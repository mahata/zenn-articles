import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { extractFrontMatterTitle } from "./front-matter.ts";

describe("extractFrontMatterTitle", () => {
  test("returns a plain title", () => {
    const markdown = "---\ntitle: What's Test Doubles?\npublished: true\n---\n\nBody\n";

    assert.equal(extractFrontMatterTitle(markdown), "What's Test Doubles?");
  });

  test("returns a double-quoted title without the quotes", () => {
    const markdown = '---\ntitle: "Initial Setup for a React + Hono Project"\n---\n';

    assert.equal(extractFrontMatterTitle(markdown), "Initial Setup for a React + Hono Project");
  });

  test("unescapes escaped characters in a double-quoted title", () => {
    const markdown = '---\ntitle: "Say \\"hi\\" to C:\\\\"\n---\n';

    assert.equal(extractFrontMatterTitle(markdown), 'Say "hi" to C:\\');
  });

  test("unescapes doubled single quotes in a single-quoted title", () => {
    const markdown = "---\ntitle: 'It''s a title'\n---\n";

    assert.equal(extractFrontMatterTitle(markdown), "It's a title");
  });

  test("drops a trailing comment from a plain title", () => {
    const markdown = "---\ntitle: C# tips # draft name\n---\n";

    assert.equal(extractFrontMatterTitle(markdown), "C# tips");
  });

  test("supports CRLF line endings", () => {
    const markdown = "---\r\ntitle: Windows title\r\n---\r\nBody\r\n";

    assert.equal(extractFrontMatterTitle(markdown), "Windows title");
  });

  test("ignores title lines in the body", () => {
    const markdown = "---\ntitle: Real title\n---\ntitle: Not a title\n";

    assert.equal(extractFrontMatterTitle(markdown), "Real title");
  });

  test("throws when the front matter is missing", () => {
    assert.throws(() => extractFrontMatterTitle("# Heading\n"), /front matter/);
  });

  test("throws when the front matter is not closed", () => {
    assert.throws(() => extractFrontMatterTitle("---\ntitle: Open\n"), /front matter/);
  });

  test("throws when the title is missing", () => {
    assert.throws(() => extractFrontMatterTitle("---\npublished: true\n---\n"), /title/);
  });

  test("throws when the title is empty", () => {
    assert.throws(() => extractFrontMatterTitle("---\ntitle:\n---\n"), /title/);
  });

  test("throws when the title uses a block scalar", () => {
    assert.throws(() => extractFrontMatterTitle("---\ntitle: >\n  Folded\n---\n"), /title/);
  });
});
