---
title: "Socks Proxy で制限されたネットワークから抜け出す方法"
emoji: "🛜"
type: "tech"
topics: ["SSH", "Socks", "macOS", "Chrome", "Java"]
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

## macOS の Google Chrome で Socks Proxy を通すようにする設定

macOS で Google Chrome を素直に .dmg 経由でインストールすると、実行ファイルは `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome` に作られます。このとき、次のように `--proxy-server="socks5://127.0.0.1:1080"` を指定して Google Chrome をコマンドラインから起動することで、Google Chrome が Socks Proxy 経由でコンテンツにアクセスするようになります。

```
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --proxy-server="socks5://127.0.0.1:1080"
```

## 手元の Java アプリケーションで Socks Proxy を通すようにする設定

`-DsocksProxyHost` と `-DsocksProxyPort` を設定します。上記の設定をしている場合、具体的には次のように実行します。

```
$ java -DsocksProxyHost=127.0.0.1 -DsocksProxyPort=1080 org.example.Main
```

環境によっては `-DsocksNonProxyHosts="localhost|127.0.0.1"` をあわせて指定すると役に立つかもしれません。このオプションをつけることで `localhost` や `127.0.0.1` への接続は Socks Proxy を通さないようになります。基本的にネットワーク越しの環境を使いたいものの、ローカルホストで動くデータベースにも接続したい場合はこれを指定します。

## macOS で Socks Proxy を通すようにする設定

[公式ページに説明があります](https://support.apple.com/ja-jp/guide/safari/ibrw1053/mac)。

> 1. MacのSafariアプリ  で、「Safari」＞「設定」と選択してから、「詳細」をクリックします。
> 2. 「プロキシ」の横にある「設定を変更」をクリックして、「ネットワーク」設定を開きます。
> 3. ネットワーク管理者によって提供された情報を使用してプロキシ設定を変更します。
> 4. 「OK」をクリックします。

手元で撮ったスクリーンショットを添付します。

![Socks Proxy Screenshot](/images/socks-proxy/socks-proxy-sonoma.png)

これでインターネットへのアクセスが全て Socks Proxy を経由するようになります。大量に通信する場合、踏み台サーバーが捌ける帯域幅がボトルネックになることがあります。注意しましょう。

## AWS の EICE 越しに Socks Proxy を起動するコマンド

```
$ ssh -i /path/to/your-key.pem \
    -D 1080 -f -C -q -N ec2-user@instance-id \
    -o ProxyCommand='aws ec2-instance-connect open-tunnel --instance-id instance-id'
```

`instance-id` で指定している EC2 インスタンスがプライベートサブネットに所属しており、そのプライベートサブネットからしかアクセスできないコンポーネントに触りたいときに便利です。これと上記の「Java アプリケーションで Socks Proxy を通すようにする設定」を組み合わせることで、(比較的) 安全にローカルホストから AWS 上の開発環境に接続できます。なお、`ssh` コマンドに渡している各オプションは次のような意味です。

* `-f`: バックグラウンドで実行
* `-C`: データ圧縮を有効化
* `-q`: クワイエットモード（出力を最小限に）
* `-N`: リモートコマンドを実行しない（プロキシのみ）

## 最後に

職場が課すポリシーが理不尽である場合、本来はポリシーが修正されるように働きかけるべきだと思います。職場と戦いましょう。