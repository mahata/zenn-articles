---
title: "Visual Studio Codeの便利なGitHub Copilotカスタマイズ方法"
emoji: "⚒️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["GitHub", "VSCode", "AI", "GitHubCopilot", "tool"]
published: true
---

## この記事は何ですか?

VS Code で設定できるGitHub Copilot用の「instruction files」と「prompt files」をご存知でしょうか。僕は最近まで知りませんでした。端的に言えば、前者は特定のファイルやプログラミング言語ごとにGitHub Copilotの動作をカスタマイズできる設定ファイル、後者はよく使うプロンプトを簡単に呼び出せる機能です。これらを利用することで、AIのコード生成をより効果的に活用できそうです。

ざっと検索した限り、本記事の執筆時点では、これらの機能はあまり知られていないようです。僕はこれらの機能に可能性を感じており、もっと有効に活用したいと思っています。これらの機能が広く使われるようになれば、僕自身がその利用方法を参考にできるだろうと思い、この記事を書きました。

### 基本の `copilot-instructions.md`

GitHub Copilotには `~/.github/copilot-instructions.md` という設定ファイルがあります。「[リポジトリカスタム命令](https://docs.github.com/ja/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)」とも呼ばれ、GitHub Copilotの動作をカスタマイズするための基本的な設定ファイルです。

僕はここに「テストが通らない限りはコミットしないで」や「不要なサードパーティライブラリを導入しないで」などの指示を書いています。

:::details 【参考情報】(僕が使っている) 具体的な `copilot-instructions.md` の内容
```markdown
## 全体的なルール

テストが通らない限りコミットはしないでください。また、Gitに関する質問があれば `@terminal` をつけて質問してください。

フレンドリーな同僚として、カジュアルな言葉遣いで質問に答えてください！

## パッケージ管理

パッケージマネージャーとして `pnpm` を使ってください。ただし、不要なパッケージの導入はなるべく避けてください。たとえば `axios` などを使う代わりに `fetch` を使うなど、軽量な実装を心がけてください。

## 実装

コードは `TypeScript` で書き、`any` 型の使用は避けてください。可能な限り `ESLint` のルールに沿ってコードフォーマットを維持し、可読性と保守性の高いコードを書いてください。

コードコメントは避けてください。代わりに説明的な変数を検討するなどして、コード自体で何をしているのかわかるようにしてください。

実装の結果、不要になったコードやファイルは削除してください。

## テスト

機能の実装と同時にテストも作成します。テストファイルは実装ファイルとのコロケーションを意識して、実装ファイルと同じディレクトリ階層に置いてください。なお、テストは `Vitest` を使って書いてください。
```
:::

### VS Codeの `*.instructions.md`

ここからが本題です。  

実はVS Codeでは `.github/instructions/*.instructions.md` というファイル名でもGitHub Copilotの設定を書けます。[VS Codeの公式ドキュメント](https://code.visualstudio.com/docs/copilot/copilot-customization)では、これを「instruction files」と呼んでいます。

公式ドキュメントでは `.github/instructions/general-coding.instructions.md` というファイルで次のサンプルを記載しています (筆者が日本語訳しています)。

```markdown
---
applyTo: "**"
---

# プロジェクト一般コーディング規約

## 命名規則
- コンポーネント名、インターフェース、型エイリアスにはPascalCaseを使用する
- 変数、関数、メソッドにはcamelCaseを使用する
- クラスのプライベートメンバーにはアンダースコア（_）をプレフィックスとして付ける
- 定数にはALL_CAPSを使用する

## エラーハンドリング
- 非同期処理にはtry/catchブロックを使用する
- Reactコンポーネントには適切なエラーバウンダリを実装する
- 常にエラーを文脈情報と共にログ出力する
```

**僕はこれを良い例だと思いません**。なぜなら、`applyTo: "**"` となっているため、すべてのファイルに適用されてしまうからです。このような設定は `.github/copilot-instructions.md` に書くべきです。

実は公式ドキュメントには、もうひとつの例が載っています。それは `.github/instructions/typescript-react.instructions.md` というファイルで、TypeScriptに特化した設定を書いています。次の内容です (筆者が日本語訳しています)。

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript と React のプロジェクトコーディング規約

すべてのコードに [一般的なコーディングガイドライン](./general-coding.instructions.md) を適用してください。

## TypeScript ガイドライン
- 新しいコードにはすべて TypeScript を使用すること
- 可能な限り関数型プログラミングの原則に従うこと
- データ構造および型定義には interface を使用すること
- イミュータブルなデータを優先すること（const, readonly）
- オプショナルチェイニング（?.）およびヌリッシュ合体演算子（??）を使用すること

## React ガイドライン
- フックを使用した関数コンポーネントを使うこと
- React のフックのルール（条件付きフックの禁止）に従うこと
- 子要素を含むコンポーネントには React.FC 型を使用すること
- コンポーネントは小さく、役割を明確に保つこと
- コンポーネントのスタイリングには CSS モジュールを使用すること
```

こちらの例は `applyTo: "**/*.ts,**/*.tsx"` となっているため、`.ts` および `.tsx` の拡張子を持つファイルにのみ適用されます。ここに書かれた指示は `TypeScript` および `TSX` にのみ有用であるため、まさに適切な使い方です。このように、特定のファイルやプログラミング言語に対してGitHub Copilotの動作をカスタマイズできることが「instruction files」の強みです。

### VS Codeの `*.prompt.md`

VS Codeには「prompt files」というexperimentalな機能もあります。これは `.github/prompts/*.prompt.md` というファイル名で書けます。prompt filesにはオプショナルなヘッダーと、プロンプト本文を書くことができます。prompt filesを書いておくと、GitHub Copilotのチャットウィンドウで `/` を入力するだけで、プロンプトを簡単に呼び出せます。

公式の例では、次のような `*.prompt.md` ファイルが紹介されています (筆者が日本語訳しています)。

```markdown
---
mode: 'agent'
tools: ['githubRepo', 'codebase']
description: '新しい React フォームコンポーネントを生成する'
---

ゴールは、#githubRepo `contoso/react-templates` のテンプレートに基づいて、新しい React フォームコンポーネントを生成することです。

フォーム名とフィールドが提供されていない場合は、確認してください。

フォームに関する要件：

* フォームデザインシステムのコンポーネントを使用する: [design-system/Form.md](../docs/design-system/Form.md)
* フォームの状態管理には `react-hook-form` を使用する
* フォームデータには必ず TypeScript の型を定義すること
* `register` を使った **非制御コンポーネント** を優先する
* 不要な再レンダリングを防ぐために `defaultValues` を使用する
* バリデーションには `yup` を使用する
* 再利用可能なバリデーションスキーマは別ファイルで作成すること
* 型の安全性を確保するために TypeScript 型を使用すること
* UX に配慮したカスタムバリデーションルールを適用すること
```

ここでは `mode`, `tools`, `description` が前述の「オプショナルなヘッダー」にあたる部分です。`mode` は ask, edit, agent のいずれかを指定できます。Visual Studio Codeで利用するGitHub Copilotチャットのモード名と対応しています。また `tools` はGitHub Copilot Agentが使用するツールを指定します。ここでは `githubRepo` と `codebase` が指定されています。`tools` はGitHub Copilotのチャットウィンドウで `#` を入力したときに表示される候補が選べます。

このプロンプトはReactのフォームコンポーネントを生成するためのものです。プロンプトの内容は、GitHub Copilotがどのようなコードを生成すべきかを詳細に指示しています。確かに、こういったプロンプトを用意しておくと、GitHub Copilotをより効果的に活用できそうです。

### もっと使われてほしい「instruction files」と「prompt files」

僕はこれらの機能がもっと使われてほしいと思っています。なぜかと言うと、僕自身が他者の「instruction files」や「prompt files」から学びたいからです。

ちなみに、僕はGitHubでコードを検索する趣味があります。「instruction files」について知ったとき、僕は `path:**/*.instructions.md` という検索クエリを使って[GitHubで検索してみました](https://github.com/search?type=code&q=path%3A**%2F*.instructions.md)。しかし、「instruction files」として有効な結果はあまり得られませんでした。

これらのファイルをコミットすべきかどうかという議論もあるとは思いますが、もっと多くのサンプルが世に出回ることを期待して、この記事を締めくくろうと思います。
