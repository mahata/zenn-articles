---
title: "Oracle Cloud で実験的な Kubernetes クラスタを無料で構築する方法"
emoji: "😊"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Kubernetes", "k8s", "OCI"]
published: false
---

[Oracle Cloud には非常に寛容な無料枠があり](https://docs.oracle.com/ja-jp/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)、たとえば次のような構成の Kubernetes クラスタを構築できます。

* **コントロールプレーン**: 2 COPU & メモリ 12 GB
* **ワーカーノード1**: 1 OCPU & メモリ 6 GB
* **ワーカーノード2**: 1 OCPU & メモリ 6 GB

このスペックはドキュメントの次の部分から来ています。

> すべてのテナンシは、Armプロセッサを含むVM.Standard.A1.Flexシェイプを使用するVMインスタンスに対して、月ごとに最初の3,000 OCPU時間および18,000 GB時間を無料で取得します。**Always Free テナンシの場合、これは4 OCPUおよび24 GBのメモリーと同等です**。


この記事では実験的な Kubernetes クラスタを Oracle Cloud に構築する手順について扱います。なお、先行事例はすでにいくつかあり、僕自身も「[Oracle Cloudの無料枠でKubernetesクラスタを構築する(完全版) | blog.potproject.net](https://blog.potproject.net/2021/06/01/oracle-cloud-kubernetes)」を参考にしました。特に iptables の設定はそのまま使用しています。主な違いは次の通りです。

1. シェルスクリプトによる環境構築の自動化
2. Oracle Cloud の「仮想クラウド・ネットワーク」の設定

それでは具体的な構築方法に進みましょう。

## Oracle Cloud でのインスタンス作成とセキュリティリストの設定

Oracle Cloud にはログインできているとします。「コンピュート・インスタンスの作成」からインスタンスを作成します。ほとんど困ることはないと思いますが「イメージとシェイプ」だけは次のようにする必要があります。

![](/images/oracle-cloud/ubuntu20.04-ampere.png)

「Canonical Ubuntu 20.04」は Kubernetes を 20.04 で動かしたいからで、`A1.Flex` は Oracle Cloud を無料で使うためです。

また、イングレス・ルールに次の許可を追加します。これらは Kubernetes ノード同士が通信をするために必要です。

![](/images/oracle-cloud/ingress-rules.png)

## iptables への設定追加

Kuberentes ノード間で通信できるように `iptables` の設定を変更します。

Oracle Cloud で Ubuntu 20.04 を使用している場合、[この Gist の内容](https://gist.github.com/mahata/856b769952bf3f0a3d70abe7ae16a217)で `/etc/iptables/rules.v4` を置き換え、次のコマンドで `iptables` を更新します。

```
sudo iptables-restore < /etc/iptables/rules.v4
```

## Oracle Cloud でシェルスクリプトを実行

コントロールプレーンとワーカーノードで別々のシェルスクリプトを実行します。

* [コントロールプレーン向けのシェルスクリプト](https://gist.github.com/mahata/e8d1ce5c188b6f3d91d98d83459b0c90#file-install_master-sh)
* [ワーカーノード向けのシェルスクリプト](https://gist.github.com/mahata/e8d1ce5c188b6f3d91d98d83459b0c90#file-install_worker-sh)

これらのスクリプトは、元々 [Kim Wuestkamp](https://github.com/wuestkamp) さんが [Udemy で開催している CKS 学習者向けコース](https://www.udemy.com/course/certified-kubernetes-security-specialist/)で[配布しているもの](https://github.com/killer-sh/cks-course-environment/tree/master/cluster-setup/latest)です。これらは GCP での環境構築を目的としていますが、ここでは Oracle Cloud で Arm プロセッサーのインスタンスを使用するため、少し変更を加えています。

具体的には `containerd` を Arm 向けのファイルに変更しています。つまり `containerd-1.6.12-linux-amd64.tar.gz` を `containerd-1.6.12-linux-arm64.tar.gz` に書き換えています。

まず、コントロールプレーンでシェルスクリプトを実行します。このシェルスクリプトは最後にワーカーノードが Kubernetes クラスターに参加する際に必要なコマンドを出力します。メモしておきましょう。

```
$ sudo -i
# bash install_master.sh
...
### COMMAND TO ADD A WORKER NODE ###
kubeadm join 10.0.0.162:6443 --token xxxxxx.xxxxxxxxxxxxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

次に、ワーカーノードでシェルスクリプトを実行します。その後、コントロールプレーンでのシェルスクリプト実行時に得たトークンを使い、次のようにコマンドを実行します。

```
$ sudo -i
# bash install_worker.sh
...

# kubeadm join 10.0.0.162:6443 --token xxxxxx.xxxxxxxxxxxxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

ここまでの設定を終えると、コントロールプレーンで `kubectl get node` などを実行してワーカーノードを含む Kubernetes クラスタができていることを確認できます。

```
# kubectl get node
NAME    STATUS   ROLES           AGE     VERSION
node1   Ready    control-plane   8m45s   v1.26.1
node2   Ready    <none>          77s     v1.26.1
```

## DNS の設定

まだ Pod 同士が通信をするためには問題があります。たとえば `frontend` Pod と `backend` Pod が `default` ネームスペースに存在するとき、次のコマンドは失敗します。

```
$ kubectl exec backend -- curl frontend
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:--  0:00:19 --:--:--     0
curl: (6) Could not resolve host: frontend
command terminated with exit code 6
```

`frontend` という名前が解決できていないことから `CoreDNS` の問題ではないかとあたりをつけ、次のコマンドを実行するとエラーを確認できます。

```
$ kubectl logs -n kube-system -l k8s-app=kube-dns
...
[ERROR] plugin/errors: 2 3656038324237740050.970672069479610665. HINFO: read udp 192.168.0.4:34296->169.254.169.254:53: read: no route to host
[ERROR] plugin/errors: 2 3656038324237740050.970672069479610665. HINFO: read udp 192.168.0.4:56195->169.254.169.254:53: read: no route to host
```

ここで `169.254.169.254:53` は `CoreDNS` のリクエスト先であり、[これは Oracle Cloud のリゾルバエンドポイントです](https://docs.oracle.com/ja-jp/iaas/Content/Network/Concepts/dns.htm)。

`CoreDNS` の ConfigMap を確認します。

:::details CoreDNS の ConfigMap

```
$ kubectl get configmap -n kube-system coredns -o yaml
apiVersion: v1
data:
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
kind: ConfigMap
metadata:
  creationTimestamp: "2023-04-11T13:55:15Z"
  name: coredns
  namespace: kube-system
  resourceVersion: "218"
  uid: 31ccd15e-3073-4af3-92e7-57ad21596c7d
```

:::

次の箇所からクラスターノードの `/etc/resolv.conf` を参照していることを確認しました。 

```
forward . /etc/resolv.conf {
   max_concurrent 1000
}
```

次にクラスターノードの `/etc/resolv.conf` の中身を確認します。

:::details /etc/resolv.conf

```
# This file is managed by man:systemd-resolved(8). Do not edit.
#
# This is a dynamic resolv.conf file for connecting local clients to the
# internal DNS stub resolver of systemd-resolved. This file lists all
# configured search domains.
#
# Run "resolvectl status" to see details about the uplink DNS servers
# currently in use.
#
# Third party programs must not access this file directly, but only through the
# symlink at /etc/resolv.conf. To manage man:resolv.conf(5) in a different way,
# replace this symlink by a static file or a different symlink.
#
# See man:systemd-resolved.service(8) for details about the supported modes of
# operation for /etc/resolv.conf.

nameserver 127.0.0.53
options edns0 trust-ad
search vcn04192235.oraclevcn.com
```

:::

いわく、`/etc/resolv.conf` は自動で生成されたものなので "uplink DNS server" の中身は `resolvectl status` で確認せよ、とのことでした。

:::details `resolvectl status` の結果

```
Global
       LLMNR setting: no
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no
          DNSSEC NTA: 10.in-addr.arpa
                      16.172.in-addr.arpa
                      168.192.in-addr.arpa
                      17.172.in-addr.arpa
                      18.172.in-addr.arpa
                      19.172.in-addr.arpa
                      20.172.in-addr.arpa
                      21.172.in-addr.arpa
                      22.172.in-addr.arpa
                      23.172.in-addr.arpa
                      24.172.in-addr.arpa
                      25.172.in-addr.arpa
                      26.172.in-addr.arpa
                      27.172.in-addr.arpa
                      28.172.in-addr.arpa
                      29.172.in-addr.arpa
                      30.172.in-addr.arpa
                      31.172.in-addr.arpa
                      corp
                      d.f.ip6.arpa
                      home
                      internal
                      intranet
                      lan
                      local
                      private
                      test

Link 14 (calia622272a21e)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 13 (cali0d901d3d613)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 12 (cali1e9261921dc)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 11 (cali9b723216629)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 6 (flannel.1)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 3 (docker0)
      Current Scopes: none
DefaultRoute setting: no
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no

Link 2 (enp0s6)
      Current Scopes: DNS
DefaultRoute setting: yes
       LLMNR setting: yes
MulticastDNS setting: no
  DNSOverTLS setting: no
      DNSSEC setting: no
    DNSSEC supported: no
  Current DNS Server: 169.254.169.254
         DNS Servers: 169.254.169.254
          DNS Domain: vcn04192235.oraclevcn.com
```
:::

コマンドの出力で「`Global` セクションに `DNS Server: 169.254.169.254` が存在しないのはおかしい」と思い、`/etc/systemd/resolved.conf` に次の内容を追記しました。

```
[Resolve]
DNS=169.254.169.254
```

その後 `systemctl restart systemd-resolved` を実行したところ、`Global` に `DNS Server: 169.254.169.254` が追加され、Pod 同士のコミュニケーションも取れるようになりました。

## 残る謎

そもそも `kube-dns` のログでは `169.254.169.254:53` に到達できないというエラーでした。しかし、ここではクラスターノードの DNS Server に `169.254.169.254` を追加しただけで、そこへの到達性について手を加えていないのに、通信できてしまいました。

クラスタを再度作るときにはもう少し調べてみようと思っています。
