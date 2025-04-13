# OpenAI Organization Costs Action

OpenAIのAdmin APIを使って、組織全体の利用コストを取得するGitHub Actionです。

## 概要

このGitHub Actionは、OpenAIの `/v1/organization/costs` APIを使用して、組織のコスト情報を取得します。
日付範囲を指定してコスト情報を取得することも可能です。

## 使い方

```yaml
name: Fetch OpenAI Costs

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日実行

jobs:
  fetch-costs:
    runs-on: ubuntu-latest
    steps:
      - name: Get OpenAI Organization Costs
        id: get-costs
        uses: TakahashiIkki/openai-org-costs-action@v0
        with:
          openai_admin_key: ${{ secrets.OPENAI_ADMIN_KEY }}
          date_from: '2023-01-01'  # オプション
          date_to: '2023-01-31'    # オプション

      - name: Use the output
        run: |
          echo "OpenAI costs: ${{ steps.get-costs.outputs.costs }}"
```

## 入力

| 入力パラメータ | 必須 | 説明 |
|------------|------|------|
| `openai_admin_key` | はい | OpenAIのAdmin API Key |
| `date` | いいえ | 単一の日付（YYYY-MM-DD形式）。指定すると自動的に開始日と終了日を計算します |
| `date_from` | いいえ | 開始日（YYYY-MM-DD形式） |
| `date_to` | いいえ | 終了日（YYYY-MM-DD形式） |

## 出力

| 出力 | 説明 |
|------|------|
| `costs` | コスト情報（JSON形式） |

出力の例:
```json
{
  "amount": {
    "value": 0.06,
    "currency": "usd"
  },
  "project_id": "proj_abc"
}
```
