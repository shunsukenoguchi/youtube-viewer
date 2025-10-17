# YouTube Viewer

YouTubeのURLを入力するか、チャンネル名・動画タイトルで検索して動画を視聴できるWebアプリケーションです。

## 特徴

- 🎥 **2つの視聴方法**:
  - **URL入力**: YouTube URLを直接入力して視聴
  - **検索機能**: チャンネル名や動画タイトルで検索して動画を選択
- 📱 **レスポンシブデザイン**: モバイルからデスクトップまで対応
- 🌙 **ダークテーマ**: 目に優しいUIデザイン
- 🔄 **複数のURL形式に対応**:
  - `https://www.youtube.com/watch?v=xxxxx`
  - `https://youtu.be/xxxxx`
  - `https://www.youtube.com/embed/xxxxx`
  - `https://www.youtube.com/v/xxxxx`
- 🔍 **動画検索**: YouTube Data API v3を使用したリアルタイム検索

## 技術スタック

- **フレームワーク**: [Next.js 15](https://nextjs.org) (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIライブラリ**: React 19
- **API**: YouTube Data API v3

## セットアップ

### 前提条件

- Node.js 18.18以上
- npm, yarn, pnpm, または bun
- YouTube Data API v3 キー（検索機能を使用する場合）

### YouTube API キーの取得

検索機能を使用するには、YouTube Data API v3のキーが必要です。

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「ライブラリ」から「YouTube Data API v3」を有効化
4. 「APIとサービス」→「認証情報」からAPIキーを作成
5. 作成したAPIキーをコピー

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

### 環境変数の設定

検索機能を使用する場合は、環境変数を設定する必要があります：

```bash
# .env.localファイルを作成
cp .env.example .env.local

# .env.localファイルを編集して設定
```

`.env.local`の設定例：
```bash
# YouTube API キー（検索機能を使う場合は必須）
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# Basic認証（オプション）
# サイト全体にBasic認証をかけたい場合に設定
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=your_secure_password
```

**注意**: 
- URL入力機能のみを使用する場合は、APIキーは不要です
- Basic認証の環境変数を設定しない場合は、認証なしでアクセスできます

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

### URL入力モード

1. トップページ（`/`）を開く
2. 入力フィールドにYouTube URLを貼り付け
3. 「表示」ボタンをクリック
4. 動画が埋め込みプレーヤーで表示されます
5. 別の動画を見る場合は「クリア」ボタンで入力をリセット

### 検索モード

1. 「動画検索へ」ボタンをクリックして検索ページ（`/search`）に移動
2. チャンネル名や動画タイトルを入力して「検索」をクリック
3. 検索結果から見たい動画のサムネイルをクリック
4. 動画が埋め込みプレーヤーで表示されます
5. 「← 検索結果に戻る」ボタンで検索結果に戻れます

## セキュリティ

### Basic認証

サイト全体にBasic認証を追加できます。`.env.local`に以下を設定してください：

```bash
BASIC_AUTH_USER=your_username
BASIC_AUTH_PASSWORD=your_password
```

設定後、開発サーバーを再起動すると、すべてのページへのアクセス時にユーザー名とパスワードの入力が求められます。

**注意**: 
- Basic認証の環境変数が設定されていない場合は、認証なしでアクセスできます
- 本番環境では強固なパスワードを設定してください
- Vercelなどのホスティングサービスでも環境変数を設定できます

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
