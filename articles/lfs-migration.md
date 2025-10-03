---
title: "Gitリポジトリの大きなバイナリファイルをGit LFSに移行する方法"
emoji: "💾"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["git", "gitlfs", "github"]
published: true
---

## この記事は何ですか?

Gitを利用しはじめた頃の気持ちを覚えているでしょうか。まだGitの操作に慣れておらず、`git add` や `git commit` のコマンドを打つたびにドキドキしていたあの頃。そんな初心者の頃にありがちなミスの一つが、大きなバイナリファイルを誤ってリポジトリに追加してしまうことです。大きいバイナリファイルはGitのパフォーマンスを低下させます。また、GitHubのリポジトリには100MBのファイルサイズ制限があるため、これを超えるとプッシュが拒否されてしまいます。

この記事では、Git Large File Storage (LFS) を利用して、誤って追加してしまった大きなバイナリファイルをリポジトリから削除し、LFSに移行する方法を紹介します。過去を精算しましょう。

## Git LFSとは?

Git LFSは、Gitで大きなファイルを効率的に管理するための拡張機能です。LFSを利用すると、大きなバイナリファイルをGitの履歴から分離し、専用のストレージに保存できます。これにより、リポジトリのクローンやフェッチが高速化され、パフォーマンスが向上します。リポジトリにはファイルそのものではなく、実体へのポインタが保存されます。

## 事前準備

Git LFSを利用するには、まずGit LFSをインストールする必要があります。macOSでは `brew install git-lfs` でインストールできます。その他の環境でのインストールについては[公式ウェブサイト](https://git-lfs.com/)を参照してください。

インストール後、次のコマンドでGit LFSを初期化します。

```bash
$ git lfs install
```

## 実例紹介

あるディレクトリに `large-file.dmg` という大きなバイナリファイルと、`small-file.txt` という小さなテキストファイルがあるとします。`large-file.dmg` は600MB超です。

このような感じでリポジトリの初期設定をします。

```bash
$ git init
$ git remote add origin ...
$ touch README.md
$ git add README.md
$ git commit -m 'first commit'

$ git add large-file.dmg
$ git commit -m 'add large file'

$ git add small-file.txt
$ git commit -m 'add small file'
```

では、ここで `git push` してみましょう。

```bash
$ git push

Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (6/6), 662.07 MiB | 6.24 MiB/s, done.
Total 6 (delta 1), reused 1 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), done.
remote: error: Trace: 2947ef440d8d1a971e80e88bb1c3292f8f592e0b0788c50529977aa826a1d9f4
remote: error: See https://gh.io/lfs for more information.
remote: error: File large-file.dmg is 664.30 MB; this exceeds GitHub's file size limit of 100.00 MB
remote: error: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
To github.com:mahata/xxxxx.git
 ! [remote rejected] main -> main (pre-receive hook declined)
error: failed to push some refs to 'github.com:mahata/xxxxx.git'
```

おや、`File large-file.dmg is 664.30 MB; this exceeds GitHub's file size limit of 100.00 MB` というエラーが出てしまいました。これは、`large-file.dmg` がGitHubの100MBのファイルサイズ制限を超えているためです。

Git LFSを利用してこの問題を解決したいところですが、その前に `git log` でこれまでのコミット履歴を確認してみましょう。

```bash
$ git log --oneline
e423349 (HEAD -> main) add small file
881b36f add large file
ed2f6bf (origin/main) first commit
```

このコミットツリーを眺めたところで、Git LFSを試してみましょう。

```bash
$ git lfs migrate info --above=100MB
Fetching remote refs: ..., done.
Sorting commits: ..., done.
Examining commits: 100% (2/2), done.
*.dmg           697 MB  1/1 file        100%

LFS Objects     0 B     0/1 file          0%
```

`git lfs migrate info --above=100MB` は、Gitリポジトリの履歴にあるブロブを走査して、サイズが100MBを超えるファイルを検出します。このコマンドの出力から、`*.dmg` ファイルが697MBで1つ存在することがわかります。

それでは、このファイルをGit LFSに移行してみましょう。

```bash
$ git lfs migrate import --above=100MB
Fetching remote refs: ..., done.
Sorting commits: ..., done.
Rewriting commits: 100% (2/2), done.
  main  e423349664ad7a4d77fad7eb3ff966909ebca54f -> b6b7d01747129a9812c7a59253fe5696e0512186
Updating refs: ..., done.
Checkout: ..., done.
```

何かコミットの書き換えが発生していそうなメッセージですね。ここで `git lfs migrate info --above=100MB` を再度実行してみましょう。

```bash
$ git lfs migrate info --above=100MB
Fetching remote refs: ..., done.
Sorting commits: ..., done.
Examining commits: 100% (2/2), done.
LFS Objects     697 MB  1/3 files       33%
```

`git lfs migrate info --above=100MB` を再度実行すると、LFSオブジェクトが697MBで1つ存在しています。これで、`large-file.dmg` がGit LFSに移行されたことが確認できます。

では、`git log --oneline` でコミット履歴を確認してみましょう。

```bash
$ git log --oneline
b6b7d01 (HEAD -> main) add small file
67ba199 add large file
ed2f6bf (origin/main) first commit
```

コミットIDが変わっていますね。`git lfs migrate import` は、履歴を書き換えるため、コミットIDが変わります。

では、変更をリモートリポジトリにプッシュしてみましょう。

```bash
$ git push
Uploading LFS objects: 100% (2/2), 697 MB | 14 MB/s, done.
Enumerating objects: 11, done.
Counting objects: 100% (11/11), done.
Delta compression using up to 8 threads
Compressing objects: 100% (8/8), done.
Writing objects: 100% (9/9), 957 bytes | 957.00 KiB/s, done.
Total 9 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), done.
To github.com:mahata/xxxxx.git
   ed2f6bf..b6b7d01  main -> main
```

今回はうまくいきました。`git push` が成功し、LFSオブジェクトがアップロードされました。めでたしめでたし。

なお、`git lfs migrate import` は履歴を書き換えるため、リモートリポジトリに既にプッシュされている場合は、強制プッシュが必要になります。今回は初めてのプッシュだったので問題ありませんでしたが、既にプッシュされている場合は `--force` オプションを付けて強制プッシュしてください。
