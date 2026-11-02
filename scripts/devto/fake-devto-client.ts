import type { DevtoArticle, DevtoClient } from "./devto-client.ts";

export type FakeDevtoClient = DevtoClient & {
  createdBodies: string[];
  updatedArticles: Array<{ articleId: number; bodyMarkdown: string }>;
};

export type FakeDevtoClientOptions = {
  remoteArticles?: DevtoArticle[];
  failWhenBodyIncludes?: string;
};

export function devtoArticle(id: number, title: string, bodyMarkdown: string): DevtoArticle {
  return { id, title, url: `https://dev.to/mahata/article-${id}`, bodyMarkdown };
}

export function createFakeDevtoClient({
  remoteArticles = [],
  failWhenBodyIncludes,
}: FakeDevtoClientOptions = {}): FakeDevtoClient {
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
      return [...remoteArticles];
    },
    async createArticle(bodyMarkdown) {
      failIfRequested(bodyMarkdown, "POST");
      createdBodies.push(bodyMarkdown);
      return devtoArticle(nextArticleId++, "Created", bodyMarkdown);
    },
    async updateArticle(articleId, bodyMarkdown) {
      failIfRequested(bodyMarkdown, "PUT");
      updatedArticles.push({ articleId, bodyMarkdown });
      return devtoArticle(articleId, "Updated", bodyMarkdown);
    },
  };
}
