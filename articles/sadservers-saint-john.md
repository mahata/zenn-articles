---
title: 'SadServers - "Saint John" の解説'
emoji: "✨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["linux", "ops", "SadServers"]
published: true
---

[SadServers](https://sadservers.com/) というウェブサービスがあります。トップページには **"Like LeetCode for Linux"** と書かれています。ここでは Linux サーバーのトラブルシュートを楽しめます。ユーザーには一時的に接続できる Ubuntu サーバーが与えられ、ブラウザで動くターミナルで与えられた環境のトラブルシュートをします。[GitHub で SadServers のアーキテクチャが説明されており](https://github.com/fduran/sadservers)、なかなか面白い構成になっています。

この記事では ["Saint John": what is writing to this log file?](https://sadservers.com/newserver/saint-john) という問題について考えてみようと思います。要約すると `/var/log/bad.log` にログデータが出力され続けており、ディスクが溢れると困るので、ファイルに書き込みをしているプロセスを止めましょう、というお題です。

あるファイルを開いているプロセスを探したいときは `lsof` を使えます。`lsof` には色々な機能があるが、このケースではファイル名をコマンドライン引数として渡すことで次のような結果が得られます。

```
$ sudo lsof /var/log/bad.log
COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF  NODE NAME
badlog.py 613 ubuntu    3w   REG  259,1    16206 67701 /var/log/bad.log
```

幸運なことに `/var/log/bad.log` を開いている `badlog.py` を発見することができました。次はこの Python スクリプトのプロセスIDを調べましょう。`ps` コマンドの出力を見ればわかります。

```
$ ps aux | grep badlog.py
ubuntu 613 0.0 1.9 17672 8900 ? S 05:41 0:00 /usr/bin/python3 /home/ubuntu/badlog.py
ubuntu 1182 0.0 0.4 7008 2200 pts/0 R+ 05:45 0:00 grep --color=auto badlog.py
```

上記の結果から、プロセスID `613` が `/usr/bin/python3 /home/ubuntu/badlog.py` で立ち上げられたプロセスのようです。

このプロセスを止めるには `kill` コマンドを使う。`kill` コマンドにプロセス番号を与えましょう。

```
$ kill 613
$ ubuntu@ip-172-31-32-108:/$ ps aux | grep badlog.py
ubuntu      1185  0.0  0.4   7008  2248 pts/0    R+   05:46   0:00 grep --color=auto badlog.py
```

`kill 613` を実行した後で再度 `ps` すると該当プロセスは見当たりません。これでトラブルシュートは完了です。

なお `kill` コマンドはデフォルトでは `SIGTERM` シグナルを発行します。[もし SIGTERM でコマンドを削除できない場合は SIGKILL などを使う必要がある](https://manned.org/kill)。
