"use client";

import { useChat } from "@ai-sdk/react";
import PokerForm from "./components/PokerForm";
import AnalysisResponse from "./components/AnalysisResponse";
import { useEffect } from "react";

export default function Home() {
  const { messages, isLoading, handleSubmit, setInput, input } = useChat({
    api: "/api/analyze",
    id: "poker-analysis",
    initialInput: "",
    initialMessages: [],
  });

  useEffect(() => {
    if (input) {
      const currentForm = document.createElement("form");
      currentForm.onsubmit = (e) => {
        e.preventDefault();
        handleSubmit(e as any);
      };
      currentForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  }, [input, handleSubmit]);

  const handleAnalyze = async (handHistory: string) => {
    try {
      // aiのuseChat内部で処理するためにformのsubmitを呼び出し
      setInput(handHistory);
    } catch (error) {
      console.error("Error analyzing hand:", error);
    }
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
      </main>

      <footer className="mt-16 py-6 text-center text-gray-400 text-sm">
        <p>© 2025 ポーカー学習アプリケーション | GTO戦略解析</p>
      </footer>
    </div>
  );
}
