---
title: "テストダブルとは何か?"
emoji: "5️⃣"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["testdoubles", "testing", "tdd", "typescript"]
published: true
---

テストダブルという言葉をご存知でしょうか? 仮に知らずとも、多くのソフトウェアエンジニアはテストダブルを利用しています。たとえば Java の世界で Mockito を使ったり、JavaScript の世界で Vitest/Jest を使う場合、ほぼ間違いなくテストダブルを使っています。

本物の実装を模倣するコードのことを、テストダブルと言います。

テストダブルには、いくつか種類があります。よく名前が知られているのは「モック」です。テストについて話すとき「関数をモックする」という表現をしたことはありませんか? 多くの場合「本物と違う振る舞いをさせる」ことを「モックする」と 言います。しかし、それは本当に「モック」しているのでしょうか? そもそも「モック」の定義は何でしょうか? この記事では、そのような疑問に答えようと思います。

:::message
テストダブルという名前は、「スタントダブル」という言葉から来ています [^stunt-double]。スタントダブルとは、いわゆる「スタントマン」のことです。映画の中で危険なシーンを演じるのは、俳優ではなくスタントマンです。スタントマンは、本物の「そっくりさん」です。

テストダブルも同様で「本物のコードそっくり」に振る舞うテストコードということになります。
:::

[^stunt-double]: [Choosing the Right Test Double](https://labspractices.com/guides/test-doubles/) に次の一節があります: _Test doubles are stand-ins —they get their name from the “stunt doubles” who stand in for the big-name actors in movies— and they allow you to control the inputs into your code and to inspect how your code interacts with them._

## テストダブルの種類

テストダブルにの分類方法はいくつかありますが、[Martin Fowler 氏に倣い](https://martinfowler.com/articles/mocksArentStubs.html)、この記事では次の 5 種類に分類します。

* **ダミー:** コンパイルを通すために作るテストダブル (実際に使おうとすると壊れる)。
* **フェイク:** 実際に動作する偽物。通常は何かの欠陥があり、本番環境には適さない (たとえばインメモリデータベース)。
* **スタブ:** コールすると、あらかじめ決められた値を返すテストダブル。
* **スパイ:** どう呼び出されたかを記録するテストダブル。
* **モック:** 自分自身をアサートするスパイ。

いかがでしょうか。「わけがわからない」と思った方もいるでしょう。筆者も最初は「??」となりました。細かいことは気にせず、ぜひ最後まで記事を読み通してください。本記事の読了後は「なるほど」となることでしょう。

### テストダブルを分類するモチベーション

なぜテストダブルを分類するのでしょう。筆者は「テストの意図を明確にするため」に分類すると考えます。筆者はペアプログラミングで開発することが多いのですが、ペアに「ここでスタブを作って振る舞いを固定しましょう」などと話すことがあります。相手もテストダブルの分類を理解していると、その意図が伝わりやすいです。

また、「プロとして」言葉を正しく使いたい気持ちもあります。`JavaScript` を `JAVA SCRIPT` と書くと、一部の人々からの信頼を損ねます。テストダブルを雑に呼称することで同様の不利益を被るかもしれません。

## 「ロケット発射」システムをテストするテストダブル

ここからはコードを書きます [^github]。「ロケット発射」を制御するプログラムでテストダブルについて考えましょう。例は TypeScript ですが、TypeScript 特有の知識がなくても理解できるように書きます。「インタフェース」と「継承」の概念さえわかれば読めます。

[^github]: 最終形のコードは [GitHub に置いてあります](https://github.com/mahata/test-doubles-typescript-sample)。

:::message
このプログラムにはネタ元が存在します。VMware Tanzu Labs が公開していた「The Test Double Rule of Thumb」というブログ記事です。いつからか Tanzu Labs のブログが非公開になってしまい、現在は閲覧できません。

ネタ元の記事は Java で書かれており、ロケットではなくミサイルの発射を制御する内容でした。筆者は元記事に多大なリスペクトを払っています。
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

簡単ですね。次は `LaunchCode` です。これは `Rocket` を発射するときに必要なコードです (以下、発射コードと言います)。無闇矢鱈にロケットを発射させるわけにはいかないので。

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
  launchRocket(rocket: Rocket, launchCode: LaunchCode) {
    this.rocket.launch()
  }
}
```

しかし、実装の途中で `launchRocket()` に本物のロケットを発射してほしくはありません。悲惨なことになってしまいます。そこで、ダミーのロケットについて考えてみましょう。

### ダミーのロケット

ロケットを発射するには、有効な発射コードが必要です。発射コードは、有効期限が切れると無効になります。有効期限切れの発射コードではロケットが発射されないことをテストで確認するにはどうすればいいでしょう。

ダミーのロケットを使う案を見てみましょう。

```typescript
export class DummyRocket implements Rocket {
  launch() {
    throw new Error("DummyRocket cannot be launched")
  }

  disable() {}
}
```

ダミーは「実際に使おうとすると壊れる」テストダブルです。`launchRocket()` が `DummyRocket` を使おうとすると失敗するテストは次の通りです。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const launcher = new Launcher()
  launcher.launchRocket(new DummyRocket(), new ExpiredLaunchCodeStub())
})
```

:::message
`ExpiredLaunchCodeStub` は次のように実装されます。このクラスは「スタブ」というテストダブルです。スタブの定義は後で説明します。

```typescript
export class ExpiredLaunchCodeStub implements LaunchCode {
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

これで「ロケットが使われると失敗する」テストができあがりました! [Red-Green-Refactor](https://martinfowler.com/bliki/TestDrivenDevelopment.html) サイクルの最初の `Red` に至れました。めでたしめでたし...となるでしょうか? なりませんね。このテストには次の問題があります。

1. テストコードにアサーションが存在しないため、テストの意図がわかりにくい。
2. 実装コードで例外を握りつぶすことで、`launch()` してもテストを通せてしまう。

2. について補足します。`launchRocket()` が次のように実装されたとしましょう。

```typescript
  launchRocket() {
    try {
      this.rocket.launch()
    } catch (error) {}
  }
```

これはロケットを発射しているにも関わらず、テストをパスします。これはテストが実装を駆動していない、つまり TDD として機能していません。

これを改善するためにスパイを導入します。

## スパイの導入

スパイは「どう呼び出されたかを記録するテストダブル」です。早速ロケットのスパイを作ってみましょう。

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

これはスパイです。`launch()` すると `launchWasCalled` フラグが true になり、`wasLaunchCalled()` をコールすることで `launchWasCalled` フラグの値が得られます。「`launch()` が呼ばれたかどうかを記録したい」という要望を叶える実装です。

これを使ってテストコードを書き換えてみましょう。次のようになるはずです。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
})
```

`launcher.launchRocket()` メソッドに渡した `rocket` が `launch()` していれば `rocket.wasLaunchCalled()` が `true` を返します。今はこのテストは失敗します。

:::message
「これは Vitest/Jest で実現できのでは」と思われたでしょうか。その通りです。このテストは次のコードとほぼ等価です。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new ValidRocket()
  const launchSpy = vi.spyOn(rocket, "launch")

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(launchSpy).not.toHaveBeenCalled()
})
```

この `vi.spyOn()` は、正にスパイを作るというメソッドです。しかし、本記事では、これ以降 Vitest や Jest には触れません。これらのテストライブラリは便利な一方、抽象度の高さから背後の仕組みを理解しづらいからです。ライブラリを使わずテストダブルを実装することで、テストダブルの単純さを感じてもらうことが本記事の主眼です。
:::

さて、このテストを通すには実装を次のようにします。

```typescript
  launchRocket() {
    if (!this.launchCode.isExpired()) {
      this.rocket.launch()
    }
  }
```

ダミーよりもスパイの方がテストの意図が汲み取りやすいのではないでしょうか。スパイを使うことで Given-When-Then 構文 [^given-when-then] に則ったテストが書けます。先ほどのスパイを使ったコードにコメントをつけてみましょう。

[^given-when-then]: Martin Fowler 氏のブログに [Given When Then](https://martinfowler.com/bliki/GivenWhenThen.html) 構文についての記事があります。テストコードを 3 つのセクションに分割し「ある条件で」「ある操作をすると」「ある結果になる」と書くことで、テストの意図を伝える構文です。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  // Given: ロケットが存在するとき
  const rocket = new RocketSpy()

  // When: 有効期限切れの発射コードでロケットを発射しようとすると
  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  // Then: ロケットは発射されない
  expect(rocket.wasLaunchCalled()).toBe(false)
})
```

分かりやすいですね。また、ダミーのときは例外を握りつぶして不正にテストをパスできましたが、スパイではそうはいきません。実装を駆動するテストが書けました。テスト駆動開発できた、とも言えます。

続いてモックについて見てみましょう。

## モックの導入

プロダクトマネジャーから新しい要望が届きました。無効な発射コードが使われたとき、ロケットそのものも無効にしたいそうです。`Rocket` インタフェースには `disable()` メソッドがありました。これをコールすればいいですね。

先ほどのスパイを使ったテストコードを修正しましょう。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true) // この行を追加
})
```

アサーションをひとつ追加しました [^one-assertion-per-test]。特に難しいことはしていません。これを通すために `RocketSpy` を更新しましょう。次のようになります。

[^one-assertion-per-test]: [ひとつのテストメソッドには単一のアサーションだけがあるべきという意見があります](https://t-wada.hatenablog.jp/entry/design-for-testability#ポイント-目指すのはテストメソッド毎にアサーションひとつ)。筆者はそのポリシーに同意していますが、ここでは説明の簡単さのためにそのポリシーを無視しています。

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

プロダクトマネジャーが言うには、期限切れの発射コードではロケットを発射できないのはもちろん、署名されていない発射コードでもロケットを発射できないそうです。それならテストケースがもうひとつ必要ですね。

```typescript
it("発射コードが署名されていなければ、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new UnsignedLaunchCodeStub())

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

これですべてのテストが通ります。すべてのテストが通っているということは、リファクタリングをするタイミングだということです [^red-green-refactor]。これまでのふたつのテストケースをあらためて眺めてみましょう。

[^red-green-refactor]: [テスト駆動開発は「Red => Green => Refactor」のサイクルをまわします](https://www.codecademy.com/article/tdd-red-green-refactor)。Red はテストが失敗する状態、Green はテストが通る状態を指します。Green の次が Refactor なのは、リファクタリング中に間違って実装を壊してもすぐに気づけるからです。

```typescript
it("発射コードが期限切れであれば、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})

it("発射コードが署名されていなければ、ロケットは発射しない", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new UnsignedLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})
```

とても似通っています。特に次の二行はまったく同じです。

```typescript
  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
```

このアサーションの重複を一掃するため、`RocketSpy` 自身にアサーションの機能を持たせてみましょう。`RocketSpy` に次のメソッドを足します。

```typescript
  verifyAbort() {
    expect(this.launchWasCalled).toBe(false)
    expect(this.disableWasCalled).toBe(true)
  }
```

これでテストコードの重複がなくなりました。スッキリですね。しかし、これは本当にこれはスパイなのでしょうか。実はここまで来ると、このクラスはモックと呼ぶ方がふさわしいです。本記事の最初で、モックのことを「自分自身をアサートできるスパイ」と表現しました。まさに、自分自身をアサートする機能を実装されました。

モックを使うデメリットはあるでしょうか。スパイよりモックの方が可読性が落ちると思う人もいるかもしれません。明示的なアサートがテスト本体から落ちてしまうので。アサートしている内容を調べるため、IDE で `verifyAbort()` にジャンプする必要があります。

しかし、もしロケットを発射しない条件が増えたとき、そのアサートがテストケースごとに散らばっていると、その認知不可は無視できません。モックを使えばアサート内容を一箇所に集められるので、あちこちに同じコードを書く必要は減るでしょう。

## スタブについて

さて、次はスタブについて話しましょう。とはいえ、実はスタブはすでに登場しています。`ExpiredLaunchCodeStub` や `UnsignedLaunchCodeStub` です。これらはスタブとしての特性を満たしています。つまり、そのメソッドが「常に同じ値を返す」ということです。

スタブは基本的なテストダブルで、これなしでテストを書くのはほぼ不可能と言えます。なので、この記事でも初手で説明なく書いてしまいました。理解も容易なテストダブルです。ここで説明を終えてしまおうかと思うほど 😛

ひとつだけ、ここまでのスタブの実装に不満があるので、リファクタリングして本節を締めくくろうと思います。どこに不満があるかと言えば、`ExpiredLaunchCodeStub` や `UnsignedLaunchCodeStub` はそれぞれ Expire しているかと Sign されているかにのみ興味があるのに、それがわかりにくい点です。ベースクラスを導入して、これを解消してみましょう。

```typescript
export class ValidLaunchCode implements LaunchCode {
  isSigned() {
    return true
  }

  isExpired() {
    return false
  }
}

export class UnsignedLaunchCodeStub extends ValidLaunchCode {
  isSigned(): boolean {
    return false
  }
}

export class ExpiredLaunchCodeStub extends ValidLaunchCode {
  isExpired() {
    return true
  }
}
```

ベースクラス `ValidLaunchCode` を導入することで、派生クラスのスタブの意図がわかりやすくなりました。

## フェイクの導入

プロダクトマネジャーから、また新しい要件が伝えられました。発射コードは一回きりしか使えなくしてほしいそうです。誰かが使った発射コードは、もう利用できません。

テストコードは次のようになるでしょう。

```typescript
it("使用済みの発射コードであれば、ロケットは発射しない", () => {
  const rocket1 = new RocketMock()
  const rocket2 = new RocketMock()
  const launchCode = new ValidLaunchCode()

  const launcher = new Launcher()
  launcher.launchRocket(rocket1, launchCode)
  launcher.launchRocket(rocket2, launchCode)

  rocket2.verifyAbort()
})
```

どういう実装なら、このテストを通せるでしょう。使用済みの `launchCode` をどこに保存するべきでしょう。RDBMS? KVS? それとも他の何か? インメモリで保存していい? ディスクが必要?

このような決断は、後回しにしたいです。より要件がはっきりしたタイミングで決断する方がベターです。具体的なバックエンドを考えずに実装するため、インタフェースにフォーカスします。仮に `launchRocket()` メソッドが `usedLaunchCodes` という引数を受け取れるとしましょう。次のように使います。

```typescript
  Launcher.launchRocket(rocket1, launchCode, usedLaunchCodes);
  Launcher.launchRocket(rocket2, launchCode, usedLaunchCodes);
```

`launchRocket()` メソッドで `usedLaunchCodes` を次のように使えると、プロダクトマネジャーの要件を満足できるはずです。

```typescript
  launchRocket(rocket: Rocket, launchCode: LaunchCode, usedLaunchCodes: UsedLaunchCodes) {
    if (
      !usedLaunchCodes.contain(launchCode) &&
      !launchCode.isExpired() &&
      launchCode.isSigned()
    ) {
      rocket.launch()
      usedLaunchCodes.add(launchCode)
    } else {
      rocket.disable()
    }
  }
```

そう、`usedLaunchCodes` に `contains()` と `add()` メソッドがあれば良いのです。ここまで来れば `UsedLaunchCodes` インタフェースは定義できそうです。そして、インタフェースが定義できれば、それを満足する偽物のクラスを作れそうですね。そうです、その偽物がフェイクです。

フェイクは、他のテストダブルとは全く異なります。他のテストダブルは、本物と簡単に見分けられます。一方、フェイクは本物と見分けがつかないように作ります。フェイクは、本物のすべての動作を模倣します。フェイクは本物と同じように使ってもらうことを想定します。でも、どうやってフェイクが期待された通りの動作をするか確認するのでしょう。テストを書けばいいですね 😉 フェイクを使うとき、フェイクそのもののテストが必要になります。これも他のテストダブルとは異なる点です。

さて `UsedLaunchCodes` のインタフェースを TypeScript コードで表現すると次の通りです。

```typescript
export interface UsedLaunchCodes {
  contain(launchCode: LaunchCode): boolean
  add(launchCode: LaunchCode): void
}
```

この実装クラスである `FakeUsedLaunchCodes` のテストはどのようになるでしょう。筆者は次のようなテストだと考えます。

```typescript
it("contains() は発射コードが使用済みか判別する", () => {
  const usedLaunchCodes = new FakeUsedLaunchCodes()
  const launchCode = new ValidLaunchCode()

  expect(usedLaunchCodes.contain(launchCode)).toBe(false)

  usedLaunchCodes.add(launchCode)

  expect(usedLaunchCodes.contain(launchCode)).toBe(true)
})
```

ここまで来れば、これを実装するのは難しくないでしょう。`FakeUsedlaunchCodes` の著者による実装は次の通りです。

```typescript
export class FakeUsedLaunchCodes implements UsedLaunchCodes {
  private launchCodes: Set<LaunchCode> = new Set()

  add(launchCode: LaunchCode): void {
    this.launchCodes.add(launchCode)
  }

  contain(launchCode: LaunchCode): boolean {
    return this.launchCodes.has(launchCode)
  }
}
```

少しずるい実装ですね。これだとプロセスを再起動したら使用済み発射コードの履歴がなくなります。でも、フェイクは「だから良い」んです。このように実装することで、本物の `UsedLaunchCodes` のバックエンドに関する決断を後回しにできます。今はインメモリの `Set<LaunchCode>` が発射コードの履歴ですが、本物の実装では ValKey の Set になるかもしれないし、PostgreSQL になるかもしれません。それらが必要になったら `UsedLaunchCodes` を実装する本物のクラスを作ればよいのです。

## まとめ

本記事ではテストダブルについて解説しました。テストダブルの種類を意識して、適切なテストダブルを選んでテストを書きましょう。

[この記事で作成したコードは GitHub に上げてあります](https://github.com/mahata/test-doubles-typescript-sample)。しかし、最終形を眺めるだけでは理解が捗らないので、記事を読みながら実際に手を動かしてみることをお勧めします。
