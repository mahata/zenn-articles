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

`frontend` ディレクトリに移動して、[Vite を使ってプロジェクトを作成します](https://ja.vite.dev/guide/) を使ってプロジェクトを作成します。Vite には様々な機能がありますが、ここでは React プロジェクトの雛形を作ってくれるツールとして使います。プロジェクトのルートディレクトリで次のコマンドを実行します。

```shell
$ npm create vite@latest frontend -- --template react-ts
```

これでルートディレクトリ配下に `backend/` と `frontend/` のディレクトリができました。`frontend/` は `backend/` にある Spring Boot プロジェクトと連携するため、Vite を設定します。`vite.config.ts` を次のように変更します。

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

React アプリケーションを起動するには、`frontend/` ディレクトリで `npm run dev` を実行します。なお、初回実行時には `npm install` コマンドも実行する必要があります。

```shell
$ cd frontend
$ npm install
$ npm run dev
```

実行結果として次のような出力が表示されます。

```shell
$ npm run dev

> frontend@0.0.0 dev
> vite


  VITE v6.0.3  ready in 231 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

表示されている通り `http://localhost:5173/` にアクセスすると React アプリケーションが表示されます。本原稿の執筆時点では初期画面は次のようになります。

![React Default Page Screenshot](/images/book/full-stack-blog/initial-react-page.png)

これで環境構築が完了しました。

次の章では、React で最初のページを作成します。

:::message
この章で作成したプロジェクトは、[GitHub に公開しています](https://github.com/mahata/full-stack-blog)。このリポジトリをクローンして、この章の内容を確認できます。
:::
