---
title: "GitHub Appで「組織」に所属するAPIトークンを取得"
emoji: "🎉"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github", "api"]
published: true
---

GitHubの組織機能を利用していると、個人アカウントに紐づかないAPIトークンが欲しくなることがあります。退職者が出た場合や、個人アカウントの権限変更があった場合でも、APIトークンの管理を組織単位で行えるためです。

この記事では、GitHub Appを利用して組織に所属するAPIトークンを取得する方法を紹介します。

## GitHub App, JWT, Install Access Token

GitHub Appは、GitHubのAPIを利用するためのアプリケーションで、組織にインストールして使用できます。かつて[GitHub Appの入門記事](/mahata/articles/intro-to-github-apps)を書いたので、ぜひ併せてご覧ください。

GitHub Appを利用してAPIリクエストを行うには、まずJWT (JSON Web Token) を生成し、そのJWTを使ってインストールアクセストークンを取得します。このインストールアクセストークンを使用して、APIリクエストを行います。ややこしいですね。

このややこしさは、GitHubの公式ドキュメントを読んでもあまり解決しません。「公式ドキュメント」という立ち位置から、網羅的な解説がされており、様々な分岐がされているためです（「個人として使う or 組織で使う」、「Octokitを使う or 使わない」など）。ここでは物事を単純にするため、「組織でGitHub Appを使い」「Octokitは使わない」という前提で行くことにします。

さて、何をするにもGitHub Appがなければ始まらないので、まずはGitHub Appの作成から始めましょう。

### GitHub Appの作成

ここでは、GitHubの組織に所属するGitHub Appを作成する手順を説明します。

1. GitHubの組織ページにアクセスし、右上の「Settings」をクリックします。
2. 左側のメニューから「Developer settings」を選択し、「GitHub Apps」をクリックします。
3. 「New GitHub App」ボタンをクリックして、新しいGitHub Appを作成します。
4. 必要な情報を入力します。特に「Permissions & events」セクションで、APIリクエストに必要な権限を設定します（APIを利用するだけであれば、ここ以外は適当で構いません）。
5. 「Create GitHub App」ボタンをクリックして、GitHub Appを作成します（表示される`App ID` はメモしておきます。）。
6. 作成後、GitHub Appの設定ページで「Generate a private key」ボタンをクリックして、秘密鍵を生成し、ダウンロードします。この秘密鍵は後でJWTを生成するために使用します。
7. GitHub Appを組織にインストールします。`https://github.com/apps/<GITHUB APP NAME>/installations/new` からインストールします。

### PythonでJWTを取得してAPIリクエストをするまで

ここまで来れば、もう一気にコードを読む方が理解が捗ることでしょう。以下は「Python 3」でGitHubのリポジトリからイシューを取得するコードです。`PyJWT` および `requests` はインストール済みだと仮定します。

```python
#!/usr/bin/env python3
import os
import sys
import time
import json
from typing import Any, Dict, List, Optional

import jwt  # PyJWT
import requests


def require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise SystemExit(f"必要な環境変数が設定されていません: {name}")
    return v


def make_app_jwt(app_id: str, private_key_pem_path: str) -> str:
    """
    アプリの秘密鍵（RS256）で署名されたGitHub App JWTを作成します。
    GitHubの期待値:
      - iss: アプリID
      - iat: 発行時刻 (わずかなクロックドリフトを許容)
      - exp: 有効期限 (10分以内を推奨)
    """
    with open(private_key_pem_path, "rb") as f:
        private_key = f.read()

    now = int(time.time())
    payload = {
        "iat": now - 60,         # 時刻のズレを考慮して60秒前に設定
        "exp": now + 9 * 60,     # 有効期限を10分以内に抑える
        "iss": app_id,
    }

    token = jwt.encode(payload, private_key, algorithm="RS256")
    # PyJWTのバージョンによって `str` か `bytes` が返されるため、`str` に正規化
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def gh_api(
    method: str,
    url: str,
    token: str,
    accept: str = "application/vnd.github+json",
    json_body: Optional[Dict[str, Any]] = None,
) -> requests.Response:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": accept,
        "X-GitHub-Api-Version": "2022-11-28",
    }
    resp = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    return resp


def get_org_installation_id(api_url: str, org: str, app_jwt: str) -> int:
    url = f"{api_url}/orgs/{org}/installation"
    resp = gh_api("GET", url, token=app_jwt)
    if resp.status_code != 200:
        raise SystemExit(
            f"組織のインストールIDの取得に失敗しました。HTTP {resp.status_code}\n{resp.text}"
        )
    data = resp.json()
    return int(data["id"])


def create_installation_access_token(api_url: str, installation_id: int, app_jwt: str) -> Dict[str, Any]:
    url = f"{api_url}/app/installations/{installation_id}/access_tokens"
    resp = gh_api("POST", url, token=app_jwt)
    if resp.status_code != 201:
        raise SystemExit(
            f"インストールアクセストークンの作成に失敗しました。HTTP {resp.status_code}\n{resp.text}"
        )
    # トークン、有効期限、権限、リポジトリ（存在する場合）を含むデータを返却
    return resp.json()


def list_repo_issues(
    api_url: str,
    org: str,
    repo: str,
    installation_token: str,
    state: str = "open",
    per_page: int = 100,
    page_limit: int = 1,
) -> List[Dict[str, Any]]:
    """
    REST経由でイシューの一覧を取得します:
      GET /repos/{owner}/{repo}/issues

    注意: このエンドポイントはイシューとプルリクエストの両方を返します。
    PRは "pull_request" キーの有無で判別可能です。
    ページネーション: page_limit で制限しています。全ページが必要な場合は拡張してください。
    """
    issues: List[Dict[str, Any]] = []

    for page in range(1, page_limit + 1):
        url = f"{api_url}/repos/{org}/{repo}/issues"
        params = {"state": state, "per_page": per_page, "page": page}
        headers = {
            "Authorization": f"Bearer {installation_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code != 200:
            raise SystemExit(
                f"イシューの取得に失敗しました。 HTTP {resp.status_code}\n{resp.text}"
            )

        batch = resp.json()
        if not isinstance(batch, list):
            raise SystemExit(f"予期しないレスポンス形式です: {batch}")

        if not batch:
            break

        issues.extend(batch)

        # 取得件数が `per_page` より少ない場合は、最終ページと判断して終了
        if len(batch) < per_page:
            break

    return issues


def main() -> None:
    app_id = require_env("APP_ID")
    org = require_env("ORG")
    repo = require_env("REPO")
    private_key_pem = os.getenv("PRIVATE_KEY_PEM", "./private-key.pem")
    api_url = os.getenv("GITHUB_API_URL", "https://api.github.com")

    state = os.getenv("STATE", "open")
    per_page = int(os.getenv("PER_PAGE", "100"))
    page_limit = int(os.getenv("PAGE_LIMIT", "1"))

    # 1) アプリ認証用のJWTを作成
    app_jwt = make_app_jwt(app_id, private_key_pem)

    # 2) インストールIDを取得
    installation_id = get_org_installation_id(api_url, org, app_jwt)

    # 3) インストール用のアクセストークンを発行
    token_data = create_installation_access_token(api_url, installation_id, app_jwt)
    installation_token = token_data["token"]

    # 4) イシュー一覧を取得
    issues = list_repo_issues(
        api_url=api_url,
        org=org,
        repo=repo,
        installation_token=installation_token,
        state=state,
        per_page=per_page,
        page_limit=page_limit,
    )

    # 生のJSON（オブジェクト全体）を出力
    print(json.dumps(issues, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

実行に際しては、いくつかの環境変数を設定する必要があります。以下は例です。

```bash
export APP_ID="your_github_app_id"
export ORG="your_github_org"
export REPO="your_github_repo"
export PRIVATE_KEY_PEM="/path/to/your/private_key.pem"

python github_app_example.py
```

このコードは、GitHub AppのJWTを生成し、組織のインストールIDを取得し、インストールアクセストークンを作成し、そのトークンを使用して指定されたリポジトリのイシューを取得する一連の流れを示しています。

## JWT, インストールID, インストールアクセストークンの関係

GitHub Appを利用する際の認証フローは以下のようになります。

1. **JWTの生成**: GitHub Appの秘密鍵を使用してJWTを生成します。このJWTはGitHubに対してアプリケーションの身元を証明するために使用されます。
2. **インストールIDの取得**: JWTを使用して、GitHub Appがインストールされている組織のインストールIDを取得します。
3. **インストールアクセストークンの作成**: インストールIDを使用して、インストールアクセストークンを作成します。このトークンは、GitHub APIへのリクエストに使用されます。
4. **APIリクエストの実行**: インストールアクセストークンを使用して、GitHub APIに対してリクエストを行います。

これらのステップを通じて、GitHub Appは組織に所属するAPIトークンを取得し、APIリクエストを行うことができます。
