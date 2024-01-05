---
title: "CKS 受験体験記"
emoji: "🦔"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["Kubernetes", "CKS", "k8s"]
published: true
published_at: 2023-10-01 09:00
---

先日 [CKS (Certified Kubernetes Security Specialist)](https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/) に合格しました。記憶が新しい内に「受験体験記」を書き残そうと思います。

## 僕と Kubernetes の付き合い

僕が深く Kubernetes に関わっていたのは O'Reilly の『[入門 Kubernetes](https://www.oreilly.co.jp/books/9784873118406//)』が出版された頃です。[同書のレビューをする機会をいただいた](https://mahata.wordpress.com/2018/03/26/%e5%85%a5%e9%96%80-kubernetes/)ためです。具体的には 2017 年末から 2018 年初頭くらいのことです。

その後は Kubernetes にどっぷり浸かるわけでもなく、アプリケーション開発者として「必要があれば触る」程度の距離感で Kubernetes と付き合いました。

現職でも Kubernetes の運用とは縁遠い仕事をしており、CKS の勉強のために久しぶりに `kubectl` を叩く、という感じでした。

僕にとって、CKS は「割と難しい」試験でした。Kubernetes の全体像は知っていたつもりですが、その周辺ツール (trivy, kube-bench, gVisor, などなど) や OS 自身のセキュリティ機構については試験勉強を通して初めて理解したことも少なくないです。

## CKS 合格のための戦略

CKS 試験は時間との戦いになります。すべての問題を解こうとすると、見直しのための時間はほぼありません。様々なコマンドを手に馴染ませないと、そもそも問題を解ききることさえ困難です。

それを踏まえると、CKS の教材は手を動かす環境が付随するものがベストです。僕は [Killer Shell](https://killercoda.com/killer-shell-cks) を使いました。すべての問題をさらっと解けるようになるまで、繰り返し演習をしました。

類似の教材もいくつかありますが、注意する点があります。

1. CKS の更新に追随していること
2. "自動で" 答え合わせをしてくれること

CKS は対象とする Kubernetes のバージョンを更新することがあります。本記事の執筆時点では Kubernetes v1.27 が対象です。たとえば、かつては [PodSecurityPolicy](https://kubernetes.io/docs/concepts/security/pod-security-policy/) が CKS の試験範囲に含まれていましたが、この機能は v1.25 で削除されました。しかし、現在も `PodSecurityPolicy` を CKS の範囲として扱う教材が現在も存在しているようです。ちゃんと CKS のアップデートにあわせて内容を更新している教材を選ぶと良いと思います。

また、解法がテキストのみで与えられる教材は使いにくいので避ける方が良いと思います。CKS で与えられる問題は、解答方法が一意になるものばかりではありません。「このような設定をしてください」という問題に対して、自身の解答が想定解と異なる場合でも正しく採点されるような環境でないと、自分の理解に自信を持ちづらいです。

そういう意味では Killer Shell は内容を定期的にアップデートしてくれるし、自動採点システムもついてくるので、やはり良い教材だと感じます。

ところで、CKS 試験を購入すると模擬試験の受験資格がついてきます。この模擬試験は非常に難易度が高く、多くの人はこれで心を折られると思います。これは「そういうもの」のようです。[注意書き](https://killer.sh/faq)をよく読むと `This simulator is more difficult than the real certification. (模擬試験は本物の試験よりも難しいです)` とあります。したがって、模擬試験は本番を模した環境に慣れることを主目的にするべきだと思います。なお「本番を模した環境に慣れる」こと自体はかなり重要です。リモートデスクトップで Ubuntu (Xfce) を使うのは僕には非日常的な体験で、模擬試験で慣れていなければ本番であたふたしていたと思います。

## おまけ: CKS に対する不満

僕は CKS 試験を三回受けています。CKS は試験料を払うと、デフォルトでは受験の機会を二回もらえます。一回目に落ちても、二回目に受験し直せる仕組みです。

僕は初回の受験時に PSI セキュアブラウザが落ちてしまい、復帰できない状態になりました。テクニカルサポートからもヘルプを得られず、困ったことになりました。「システムトラブルで試験が中断してしまったので何とかしてくれないか」と問い合わせたところ、試験を白紙撤回してくれたので、とりあえずホッとしました。検索すると似たような例がいくつか見つかるので、この手のトラブルは CKS 試験では珍しくないのでしょう。

二回目の受験時は試験環境の Firefox で Kubernetes ドキュメントが開けなくなり、あたふたしている内に試験時間が終了になりました。試験監督に「Kubernetes のドキュメントにアクセスできないので、試験を中断できないか?」とお願いしたところ「そのような権限は試験監督にはない」と言われてしまいました。このときは問い合わせをする気力もなく「次のタイミングでもトラブルがあれば、もう辞めてしまおう」と思いました。

そう考えていたところ、三回目の受験でようやくトラブルなく最後まで問題を解くことができ、無事に合格できました。

しかしながら、これらの経験は総じてネガティブで「今後も CKS 資格を更新し続けたいか?」と問われれば、正直なところ「そこまでではないな」と感じます。他にも、リモートデスクトップでブラウザやターミナルがきびきび動いてくれないなど、様々なところで「うーん...つらい...」となる試験でした。