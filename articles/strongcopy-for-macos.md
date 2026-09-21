---
title: "Strongcopy をリリースしました"
emoji: "📋"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["macos", "productivity", "clipboard", "software"]
published: true
---

## この記事は何ですか?

先日、[Strongcopy](https://strongcopy.mahata.org/) を公開しました。

Strongcopy は、macOS でクリップボードを使うときに「きちんとコピーできたか」を確認できるアプリです。コピペミスにタイムリーに気づくのは難しいものです。ペースト時にようやく、コピーしそこねていたことに気づくことがあります。

Strongcopy は、そのようなミスを防ぐためのツールです。データがクリップ時に入るときに、一瞬だけツールチップが出て確認できるようにします。

![Strongcopy のバッジ表示](/images/strongcopy-for-macos/strongcopy.png)

## ユーザー体験

[Strongcopyの紹介ページ](https://strongcopy.mahata.org/)に、コピー時に現れる小さなバッジを載せています。マウスの横に出ている `Copied` バッジが確認できます。

このバッジは、クリップボードの中身が変わった瞬間にポインターの横に一瞬だけ出て、1秒未満で消えます。メニューバーのアイコンはアプリが起動していることを示しており、ユーザーは「今、コピーが完了した」と分かるようになっています。

## プライバシーと安全性

このアプリでは、クリップボードの中身を読み取ったり、ログに残したり、保持したりすることはしません。アクセス権も必要ありません。通知の許可も必要ありません。ネットワーク接続も行いません。実際に `Strongcopy` は、読めば理解できるくらいの小さなコードで作られています。[ソースコードはGitHubで公開しています](https://github.com/mahata/strongcopy)。

Strongcopy はバックグラウンドの補助アプリとして動きます。

Dock に常駐せず、メニューバーにアイコンが1つだけ残るだけです。そこには「About」「Open at Login」「Quit」くらいの機能しかありません。シンプルなミニアプリです。

## ご意見、ご要望

もしよければ、[Strongcopy のページ](https://strongcopy.mahata.org/) を見て、気になるところや改善してほしい点があれば教えてください。
