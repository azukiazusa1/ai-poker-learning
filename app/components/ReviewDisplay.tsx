"use client";

interface ReviewDisplayProps {
  formattedHistory: string;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void; // Pass the submit handler
}

export default function ReviewDisplay({
  formattedHistory,
  isLoading,
  onBack,
  onSubmit,
}: ReviewDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">確認と解析</h3>

      <div className="bg-gray-800 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
        {formattedHistory}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="submit" // Changed to type="submit" to trigger form submission
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800"
          onClick={onSubmit} // Attach the submit handler here as well if needed, or rely on form's onSubmit
        >
          {isLoading ? "解析中..." : "ハンド解析する"}
        </button>
      </div>
    </div>
  );
}
