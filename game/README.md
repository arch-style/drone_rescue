# Drone Rescue: Sky Guardian - Production Version

2.5Dドローンレスキューゲームの本番版プロジェクトです。

## 技術スタック

- **フレームワーク**: PixiJS v8 (WebGL/WebGPU)
- **言語**: TypeScript
- **ビルドツール**: Vite
- **ターゲット**: Web (PC/iOS/Android対応)

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## プロジェクト構造

```
game/
├── src/
│   ├── game/        # ゲームロジック
│   ├── ui/          # UIコンポーネント
│   ├── utils/       # ユーティリティ
│   ├── assets/      # アセット（コード内で使用）
│   └── main.ts      # エントリーポイント
├── public/
│   └── assets/      # 静的アセット
│       ├── images/  # 画像ファイル
│       └── sounds/  # 音声ファイル
└── package.json
```

## 開発状況

- [x] 基本的なPixiJSセットアップ
- [x] プロジェクト構造の作成
- [ ] 既存ゲームロジックの移植
- [ ] 2.5Dグラフィックスの実装
- [ ] タッチコントロールの実装
- [ ] PWA対応

## デプロイ

Cloudflare Pagesへの自動デプロイが設定されています。
`production`ブランチへのプッシュで自動的にデプロイされます。