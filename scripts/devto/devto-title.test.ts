import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeDevtoTitle } from "./devto-title.ts";

describe("normalizeDevtoTitle", () => {
  test("keeps letters, numbers, punctuation, and currency symbols", () => {
    const title = "What's new in C# 12? ($5 + <tips> | 50% off ^_^ ~ `code` = €)";

    assert.equal(normalizeDevtoTitle(title), title);
  });

  test("keeps letters from other scripts and dashes", () => {
    assert.equal(normalizeDevtoTitle("Café — Zenn の記事"), "Café — Zenn の記事");
  });

  test("replaces characters that dev.to does not allow with spaces", () => {
    assert.equal(normalizeDevtoTitle("Jest → Vitest"), "Jest Vitest");
  });

  test("keeps the arrows and emoji that dev.to allows", () => {
    assert.equal(normalizeDevtoTitle("Sync ↔ Merge 🚀 ★"), "Sync ↔ Merge 🚀 ★");
  });

  test("collapses ASCII whitespace and trims the ends", () => {
    assert.equal(normalizeDevtoTitle("  Hello \t\n  world  "), "Hello world");
  });

  test("matches dev.to for symbols, superscripts, and letter numbers", () => {
    const title = "x² ½ Ⅻ ∑ ∞ © ™ ✓ ✔ ❤ → ⇒ — ‐ … · • ° ± × ÷ ≠ ≤ ‰ † ‡ § ¶ ¡ ¿ « » „ “ ” ‘ ’";

    assert.equal(normalizeDevtoTitle(title), "x Ⅻ © ™ ✓ ✔ ❤ — ‐ … · • ‰ † ‡ § ¶ ¡ ¿ « » „ “ ” ‘ ’");
  });

  test("keeps non-ASCII spaces as dev.to does", () => {
    assert.equal(normalizeDevtoTitle("nbsp\u00a0here\u3000ideographic"), "nbsp\u00a0here\u3000ideographic");
  });
});
