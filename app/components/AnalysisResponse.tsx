"use client";

import { useEffect, useRef } from "react";
import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnalysisResponseProps {
  messages: Message[];
  isLoading: boolean;
}

export default function AnalysisResponse({
  messages,
  isLoading,
}: AnalysisResponseProps) {
  const responseRef = useRef<HTMLDivElement>(null);
  const initialAnalysisRef = useRef<Message | null>(null);

  // 初回のAI分析を保存
  useEffect(() => {
    if (messages.length > 0 && messages[0].role === "user" && messages[1]?.role === "assistant" && !initialAnalysisRef.current) {
      initialAnalysisRef.current = messages[1];
    }
  }, [messages]);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (responseRef.current && messages.length > 0) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) return null;

  // メッセージの種類に基づいてラベルを決定
  const getMessageLabel = (message: Message, index: number) => {
    if (message.role === "user") {
      if (index === 0) return "入力情報";
      return "質問";
    } else {
      if (index === 1) return "AI 解析";
      return "AI 回答";
    }
  };

  return (
    <div id="analysis-section" ref={responseRef} className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">解析結果</h2>

      <div className="bg-gray-900 p-6 rounded-lg">
        {isLoading && (
          <div className="flex flex-col items-center py-8 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg text-gray-300">
              {messages.length <= 2 ? "AI がハンドを解析中..." : "AI が回答を生成中..."}
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-6 p-4 rounded-lg ${
              message.role === "user"
                ? "bg-blue-800/50 text-white"
                : index === 1 
                  ? "bg-gray-800 text-gray-100 border-l-4 border-green-500"
                  : "bg-gray-800 text-gray-100"
            }`}
          >
            <div className="font-semibold mb-3 text-sm text-gray-400">
              {getMessageLabel(message, index)}
            </div>
            
            {message.role === "user" ? (
              // ユーザーメッセージは整形済みテキストとして表示
              <div className="font-mono text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              // AIの応答はマークダウンとして解析して表示
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-500">
                {message.role === "assistant" && index === 1 && 
                  <span className="px-2 py-1 bg-green-800/30 text-green-400 rounded text-xs">
                    初回分析
                  </span>
                }
              </div>
              <div className="text-xs text-gray-500">
                {(message.createdAt ? new Date(message.createdAt) : new Date()).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
