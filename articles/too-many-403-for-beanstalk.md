---
title: "AWS Elastic Beanstalk と WAF および ALB を組み合わせた環境での 403 エラー対応"
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["aws"]
published: false
---

TODO: AWS 図の作成

`AWS Elastic Beanstalk Notification - Environment health has transitioned from Ok to Severe. 100.0...`

```
Timestamp: Sun Apr 01 12:00:00 UTC 2024
Message: Environment health has transitioned from Ok to Severe. 100.0 % of the requests to the ELB are erroring with HTTP 4xx (3 minutes ago).
```

いきなり解答ですが。

> [AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/) を環境の Application Load Balancer と併用して不要な着信トラフィックをブロックします。この場合、Application Load Balancer は着信メッセージを拒否するたびに HTTP 403 を返します。

これ。
