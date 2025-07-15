---
title: ""
emoji: "✨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: []
published: false
---

* この記事は何ですか?
  * GitHub Copilot Coding Agentが利用しているGitHub Actionsの使用料を調べる方法のご紹介
* 最近のアップデートでGitHub Copilot Coding Agentの料金体系がシンプルになった
* 一言で表現すると「劇的に安くなった」
* GitHub Copilotのプレミアムリクエストの使用料は「ほとんど気にしないで良い」レベルになった
* しかしながら、GitHub Copilot Coding Agentは作業をGitHub Actionsで実行するため、GitHub Actionsの料金は依然として発生する
* そのためGitHub Actionsの使用料を別途きちんと把握する必要がある
* GitHub Actionsの使用料 (というか使用「分数」) は「ワークフローファイル」ごとに集計される
* ...んだけど、GitHub Copilot Coding Agentは別途集計されている
* `workflow_file_name:copilot` のように絞り込むと、GitHub Copilot Coding Agentの使用料を確認できる
* 僕が趣味でVibe Codingしているものだと、こういう感じ:

https://github.com/mahata/mlack/actions/metrics/usage?filters=workflow_file_name%3Acopilot

* 参考になれば嬉しい
