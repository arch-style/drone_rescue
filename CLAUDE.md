# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

「Drone Rescue: Sky Guardian」- 横スクロール型2Dレスキューゲーム。災害現場から市民を救助し、基地に運ぶゲームです。
HTML5 Canvas + Vanilla JavaScriptで実装されており、モダンブラウザ（Chrome, Firefox, Safari）で動作します。

## 開発セットアップ

```bash
# prototypeフォルダに移動
cd prototype

# ローカルサーバーで起動（Pythonの場合）
python -m http.server 8000
# または
python3 -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000/index.html
```

直接 `prototype/index.html` をブラウザで開くことも可能です。

## アーキテクチャ

### 技術スタック
- **描画エンジン**: HTML5 Canvas API
- **言語**: Vanilla JavaScript（ES6+）
- **スタイル**: CSS3
- **音声**: Web Audio API（sound.js）

### ディレクトリ構造
```
prototype/
├── index.html      # メインHTMLファイル
├── css/
│   └── style.css   # ゲームスタイルシート
├── js/             # JavaScriptモジュール
│   ├── main.js     # エントリーポイント
│   ├── game.js     # ゲームロジック・状態管理
│   ├── drone.js    # ドローンクラス
│   ├── citizen.js  # 市民クラス
│   ├── stage.js    # ステージ管理
│   ├── sound.js    # サウンドシステム
│   └── upgrades.js # アップグレードシステム
└── assets/         # ゲームアセット（画像・音声）
```

## 主要機能

### 実装済み
- **ドローン操作**: キーボード（矢印キー/WASD）での移動
- **救助システム**: ハシゴを使った市民救助
- **バッテリー管理**: 時間経過で減少、充電ポートで回復
- **ステージシステム**: 進行により難易度上昇（世界拡大、充電量減少）
- **アップグレードシステム**: ステージクリアで獲得できるパワーアップ
- **UI**: スタート画面、ゲームオーバー画面、HUD表示
- **サウンド**: 効果音とBGM（Web Audio API）
- **収容システム**: 最大5人まで同時収容可能
- **スコアシステム**: 救助人数と時間でスコア計算

### ゲーム要素
- **基地**: 緑色の建物（市民を投下する場所）
- **充電ポート**: 青色の建物（バッテリー回復）
- **建物**: 灰色の建物（市民が待機）
- **市民**: 救助対象（建物の周辺に配置）

## ゲーム仕様

### 操作方法
- **↑↓ または W/S**: ドローンの上昇・下降
- **←→ または A/D**: ドローンの左右移動
- **スペースキー**: 救助/投下アクション

### ゲームフロー
1. ステージ開始時、市民が建物周辺に配置される
2. ドローンで市民に接近し、スペースキーで救助
3. 救助した市民を基地まで運び、スペースキーで投下
4. すべての市民を救助するとステージクリア
5. アップグレードを選択して次のステージへ

### バッテリーシステム
- 初期容量: 100%
- 消費速度: 基本0.2%/秒（収容人数により増加）
- 充電速度: 2.0%/秒（充電ポート接触時）
- 0%になるとゲームオーバー

### アップグレードの種類
- **バッテリー容量増加**: 最大バッテリー量アップ
- **スピード強化**: 移動速度向上
- **効率的な充電**: 充電速度向上
- **省エネモード**: バッテリー消費軽減
- **収容能力拡張**: 最大収容人数増加

## 開発時の注意点

1. **パフォーマンス**: Canvas描画の最適化、不要な再描画を避ける
2. **ゲームバランス**: ステージ進行による難易度調整は段階的に
3. **ブラウザ互換性**: Chrome, Firefox, Safari での動作確認
4. **レスポンシブ対応**: 画面サイズに応じたCanvas調整
5. **サウンド**: ユーザー操作後に音声を初期化（ブラウザ制限対応）

## デプロイ手順

修正後は以下の手順でデプロイを行う：

1. **バージョン番号の更新**
   - game.js内のバージョン番号を更新（例: 0.0.8 → 0.0.9）

2. **GitHub連携デプロイ（推奨）**
   ```bash
   git add .
   git commit -m "修正内容の説明 v0.0.9"
   git push origin main
   ```
   - Cloudflare Pagesが自動的に再デプロイ

3. **Direct Uploadデプロイ（代替方法）**
   - Cloudflare Pagesダッシュボードにアクセス
   - プロジェクトを選択
   - 「Create new deployment」をクリック
   - prototypeフォルダ内の全ファイルをアップロード

4. **デプロイ確認**
   - https://drone-rescue.pages.dev/ でゲームの動作確認
   - 特にモバイル（iOS Safari）での動作確認

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.