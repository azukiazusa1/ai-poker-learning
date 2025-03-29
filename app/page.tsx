"use client";

import { useChat } from "@ai-sdk/react";
import PokerForm from "./components/PokerForm";
import AnalysisResponse from "./components/AnalysisResponse";
import { useRef } from "react";

export default function Home() {
  const { messages, isLoading, handleSubmit, setInput, input } = useChat({
    api: "/api/analyze",
    id: "poker-analysis",
    initialInput: "",
    initialMessages: [],
  });

  const chatInputRef = useRef<HTMLInputElement>(null);

  // ハンド分析の処理（setInputの反映を待ってからhandleSubmitを呼び出す）
  const handleAnalyze = (handHistory: string) => {
    // ハンド履歴を入力にセット
    setInput(handHistory);
    
    // setInputの状態更新が反映されるのを少し待ってからhandleSubmitを呼び出す
    setTimeout(() => {
      const fakeEvent = {} as React.FormEvent<HTMLFormElement>;
      handleSubmit(fakeEvent);
    }, 0);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-screen-xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          ポーカー学習アプリケーション
        </h1>
        <p className="text-lg text-gray-300">GTO戦略に基づくポーカー戦略解析</p>
      </header>

      <main className="space-y-12">
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <PokerForm onAnalyze={handleAnalyze} />
        </section>

        <AnalysisResponse messages={messages} isLoading={isLoading} />

        {messages.length > 0 && (
          <section className="w-full max-w-4xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">AIに質問する</h2>
            <p className="text-gray-300 mb-4">
              分析結果について更に質問したいことがあれば入力してください。
            </p>

            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={chatInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="質問を入力してください..."
                className="w-full p-4 pr-20 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-300"
              >
                送信
              </button>
            </form>
          </section>
        )}
      </main>

      <footer className="mt-16 py-6 text-center text-gray-400 text-sm">
        <p>© 2025 ポーカー学習アプリケーション | GTO戦略解析</p>
      </footer>
    </div>
  );
}
