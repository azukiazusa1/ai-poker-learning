import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { Message } from "ai/react";

// エッジランタイムを使用
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // リクエストボディのパース
    const body = await req.json();
    const messages = body.messages as Message[] || [];
    
    // 初回の分析かチャットでの質問かを判定
    const isInitialAnalysis = messages.length === 1 || body.handHistory;
    
    // ハンド履歴があるか最初のメッセージを抽出
    const handHistory =
      body.handHistory ||
      (messages.length > 0 && isInitialAnalysis
        ? messages[messages.length - 1].content
        : null);

    // システムプロンプト
    const systemPrompt = `あなたはポーカーエキスパートです。ユーザーから提供されたポーカーのハンド履歴を詳細に分析し、最適な戦略をアドバイスします。ユーザーからの追加質問にも回答します。

分析にあたっては、以下の点を考慮してください：
1. GTO (Game Theory Optimal) 戦略に基づいた分析
2. ICM (Independent Chip Model) への考慮 - 以下のポイント配分に基づいて評価:
   - 1位: 30pt
   - 2位: 20pt
   - 3位: 10pt
   - 4位: -10pt
   - 5位: -20pt
   - 6位: -30pt
3. ヒーローのポジション、スタック、およびハンドの強さ
4. 対戦相手の可能性のあるハンドレンジ
5. ボードテクスチャとその変化
6. ポットオッズとエクイティ
7. 各アクション（チェック、ベット、レイズ、フォールド）の長所と短所

提案するアクションについては、なぜそのアクションが最適なのかを詳細に説明してください。可能な場合は、異なるサイズのベットやレイズについても言及し、それぞれのメリットを比較してください。

回答は日本語で行い、ポーカー用語は適宜英語のまま使用しても構いません。専門的な分析を提供しつつも、わかりやすい言葉で説明してください。

ユーザーが追加の質問をしてきた場合は、前回の分析内容を踏まえて回答してください。`;

    // 初回分析時とチャット時でプロンプトを変える
    let messageList = [];
    
    if (isInitialAnalysis && handHistory) {
      // 初回のハンド分析
      const userPrompt = `以下のポーカーハンド履歴を分析し、状況に応じた最適なアクションを提案してください。

${handHistory}

最後の状況で「分析を求める」または「?」となっているところが、これから取るべきアクションです。最適なアクションを根拠とともに説明してください。

現在のポットサイズと参加プレイヤーのスタックサイズを考慮して、以下の情報を含めてください:
1. 最適なアクション（ベット、チェック、コール、レイズ、フォールドなど）
2. ベットやレイズを推奨する場合、最適なサイズとその理由
3. いくつかの代替案と、それらが最適でない理由
4. ICM（Independent Chip Model）の観点からの考察
5. プレイヤーの相対的ポジションとレンジを考慮した分析`;

      messageList = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    } else {
      // 会話継続時は過去のメッセージを含める
      messageList = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ 
          role: m.role as "system" | "user" | "assistant" | "tool", 
          content: m.content 
        }))
      ];
    }

    console.log("Messages sent to AI:", messageList.length);

    const response = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      messages: messageList,
    });
    
    return response.toDataStreamResponse();
  } catch (error) {
    console.error("Error analyzing hand:", error);
    return new Response("Error analyzing hand", { status: 500 });
  }
}
