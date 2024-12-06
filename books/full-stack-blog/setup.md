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

;;;message
Spring Initializr は設定済みのプロジェクトにリンクを設定できます。[こちらをクリックする](https://start.spring.io/#!type=gradle-project-kotlin&language=kotlin&platformVersion=3.4.0&packaging=jar&jvmVersion=21&groupId=com.example&artifactId=demo&name=demo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&dependencies=web)と、Spring Initializr に設定済みのプロジェクトが表示されます。
;;;

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
