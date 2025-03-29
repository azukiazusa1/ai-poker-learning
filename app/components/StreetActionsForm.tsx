"use client";

import { useState } from "react";
import {
  HandHistoryState,
  Position,
  Action,
  ActionEntry,
  Street,
} from "./types";

interface StreetActionsFormProps {
  stage: Street;
  handHistory: HandHistoryState;
  getAvailablePositions: () => Position[];
  addAction: (stage: Street, action: ActionEntry) => void;
  removeAction: (stage: Street, index: number) => void;
  onAnalyze: (history: string) => void; // "?" アクション用
  formatHandHistory: () => string; // "?" アクション用
  onNext: () => void;
  onBack: () => void;
}

const streetTitles: Record<Street, string> = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
};

const actions: Action[] = [
  "fold",
  "check",
  "call",
  "bet",
  "raise",
  "all-in",
  "?",
];

export default function StreetActionsForm({
  stage,
  handHistory,
  getAvailablePositions,
  addAction,
  removeAction,
  onAnalyze,
  formatHandHistory,
  onNext,
  onBack,
}: StreetActionsFormProps) {
  const [newAction, setNewAction] = useState<ActionEntry>({
    position: handHistory.heroPosition,
    action: "check",
    amount: undefined,
  });

  const needsAmount = ["bet", "raise"].includes(newAction.action); // 'call' を除外
  const isQuestion = newAction.action === "?";
  const currentActions = handHistory[`${stage}Actions`];

  const handleAddAction = () => {
    const actionToAdd = { ...newAction };
    if (actionToAdd.action === "?") {
      actionToAdd.isQuestion = true;
    }
    addAction(stage, actionToAdd);

    // "?" アクションの場合はすぐに解析実行
    if (actionToAdd.action === "?") {
      // ステート更新が反映されるのを待つために少し遅延させる
      setTimeout(() => {
        const formattedHistory = formatHandHistory(); // 最新の状態でフォーマット
        onAnalyze(formattedHistory);
        // 解析セクションへスクロール
        setTimeout(() => {
          document
            .getElementById("analysis-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }, 10);
    }

    // フォームをリセット (Heroのポジションは維持)
    setNewAction({
      position: handHistory.heroPosition,
      action: "check",
      amount: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{streetTitles[stage]}</h3>

      {/* Action List */}
      <div>
        <label className="block mb-2 text-sm font-medium">
          {streetTitles[stage]}のアクション
        </label>

        {currentActions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {currentActions.map((action, index) => (
              <div
                key={`${stage}-${index}`}
                className={`flex items-center justify-between p-2 rounded-md ${
                  action.action === "?"
                    ? "bg-green-900"
                    : action.position === handHistory.heroPosition
                    ? "bg-blue-900"
                    : "bg-gray-800"
                }`}
              >
                <span>
                  {action.position === handHistory.heroPosition
                    ? `${action.position} (Hero)`
                    : action.position}
                  : {action.action === "?" ? "分析を求める" : action.action}
                  {action.amount !== undefined
                    ? ` ${action.amount.toFixed(1)}BB`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeAction(stage, index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-4">
            アクションが記録されていません。
          </p>
        )}
      </div>

      {/* Action Input Form */}
      <div className="space-y-4 border border-gray-700 rounded-md p-4 mt-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">新しいアクション</h4>
          <div className="text-sm bg-blue-900 px-3 py-1 rounded-md">
            現在のポット:{" "}
            <span className="font-bold">
              {handHistory.potSize.toFixed(1)}BB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1">ポジション</label>
            <select
              value={newAction.position}
              onChange={(e) =>
                setNewAction({
                  ...newAction,
                  position: e.target.value as Position,
                })
              }
              className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
            >
              {getAvailablePositions().map((pos) => (
                <option key={pos} value={pos}>
                  {pos === handHistory.heroPosition ? `${pos} (Hero)` : pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">アクション</label>
            <select
              value={newAction.action}
              onChange={(e) =>
                setNewAction({ ...newAction, action: e.target.value as Action })
              }
              className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action === "?" ? "? (解析)" : action}
                </option>
              ))}
            </select>
          </div>

          {needsAmount && (
            <div className="col-span-2">
              <label className="block text-xs mb-1">金額 (BB)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newAction.amount || ""}
                onChange={(e) =>
                  setNewAction({
                    ...newAction,
                    amount: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleAddAction}
            className={`px-3 py-1 ${
              isQuestion
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-md`}
            disabled={needsAmount && !newAction.amount}
          >
            {isQuestion ? "解析する" : "追加"}
          </button>

          {isQuestion && (
            <div className="text-yellow-400 text-sm italic text-right">
              「?」を追加すると、この時点での最適なアクションを解析します
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          次へ
        </button>
      </div>
    </div>
  );
}