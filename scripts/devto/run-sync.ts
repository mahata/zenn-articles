import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DevtoClient } from "./devto-client.ts";
import { applySync, planSync, type LocalArticle, type SyncAction, type SyncResult } from "./sync.ts";

const MARKDOWN_EXTENSION = ".md";

export type RunDevtoSyncOptions = {
  articlesDirectory: string;
  articleIdsPath: string;
  client: DevtoClient;
  dryRun: boolean;
  log: (message: string) => void;
};

export async function runDevtoSync({
  articlesDirectory,
  articleIdsPath,
  client,
  dryRun,
  log,
}: RunDevtoSyncOptions): Promise<boolean> {
  const localArticles = await readLocalArticles(articlesDirectory);
  const articleIdsBySlug = await readArticleIds(articleIdsPath);
  const actions = planSync(localArticles, articleIdsBySlug, await client.listMyArticles());

  if (dryRun) {
    for (const action of actions) {
      log(describePlannedAction(action));
    }
    return actions.every((action) => action.kind !== "invalid");
  }

  const report = await applySync(actions, client, articleIdsBySlug);
  for (const result of report.results) {
    log(describeResult(result));
  }

  const updatedArticleIdsJson = serializeArticleIds(report.articleIdsBySlug);
  if (updatedArticleIdsJson !== serializeArticleIds(articleIdsBySlug)) {
    await writeFile(articleIdsPath, updatedArticleIdsJson);
    log(`Recorded dev.to article IDs in ${articleIdsPath}`);
  }
  return report.results.every((result) => result.outcome !== "failed");
}

async function readLocalArticles(articlesDirectory: string): Promise<LocalArticle[]> {
  const directoryEntries = await readdir(articlesDirectory, { withFileTypes: true });
  const markdownFileNames = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(MARKDOWN_EXTENSION))
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    markdownFileNames.map(async (fileName) => ({
      slug: fileName.slice(0, -MARKDOWN_EXTENSION.length),
      markdown: await readFile(join(articlesDirectory, fileName), "utf8"),
    })),
  );
}

async function readArticleIds(articleIdsPath: string): Promise<Map<string, number>> {
  let articleIdsJson: string;
  try {
    articleIdsJson = await readFile(articleIdsPath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Map();
    }
    throw error;
  }

  const parsedArticleIds: unknown = JSON.parse(articleIdsJson);
  if (typeof parsedArticleIds !== "object" || parsedArticleIds === null || Array.isArray(parsedArticleIds)) {
    throw new Error(`${articleIdsPath} must contain a JSON object that maps slugs to dev.to article IDs`);
  }
  return new Map(
    Object.entries(parsedArticleIds).map(([slug, articleId]: [string, unknown]) => {
      if (typeof articleId !== "number" || !Number.isSafeInteger(articleId) || articleId <= 0) {
        throw new Error(
          `${articleIdsPath} has an invalid dev.to article ID for "${slug}": ${JSON.stringify(articleId)}`,
        );
      }
      return [slug, articleId];
    }),
  );
}

function serializeArticleIds(articleIdsBySlug: ReadonlyMap<string, number>): string {
  const sortedSlugs = [...articleIdsBySlug.keys()].sort();
  const articleIdsInSlugOrder = Object.fromEntries(sortedSlugs.map((slug) => [slug, articleIdsBySlug.get(slug)]));
  return `${JSON.stringify(articleIdsInSlugOrder, null, 2)}\n`;
}

function describePlannedAction(action: SyncAction): string {
  switch (action.kind) {
    case "create":
      return `Would create ${action.slug}`;
    case "update":
      return `Would update ${action.slug}: ${action.url}${describeTitleLink(action.linkedByTitle)}`;
    case "unchanged":
      return `Unchanged ${action.slug}: ${action.url}${describeTitleLink(action.linkedByTitle)}`;
    case "invalid":
      return `Invalid ${action.slug}: ${action.reason}`;
  }
}

function describeResult(result: SyncResult): string {
  switch (result.outcome) {
    case "created":
      return `Created ${result.slug}: ${result.url}`;
    case "updated":
      return `Updated ${result.slug}: ${result.url}${describeTitleLink(result.linkedByTitle)}`;
    case "unchanged":
      return `Unchanged ${result.slug}: ${result.url}${describeTitleLink(result.linkedByTitle)}`;
    case "failed":
      return `Failed ${result.slug}: ${result.reason}`;
  }
}

function describeTitleLink(linkedByTitle: boolean): string {
  return linkedByTitle ? " (linked to the existing dev.to article with the same title)" : "";
}
