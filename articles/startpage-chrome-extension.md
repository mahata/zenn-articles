---
title: "Startpage の検索結果タイトルに検索キーワードを付与する Chrome 拡張"
emoji: "🔎"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["Search", "Startpage", "Chrome"]
published: true
published_at: 2024-01-04 09:00
---

ChatGPT の登場により、一般的なウェブ検索を使うことはだいぶ減りました。とはいえ ChatGPT は新しい知識を持たないので、最新の情報を得るため、まれに検索エンジンを使うこともあると思います。

僕は検索エンジンに [Startpage](https://www.startpage.com/) を使用しています。これは `The world's most private search engine.` を標榜している検索エンジンです。[彼ら自身の説明では、ユーザーの情報を一切保持せずに検索結果を返すサービスとしています](https://www.startpage.com/en/how-startpage-works/)。類似のサービスで、もっとも知名度の高いものは [DuckDuckGo](https://duckduckgo.com/) だと思います。

ところで、僕は DuckDuckGo の検索品質は「あまり良くない」と思っています。DuckDuckGo はバックエンドの検索エンジンとして Bing を使用しているのですが、Bing 自体の検索結果がいまひとつ Google などに比べると劣ると思っています。これは日本語情報を検索しているときに強く感じます。過去に個人ブログでもこれについて書いたことがあります。

* [日本語圏のユーザーには DuckDuckGo よりも startpage.com がオススメ](https://mahata.gitlab.io/post/2019-12-05-startpage/)

さて、生の Startpage を使っていると困ることがあります。複数の検索結果ページを見分けられないのです。たとえば "Startpage", "DuckDuckGo", "Google" というキーワードで検索した 3 つのタブがあるとします。Google Chrome では次のように表示されます。

![Chrome 拡張なし](/images/startpage-chrome-extension/without-extension-compressed.gif)

検索を繰り返すと、どのタブにどの検索結果があるのかわからなくなってしまいます。

これは Startpage の意図的な設計によるものだと思います。よくある検索エンジンでは、検索クエリを URL パラメーターに付与します。たとえば `?q=search-query` のようなものです。Startpage は POST リクエストで検索クエリを受け取るため、URL から検索クエリがわからないようになっています。同じように、ページタイトルに検索クエリを含めないのは、ブラウザを背後から覗き見られてもプライバシーが守られるようにする配慮だと想像できます。

しかし、これはユーザビリティをトレードオフにしており、個人的には耐え難いです。これを解消するための [Startpage Nicer Title Extension](https://chromewebstore.google.com/u/1/detail/startpage-nicer-title-ext/bnmehmalocfmlifckddiolikhcdkaifa) という Chrome Extension を作りました。これをインストールすると、タブの様子は次のようになります。

![Chrome 拡張あり](/images/startpage-chrome-extension/with-extension-compressed.gif)

違いが伝わるでしょうか? 念のために注釈付きの静止画も貼っておきます。

![タイトル](/images/startpage-chrome-extension/annotation.png)

検索キーワードがタブの先頭に付与されています。これにより、複数の検索結果がブラウザ内に存在していても、それらのページを用意に見分けられるようになります。

この [Chrome 拡張のソースコードは GitHub にあります](https://github.com/mahata/startpage-chrome-extension)。技術的な話もしておこう...と思うものの、ほとんど語れることはありません。本記事の執筆時点では `scripts/content.js` 内の 5 行のコードが全てです。

```javascript
const searchBox = document.getElementById('q');

if (searchBox && searchBox.value.trim() !== "") {
    document.title = searchBox.value + " - StartPage";
}
```

Startpage の検索ボックスは `id="q"` なので、その値を取得して `document.title` に詰める、というだけのものです。短いコードですが、これだけで意味のある拡張が作れるというのもすごいことだと思います。

もし Chromium 系のブラウザを使われている方で Startpage に興味がある方がいれば、ぜひ [Startpage Nicer Title Extension](https://chromewebstore.google.com/u/1/detail/startpage-nicer-title-ext/bnmehmalocfmlifckddiolikhcdkaifa) を試してみてください。
