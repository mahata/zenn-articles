import type { DevtoArticle, DevtoClient } from "./devto-client.ts";
import { extractFrontMatterTitle } from "./front-matter.ts";

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

export function planSync(
  localArticles: readonly LocalArticle[],
  articleIdsBySlug: ReadonlyMap<string, number>,
  remoteArticles: readonly DevtoArticle[],
): SyncAction[] {
  const remoteArticlesById = new Map(remoteArticles.map((remoteArticle) => [remoteArticle.id, remoteArticle]));
  const linkedArticleIds = new Set(articleIdsBySlug.values());

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

    const unlinkedArticlesWithSameTitle = remoteArticles.filter(
      (remoteArticle) => remoteArticle.title.trim() === title.trim() && !linkedArticleIds.has(remoteArticle.id),
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
  const updatedArticleIdsBySlug = new Map(articleIdsBySlug);
  const results: SyncResult[] = [];
  for (const action of actions) {
    results.push(await applyAction(action, client, updatedArticleIdsBySlug));
  }
  return { results, articleIdsBySlug: updatedArticleIdsBySlug };
}

async function applyAction(
  action: SyncAction,
  client: DevtoClient,
  articleIdsBySlug: Map<string, number>,
): Promise<SyncResult> {
  const { slug } = action;
  switch (action.kind) {
    case "invalid":
      return { slug, outcome: "failed", reason: action.reason };
    case "unchanged":
      articleIdsBySlug.set(slug, action.articleId);
      return { slug, outcome: "unchanged", url: action.url, linkedByTitle: action.linkedByTitle };
    case "update":
      articleIdsBySlug.set(slug, action.articleId);
      try {
        const updatedArticle = await client.updateArticle(action.articleId, action.markdown);
        return { slug, outcome: "updated", url: updatedArticle.url, linkedByTitle: action.linkedByTitle };
      } catch (error) {
        return { slug, outcome: "failed", reason: describeError(error) };
      }
    case "create":
      try {
        const createdArticle = await client.createArticle(action.markdown);
        articleIdsBySlug.set(slug, createdArticle.id);
        return { slug, outcome: "created", url: createdArticle.url, linkedByTitle: false };
      } catch (error) {
        return { slug, outcome: "failed", reason: describeError(error) };
      }
  }
}

function compareWithRemoteArticle(
  localArticle: LocalArticle,
  remoteArticle: DevtoArticle,
  linkedByTitle: boolean,
): SyncAction {
  const linkedArticle = { slug: localArticle.slug, articleId: remoteArticle.id, url: remoteArticle.url, linkedByTitle };
  if (normalizeMarkdown(localArticle.markdown) === normalizeMarkdown(remoteArticle.bodyMarkdown)) {
    return { kind: "unchanged", ...linkedArticle };
  }
  return { kind: "update", markdown: localArticle.markdown, ...linkedArticle };
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replaceAll("\r\n", "\n").trimEnd();
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
