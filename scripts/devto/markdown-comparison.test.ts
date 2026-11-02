import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hasSameMarkdown } from "./markdown-comparison.ts";

describe("hasSameMarkdown", () => {
  test("treats identical markdown as the same", () => {
    assert.equal(hasSameMarkdown("# Title\n\nBody\n", "# Title\n\nBody\n"), true);
  });

  test("ignores CRLF line endings and trailing whitespace at the end", () => {
    assert.equal(hasSameMarkdown("# Title\n\nBody\n\n", "# Title\r\n\r\nBody"), true);
  });

  test("detects a changed line", () => {
    assert.equal(hasSameMarkdown("# Title\n\nNew body\n", "# Title\n\nOld body\n"), false);
  });

  test("detects an added line", () => {
    assert.equal(hasSameMarkdown("# Title\n\nBody\nMore\n", "# Title\n\nBody\n"), false);
  });

  test("ignores a language that dev.to added to a code block without one", () => {
    const localMarkdown = "Run this:\n\n```\nnpm install\n```\n";
    const remoteMarkdown = "Run this:\n\n```bash\nnpm install\n```\n";

    assert.equal(hasSameMarkdown(localMarkdown, remoteMarkdown), true);
  });

  test("ignores a language added to an indented tilde fence with trailing spaces", () => {
    const localMarkdown = "  ~~~~ \ncode\n  ~~~~\n";
    const remoteMarkdown = "  ~~~~plaintext\ncode\n  ~~~~\n";

    assert.equal(hasSameMarkdown(localMarkdown, remoteMarkdown), true);
  });

  test("detects a changed code block language", () => {
    assert.equal(hasSameMarkdown("```ts\nconst a = 1;\n```\n", "```js\nconst a = 1;\n```\n"), false);
  });

  test("detects a fence whose indentation changed along with the language", () => {
    assert.equal(hasSameMarkdown("```\ncode\n```\n", " ```bash\ncode\n```\n"), false);
  });

  test("detects text after a fence that is not a language", () => {
    assert.equal(hasSameMarkdown("```\ncode\n```\n", "```bash title\ncode\n```\n"), false);
  });

  test("detects a fixed closing fence that dev.to would never have rewritten", () => {
    const fixedLocalMarkdown = "```\nnpm install\n```\n\nSome text\n";
    const brokenRemoteMarkdown = "```\nnpm install\n```bash\n\nSome text\n";

    assert.equal(hasSameMarkdown(fixedLocalMarkdown, brokenRemoteMarkdown), false);
  });

  test("detects a language on an unclosed fence because dev.to only labels closed code blocks", () => {
    assert.equal(hasSameMarkdown("```\ncode\n", "```bash\ncode\n"), false);
  });

  test("treats a fence followed only by Unicode spaces as unlabeled, as dev.to does", () => {
    assert.equal(hasSameMarkdown("```\u3000\ncode\n```\n", "```bash\ncode\n```\n"), true);
  });

  test("ignores languages that dev.to added to several code blocks", () => {
    const localMarkdown = "```\na\n```\n```ts\nb\n```\n~~~\nc\n~~~\n";
    const remoteMarkdown = "```plaintext\na\n```\n```ts\nb\n```\n~~~python\nc\n~~~\n";

    assert.equal(hasSameMarkdown(localMarkdown, remoteMarkdown), true);
  });
});
