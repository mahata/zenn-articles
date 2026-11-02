import type { DevtoArticle, DevtoClient } from "./devto-client.ts";
import { normalizeDevtoTitle } from "./devto-title.ts";
import { extractFrontMatterTitle } from "./front-matter.ts";
import { hasSameMarkdown } from "./markdown-comparison.ts";

export type LocalArticle = { slug: string; markdown: string };

type LinkedArticle = { slug: string; articleId: number; url: string; linkedByTitle: boolean };

export type SyncAction =
  | { kind: "create"; slug: string; markdown: string }
  | ({ kind: "update"; markdown: string } & LinkedArticle)
  | ({ kind: "unchanged" } & LinkedArticle)
  | { kind: "invalid"; slug: string; reason: string };

export type SyncResult =
  | { slug: string; outcome: "created" | "updated" | "unchanged"; url: string; linkedByTitle: boolean }
  | { slug: string; outcome: "failed"; reason: string };

export type SyncReport = { results: SyncResult[]; articleIdsBySlug: Map<string, number> };

type AppliedAction = { result: SyncResult; articleId: number | undefined };

export function planSync(
  localArticles: readonly LocalArticle[],
  articleIdsBySlug: ReadonlyMap<string, number>,
  remoteArticles: readonly DevtoArticle[],
): SyncAction[] {
  const remoteArticlesById = new Map(remoteArticles.map((remoteArticle) => [remoteArticle.id, remoteArticle]));
  const localSlugs = new Set(localArticles.map((localArticle) => localArticle.slug));
  const linkedArticleIds = new Set(
    [...articleIdsBySlug].filter(([slug]) => localSlugs.has(slug)).map(([, articleId]) => articleId),
  );

  return localArticles.map((localArticle): SyncAction => {
    const { slug, markdown } = localArticle;

    const mappedArticleId = articleIdsBySlug.get(slug);
    if (mappedArticleId !== undefined) {
      const mappedRemoteArticle = remoteArticlesById.get(mappedArticleId);
      if (mappedRemoteArticle === undefined) {
        return {
          kind: "invalid",
          slug,
          reason: `dev.to article ${mappedArticleId} is not among your articles. Remove "${slug}" from the dev.to ID mapping to create it again.`,
        };
      }
      return compareWithRemoteArticle(localArticle, mappedRemoteArticle, false);
    }

    let title: string;
    try {
      title = extractFrontMatterTitle(markdown);
    } catch (error) {
      return { kind: "invalid", slug, reason: describeError(error) };
    }

    const normalizedTitle = normalizeDevtoTitle(title);
    const unlinkedArticlesWithSameTitle = remoteArticles.filter(
      (remoteArticle) =>
        normalizeDevtoTitle(remoteArticle.title) === normalizedTitle && !linkedArticleIds.has(remoteArticle.id),
    );
    if (unlinkedArticlesWithSameTitle.length > 1) {
      const articleIds = unlinkedArticlesWithSameTitle.map((remoteArticle) => remoteArticle.id).join(", ");
      return {
        kind: "invalid",
        slug,
        reason: `Several dev.to articles are titled "${title}" (IDs: ${articleIds}). Add the right ID to the dev.to ID mapping.`,
      };
    }

    const [articleWithSameTitle] = unlinkedArticlesWithSameTitle;
    if (articleWithSameTitle === undefined) {
      return { kind: "create", slug, markdown };
    }
    linkedArticleIds.add(articleWithSameTitle.id);
    return compareWithRemoteArticle(localArticle, articleWithSameTitle, true);
  });
}

export async function applySync(
  actions: readonly SyncAction[],
  client: DevtoClient,
  articleIdsBySlug: ReadonlyMap<string, number>,
): Promise<SyncReport> {
  const updatedArticleIdsBySlug = new Map<string, number>();
  const results: SyncResult[] = [];
  for (const action of actions) {
    const { result, articleId } = await applyAction(action, client);
    results.push(result);
    const recordedArticleId = articleId ?? articleIdsBySlug.get(action.slug);
    if (recordedArticleId !== undefined) {
      updatedArticleIdsBySlug.set(action.slug, recordedArticleId);
    }
  }
  return { results, articleIdsBySlug: updatedArticleIdsBySlug };
}

async function applyAction(action: SyncAction, client: DevtoClient): Promise<AppliedAction> {
  const { slug } = action;
  switch (action.kind) {
    case "invalid":
      return { result: { slug, outcome: "failed", reason: action.reason }, articleId: undefined };
    case "unchanged":
      return {
        result: { slug, outcome: "unchanged", url: action.url, linkedByTitle: action.linkedByTitle },
        articleId: action.articleId,
      };
    case "update":
      try {
        const updatedArticle = await client.updateArticle(action.articleId, action.markdown);
        return {
          result: { slug, outcome: "updated", url: updatedArticle.url, linkedByTitle: action.linkedByTitle },
          articleId: action.articleId,
        };
      } catch (error) {
        return { result: { slug, outcome: "failed", reason: describeError(error) }, articleId: action.articleId };
      }
    case "create":
      try {
        const createdArticle = await client.createArticle(action.markdown);
        return {
          result: { slug, outcome: "created", url: createdArticle.url, linkedByTitle: false },
          articleId: createdArticle.id,
        };
      } catch (error) {
        return { result: { slug, outcome: "failed", reason: describeError(error) }, articleId: undefined };
      }
  }
}

function compareWithRemoteArticle(
  localArticle: LocalArticle,
  remoteArticle: DevtoArticle,
  linkedByTitle: boolean,
): SyncAction {
  const linkedArticle = { slug: localArticle.slug, articleId: remoteArticle.id, url: remoteArticle.url, linkedByTitle };
  if (hasSameMarkdown(localArticle.markdown, remoteArticle.bodyMarkdown)) {
    return { kind: "unchanged", ...linkedArticle };
  }
  return { kind: "update", markdown: localArticle.markdown, ...linkedArticle };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
