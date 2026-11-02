import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DevtoArticle, DevtoClient } from "./devto-client.ts";
import { applySync, planSync, type SyncAction } from "./sync.ts";

function markdownWithTitle(title: string, body = "Body"): string {
  return `---\ntitle: ${title}\npublished: true\n---\n\n${body}\n`;
}

function remoteArticle(id: number, title: string, bodyMarkdown: string): DevtoArticle {
  return { id, title, url: `https://dev.to/mahata/article-${id}`, bodyMarkdown };
}

type FakeDevtoClient = DevtoClient & {
  createdBodies: string[];
  updatedArticles: Array<{ articleId: number; bodyMarkdown: string }>;
};

function createFakeDevtoClient({ failWhenBodyIncludes }: { failWhenBodyIncludes?: string } = {}): FakeDevtoClient {
  const createdBodies: string[] = [];
  const updatedArticles: Array<{ articleId: number; bodyMarkdown: string }> = [];
  let nextArticleId = 100;

  function failIfRequested(bodyMarkdown: string, method: string): void {
    if (failWhenBodyIncludes !== undefined && bodyMarkdown.includes(failWhenBodyIncludes)) {
      throw new Error(`dev.to API ${method} failed with 422: {"error":"boom"}`);
    }
  }

  return {
    createdBodies,
    updatedArticles,
    async listMyArticles() {
      return [];
    },
    async createArticle(bodyMarkdown) {
      failIfRequested(bodyMarkdown, "POST");
      createdBodies.push(bodyMarkdown);
      const articleId = nextArticleId++;
      return remoteArticle(articleId, "Created", bodyMarkdown);
    },
    async updateArticle(articleId, bodyMarkdown) {
      failIfRequested(bodyMarkdown, "PUT");
      updatedArticles.push({ articleId, bodyMarkdown });
      return remoteArticle(articleId, "Updated", bodyMarkdown);
    },
  };
}

describe("planSync", () => {
  test("keeps a mapped article whose body matches dev.to unchanged", () => {
    const markdown = markdownWithTitle("Same");

    const actions = planSync(
      [{ slug: "same-article", markdown }],
      new Map([["same-article", 1]]),
      [remoteArticle(1, "Same", markdown)],
    );

    assert.deepEqual(actions, [
      { kind: "unchanged", slug: "same-article", articleId: 1, url: "https://dev.to/mahata/article-1", linkedByTitle: false },
    ]);
  });

  test("ignores line ending and trailing whitespace differences", () => {
    const markdown = markdownWithTitle("Same", "Line one\nLine two");

    const actions = planSync(
      [{ slug: "same-article", markdown }],
      new Map([["same-article", 1]]),
      [remoteArticle(1, "Same", markdown.replaceAll("\n", "\r\n").trimEnd())],
    );

    assert.equal(actions[0]?.kind, "unchanged");
  });

  test("updates a mapped article whose body differs from dev.to", () => {
    const markdown = markdownWithTitle("Changed", "New body");

    const actions = planSync(
      [{ slug: "changed-article", markdown }],
      new Map([["changed-article", 2]]),
      [remoteArticle(2, "Changed", markdownWithTitle("Changed", "Old body"))],
    );

    assert.deepEqual(actions, [
      {
        kind: "update",
        slug: "changed-article",
        markdown,
        articleId: 2,
        url: "https://dev.to/mahata/article-2",
        linkedByTitle: false,
      },
    ]);
  });

  test("reports a mapped article that is missing on dev.to as invalid", () => {
    const actions = planSync([{ slug: "gone-article", markdown: markdownWithTitle("Gone") }], new Map([["gone-article", 3]]), []);

    assert.equal(actions[0]?.kind, "invalid");
    assert.match(actions[0]?.kind === "invalid" ? actions[0].reason : "", /3.*Remove "gone-article"/);
  });

  test("links an unmapped article to the dev.to article with the same title", () => {
    const markdown = markdownWithTitle("Existing");

    const actions = planSync([{ slug: "existing-article", markdown }], new Map(), [remoteArticle(4, "Existing", markdown)]);

    assert.deepEqual(actions, [
      { kind: "unchanged", slug: "existing-article", articleId: 4, url: "https://dev.to/mahata/article-4", linkedByTitle: true },
    ]);
  });

  test("updates a title-linked article whose body differs from dev.to", () => {
    const markdown = markdownWithTitle("Existing", "New body");

    const actions = planSync(
      [{ slug: "existing-article", markdown }],
      new Map(),
      [remoteArticle(4, "Existing", markdownWithTitle("Existing", "Old body"))],
    );

    assert.deepEqual(actions, [
      {
        kind: "update",
        slug: "existing-article",
        markdown,
        articleId: 4,
        url: "https://dev.to/mahata/article-4",
        linkedByTitle: true,
      },
    ]);
  });

  test("does not link a dev.to article that is already mapped to another file", () => {
    const markdown = markdownWithTitle("Shared title");

    const actions = planSync(
      [{ slug: "new-article", markdown }],
      new Map([["other-article", 5]]),
      [remoteArticle(5, "Shared title", markdown)],
    );

    assert.deepEqual(actions, [{ kind: "create", slug: "new-article", markdown }]);
  });

  test("reports an unmapped article as invalid when several dev.to articles share its title", () => {
    const markdown = markdownWithTitle("Ambiguous");

    const actions = planSync(
      [{ slug: "ambiguous-article", markdown }],
      new Map(),
      [remoteArticle(6, "Ambiguous", markdown), remoteArticle(7, "Ambiguous", markdown)],
    );

    assert.equal(actions[0]?.kind, "invalid");
    assert.match(actions[0]?.kind === "invalid" ? actions[0].reason : "", /6, 7/);
  });

  test("creates an unmapped article without a dev.to article of the same title", () => {
    const markdown = markdownWithTitle("Brand new");

    const actions = planSync([{ slug: "brand-new-article", markdown }], new Map(), [remoteArticle(8, "Other", "x")]);

    assert.deepEqual(actions, [{ kind: "create", slug: "brand-new-article", markdown }]);
  });

  test("reports an unmapped article without a front matter title as invalid", () => {
    const actions = planSync([{ slug: "untitled-article", markdown: "# No front matter\n" }], new Map(), []);

    assert.equal(actions[0]?.kind, "invalid");
    assert.match(actions[0]?.kind === "invalid" ? actions[0].reason : "", /front matter/);
  });
});

describe("applySync", () => {
  test("creates articles and records their IDs", async () => {
    const client = createFakeDevtoClient();
    const markdown = markdownWithTitle("Brand new");

    const report = await applySync([{ kind: "create", slug: "brand-new-article", markdown }], client, new Map());

    assert.deepEqual(client.createdBodies, [markdown]);
    assert.deepEqual(report.results, [
      { slug: "brand-new-article", outcome: "created", url: "https://dev.to/mahata/article-100", linkedByTitle: false },
    ]);
    assert.deepEqual(report.articleIdsBySlug, new Map([["brand-new-article", 100]]));
  });

  test("updates changed articles", async () => {
    const client = createFakeDevtoClient();
    const markdown = markdownWithTitle("Changed", "New body");
    const actions: SyncAction[] = [
      { kind: "update", slug: "changed-article", markdown, articleId: 2, url: "https://dev.to/mahata/article-2", linkedByTitle: false },
    ];

    const report = await applySync(actions, client, new Map([["changed-article", 2]]));

    assert.deepEqual(client.updatedArticles, [{ articleId: 2, bodyMarkdown: markdown }]);
    assert.deepEqual(report.results, [
      { slug: "changed-article", outcome: "updated", url: "https://dev.to/mahata/article-2", linkedByTitle: false },
    ]);
    assert.deepEqual(report.articleIdsBySlug, new Map([["changed-article", 2]]));
  });

  test("records title links without calling dev.to for unchanged articles", async () => {
    const client = createFakeDevtoClient();
    const actions: SyncAction[] = [
      { kind: "unchanged", slug: "existing-article", articleId: 4, url: "https://dev.to/mahata/article-4", linkedByTitle: true },
    ];

    const report = await applySync(actions, client, new Map());

    assert.deepEqual(client.createdBodies, []);
    assert.deepEqual(client.updatedArticles, []);
    assert.deepEqual(report.results, [
      { slug: "existing-article", outcome: "unchanged", url: "https://dev.to/mahata/article-4", linkedByTitle: true },
    ]);
    assert.deepEqual(report.articleIdsBySlug, new Map([["existing-article", 4]]));
  });

  test("keeps going after a failure and still records the articles that succeeded", async () => {
    const client = createFakeDevtoClient({ failWhenBodyIncludes: "Broken" });
    const brokenMarkdown = markdownWithTitle("Broken");
    const workingMarkdown = markdownWithTitle("Working");
    const actions: SyncAction[] = [
      { kind: "create", slug: "broken-article", markdown: brokenMarkdown },
      { kind: "create", slug: "working-article", markdown: workingMarkdown },
    ];

    const report = await applySync(actions, client, new Map());

    assert.deepEqual(report.results, [
      { slug: "broken-article", outcome: "failed", reason: 'dev.to API POST failed with 422: {"error":"boom"}' },
      { slug: "working-article", outcome: "created", url: "https://dev.to/mahata/article-100", linkedByTitle: false },
    ]);
    assert.deepEqual(report.articleIdsBySlug, new Map([["working-article", 100]]));
  });

  test("records a title link even when the update fails", async () => {
    const client = createFakeDevtoClient({ failWhenBodyIncludes: "Broken" });
    const markdown = markdownWithTitle("Broken");
    const actions: SyncAction[] = [
      { kind: "update", slug: "broken-article", markdown, articleId: 4, url: "https://dev.to/mahata/article-4", linkedByTitle: true },
    ];

    const report = await applySync(actions, client, new Map());

    assert.equal(report.results[0]?.outcome, "failed");
    assert.deepEqual(report.articleIdsBySlug, new Map([["broken-article", 4]]));
  });

  test("reports invalid articles as failures without calling dev.to", async () => {
    const client = createFakeDevtoClient();

    const report = await applySync([{ kind: "invalid", slug: "untitled-article", reason: "no title" }], client, new Map());

    assert.deepEqual(client.createdBodies, []);
    assert.deepEqual(report.results, [{ slug: "untitled-article", outcome: "failed", reason: "no title" }]);
  });

  test("does not modify the given ID mapping", async () => {
    const client = createFakeDevtoClient();
    const originalArticleIdsBySlug = new Map([["existing-article", 1]]);

    await applySync([{ kind: "create", slug: "brand-new-article", markdown: markdownWithTitle("New") }], client, originalArticleIdsBySlug);

    assert.deepEqual(originalArticleIdsBySlug, new Map([["existing-article", 1]]));
  });
});
