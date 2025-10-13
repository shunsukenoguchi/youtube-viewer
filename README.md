# YouTube Viewer

YouTubeのURLを入力すると、その動画だけを埋め込みプレーヤーで視聴できるシンプルなWebアプリケーションです。

## 特徴

- 🎥 **シンプルな操作**: YouTube URLを入力するだけ
- 📱 **レスポンシブデザイン**: モバイルからデスクトップまで対応
- 🌙 **ダークテーマ**: 目に優しいUIデザイン
- 🔄 **複数のURL形式に対応**:
  - `https://www.youtube.com/watch?v=xxxxx`
  - `https://youtu.be/xxxxx`
  - `https://www.youtube.com/embed/xxxxx`
  - `https://www.youtube.com/v/xxxxx`

## 技術スタック

- **フレームワーク**: [Next.js 15](https://nextjs.org) (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIライブラリ**: React 19

## セットアップ

### 前提条件

- Node.js 18.18以上
- npm, yarn, pnpm, または bun

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/shunsukenoguchi/youtube-viewer.git
cd youtube-viewer

# 依存関係をインストール
npm install
# または
yarn install
# または
pnpm install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 使い方

1. アプリケーションを開く
2. 入力フィールドにYouTube URLを貼り付け
3. 「表示」ボタンをクリック
4. 動画が埋め込みプレーヤーで表示されます
5. 別の動画を見る場合は「クリア」ボタンで入力をリセット

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# コードチェック
npm run lint

# コードフォーマット
npm run format
```

## デプロイ

このアプリは[Vercel](https://vercel.com)でデプロイされています。

[https://youtube-viewer-knhrw398n-shunsukenoguchis-projects.vercel.app](https://youtube-viewer-knhrw398n-shunsukenoguchis-projects.vercel.app)

詳細は[Next.jsデプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying)を参照してください。

## ライセンス

MIT
