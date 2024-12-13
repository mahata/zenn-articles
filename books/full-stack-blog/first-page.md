---
title: "最初のウェブページ"
---

さて、これまでの内容で `frontend/` に React プロジェクトを作成しました。次はそのプロジェクトをブラウザで表示するための最初のウェブページを作成します。

## App.tsx の編集

`App.tsx` に色々な内容が書かれていると思いますが、まずはそれを削除して、次のように書き換えます。

```tsx
export default function App() {
    return <div>Hello, world!</div>
}
```

このコードは、`Hello, world!` という文字列を表示するだけのコンポーネントです。

さて、ここで `frontend/` ディレクトリ内に移動して、React アプリケーションを起動します。

```shell
$ cd frontend
$ npm run dev
```

無事に起動したでしょうか? この状態でブラウザで `http://localhost:5174` にアクセスすると、`Hello, world!` と表示されているはずです。

これで最初のウェブページが完成しました。おめでとうございます!

:::message
この例では `export default function ...` という記法で React コンポーネントを公開しています。これは「デフォルトエクスポート」と呼ばれる公開方法ですが、これを好まない開発者もいます。なぜなら、これは任意の名前でコンポーネントをインポートできてしまうため、コンポーネントを実際に使っている箇所を特定するのが難しくなるからです。

React コンポーネントを公開する方法は他にもあります。たとえば、`export function ...` という記法で公開する方法もあります。この方法は「名前付きエクスポート」と呼ばれます。名前付きエクスポートは、コンポーネントをインポートする際に `{ ... }` で囲む必要がありますが、コンポーネント名を明示的に指定できるため、コンポーネントが使われている場所がわかりやすくなります。

この本では、デフォルトエクスポートを使ってコンポーネントを公開していきますが、違いを意識しておくとよいでしょう。
:::

## CSS 関連の設定

"Hello, world!" というテキストが表示されている位置が不可解ではないでしょうか。プロジェクト作成時に作られたスタイルが `App` コンポーネントに適用されているためです。`main.tsx` に `import './index.css'` という行があります。`main.tsx` は React アプリのエントリーポイントなので、ここで読み込んだ `index.css` が `App` にも適用されます。`main.tsx` から `index.css` をインポートしている行を削除し、`index.css` そのものも削除しましょう。

さて、これで React によって設定される CSS は削除されました。さらにここから、もう一歩踏み込み、ブラウザがデフォルトで適用するスタイルも削除しましょう。

### Reset CSS の適用

「Reset CSS」と呼ばれるジャンルのライブラリがあります。これは、ブラウザがデフォルトで適用するスタイルをリセットすることで、全ての要素が同じ基準で表示されるようにするためのライブラリです。たとえば `<button />` 要素はデフォルトで余白や枠線が設定されていますが、これがデザインの邪魔になる場合があります。Reset CSS を適用することで、これらのデフォルトスタイルをリセットし、デザインを自由に設計できるようになります。

筆者は Reset CSS として [The New CSS Reset](https://github.com/elad2412/the-new-css-reset) をよく利用します。Reset CSS ライブラリの比較は本書の範疇ではないので、ここでも The New CSS Reset を導入します。

```shell
$ cd frontend
$ npm install the-new-css-reset
```

main.tsx に `import 'the-new-css-reset/css/reset.css'` という行を追加します。

これで Reset CSS を導入できました。

### Tailwind CSS の適用

このプロジェクトでは [Tailwind CSS](https://tailwindcss.com) を使ってスタイルを適用していきます。Tailwind CSS は CSS フレームワークの一つで、クラス名を使ってスタイルを適用できます。たとえば、`<button />` 要素に `bg-blue-500 text-white` というクラス名を付けると、背景色が青くなり、文字色が白くなります。このように、あらかじめ設定されたクラスのことをユーティリティクラスと呼びます。

Tailwind CSS を導入するには、まず npm パッケージをインストールします。

```shell
$ cd frontend
$ npm install -D tailwindcss
```

次に、`tailwind.config.js` を作成します。`frontend/` ディレクトリで次のコマンドを実行します。

```shell
$ npx tailwindcss init
```

`tailwind.config.js` は Tailwind CSS の設定ファイルです。次のように書き換えてください。

```
```

次の内容で `frontend/src/index.css` を作成します。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

PostCSS で Tailwind CSS を使うための設定を追加します。`frontend/` ディレクトリで次のコマンドを実行します。

```shell
$ npm install -D postcss autoprefixer
```

`frontend/postcss.config.js` を次の内容で作成します。

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

最後に、`main.tsx` に `import './index.css'` という行を追加します。

:::message
Tailwind CSS は熱狂的に指示する開発者もいれば、批判的な立場を取る方もいます。

Tailwind CSS の公式ページに行けば、支持者の熱いコメントが並んでいます。たとえば [Vercel CEO の Guillermo 氏のコメント](https://x.com/rauchg/status/1225611926320738304)は次の通りです。

> If I had to recommend a way of getting into programming today, it would be HTML + CSS with
@tailwindcss
>
> 今からプログラミングを始めるなら、HTML と Tailwind CSS から入るのをお勧めするよ。

批判的な意見も数多くあります。筆者が目にしたもので、もっともまとまっているのは [uhyo さんによる「Tailwind考」](https://blog.uhy.ooo/entry/2022-10-01/tailwind/)という記事です。

筆者が本書で Tailwind CSS を使う理由は主にふたつです。

1. CSS ファイルを別に管理しなくて良いから
2. 多くの開発者が Tailwind CSS を無視できなくなりそうだから

CSS ファイルを React コンポーネントと別に管理すると、どのタグにどのスタイルがあたっているか判断するのが難しくなります。CSS がネストされていると難易度が更にあがります。Tailwind CSS なら、クラス名から適用されるスタイルが一目でわかります。

また、npm trends などで調べればわかる通り、[Tailwind CSS は今なおユーザー数を増やしています](https://npmtrends.com/tailwindcssn)。フロントエンドを触る開発者であれば、Tailwind CSS を知っておいて損はないでしょう。
:::

## Biome の導入

(以下、執筆中)
