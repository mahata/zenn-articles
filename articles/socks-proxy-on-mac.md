---
title: "Socks Proxy で制限されたネットワークから抜け出す方法"
emoji: "🛜"
type: "tech"
topics: ["SSH", "Socks", "macOS"]
published: true
---

職場のポリシーにより、従業員が接続できるウェブサービスが限られているとしましょう。その職場はソフトウェア開発を生業としているため、SSH によるリモートサーバーへのアクセスは許可されているとします。

そのような場合 Socks Proxy を使うことで制限を回避できることがあります。

Socks Proxy のイメージは次の通りです。

![Socks Proxy Network Diagram](/images/socks-proxy/socks-proxy-network.png)

ローカルマシンからはリモートマシンに対して SSH 接続をしているだけに見えるので、この接続をブロックすることは困難でしょう。

この Socks Proxy を macOS Sonoma で設定する方法について書いていきます。

## Socks Proxy の作成

`ssh` コマンド一発で作成できます。

```
ssh -f -N -D 1080 -i ~/.ssh/my-key.pem mahata@bastion.example.com
```

`-D 1080` オプションでローカルマシンのポート 1080 番に Socks Proxy を設定しています。ちなみに `-f` は SSH セッションをバックグラウンドで実行させるオプションですが、これは指定しない方がいいかもしれません。仕事で MacBook を持って移動したり、うっかりスリープさせてしまったりすると SSH 接続が切れることがありますが、そのときフォアグラウンドで SSH を実行している方が切断に気づきやすいからです。

## macOS で Socks Proxy を通すようにする設定

[公式ページに説明があります](https://support.apple.com/ja-jp/guide/safari/ibrw1053/mac)。

> 1. MacのSafariアプリ  で、「Safari」＞「設定」と選択してから、「詳細」をクリックします。
> 2. 「プロキシ」の横にある「設定を変更」をクリックして、「ネットワーク」設定を開きます。
> 3. ネットワーク管理者によって提供された情報を使用してプロキシ設定を変更します。
> 4. 「OK」をクリックします。

手元で撮ったスクリーンショットを添付します。

![Socks Proxy Screenshot](/images/socks-proxy/socks-proxy-sonoma.png)

これで Socks Proxy を経由したインターネットへのアクセスが可能になりました。こんにちは、インターネット。会いたかったよ...。

## 最後に

職場が課すポリシーが理不尽である場合、本来はポリシーが修正されるように働きかけるべきだと思います。職場と戦いましょう。
