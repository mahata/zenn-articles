const DEVTO_API_BASE_URL = "https://dev.to/api";
const DEVTO_API_V1_MEDIA_TYPE = "application/vnd.forem.api-v1+json";
const USER_AGENT = "zenn-articles-devto-sync (+https://github.com/mahata/zenn-articles)";
const MAX_PAGE_SIZE = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

export type DevtoArticle = {
  id: number;
  title: string;
  url: string;
  bodyMarkdown: string;
};

export type DevtoClient = {
  listMyArticles(): Promise<DevtoArticle[]>;
  createArticle(bodyMarkdown: string): Promise<DevtoArticle>;
  updateArticle(articleId: number, bodyMarkdown: string): Promise<DevtoArticle>;
};

export type DevtoClientOptions = {
  apiKey: string;
  fetch?: typeof fetch;
  pageSize?: number;
  timeoutMs?: number;
};

export function createDevtoClient({
  apiKey,
  fetch: fetchFromApi = fetch,
  pageSize = MAX_PAGE_SIZE,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: DevtoClientOptions): DevtoClient {
  async function requestJson(method: string, path: string, requestBody?: unknown): Promise<unknown> {
    const headers = new Headers({
      "api-key": apiKey,
      accept: DEVTO_API_V1_MEDIA_TYPE,
      "user-agent": USER_AGENT,
    });
    if (requestBody !== undefined) {
      headers.set("content-type", "application/json");
    }

    const response = await fetchFromApi(`${DEVTO_API_BASE_URL}${path}`, {
      method,
      headers,
      body: requestBody === undefined ? null : JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      const retryAfterHint = retryAfter === null ? "" : ` (Retry-After: ${retryAfter})`;
      throw new Error(
        `dev.to API ${method} ${path} failed with ${response.status}${retryAfterHint}: ${await response.text()}`,
      );
    }
    return response.json();
  }

  return {
    async listMyArticles() {
      const articles: DevtoArticle[] = [];
      for (let page = 1; ; page++) {
        const pageOfArticles = parseArticleList(
          await requestJson("GET", `/articles/me/all?page=${page}&per_page=${pageSize}`),
        );
        articles.push(...pageOfArticles);
        if (pageOfArticles.length < pageSize) {
          return articles;
        }
      }
    },

    async createArticle(bodyMarkdown) {
      return parseArticle(await requestJson("POST", "/articles", { article: { body_markdown: bodyMarkdown } }));
    },

    async updateArticle(articleId, bodyMarkdown) {
      return parseArticle(
        await requestJson("PUT", `/articles/${articleId}`, { article: { body_markdown: bodyMarkdown } }),
      );
    },
  };
}

function parseArticleList(responseBody: unknown): DevtoArticle[] {
  if (!Array.isArray(responseBody)) {
    throw new Error(`Unexpected article list in dev.to API response: ${JSON.stringify(responseBody)}`);
  }
  return responseBody.map(parseArticle);
}

function parseArticle(responseBody: unknown): DevtoArticle {
  if (typeof responseBody === "object" && responseBody !== null) {
    const { id, title, url, body_markdown: bodyMarkdown } = responseBody as Record<string, unknown>;
    if (
      typeof id === "number" &&
      typeof title === "string" &&
      typeof url === "string" &&
      typeof bodyMarkdown === "string"
    ) {
      return { id, title, url, bodyMarkdown };
    }
  }
  throw new Error(`Unexpected article in dev.to API response: ${JSON.stringify(responseBody)}`);
}
