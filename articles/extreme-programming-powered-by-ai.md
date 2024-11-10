---
title: "AI で変わる XP のプラクティス"
emoji: "👥"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["xp", "ai", "pairprogramming"]
published: true
---

僕はエクストリームプログラミング (以下、XP と表現します) の導入支援を行う企業で、ソフトウェアエンジニアとして働いています。業務時間の 80% 前後をクライアント企業のソフトウェアエンジニア (以下、クライアントと表現します) とのペアプログラミングに費やしています。

先日、クライアントから「XP のプラクティスと AI の関係」について尋ねられました。昨今の AI 技術によって XP のプラクティスも変化するのではないか、という質問です。残念ながら即答できなかったので、これについて深く考えてみます。

少なくとも次の事柄は AI 技術による影響を受けそうです。

* ペアプログラミングにおけるドライバー/ナビゲーターのロール
* トランクベース開発

ひとつずつ考えていきます。

## ペアプログラミングにおけるドライバー/ナビゲーターのロール

[GitHub Copilot](https://github.com/features/copilot) は「Your AI Pair Programmer」という謳い文句でサービスを提供しています。

![GitHub Copilot](/images/extreme-programming-powered-by-ai/github-copilot-ai-pair-programmer.png)

ペアプログラミングにおける「ペア」とは何でしょうか? XP の文脈では、ドライバーとナビゲーターの組み合わせを指すことが多いです。ドライバーはキーボードを操作し、ナビゲーターはドライバーに指示および助言をする、という分担です。

なるほど、たしかに Copilot は質問に答えてくれたり、コードを提案してくれたりします。 しかし、ドライバーやナビゲーターとしての機能は果たせるでしょうか?

一般に、ペアプログラミングではドライバーとナビゲーターは定期的に交代します。交代のタイミングには色々な流派があります。僕個人は、成熟したプログラマー同士であればピンポン形式[^1]でロールを交換するのが望ましいと思います。ピンポン形式では A さんと B さんが次のように役割を交代していきます。

[^1]: [ペア・プログラミングの採用を成功させるには](https://www.infoq.com/jp/articles/adopting-pair-programming/)

1. A がテストコードを書く
2. B が実装コードを書く
3. (A, B が一緒にリファクタリングを行う)
4. B が (次の機能のための) テストコードを書く
5. A が実装コードを書く
6. (以下、繰り返し)

さて、もし Copilot が十分に賢ければ、このプロセスはどうなるでしょうか。 

テスト駆動開発では、テストコードは仕様だと考えます。Given-When-Then 構文[^2]にしたがい「どういう前提条件で (= Given)」「何をすると (= When)」「どう振る舞うか (= Then)」を記述することがテストだからです。上記のプロセスにおける 2. や 4. の大部分は Copilot に任せられるかもしれません。つまり、十分にクリアな仕様さえ与えられれば、実装は Copilot によって行える、ということです。

[^2]: [Given When Then](https://martinfowler.com/bliki/GivenWhenThen.html)

なお、逆は難しいと思います。つまり、実装をペアプログラミングした後、そのテストを Copilot に書かせる手法は機能しないということです。そうしてしまうと、テストは「現状の追認」[^3]になってしまうからです。将来のデグレーションを防ぐテストとしては有用かもしれませんが、実装のミスに気づく材料にはならないでしょう。

[^3]: [希薄化したTDD、プロダクトの成長のために必要なものは？〜『健全なビジネスの継続的成長のためには健全なコードが必要だ』対談](https://twop.agile.esm.co.jp/what-do-we-need-for-growth-of-future-65c43b5a8fe2)

こう考えると、AI 時代のピンポンは「テストコードと実装のセット」までがワンセット、というのが現実的かもしれません。おそらく、この考え方は XP 実践者の中でもマジョリティではないでしょう。もしかすると「ピンポンの境目がぼやける」という方がリアルなのかもしれません。実際、先述のクライアントとのペアプログラミングではドライバーとナビゲーターの境界がぼやけていることも多かったです。

## トランクベース開発

トランクベース開発[^4]とは、開発者が常にメインライン (= トランク) にコードをコミットする開発手法です。Git を使ったチームであれば、常に `main` や `master` ブランチにプッシュする開発手法、と言い換えても良いと思います。

[^4]: [トランクベース開発](https://www.atlassian.com/ja/continuous-delivery/continuous-integration/trunk-based-development)

ペアプログラミングとトランクベース開発は相性が良いです。ペアプログラミングでは、常にペアからレビューを受けているため、別途コードレビューを受ける必要がないからです。なお、公平のために言うと、『[レガシーコードからの脱却](https://www.oreilly.co.jp/books/9784873118864/)』ではペアプログラミングをしていても、コードレビューを行うことを推奨しています。僕はこの主張に同意していないのですが、様々な考え方があるということですね。

ところで、先日の GitHub Universe 2024 で GitHub は[次のような発表をしています](https://github.com/newsroom/press-releases/github-universe-2024)。

> Finally, GitHub envisioned the AI-native developer experience with substantial updates to GitHub Copilot in VS Code, Copilot Workspace, GitHub Models, and Copilot Autofix, bringing AI functionality to the entire GitHub platform from issues, to pull requests, to builds.
> 
> (さらに、GitHubはAIネイティブの開発者体験を想定し、GitHub Copilot for VS Code、Copilot Workspace、GitHub Models、そしてCopilot AutofixといったGitHubプラットフォーム全体にわたる主要機能のアップデートを発表しました。これにより、GitHub上での課題管理、プルリクエスト、ビルドといった作業にAI機能が取り入れられます。)

少し具体性に欠ける発表ではありますが、AI 技術が GitHub の中核機能により深く入り込んでくる、ということのようです。

たとえばプルリクエストに含まれる変更リストに対して Copilot が改善案を提示してくれる、というのはそう遠くない未来の話ではないかと思います。[CodeRabbit](https://www.coderabbit.ai) のようなサードパーティのツールではすでに実現されています。また、[現状でもプルリクエストのサマリーを作成してくれる機能が存在する](https://docs.github.com/ja/enterprise-cloud@latest/copilot/responsible-use-of-github-copilot-features/responsible-use-of-github-copilot-pull-request-summaries)ので、その目的でもプルリクエストベースの変更取り込みがトランクベース開発に対して優位性があると言えるかもしれません。

(2024年11月10日追記)

[GitHub Copilot code review in GitHub.com (public preview)](https://github.blog/changelog/2024-10-29-github-copilot-code-review-in-github-com-public-preview/) という記事が出ていました。もう GitHub Copilot が Pull Request をレビューする機能というのは現実のものなんですね。

(追記ここまで)

## まとめ

Copilot などの AI がソフトウェア開発にもたらす変化は大きく、不可逆的なものだと思います。これまで特に XP のプラクティスに対する影響について考察した記事を読んだことがなかったので、自分の思うところを書いてみました。まだまだ自分には見えていないことも多いと思うので、ぜひ他の方がどう考えているのかも知りたいと思っています。
