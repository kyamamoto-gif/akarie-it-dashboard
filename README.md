# アカリエ IT部門 採用KPIダッシュボード

## ファイル構成

```
akarie-it-dashboard/
├── index.html          # ダッシュボード本体
└── gas/
    └── Code.gs         # Google Apps Script バックエンド
```

## セットアップ手順

### 1. GASデプロイ

1. [Google Apps Script](https://script.google.com) を開く
2. 新規プロジェクト作成 → `gas/Code.gs` の内容を貼り付ける
3. 「デプロイ」→「新しいデプロイ」→ 種類：**ウェブアプリ**
   - 実行ユーザー：自分
   - アクセスできるユーザー：**全員**
4. デプロイURL（`https://script.google.com/macros/s/.../exec`）をコピー

### 2. HTMLにURLを設定

`index.html` の以下の行を編集：

```js
const GAS_URL = 'YOUR_GAS_DEPLOY_URL_HERE';
// ↓
const GAS_URL = 'https://script.google.com/macros/s/【コピーしたID】/exec';
```

### 3. GitHubにプッシュ

```bash
git init
git add .
git commit -m "feat: IT部門 採用KPIダッシュボード初期構築"
git branch -M main
git remote add origin https://github.com/【ユーザー名】/【リポジトリ名】.git
git push -u origin main
```

### 4. GitHub Pages 有効化

リポジトリ Settings → Pages → Branch: `main` / root → Save

---

## 書類選考・面接判定値

GASの `isPass()` 関数が以下の値を「通過」と判定します：
`○` `◯` `通過` `合格` `pass` `Pass` `TRUE` `1`

スプレッドシートの表記に合わせて適宜追加してください。

---

## パスワード
`akarie2026`
