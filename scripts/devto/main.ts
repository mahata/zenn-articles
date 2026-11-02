import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createDevtoClient } from "./devto-client.ts";
import { runDevtoSync } from "./run-sync.ts";

const ARTICLES_DIRECTORY = fileURLToPath(new URL("../../articles-en/", import.meta.url));
const ARTICLE_IDS_PATH = fileURLToPath(new URL("../../articles-en/devto-articles.json", import.meta.url));

try {
  const { values: commandLineOptions } = parseArgs({
    options: { "dry-run": { type: "boolean", default: false } },
  });
  const dryRun = commandLineOptions["dry-run"];

  const apiKey = process.env.DEVTO_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new Error("Set DEVTO_API_KEY to your dev.to API key. You can create one at https://dev.to/settings/extensions");
  }

  if (dryRun) {
    console.log("Dry run: nothing will be created or updated on dev.to, and the ID mapping stays untouched.");
  }
  const succeeded = await runDevtoSync({
    articlesDirectory: ARTICLES_DIRECTORY,
    articleIdsPath: ARTICLE_IDS_PATH,
    client: createDevtoClient({ apiKey }),
    dryRun,
    log: (message) => console.log(message),
  });
  process.exitCode = succeeded ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
