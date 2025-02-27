---
title: "React + Hono プロジェクトの初期設定 in 2025"
emoji: "🔥"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["React", "Hono", "Vite", "TypeScript"]
published: false
---

## この記事は何ですか?

新規にWebアプリケーションを React (フロントエンド) と Hono (バックエンド) で構築するときの初期設定に関するメモです。

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
$ pnpm install -D vitest @vitest/browser playwright vitest-browser-react @vitejs/plugin-react
```

あわせて `package.json` の scripts に `"test":` の項を足します。次のようになります。

```json
	"scripts": {
		"dev": "vite",
		"build": "tsc -b && vite build",
		"lint": "eslint .",
		"preview": "vite preview",
		"test": "vitest run --browser=chrome"   <-- 追加
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

続いて `tsconfig.app.json` の `compilerOptions` のセクションに次の行を追加します。利用する IDE に型情報を伝えるためです。

```
    "types": ["@vitest/browser/providers/playwright", "vitest/globals"]
```

これで `pnpm test` で Vitest が起動するようになりました。

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

では、これをテストしてみましょう。

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




## 参考資料

* [React (Vite) + Spring Boot (Kotlin) プロジェクトの初期設定](https://zenn.dev/mahata/articles/d9ced1f3a9d411)

## あえて無視したもの

### Hono + JSX Middleware

Hono には [JSX ミドルウェア](https://zenn.dev/yusukebe/articles/c9bc1aa389cbd7)があるので React にこだわらず JSX さえ使えれば、それでも十分かもしれません。

### Hono + HonoX

[HonoX という (メタ) フレームワーク](https://github.com/honojs/honox)で React と Hono を組み合わせることもできます。HonoX はこの記事の執筆時点ではアルファ版です。
