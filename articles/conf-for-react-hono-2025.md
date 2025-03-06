---
title: "React + Hono プロジェクトの初期設定"
emoji: "🔥"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["React", "Hono", "Vite", "TypeScript"]
published: true
---

## この記事は何ですか?

新規にWebアプリケーションを React (フロントエンド) と Hono (バックエンド) で構築するときの初期設定に関するメモです。この記事では [Vite](https://ja.vitejs.dev/) で React の設定をします。

本記事の通りに設定すると、次のようなディレクトリ構成になります。`frontend/` には React アプリケーションがあり `backend/` には Hono アプリケーションがある、というイメージです。

```
$ tree .
.
├── README.md
├── backend
│   ├──...
│   ...
└── frontend
    ├── ...
    ...
```

なお [Node.js](https://nodejs.org/) および [pnpm](https://pnpm.io) はすでにインストールされているものと仮定しています。筆者は macOS で作業しましたが、モダンなシェルが動く環境であれば再現できる手順だと思います。

最後に「おまけ」として、この構成で Cloudflare Workers へデプロイする方法も書きました。

## `frontend/` を作る

新規プロジェクトに `frontend/` ディレクトリを作り、そこに React プロジェクトを配置します。

### Vite でプロジェクトの雛形を作る

```
$ pnpm create vite frontend --template react-swc-ts
$ cd frontend
$ pnpm i
```

`--template` オプションの引数は `react-ts` でも構いません。違いは TypeScript のトランスパイルに Babel を使うか SWC (Speedy Web Compiler) を使うかです。一般に SWC の方が高速に動作するので、ここでは `react-swc-ts` をテンプレートとして選択しています。

### Vitest (Browser Mode) でテストを実行する

[Vitest](https://vitest.dev/) と関連パッケージを追加でインストールします。

```
$ pnpm install -D vitest @vitest/browser playwright vitest-browser-react @vitejs/plugin-react @testing-library/jest-dom
```

あわせて `package.json` の scripts に `"test":` の項を足します。次のようになります。

```json
	"scripts": {
		"dev": "vite",
		"build": "tsc -b && vite build",
		"lint": "eslint .",
		"preview": "vite preview",
		"test": "vitest run --browser=chromium"   <-- 追加
	},
```

Vitest 用の設定ファイルを `frontend/vitest.config.ts` に作ります。内容は次の通りです。

```typescript
/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />

import react from "@vitejs/plugin-react";
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/setupTests.ts'],
    browser: {
      name: 'chromium',
      provider: 'playwright',
      enabled: true,
    },
  }
})
```

`frontend/src/setupTests.ts` を作り、次の内容を記述します。

```typescript
import "vitest-browser-react";
import "@testing-library/jest-dom/vitest";
```


続いて `tsconfig.app.json` の `compilerOptions` のセクションに次の行を追加します。利用する IDE に型情報を伝えるためです。

```
    "types": ["@vitest/browser/providers/playwright", "vitest/globals"]
```

これで `pnpm test` で Vitest が起動するようになりました。現時点ではテストコードがないため失敗します。

Vite の `react-swc-ts` テンプレートの画面は "Vite + React" 表示します。これをテストするコードは次のようになります。

```typescript
import { render } from 'vitest-browser-react'
import { expect, test } from 'vitest'
import App from './App'

test('loads and displays greeting', async () => {
  const screen = render(<App />)

  await expect.element(screen.getByText("Vite + React")).toBeInTheDocument()
})
```

これを `frontend/src/App.test.tsx` という名前で保存し、テストしてみましょう。

```
$ pnpm test                                                                                       ✔  took 1m 24s  at 04:26:03 PM

> frontend@0.0.0 test /path/to/frontend
> vitest run --browser.headless src/

 RUN  v3.0.7 /path/to/frontend

4:26:07 PM [vite] (client) Re-optimizing dependencies because vite config has changed
 ✓  chromium  src/App.test.tsx (1 test) 19ms
   ✓ loads and displays greeting

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  16:26:07
   Duration  898ms (transform 0ms, setup 83ms, collect 9ms, tests 19ms, environment 0ms, prepare 176ms)
```

いい感じですね。

## `backend/` を作る

プロジェクトのルートに移動して、次のコマンドを実行します。

```
$ pnpm create hono@latest ./backend --template cloudflare-workers --pm pnpm --install
$ cd backend

(Note: `pnpm i` が必要なのは少し不思議です `--install` でインストールが自動的に走ることを期待しているので)
$ pnpm i
```

### API エンドポイントを作る

`backend/src/index.ts` に次のようなエンドポイントを生やします。

```typescript
app.get('/api/v1/books', (c) => {
  return c.json([
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  ])
})
```

では次にテストを書きましょう。テスト用にパッケージをインストールします。`backend/` ディレクトリで次のコマンドを実行します。

```
$ pnpm i -D vitest @cloudflare/vitest-pool-workers
```

`backend/package.json` の scripts に次の項目を追加します。

```json
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy --minify",
    "test": "vitest --run"   <-- 追加
  },
```

これで `pnpm test` が動作します。

このようなテストを `backend/src/index.test.ts` に書いてみましょう。

```typescript
import { expect, test } from 'vitest'
import app from './index'

test('should return JSON', async () => {
  const res = await app.request('http://localhost/api/v1/books');
  expect(res.status).toBe(200);

  const data = await res.json();
  expect(data).toEqual([
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  ]);
})
```

最後に `backend/src/index.ts` に次のコードを加えます。

```typescript
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: 'http://localhost:5173',
}));
```

これは開発環境で React からの API リクエストを受け取れるようにするためです。これがないと CORS の制約により、HTTP リクエストが通りません。

## (おまけ) Cloudflare Workers へのデプロイ

Hono アプリは Cloudflare Workers へ簡単にデプロイできます。`backend/` ディレクトリに移動して `pnpm run deploy` とするだけです。これで Hono アプリ **だけ** が Cloudflare Workers にデプロイされます。

しかし、本記事は React と Hono でサービスを構成しています。React も一緒にデプロイするにはどうすればいいのでしょう? [Cloudflare Workers の Static Assets](https://developers.cloudflare.com/workers/static-assets/) は選択肢のひとつです。これは Cloudflare Workers を使いつつ、特定のディレクトリのファイルを静的にホストするというものです。`frontend/` のビルド結果を `backend/` 以下に出力し、それを Static Assets とすれば React と Hono を併せてデプロイできます。

`frontend/package.json` の `scripts.build` を次のように書き換えましょう。

```json
...
   "build": "tsc -b && vite build --outDir=../backend/dist",
...
```

`--outDir` を追加したので、React をビルドしたものが `backend/dist` に出力されます。

そして `backend/wrangler.jsonc` には次のように `assets` の設定を追加します。

```json
...
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  }
...
```

これで準備はできました。`frontend/` で `pnpm build` し、`backend/` で `pnpm run deploy` すると Cloudflare Workers へデプロイできます。

実務的には、毎回ディレクトリを移動してコマンドをたくさん叩きたくはないので、小さいスクリプトを準備してあげる方が良いと思います。

## あえて無視したもの

### Hono + JSX Middleware

Hono には [JSX ミドルウェア](https://zenn.dev/yusukebe/articles/c9bc1aa389cbd7)があるので React にこだわらず JSX だけ使いたければ、これでも十分かもしれません。

### Hono + HonoX

[HonoX という (メタ) フレームワーク](https://github.com/honojs/honox)で React と Hono を組み合わせることもできます。HonoX はこの記事の執筆時点ではアルファ版です。

## 参考資料

* [React (Vite) + Spring Boot (Kotlin) プロジェクトの初期設定](https://zenn.dev/mahata/articles/d9ced1f3a9d411)
