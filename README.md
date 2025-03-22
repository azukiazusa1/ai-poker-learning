> [!IMPORTANT]
> このレポジトリのコードはすべて Claude Code によって欠かれています。

# ポーカー学習アプリケーション

GTO戦略に基づいたポーカー学習アプリケーションです。ユーザーはハンド履歴を入力し、AIが最適なプレイ戦略を提案します。

## 機能

- 直感的なハンド履歴入力フォーム
- ステップバイステップの入力プロセス
- AI（Anthropic Claude）による詳細なハンド解析
- ICM（Independent Chip Model）を考慮した戦略提案
- リアルタイムストリーミングレスポンス

## 必要条件

- [Anthropic API キー](https://www.anthropic.com/api)
- Node.js 18.0.0 以上

## セットアップ

1. リポジトリをクローンする:

```bash
git clone https://github.com/yourusername/poker-learning.git
cd poker-learning
```

2. 依存関係をインストールする:

```bash
npm install
# or
yarn
# or
pnpm install
```

3. 環境変数を設定する:

`.env.example` ファイルを `.env.local` としてコピーし、Anthropic API キーを追加します:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. 開発サーバーを起動する:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1. ハンド情報入力: プレイヤー数、スタックサイズ、自分のハンドとポジションを入力します。
2. プリフロップアクション: プリフロップでのアクションを記録します。
3. フロップ: フロップのカードとアクションを記録します。
4. ターン: ターンのカードとアクションを記録します。
5. リバー: リバーのカードとアクションを記録します（オプション）。
6. 解析: ハンド履歴を確認し、「ハンド解析する」ボタンをクリックします。

AIは状況を分析し、最適なアクションとその理由を詳しく説明します。

## ICM計算

このアプリケーションは以下のICMポイント配分を考慮した戦略を提案します:

- 1位: 30pt
- 2位: 20pt
- 3位: 10pt
- 4位: -10pt
- 5位: -20pt
- 6位: -30pt

## テクノロジー

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Anthropic Claude API](https://www.anthropic.com/) - ポーカー戦略AI分析
- [TypeScript](https://www.typescriptlang.org/) - 型安全性

## ライセンス

MIT
