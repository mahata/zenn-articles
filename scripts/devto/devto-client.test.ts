import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createDevtoClient } from "./devto-client.ts";

type RecordedRequest = { url: string; init: RequestInit };

function createFetchStub(responses: Response[]) {
  const recordedRequests: RecordedRequest[] = [];
  const fetchStub = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    recordedRequests.push({ url: String(input), init });
    const nextResponse = responses.shift();
    if (nextResponse === undefined) {
      throw new Error(`Unexpected request to ${String(input)}`);
    }
    return nextResponse;
  };
  return { fetchStub: fetchStub as typeof fetch, recordedRequests };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

function rawArticle(id: number) {
  return {
    id,
    title: `Title ${id}`,
    url: `https://dev.to/mahata/title-${id}`,
    body_markdown: `---\ntitle: Title ${id}\n---\n`,
  };
}

function expectedArticle(id: number) {
  return {
    id,
    title: `Title ${id}`,
    url: `https://dev.to/mahata/title-${id}`,
    bodyMarkdown: `---\ntitle: Title ${id}\n---\n`,
  };
}

function headersOf(request: RecordedRequest | undefined): Headers {
  return new Headers(request?.init.headers);
}

describe("createDevtoClient", () => {
  test("lists the authenticated user's articles including drafts", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([jsonResponse([rawArticle(1), rawArticle(2)])]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    const articles = await client.listMyArticles();

    assert.deepEqual(articles, [expectedArticle(1), expectedArticle(2)]);
    assert.equal(recordedRequests.length, 1);
    assert.equal(recordedRequests[0]?.url, "https://dev.to/api/articles/me/all?page=1&per_page=1000");
    assert.equal(recordedRequests[0]?.init.method, "GET");
  });

  test("sends the API key, the API version, and a user agent", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([jsonResponse([])]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    await client.listMyArticles();

    const headers = headersOf(recordedRequests[0]);
    assert.equal(headers.get("api-key"), "secret-key");
    assert.equal(headers.get("accept"), "application/vnd.forem.api-v1+json");
    assert.match(headers.get("user-agent") ?? "", /zenn-articles/);
  });

  test("follows pages until a page is not full", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([
      jsonResponse([rawArticle(1), rawArticle(2)]),
      jsonResponse([rawArticle(3), rawArticle(4)]),
      jsonResponse([rawArticle(5)]),
    ]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub, pageSize: 2 });

    const articles = await client.listMyArticles();

    assert.deepEqual(
      articles.map((article) => article.id),
      [1, 2, 3, 4, 5],
    );
    assert.deepEqual(
      recordedRequests.map((request) => request.url),
      [
        "https://dev.to/api/articles/me/all?page=1&per_page=2",
        "https://dev.to/api/articles/me/all?page=2&per_page=2",
        "https://dev.to/api/articles/me/all?page=3&per_page=2",
      ],
    );
  });

  test("creates an article from markdown with front matter", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([jsonResponse(rawArticle(7), { status: 201 })]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    const article = await client.createArticle("---\ntitle: Title 7\n---\n");

    assert.deepEqual(article, expectedArticle(7));
    assert.equal(recordedRequests[0]?.url, "https://dev.to/api/articles");
    assert.equal(recordedRequests[0]?.init.method, "POST");
    assert.equal(headersOf(recordedRequests[0]).get("content-type"), "application/json");
    assert.equal(headersOf(recordedRequests[0]).get("api-key"), "secret-key");
    assert.deepEqual(JSON.parse(String(recordedRequests[0]?.init.body)), {
      article: { body_markdown: "---\ntitle: Title 7\n---\n" },
    });
  });

  test("updates an article by id", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([jsonResponse(rawArticle(9))]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    const article = await client.updateArticle(9, "---\ntitle: Title 9\n---\n");

    assert.deepEqual(article, expectedArticle(9));
    assert.equal(recordedRequests[0]?.url, "https://dev.to/api/articles/9");
    assert.equal(recordedRequests[0]?.init.method, "PUT");
    assert.equal(headersOf(recordedRequests[0]).get("content-type"), "application/json");
    assert.deepEqual(JSON.parse(String(recordedRequests[0]?.init.body)), {
      article: { body_markdown: "---\ntitle: Title 9\n---\n" },
    });
  });

  test("reports the status and the response body when a request fails", async () => {
    const { fetchStub } = createFetchStub([
      jsonResponse({ error: "Title can't be blank", status: 422 }, { status: 422 }),
    ]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    await assert.rejects(client.createArticle("no front matter"), /POST \/articles failed with 422.*Title can't be blank/);
  });

  test("reports Retry-After when rate limited", async () => {
    const { fetchStub } = createFetchStub([
      jsonResponse({ error: "Rate limit reached", status: 429 }, { status: 429, headers: { "retry-after": "30" } }),
    ]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    await assert.rejects(client.updateArticle(1, "body"), /429.*Retry-After: 30/);
  });

  test("rejects a response that is not an article", async () => {
    const { fetchStub } = createFetchStub([jsonResponse({ id: "not-a-number" })]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    await assert.rejects(client.updateArticle(1, "body"), /Unexpected article/);
  });

  test("rejects a list response that is not an array", async () => {
    const { fetchStub } = createFetchStub([jsonResponse({ error: "oops" })]);
    const client = createDevtoClient({ apiKey: "secret-key", fetch: fetchStub });

    await assert.rejects(client.listMyArticles(), /Unexpected article list/);
  });

  test("aborts a request that exceeds the timeout", async () => {
    const hangingFetch = ((_input: string | URL | Request, init: RequestInit = {}) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as typeof fetch;
    const client = createDevtoClient({ apiKey: "secret-key", fetch: hangingFetch, timeoutMs: 10 });

    await assert.rejects(client.listMyArticles(), /timeout/i);
  });

  test("waits between writes because dev.to accepts one write per second", async () => {
    const { fetchStub, recordedRequests } = createFetchStub([
      jsonResponse(rawArticle(1), { status: 201 }),
      jsonResponse([rawArticle(1)]),
      jsonResponse({ error: "boom", status: 422 }, { status: 422 }),
      jsonResponse(rawArticle(2), { status: 201 }),
    ]);
    const requestedWaits: Array<{ milliseconds: number; requestsSoFar: number }> = [];
    const client = createDevtoClient({
      apiKey: "secret-key",
      fetch: fetchStub,
      sleep: async (milliseconds) => {
        requestedWaits.push({ milliseconds, requestsSoFar: recordedRequests.length });
      },
    });

    await client.createArticle("first");
    await client.listMyArticles();
    await assert.rejects(client.updateArticle(1, "second"));
    await client.createArticle("third");

    assert.deepEqual(requestedWaits, [
      { milliseconds: 1000, requestsSoFar: 2 },
      { milliseconds: 1000, requestsSoFar: 3 },
    ]);
  });
});
