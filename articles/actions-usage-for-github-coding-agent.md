---
title: "GitHub Copilot Coding Agentが利用しているGitHub Actionsの使用料"
emoji: "✨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github", "githubactions", "githubcopilot"]
published: true
---

## この記事は何ですか?

先日、GitHub Copilot Coding Agentの料金体系は単純化されました。単に[「1セッションごとに1つのプレミアムリクエストを消費」するようになった](https://github.blog/jp/2025-07-11-github-copilot-coding-agent-now-uses-one-premium-request-per-session/)、というあれです。この結果、プレミアムリクエストの使用料はほとんど気にする必要がなくなりました。

しかし、GitHub Copilot Coding Agentは内部でGitHub Actionsを利用するため、GitHub Actionsの実行時間に応じた課金は依然として発生します。この実行時間を確認する方法を紹介します。

## GitHub Actionsの利用時間

GitHub Actionsの利用時間は `https://github.com/{user}/{repository}/actions/metrics/usage` で確認できます。ここでは、ワークフロー毎の時間を消費したかを確認できます。

Copilot Coding Agentが利用した時間はどこで確認できるかというと、実は `copilot` という名前のワークフローで集計されています。したがって、GitHub Copilot Coding Agentが起動するワークフローは、`workflow_file_name:copilot` というフィルターで抽出できます。

例えば、僕の [`mahata/mlack`](https://github.com/mahata/mlack) というリポジトリでは、次のURLでCopilot Coding Agentの使用料を確認できます (もちろん、権限のないユーザーはこのURLにアクセスできません)。

* https://github.com/mahata/mlack/actions/metrics/usage?filters=workflow_file_name%3Acopilot

開くと、次のような画面が見えます。

![Actions Usage for GitHub Copilot Coding Agent](/images/actions-usage-for-github-coding-agent/actions-usage.png)

## まとめ

* GitHub Copilot Coding Agentによるプレミアムリクエスト消費は少なくなりました
* (しかし) GitHub Actionsの実行時間は相変わらず課金対象です
* `workflow_file_name:copilot` でGitHub Copilot Coding AgentのみのActions実行時間を調べられます

この記事が、Copilot Coding Agentのコスト見積もりの助けになれば嬉しいです 🤖
