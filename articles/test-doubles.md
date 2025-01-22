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
  const launcher = new Launcher(new DummyRocket(), new ExpiredLaunchCodeStub())
  launcher.launchRocket()
})
```

:::message
`ExpiredLaunchCodeStu` は次のように実装されています。これは「スタブ」というテストダブルですが、スタブの定義については後の節で行います。

```typescript
export class ExpiredLaunchCodeStu implements LaunchCode {
  isSigned() {
    return true
  }

  isExpired() {
    return true
  }
}
```
:::

このテストは失敗します。`dummyRocket` は `launch()` すると例外を投げるのだから、当然ですね。

これで「ロケットが使われると失敗する」テストができあがりました! めでたしめでたし...となるでしょうか? なりませんね。このテストには次の問題があります。

1. テストコードにアサーションが存在しないため、テストの意図がわかりにくい。
2. 実装コードで例外をキャッチすることで、`launch()` してもテストを通せてしまう。

2. について補足します。`launchRocket()` が次のように実装されたとしましょう。

```typescript
  launchRocket() {
    try {
      this.rocket.launch()
    } catch (error) {}
  }
```

これはロケットを発射しているにも関わらず、テストをパスしてしまいます。これはテストが実装を駆動していない、つまり TDD として機能していないと言えます。

これを改善するためにスパイを導入してみましょう。

## スパイの導入

スパイは前述の通り「どのように呼び出されたかを記録するテストダブル」です。具体的な例がないと理解しづらいかもしれません。早速ロケットのスパイを作ってみましょう。

```typescript
export class RocketSpy implements Rocket {
  launchWasCalled = false

  launch() {
    this.launchWasCalled = true
  }

  wasLaunchCalled(): boolean {
    return this.launchWasCalled
  }

  disable() {}
}
```

いかがでしょう。これはスパイに見えますか? `launch()` すると `launchWasCalled` フラグが true になり、`wasLaunchCalled()` をコールすることで `launchWasCalled` フラグの値が得られます。「`launch()` が呼ばれたかどうかを記録したい」という目的を叶える実装です。

これを使ってテストコードを書き換えてみましょう。次のようになるはずです。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher(rocket, new ExpiredLaunchCodeStub())
  launcher.launchRocket()

  expect(rocket.wasLaunchCalled()).toBe(false)
})
```

`Launcher` のコンストラクタに渡した `rocket` が `launch()` していれば `rocket.wasLaunchCalled()` が `true` を返します。ここまでの実装では、このテストは失敗します。

:::message
「あれ? これって Vitest/Jest で実現できるんじゃないの?」と思われたでしょうか。その通りです。このテストは次のコードとほぼ等価です。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new ValidRocket()
  const launchSpy = vi.spyOn(rocket, "launch")

  const launcher = new Launcher(rocket, new ExpiredLaunchCodeStub())
  launcher.launchRocket()

  expect(launchSpy).not.toHaveBeenCalled()
})
```

この `vi.spyOn()` は正に、スパイを作るというメソッドです。しかし、本記事では、これ以降 Vitest や Jest には触れません。これらのテストライブラリは便利な一方、抽象度の高さから背後の動きを理解しづらいためです。ライブラリを避けてテストダブルを実装することで、テストダブルは意外と単純なものだと感じてもらうことを、本記事の主眼としています。
:::

さて、このテストを通すには実装を次のようにすれば良いです。

```typescript
  launchRocket() {
    if (!this.launchCode.isExpired()) {
      this.rocket.launch()
    }
  }
```

ダミーよりもスパイの方がテストの意図が汲み取りやすいのではないでしょうか。スパイを使うことで Given-When-Then 構文 [^2] に則ったテストが書けます。先ほどのスパイを使ったコードにコメントをつけてみましょう。

[^2]: Martin Fowler 氏のブログに [Given When Then](https://martinfowler.com/bliki/GivenWhenThen.html) 構文についての記事があります。テストコードを 3 つのセクションに分割し「ある条件で」「ある操作をすると」「ある結果になる (ことを期待する)」と記述することで、テストの意図を伝える構文です。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  // Given: ロケットが存在するとき
  const rocket = new RocketSpy()

  // When: 有効期限切れの発射コードでロケットを発射しようとすると
  const launcher = new Launcher(rocket, new ExpiredLaunchCodeStub())
  launcher.launchRocket()

  // Then: ロケットは発射されない
  expect(rocket.wasLaunchCalled()).toBe(false)
})
```

意図が伝わりますね。また、ダミーのときは例外を飲み込むことで不正にテストをパスできましたが、スパイではそうはいきません。実装を駆動するテストが書けました。テスト駆動開発できた、と言っても良いと思います。

続いてモックについて見てみましょう。

## モックの導入

プロダクトマネジャーから新しい要望が届きました。無効な発射コードが使われたとき、ロケットそのものも無効にしたいそうです。`Rocket` インタフェースには `disable()` メソッドが定義されていました。これをコールすればいいですね。

先ほどのスパイを使ったテストコードを修正しましょう。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher(rocket, new ExpiredLaunchCodeStub())
  launcher.launchRocket()

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true) // この行を追加
})
```

アサーションをひとつ追加しました [^3]。特に難しいことはしていません。これを通すために `RocketSpy` を更新しましょう。次のようになります。

[^3]: [ひとつのテストメソッドには単一のアサーションだけがあるべきという意見があります](https://t-wada.hatenablog.jp/entry/design-for-testability#ポイント-目指すのはテストメソッド毎にアサーションひとつ)。筆者はそのポリシーに同意していますが、ここでは説明の簡単さのためにそのポリシーを無視しています。

```typescript
export class RocketSpy implements Rocket {
  launchWasCalled = false
  disableWasCalled = false  // この行を追加

  launch() {
    this.launchWasCalled = true
  }

  wasLaunchCalled(): boolean {
    return this.launchWasCalled
  }

  disable() {
    this.disableWasCalled = true  // この行を追加
  }

   // このメソッドを追加
  wasDisableCalled() {
    return this.disableWasCalled
  }
}
```

ここまでは特に問題ありませんね。

プロダクトマネジャーが言うには、期限切れの発射コードではロケットを発射できないのはもちろん、署名されていない発射コードでもロケットを発射できないそうです。なるほど、そういうことならテストケースがもうひとつ必要ですね。

```typescript
it("発射コードが署名されていなければ、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher(rocket, new UnsignedLaunchCodeStub())
  launcher.launchRocket()

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})
```

`UnsignedLaunchCodeStub` は次のようになります。`isSigned()` が `false` を返すのが特徴です。そのままですね。

```typescript
export class UnsignedLaunchCodeStub implements LaunchCode {
  isSigned(): boolean {
    return false
  }

  isExpired() {
    return false
  }
}
```

さて、これらのテストをパスする実装を考えましょう。発射コードが期限切れではなく、署名されているときだけロケットを `launch()` できるのでした。ということは、実装は次のようになりますね。

```typescript
  launchRocket() {
    if (!this.launchCode.isExpired() && this.launchCode.isSigned()) {
      this.rocket.launch()
    } else {
      this.rocket.disable()
    }
  }
```

これですべてのテストが通ります。すべてのテストが通っているということは、リファクタリングをするタイミングだということです [^4]。これまでのふたつのテストケースをあらためて眺めてみましょう。

[^4]: [テスト駆動開発は「Red => Green => Refactor」のサイクルをまわします](https://www.codecademy.com/article/tdd-red-green-refactor)。Red はテストが失敗する状態、Green はテストが通る状態を指します。Green の次が Refactor なのは、リファクタリング中に間違って実装を壊してもすぐに気づけるからです。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher(rocket, new ExpiredLaunchCodeStub())
  launcher.launchRocket()

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})

it("発射コードが署名されていなければ、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher(rocket, new UnsignedLaunchCodeStub())
  launcher.launchRocket()

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})
```

これらはとても似通っています。特に次の二行はまったく同じです。

```typescript
  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
```

このアサーションの重複を一掃するため、`RocketSpy` 自身にアサーションの機能を持たせてみるのはどうでしょう。`RocketSpy` に次のメソッドを足してみます。

```typescript
  verifyAbort() {
    expect(this.launchWasCalled).toBe(false)
    expect(this.disableWasCalled).toBe(true)
  }
```

これでテストコードの重複がなくなりました。スッキリですね。しかし...これは本当にこれはスパイなのでしょうか? 実はここまで来ると、このクラスはモックと呼ぶ方が良さそうです。本記事の最初で、モックのことを「自分自身をアサートできるスパイ」と表現しました。まさに、自分自身をアサートする機能を実装したところです!

モックを使うデメリットはあるでしょうか。スパイよりモックの方が可読性が落ちると思う人もいるかもしれません。明示的なアサートがテスト本体から落ちてしまうので。アサートしている内容を調べるため、IDE で `verifyAbort()` にジャンプする必要があります。

しかし、もしロケットを発射しない条件が増えたとき、そのアサートがテストケースごとに散らばっていると、その認知不可も馬鹿になりません。モックを使えばアサート内容を一箇所に集められるので、あちこちに同じコードを書く必要は減るでしょう。

## スタブについて

(執筆中)
