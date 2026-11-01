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
