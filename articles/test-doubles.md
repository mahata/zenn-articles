---
title: "テストダブルとは何か?"
emoji: "5️⃣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["testdoubles", "testing", "tdd", "typescript"]
published: false
---

テストダブルという言葉をご存知でしょうか? 仮に知らないとしても、多くのソフトウェアエンジニアはこれを利用したことがあります。たとえば Java の世界で Mockito を使ったり、JavaScript の世界で Jest を使う場合、ほぼ間違いなくテストダブルを使っています。すなわち、本物のコードを「模倣」するコードのことをテストダブルと言います。

テストダブルには、いくつか種類があります。よく名前が知られているのは「モック」です。テストコードについて会話するとき「関数をモックする」という表現をしたことはありませんか? 多くの場合「本物と違う振る舞いをさせる」ことを「モックする」と 言います。しかし、それは本当に「モック」しているのでしょうか? そもそも「モック」の定義は何でしょうか? この記事では、そのような疑問に答えようと思います。

:::message
テストダブルという名前は、「スタントダブル」という言葉から来ています [^1]。スタントダブルとは、いわゆる「スタントマン」のことです。映画の中で危険なシーンを演じるのは、俳優ではなくスタントマンです。スタントマンは、本物の「そっくりさん」です。

テストダブルも同様で「本物のコードそっくり」に振る舞うテストコードということになります。
:::

[^1]: [Choosing the Right Test Double](https://labspractices.com/guides/test-doubles/) に次の一節があります: _Test doubles are stand-ins —they get their name from the “stunt doubles” who stand in for the big-name actors in movies— and they allow you to control the inputs into your code and to inspect how your code interacts with them._

## テストダブルの種類

テストダブルにはいくつか種類があります。分類の仕方にはいくつかありますが、[Martin Fowler 氏に倣い](https://martinfowler.com/articles/mocksArentStubs.html)、この記事では次の 5 種類に分類します。

* **ダミー:** コンパイルを通すために取りあえず作られるテストダブル (実際に使おうとすると壊れる)。
* **フェイク:** 実際に動作させられる偽物。通常は何かの欠陥があり、本番環境には適さない (たとえばインメモリデータベース)。
* **スタブ:** コールすると、あらかじめ決められた値を返すテストダブル。
* **スパイ:** どのように呼び出されたかを記録するテストダブル。
* **モック:** 自分自身をアサートできるスパイ。

いかがでしょうか? きっと「わけがわからない」と思った方も多いでしょう。筆者自身、不慣れなときにこの説明だけを読んだら「はぁ?」となったと思います。ぜひ細かいことは気にせず、最後まで記事を読み通していただけると幸いです。読み通した後でここに戻っていただければ「なるほど」となるはずです。

### テストダブルを分類するモチベーション

そもそも、なぜテストダブルを分類するのでしょうか? 筆者は「テストの意図を明確にするため」これらを分類することが重要だと考えています。筆者はペアプログラミングで開発を進めることが多いのですが、ペアに「ここでスタブを作って振る舞いを固定しましょうか」などと話すことがあります。相手もテストダブルの種類について理解していると、その意図が伝わりやすいです。

また、個人的には「プロとして」言葉を正しく使いたいという気持ちもあります。`JavaScript` を `JAVA SCRIPT` と書いてしまうと、一部の人々からの信頼を損ねるでしょう。テストダブルを雑に呼称することでも同様の不利益を被るかもしれません。

## 「ロケット発射」システムをテストするテストダブル

ここからはハンズオンです。「ロケット発射」を制御するプログラムを例に、テストダブルについて考えましょう。例は TypeScript ですが、TypeScript 特有の知識がなくても理解できるように書いています。具体的には「インタフェース」と「継承」の概念がわかれば読み進められるでしょう。

:::message
このプログラムにはネタ元が存在します。VMware Tanzu Labs が公開していた「The Test Double Rule of Thumb」というブログ記事です。2024 年の中頃まではアクセスできたのですが、ブログそのものが非公開になってしまいました。

ネタ元の記事は元々 Java で書かれており、ロケットではなくミサイルの発射を制御するような内容でした。アクセスはできなくなってしまったものの、筆者は元記事に多大なリスペクトを払っています。
:::

### 最初の状態

ふたつのインタフェースがあります。`Rocket` と `LaunchCode` です。

まずは `Rocket` から見てみましょう。

```typescript
export interface Rocket {
  // ロケットを発射する
  launch(): void

  // ロケットを発射不能にする
  disable(): void
}
```

簡単ですね。次は `LaunchCode` です。これは `Rocket` を発射するときに必要なコードです (以下、発射コードと言います)。無闇矢鱈にロケットを発射させるわけにはいきませんから。

```typescript
export interface LaunchCode {
  // 発射コードが期限切れしているかを返す
  isExpired(): boolean

  // 発射コードが署名されているかを返す
  isSigned(): boolean
}

```

また、メインクラスとして `Launcher` を作り、`launchRocket()` というメソッドを用意しました。今は単に `Rocket` オブジェクトを `launch()` するだけのメソッドです。

```typescript
export class Launcher {
  rocket: Rocket
  launchCode: LaunchCode

  constructor(rocket: Rocket, launchCode: LaunchCode) {
    this.rocket = rocket
    this.launchCode = launchCode
  }

  launchRocket() {
    this.rocket.launch()
  }
}
```

しかし、実装の途中で `launchRocket()` に本物のロケットを発射してほしくはありません。悲惨なことになってしまいます。そこで、ダミーのロケットについて考えてみましょう。

### ダミーのロケット

ロケットを発射するには、有効な発射コードが必要です。発射コードは、たとえば有効期限が切れていると無効になります。そのようなケースではロケットが発射されないことを保証したいです。ロケットが発射されなかったことを単体テストで確認するにはどうすればいいでしょう?

ダミーのロケットを使うという方法があります。

```typescript
export class DummyRocket implements Rocket {
  launch() {
    throw Error()
  }

  disable() {}
}
```

前述のように、ダミーは "実際に使おうとすると壊れ" ます。誰かが launch() をコールすると例外を投げます。`launchRocket()` が `DummyRocket` を使おうとすると失敗するテストは次のようになります。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const launcher = new Launcher(new DummyRocket(), new ValidLaunchCodeStub())
  launcher.launchRocket()
})
```

:::message
`ValidLaunchCodeStub` は次のように実装されています。これは「スタブ」というテストダブルですが、スタブの定義については後の節で行います。

```typescript
export class ValidLaunchCodeStub implements LaunchCode {
  isSigned() {
    return true
  }

  isExpired() {
    return false
  }
}
```
:::

このテストは失敗します。`dummyRocket` は `launch()` すると例外を投げるのだから、当然ですね。

これで「ロケットが使われると失敗する」テストができあがりました! めでたしめでたし...となるでしょうか? なりませんね。このテストには次の問題があります。

1. テストコードにアサーションが存在しないため、テストの意図がわかりにくい。
2. 実装コードで例外をキャッチすることで、`launch()` してもテストを通せてしまう。

2. について補足します。

(執筆中)
