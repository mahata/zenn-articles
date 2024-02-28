---
title: "ノッチ付き MacBook のメニューバーにたくさんアイコンを表示する方法"
emoji: "💻"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["MacBook"]
published: true
---

僕は MacBook のメニューバーにたくさんアイコンを置いています。ところが、新しい MacBook は「ノッチ」と呼ばれる切り込みが画面上部の中央に存在しているため、たくさんアイコンを置くと一部のアイコンが隠れてしまいます。これを回避する有名な方法といえば:

* [Bartendar](https://www.macbartender.com/) を使う
* [解像度を変更する](https://getnavi.jp/digital/890135/)

のふたつだと思います。

しかし Bartendar のような外部ツールを使いたくないし、解像度もいじりたくないという場合もあるでしょう。僕がまさにそうでした。最近、同僚に「Mac のプロパティをいじって回避できるよ」と教わったので、それについて書いてみようと思います。

## プロパティの変更方法

次のコマンドを打ちます。

```shell
defaults -currentHost write -globalDomain NSStatusItemSelectionPadding -int 6
defaults -currentHost write -globalDomain NSStatusItemSpacing -int 6
```

その後で Mac にログインし直すとメニューアイコン間のスペースが小さくなり、通常よりも多くのメニューアイコンが表示できるようになります。

ところで、同僚の情報のネタ元は [Built-in workaround for applications hiding under the MacBook Pro notch という記事](https://flaky.build/built-in-workaround-for-applications-hiding-under-the-macbook-pro-notch)です。スクリーンショットや、元に戻すための情報などもあるので、ぜひ併せて読んでみてください。
