# 無人島の選択（道徳判断プロトタイプ）

失敗体験と内省を組み合わせて道徳的な視野拡大を検証するための、Webベースのプロトタイプです。
Unity/VRでの本実装の前段階として、ブラウザだけで動く簡易版として作成しました。

## 構成

```
.
├── index.html          # プロトタイプ本体（これ1枚で完結）
├── apps-script/
│   └── Code.gs          # Googleスプレッドシート連携用（Apps Scriptにコピペして使う）
└── docs/
    └── SETUP.md          # Apps Scriptの設定手順
```

## そのまま試す（設定不要）

`index.html` をブラウザで開くだけで動きます。今はデモモードになっていて、回答はそのブラウザ内（localStorage）だけに保存されます。

## GitHub Pagesで公開する

1. このリポジトリをGitHubにpushする
2. リポジトリの `Settings` → `Pages` を開く
3. `Source` を `Deploy from a branch` にして、ブランチは `main`、フォルダは `/ (root)` を選ぶ
4. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` でアクセスできるようになる

`index.html` がリポジトリのルートにあるので、追加設定なしでそのまま公開できます。

## 本番運用（Googleスプレッドシートにデータを貯める）

複数人の回答を集めて比較フィードバックに使うには、Google Apps Script側の設定が必要です。手順は [`docs/SETUP.md`](docs/SETUP.md) を参照してください。

設定が終わったら、`index.html` 内の以下の部分にWebアプリのURLを貼ります。

```js
const CONFIG = {
  APPS_SCRIPT_URL: "", // ここにデプロイしたURLを貼る
  MIN_N_FOR_REAL_AVERAGE: 3
};
```

## パイロットデータと本番データの区別

パイロットデータ（開発後にあらかじめ記録しておく初期の参考データ）を作るときは、URLの末尾に `?pilot=1` を付けてアクセスしてください（例: `https://.../index.html?pilot=1`）。

- 画面上部に「パイロットモードで実行中」のバナーが出ます。
- 送信される全レコードに `isPilot=true` の印が付きます。
- **比較フィードバックで使う参考データの集計（平均順位・異なる選択の例）には、パイロットデータもそのまま含まれます。** OC当日、最初の参加者にも比較対象があるようにするためです。
- `isPilot` はあくまで「あとで区別・除外するための目印」です。OC終了後の分析時に、この列でパイロットデータだけを絞り込んで除外できます。

`?pilot=1` を付けずに配布したリンクは、常に本番データ（`isPilot=false`）として扱われます。

## 主なカスタマイズポイント（index.html内）

| 変更したいこと | 探す場所 |
|---|---|
| 登場人物の情報・セリフ | `CHARACTERS` |
| 失敗時のグループ全体への影響 | `GROUP_CONSEQUENCE` / `EMOTIONAL_ONLY_CONSEQUENCE` / `FAILURE_EPILOGUE` |
| 成功時の描写 | `SUCCESS_HIGHLIGHT` |
| アンケートの設問 | `SURVEY1_QUESTIONS` 〜 `SURVEY4_QUESTIONS` / 各 `renderSurveyX` 関数内 |
| 判断タイプ（功利主義型/中間型/義務論型）の判定ロジック | `classifyByComposition` |
| 自由記述のキーワードスコア（分析用の保存データ） | `calcReasonKeywordScore` |
| 比較フィードバックの暫定基準値 | `PRESET_BASELINE` |
| 食料を渡す人数 | `FOOD_RECIPIENTS` |

## 注意事項

- 判断タイプの自動判定（`classifyByComposition`）は本研究独自の暫定ルールです。最終的な分類は研究者が確認してください。
- `PRESET_BASELINE` の数値は仮の参考値です。実験前に妥当性を確認してください。
