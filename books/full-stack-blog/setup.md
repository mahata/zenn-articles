---
title: "環境構築"
---

プロジェクトのルートディレクトリを `full-stack-blog` として、そこに `backend` と `frontend` のディレクトリを作成します。`backend` には Spring Boot のプロジェクトを作成し、`frontend` には React のプロジェクトを作成する予定です。

```shell
$ mkdir full-stack-blog
$ cd full-stack-blog
$ mkdir backend frontend
```

それでは Spring Boot プロジェクトを作成しましょう。

## Spring Boot プロジェクトの作成

`backend` ディレクトリに移動して、[Spring Initializr](https://start.spring.io) を使ってプロジェクトを作成します。Spring Initializr は、Spring Boot のプロジェクトを簡単に作成できるウェブアプリケーションです。

おおむねデフォルトのままで構いませんが、次の項目だけ変更します。

* Project: `Gradle - Groovy` から `Gradle-Kotlin` に変更
* Language: `Java` から `Kotlin` に変更
* Dependencies に `Spring Web` を追加

ここまでの設定が完了したら、`Generate` ボタンをクリックしてプロジェクトをダウンロードします。`demo.zip` という名前でダウンロードされるはずです。

:::message
Spring Initializr は設定済みのプロジェクトにリンクを設定できます。[こちらをクリックする](https://start.spring.io/#!type=gradle-project-kotlin&language=kotlin&platformVersion=3.4.0&packaging=jar&jvmVersion=21&groupId=com.example&artifactId=demo&name=demo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&dependencies=web)と、Spring Initializr に設定済みのプロジェクトが表示されます。
:::

ダウンロードしたファイルを `backend` ディレクトリに展開します。プロジェクトのルートディレクトリで、次のコマンドを実行します。

```shell
$ unzip demo.zip -d backend
```

もし `tree` コマンドがインストールされていれば [^1]、次のようにディレクトリ構造を確認できます (一部省略しています)。

[^1]: `tree` コマンドがインストールされていない場合、macOS であれば `brew install tree` などでインストールできます。他の OS でも、パッケージマネージャーからインストールできることがほとんどです。

```shell
$ tree .
.
├── backend
│   └── demo
│       ├── HELP.md
│       ├── build.gradle.kts
│       ├── settings.gradle.kts
...
│       └── src
│           ├── main
...
│           └── test
└── frontend
```

## React プロジェクトの作成

`frontend` ディレクトリに移動して、[Vite を使ってプロジェクトを作成します](https://ja.vite.dev/guide/) を使ってプロジェクトを作成します。Vite には様々な機能がありますが、ここでは React プロジェクトの雛形を作ってくれるツールとして使います。

```shell
$ cd frontend
$ npm create vite@latest frontend -- --template react-ts
```

さて、これでプロジェクト直下に `backend/` と `frontend/` のディレクトリができました。`frontend/` は `backend/` にある Spring Boot プロジェクトと連携するため、Vite を設定します。`vite.config.ts` を次のように変更します。

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
})
```

`server: {}` のセクションが新規で設定したところになります。`proxy` オプションは、`/api` 以下のリクエストを `http://localhost:8080` に転送する設定です。これにより、React アプリケーションからバックエンドの API にアクセスできるようになります。

:::message
このプロジェクトでは `/api` というパスを特別視します。React アプリケーションが多くのパスを処理する一方、バックエンドへのリクエストはすべて `/api` 以下に集約します。このようにすることで、バックエンドの API とフロントエンドのコードを分離しやすくなります。

React アプリケーションで複数のパスを処理する方法については後の章で説明します。
:::
