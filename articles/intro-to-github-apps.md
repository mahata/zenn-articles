---
title: "GitHub Apps (およびCheck Run REST API) 入門"
emoji: "✔"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github", "githubapps", "typescript", "hono"]
published: true
---

## この記事は何ですか?

僕は毎日GitHub Appsのお世話になっているのですが、その背後にある仕組みがいまいち分かっていませんでした。ソフトウェア開発者である以上、実際に作ってみることで仕組みを理解したいと思い、この記事では小さな GitHub App を自作して GitHub Apps の仕組みを学ぶことにしました。本記事で作成する GitHub App を `Hello World App` と呼びます。

[成果物のソースコードはGitHubで公開しています](https://github.com/mahata/hello-world-check-run-app)。これをインストールすると、GitHubのプルリクエストに対して `"Hello, world!"` というチェックが実行されます。次の画像の通りです。

![GitHub Appsのチェック実行結果](/images/intro-to-github-apps/check-run-output.png)

これは常に成功するチェックなので、実用上のメリットはありません。単にGitHub Appsの仕組みを理解するためのコードだと思ってください。

## GitHub Appsとは

GitHub Appsとは何でしょう。ややこしいですが、GitHub AppsはGitHubにデプロイするアプリケーションのこと**ではありません**。

GitHub Appsは、GitHubのイベントを監視して、対応するペイロードを受け取ることができるアプリケーションです。アプリケーション本体はGitHubではなく、外部のサーバーやサービス上で動作します。本記事で紹介しているGitHub AppsはCloudflare Workersで動作しています。

GitHub Appsはサブスクライブするイベントを選択できます。例えば、プルリクエストが作成されたときや、コミットがプッシュされたとき、それに対応するペイロードを受け取ることができます。

![GitHub Appsにプルリクエストをサブスクライブさせる](/images/intro-to-github-apps/subscribe-to-pull-requests.png)

ここではプルリクエストをサブスクライブしています。この設定のおかげで、プルリクエストが作成されると、GitHub Appsはそのイベントを受け取ることができます。

## Check Runとは?

Check Runはプルリクエストやコミットに対するチェック機能です。プルリクエストにテストや静的解析の結果がGitHub上に表示されているのを見たことがあるでしょうか。これらは、[GitHubの `Check Run API`](https://docs.github.com/ja/rest/checks/runs?apiVersion=2022-11-28)で実現されています。

Check Runエンドポイントに渡せるパラメーターの中でも特徴的なものが `status` と `conclusion` です。これらはチェックの状態を表すもので、例えば `status` が `completed` のときに `conclusion` が `success` であれば、チェックが成功したことを意味します。

`Hello World App` では、次のように `Check Run API` を叩いています。

```typescript
const response = await octokit.rest.checks.create({
    owner,
    repo,
    name: "Hello World Check",
    head_sha: headSha,
    status: "completed", // 常に "completed"
    conclusion: "success", // 常に "success"
    output: {
        title: "Hello World Message",
        summary: `This is a simple 'Hello, world!' message from your GitHub App for PR #${pullNumber}.`,
        text: "The check was successfully created by your GitHub App for this pull request.",
    },
});
```

このようにして、常に `Check Run` が成功するようにしています。意味のあることをする場合は、`status` や `conclusion` の値を適切に設定する必要があります。例えばテストを実行中には `status` を `in_progress` に設定し、完了時に `completed` にする。テストが成功した場合は `conclusion` を `success` に、失敗した場合は `failure` に設定することになります。

## GitHub Appsの作り方

GitHub Appsを作成するには、まずGitHubの設定画面から新しいアプリケーションを作成します。以下の手順で進めます。

1. GitHubのウェブサイトから、右上のアイコンをクリックし、「Settings」をクリックします。
2. 左側のメニューから「Developer settings」を選択します。
3. 「GitHub Apps」を選択し、「New GitHub App」ボタンをクリックします。

ここで様々な設定をします。`Permissions` のセクションで必要なパーミッションを選択しましょう。`Hello World App` では、プルリクエストのイベントを受け取るために、`Pull requests` のパーミッションを `Read & write` に設定しています。`Check Run` を扱うアプリケーションなので `Checks` のパーミッションも `Read & write` に設定しています。

また、`Hello World App` の場合はWebhookのURLも設定します。プルリクエストが作成されたときにPOSTリクエストを送信してほしいからです。Webhookのシークレットもあわせて設定しましょう。

![Webhook URLの設定](/images/intro-to-github-apps/webhook.png)

必須入力項目ではありますが、`Homepage URL` などは適当なURLを入れても構いません。

入力が完了したら「Create GitHub App」ボタンをクリックします。

Appが無事に作成できたでしょうか。ここで、もうひとつやることがあります。`General`のセクションで「Generate a private key」ボタンをクリックして、秘密鍵を生成します。この秘密鍵は、GitHub AppがAPIをコールするために必要です。なお、細かい話ですが、`Hello World App` が利用している [`octokit/auth-app.js`](https://github.com/octokit/auth-app.js/)ライブラリは、この秘密鍵を**直接は利用できません**。生成される秘密鍵は`PKCS#1` 形式ですが、`octokit/auth-app.js` はPKCS#8形式の秘密鍵を必要とします。そのため、生成された秘密鍵を `PKCS#8` 形式に変換する必要があります。次のようにします。

```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in my-original.pem -out my-hello-world-cli-app-pkcs8.pem
```

さらに言うと、`Hello World App` の場合、この秘密鍵をBase64エンコードして、環境変数 `GITHUB_APP_PRIVATE_KEY` に設定して、`.dev.vars` に設定する必要があります。なお、アプリケーションを実際に起動する方法は `README.md` にゆずり、ここでは単にBase64エンコードされたテキストを取得する方法だけ示します。

```bash
cat my-hello-world-cli-app-pkcs8.pem | base64
```

## 実装

実装の詳細は[GitHubのリポジトリ](https://github.com/mahata/hello-world-check-run-app)に譲りますが、雰囲気は次のような感じです。エンドポイントは[Hono](https://github.com/honojs/hono)で実装しています。

```typescript
import { Octokit } from "@octokit/rest";
import { Webhooks } from "@octokit/webhooks";

// `/webhooks` へのリクエストを処理する
app.post("/webhooks", async (c) => {
    const env = c.env;

    const webhooks = new Webhooks({
        secret: env.GITHUB_WEBHOOK_SECRET,
    });

    // Pull Requestが開かれたときのイベントを処理する
    webhooks.on("pull_request.opened", async ({ payload }) => {
        await handlePullRequest(payload, env);
    });

    return c.text("OK", 200);
});

async function handlePullRequest(payload: PullRequestPayload, env: Env) {
    const { repository, pull_request } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const headSha = pull_request.head.sha;

    const octokit = new Octokit({auth: "Note: トークンの取得方法は実際のソースコードを参照してください"});

    // Check Runを作成する
    await octokit.rest.checks.create({
        owner,
        repo,
        name: "Hello World Check",
        head_sha: headSha,
        status: "completed",
        conclusion: "success",
        output: {
            title: "Hello World Message",
            summary: `This is a simple 'Hello, world!' message from your GitHub App.`,
            text: "The check was successfully created by your GitHub App for this pull request.",
        },
    });
}
```

エラー処理などは省略していますが、雰囲気はだいぶ伝わるのではないでしょうか。

## おわりに

作ってみることで、だいぶ理解が深まりました。「思ったより簡単に作れるな」というのが僕の印象です。

真面目なGitHub Appを作る場合、次のステップは[マーケットプレイス](https://github.com/marketplace)にリスティングすることでしょう。`Hello World App` は[オンラインで公開している](https://github.com/apps/hello-world-check-run-app)のですが、マーケットプレイスには載せていません。作者として、このページを開くと `"Manage this apps's Marketplace listing."` というリンクが表示され、マーケットプレイスに公開するための情報を入力できます。

...できるのですが、マーケットプレイスに載せる前にGitHubによる審査が入るため、ここで僕は諦めました。

![GitHub Appをマケットプレイスに載せるには、GitHubによる審査が必要](/images/intro-to-github-apps/review-by-github.png)

`Hello World App` のような単純なアプリケーションが審査に通るとは思えなかったからです。もしここまで読んでくださった方で、面白いGitHub Appをマーケットプレイスに登録できた方がいらしたら、ぜひ教えてください 😊
