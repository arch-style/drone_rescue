# Cloudflare Pagesへのデプロイ手順

## 前提条件
- Cloudflareアカウントを持っていること
- GitHubアカウントを持っていること（推奨）

## 方法1: GitHub連携でのデプロイ（推奨）

### 1. GitHubリポジトリの作成
1. GitHubで新しいリポジトリを作成
2. このプロジェクトをプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/drone-rescue.git
git push -u origin main
```

### 2. Cloudflare Pagesでのセットアップ
1. [Cloudflare Pages](https://pages.cloudflare.com/)にアクセス
2. 「Create a project」をクリック
3. 「Connect to Git」を選択
4. GitHubアカウントを連携し、リポジトリを選択
5. ビルド設定：
   - **Framework preset**: None
   - **Build command**: （空欄のまま）
   - **Build output directory**: `/prototype`
   - **Root directory**: `/`

### 3. デプロイ
- 「Save and Deploy」をクリック
- 数分でデプロイが完了し、URLが発行されます

## 方法2: Direct Uploadでのデプロイ

### 1. Cloudflare Pagesにアクセス
1. [Cloudflare Pages](https://pages.cloudflare.com/)にアクセス
2. 「Create a project」をクリック
3. 「Upload assets」を選択

### 2. フォルダのアップロード
1. プロジェクト名を入力（例：drone-rescue）
2. `prototype`フォルダ内の全ファイルをドラッグ&ドロップ
   - index.html
   - css/フォルダ
   - js/フォルダ
   - assets/フォルダ（ある場合）
   - _redirectsファイル

### 3. デプロイ
- 「Deploy site」をクリック
- 数分でデプロイが完了

## デプロイ後の確認

### URLの形式
- `https://[プロジェクト名].pages.dev`
- カスタムドメインも設定可能

### iOS Safari での確認事項
1. タッチコントロールが表示されること
2. 画面の拡大縮小が無効化されていること
3. フルスクリーンモードで動作すること

### ホーム画面に追加
1. iOS Safariでサイトを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択
4. アプリのように起動可能に

## トラブルシューティング

### デプロイが失敗する場合
- ファイルパスに日本語が含まれていないか確認
- ファイルサイズが25MB以下か確認
- _redirectsファイルが正しく配置されているか確認

### タッチ操作が効かない場合
- iOS Safariの設定でJavaScriptが有効か確認
- プライベートブラウズモードでない状態で確認

## 更新方法

### GitHub連携の場合
- mainブランチにプッシュすると自動的に再デプロイ

### Direct Uploadの場合
1. Cloudflare Pagesダッシュボードにアクセス
2. プロジェクトを選択
3. 「Create new deployment」をクリック
4. 更新したファイルをアップロード