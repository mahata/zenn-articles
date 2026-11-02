import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";
import { createFakeDevtoClient, devtoArticle } from "./fake-devto-client.ts";
import { runDevtoSync } from "./run-sync.ts";

const ARTICLE_IDS_FILE_NAME = "devto-articles.json";

function markdownWithTitle(title: string, body = "Body"): string {
  return `---\ntitle: ${title}\npublished: true\n---\n\n${body}\n`;
}

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createArticlesDirectory(filesByName: Record<string, string>): Promise<string> {
  const articlesDirectory = await mkdtemp(join(tmpdir(), "devto-sync-"));
  temporaryDirectories.push(articlesDirectory);
  for (const [fileName, content] of Object.entries(filesByName)) {
    await writeFile(join(articlesDirectory, fileName), content);
  }
  return articlesDirectory;
}

function syncOptions(articlesDirectory: string, overrides: { dryRun?: boolean } = {}) {
  const loggedMessages: string[] = [];
  return {
    loggedMessages,
    articlesDirectory,
    articleIdsPath: join(articlesDirectory, ARTICLE_IDS_FILE_NAME),
    dryRun: overrides.dryRun ?? false,
    log: (message: string) => loggedMessages.push(message),
  };
}

async function readArticleIdsFile(articlesDirectory: string): Promise<string> {
  return readFile(join(articlesDirectory, ARTICLE_IDS_FILE_NAME), "utf8");
}

describe("runDevtoSync", () => {
  test("creates new articles and records their IDs in sorted order", async () => {
    const newArticle = markdownWithTitle("New");
    const articlesDirectory = await createArticlesDirectory({
      "new-article.md": newArticle,
      [ARTICLE_IDS_FILE_NAME]: '{\n  "older-article": 1\n}\n',
    });
    const client = createFakeDevtoClient({ remoteArticles: [devtoArticle(1, "Older", "Older body")] });
    const options = syncOptions(articlesDirectory);

    const succeeded = await runDevtoSync({ ...options, client });

    assert.equal(succeeded, true);
    assert.deepEqual(client.createdBodies, [newArticle]);
    assert.equal(await readArticleIdsFile(articlesDirectory), '{\n  "new-article": 100,\n  "older-article": 1\n}\n');
    assert.ok(options.loggedMessages.some((message) => message.includes("https://dev.to/mahata/article-100")));
  });

  test("updates changed articles and leaves unchanged articles alone", async () => {
    const changedArticle = markdownWithTitle("Changed", "New body");
    const sameArticle = markdownWithTitle("Same");
    const articleIdsJson = '{\n  "changed-article": 1,\n  "same-article": 2\n}\n';
    const articlesDirectory = await createArticlesDirectory({
      "changed-article.md": changedArticle,
      "same-article.md": sameArticle,
      [ARTICLE_IDS_FILE_NAME]: articleIdsJson,
    });
    const client = createFakeDevtoClient({
      remoteArticles: [
        devtoArticle(1, "Changed", markdownWithTitle("Changed", "Old body")),
        devtoArticle(2, "Same", sameArticle),
      ],
    });

    const succeeded = await runDevtoSync({ ...syncOptions(articlesDirectory), client });

    assert.equal(succeeded, true);
    assert.deepEqual(client.createdBodies, []);
    assert.deepEqual(client.updatedArticles, [{ articleId: 1, bodyMarkdown: changedArticle }]);
    assert.equal(await readArticleIdsFile(articlesDirectory), articleIdsJson);
  });

  test("links articles to dev.to articles with the same title when the ID mapping file is missing", async () => {
    const existingArticle = markdownWithTitle("Existing");
    const articlesDirectory = await createArticlesDirectory({ "existing-article.md": existingArticle });
    const client = createFakeDevtoClient({ remoteArticles: [devtoArticle(4, "Existing", existingArticle)] });

    const succeeded = await runDevtoSync({ ...syncOptions(articlesDirectory), client });

    assert.equal(succeeded, true);
    assert.deepEqual(client.createdBodies, []);
    assert.deepEqual(client.updatedArticles, []);
    assert.equal(await readArticleIdsFile(articlesDirectory), '{\n  "existing-article": 4\n}\n');
  });

  test("reports planned changes without writing anything in a dry run", async () => {
    const articleIdsJson = '{\n  "changed-article": 1\n}\n';
    const articlesDirectory = await createArticlesDirectory({
      "changed-article.md": markdownWithTitle("Changed", "New body"),
      "new-article.md": markdownWithTitle("New"),
      [ARTICLE_IDS_FILE_NAME]: articleIdsJson,
    });
    const client = createFakeDevtoClient({
      remoteArticles: [devtoArticle(1, "Changed", markdownWithTitle("Changed", "Old body"))],
    });
    const options = syncOptions(articlesDirectory, { dryRun: true });

    const succeeded = await runDevtoSync({ ...options, client });

    assert.equal(succeeded, true);
    assert.deepEqual(client.createdBodies, []);
    assert.deepEqual(client.updatedArticles, []);
    assert.equal(await readArticleIdsFile(articlesDirectory), articleIdsJson);
    assert.ok(options.loggedMessages.some((message) => /would create.*new-article/i.test(message)));
    assert.ok(options.loggedMessages.some((message) => /would update.*changed-article/i.test(message)));
  });

  test("fails a dry run that finds an invalid article", async () => {
    const articlesDirectory = await createArticlesDirectory({ "untitled-article.md": "# No front matter\n" });
    const options = syncOptions(articlesDirectory, { dryRun: true });

    const succeeded = await runDevtoSync({ ...options, client: createFakeDevtoClient() });

    assert.equal(succeeded, false);
    assert.ok(options.loggedMessages.some((message) => /untitled-article.*front matter/.test(message)));
  });

  test("fails when an article fails but still records the IDs of created articles", async () => {
    const articlesDirectory = await createArticlesDirectory({
      "broken-article.md": markdownWithTitle("Broken"),
      "working-article.md": markdownWithTitle("Working"),
      [ARTICLE_IDS_FILE_NAME]: "{}\n",
    });
    const options = syncOptions(articlesDirectory);

    const succeeded = await runDevtoSync({
      ...options,
      client: createFakeDevtoClient({ failWhenBodyIncludes: "Broken" }),
    });

    assert.equal(succeeded, false);
    assert.equal(await readArticleIdsFile(articlesDirectory), '{\n  "working-article": 100\n}\n');
    assert.ok(options.loggedMessages.some((message) => /broken-article.*422/.test(message)));
  });

  test("rejects an ID mapping file with an invalid article ID", async () => {
    const articlesDirectory = await createArticlesDirectory({
      "some-article.md": markdownWithTitle("Some"),
      [ARTICLE_IDS_FILE_NAME]: '{\n  "some-article": "123"\n}\n',
    });

    await assert.rejects(
      runDevtoSync({ ...syncOptions(articlesDirectory), client: createFakeDevtoClient() }),
      /invalid dev\.to article ID for "some-article"/,
    );
  });
});
