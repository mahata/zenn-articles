# Zenn CLI

* [📘 How to use](https://zenn.dev/zenn/articles/zenn-cli-guide)

## Setup

`package.json` pins pnpm 12.16.1, and older pnpm versions cannot read `pnpm-lock.yaml`. Install it if `pnpm` is missing or older:

```bash
npm install -g pnpm@12.16.1
```

## Commands

```bash
pnpm install
pnpm zenn new:article --slug my-slug
pnpm zenn preview
```

## Publishing English articles to dev.to

`articles-en/` holds the English editions of the articles for [dev.to](https://dev.to/mahata). The [Publish to dev.to](.github/workflows/publish-devto.yml) workflow syncs them with dev.to whenever `articles-en/` changes on `main`:

- A new file is posted as a new dev.to article.
- A changed file updates its dev.to article. Articles that match dev.to are left alone.
- The `published` front matter field decides whether an article is public or a draft.

Each file starts with dev.to front matter. Use absolute image URLs, because dev.to cannot load the `/images` paths of this repository.

```markdown
---
title: My article title
description: A short summary for previews and search engines.
tags: ["typescript", "testing"]
published: true
---
```

`articles-en/devto-articles.json` maps each file name (without `.md`) to its dev.to article ID. The workflow records the IDs of new articles there and commits them to `main` as github-actions[bot], so pull `main` before you push to it. A file without a recorded ID is linked to the dev.to article with the same title if one exists, so the same article is not posted twice.

Keep in mind:

- Edit articles in this repository, not on dev.to. An edit made on dev.to is overwritten the next time the workflow runs.
- Deleting a file does not delete or unpublish its dev.to article.

### Setup

1. Create an API key in the "DEV Community API Keys" section of <https://dev.to/settings/extensions>.
2. Save it as the `DEVTO_API_KEY` repository secret. The command prompts for the key:

   ```bash
   gh secret set DEVTO_API_KEY --repo mahata/zenn-articles
   ```

### Running the sync by hand

Run the workflow from the Actions tab. Check "dry-run" to only see the planned changes. You can also run the sync locally:

```bash
DEVTO_API_KEY=your-api-key pnpm devto:sync --dry-run
```

Without `--dry-run`, a local run creates and updates articles on dev.to and writes new IDs to `articles-en/devto-articles.json`.

### Developing the sync script

The script lives in `scripts/devto/`. Node.js 24 or later runs its TypeScript files directly, so there is no build step.

```bash
pnpm test
pnpm typecheck
```
