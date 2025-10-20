---
title: "スクリーンショットを自動でWebP形式で保存する方法"
emoji: "💽"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["macOS", "Automator", "WebP"]
published: true
---

## この記事は何ですか？

macOSのデフォルト機能でスクリーンショットを撮ると `.png` 形式で保存されます。しかし、Web用途では `.webp` 形式の方がファイルサイズが小さくて便利です。この記事では、macOSでスクリーンショットを撮ると自動的に `.webp` 形式で保存されるようにする方法を紹介します。

## 必要なソフトウェア

cwebpをインストールします。Homebrewを使う場合、次のコマンドでインストールできます。

```bash
brew install webp
```

## Automatorでフォルダアクションを作成

1. Automatorを起動して `Folder Action` を選択します。
2. `Folder Action receives files and folders added to` に `Desktop` を選択します（スクリーンショットがデスクトップに保存される前提）。
3. 左側のメニューから `Run Shell Script` を選択します。
4. 次の内容のシェルスクリプトを貼り付け、アクションを保存します（このとき `Pass input: as arguments` を選択）。

```bash
for f in "$@"; do
  ext="${f##*.}"
  if [[ "$ext" == "png" ]]; then
    base="${f%.*}"
    /opt/homebrew/bin/cwebp -q 90 "$f" -o "${base}.webp" >/dev/null 2>&1

    # if [[ $? -eq 0 ]]; then
    #   rm "$f"
    # fi
  fi
done
```

なお `/opt/homebrew/bin/cwebp -q 90 "$f" -o "${base}.webp" >/dev/null 2>&1` コマンドの `-q 90` は品質を `90` に設定するオプションです（`0` から `100` の範囲で指定可能）。品質を上げるとファイルサイズが大きくなりますが、画質も向上します。用途に応じて調整してください。

## 動作確認

スクリーンショットを撮影し、デスクトップに `.webp` 形式で保存されることを確認します。

私の環境でAutomatorのスクリーンショットを撮影してみました。もとの `.png` ファイルがこちらです。

![スクリーンショットの例](/images/auto-webp-screenshot/screenshot.png)

そして、Automatorのフォルダアクションによって変換された `.webp` ファイルがこちらです。

![変換後のスクリーンショットの例](/images/auto-webp-screenshot/screenshot.webp)

`.png` ファイルが 104KB であったのに対し、`.webp` ファイルは 23KB となり、かなりファイルサイズが小さくなっていることがわかります。スクリーンショット内の文字も十分に読めるレベルだと思います。

便利ですね。
