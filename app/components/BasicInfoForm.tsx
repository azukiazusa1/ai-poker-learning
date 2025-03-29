"use client";

import { HandHistoryState, Position, StackEntry } from "./types"; // Card は CardDisplay で使われるため不要、StackEntry は必要
import CardDisplay from "./CardDisplay";

interface BasicInfoFormProps {
  handHistory: HandHistoryState;
  // positionsByPlayerCount は getAvailablePositions で代替できるため削除
  getAvailablePositions: () => Position[];
  adjustPlayerCount: (delta: number) => void;
  updateStack: (position: Position, value: number) => void;
  updateHeroPosition: (position: Position) => void;
  openCardSelector: (index: 0 | 1) => void; // Heroカード選択用
  onNext: () => void; // 次のステップへ進む関数
}

export default function BasicInfoForm({
  handHistory,
  getAvailablePositions,
  adjustPlayerCount,
  updateStack,
  updateHeroPosition,
  openCardSelector,
  onNext,
}: BasicInfoFormProps) {
  const isNextDisabled =
    !handHistory.heroHand[0]?.rank ||
    !handHistory.heroHand[0]?.suit ||
    !handHistory.heroHand[1]?.rank ||
    !handHistory.heroHand[1]?.suit;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">ゲーム情報</h3>

      {/* Player Count */}
      <div>
        <label className="block mb-2 text-sm font-medium">プレイヤー数</label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => adjustPlayerCount(-1)}
            className="px-3 py-1 bg-gray-700 text-white rounded-md"
            disabled={handHistory.playerCount <= 2}
          >
            -
          </button>
          <span className="text-lg font-medium">{handHistory.playerCount}</span>
          <button
            type="button"
            onClick={() => adjustPlayerCount(1)}
            className="px-3 py-1 bg-gray-700 text-white rounded-md"
            disabled={handHistory.playerCount >= 9}
          >
            +
          </button>
        </div>
      </div>

      {/* Player Stacks */}
      <div>
        <label className="block mb-2 text-sm font-medium">スタック (BB)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {handHistory.stacks.map(
            (
              stackEntry: StackEntry // 型アノテーションを追加
            ) => (
              <div key={stackEntry.position} className="flex flex-col">
                {" "}
                {/* key を index から position に変更 */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm flex items-center">
                    {stackEntry.position}
                    {stackEntry.isHero && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">
                        Hero
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold">
                    {stackEntry.stack.toFixed(1)} BB
                  </span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <span className="text-xs mr-2">10</span>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="0.1"
                      value={stackEntry.stack}
                      onChange={(e) =>
                        updateStack(
                          stackEntry.position,
                          parseFloat(e.target.value)
                        )
                      }
                      className={`w-full ${
                        stackEntry.isHero
                          ? "accent-blue-600"
                          : "accent-gray-500"
                      }`}
                    />
                    <span className="text-xs ml-2">200</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="relative w-20">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={String(stackEntry.stack)}
                        step="0.1"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            updateStack(stackEntry.position, value);
                          }
                        }}
                        className={`w-full p-1 text-right pr-7 text-sm bg-white/5 border ${
                          stackEntry.isHero
                            ? "border-blue-600"
                            : "border-gray-600"
                        } rounded-md`}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        BB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Hero Position */}
      <div>
        <label className="block mb-2 text-sm font-medium">
          Heroのポジション
        </label>
        <div className="flex flex-wrap gap-2">
          {getAvailablePositions().map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => updateHeroPosition(pos)}
              className={`px-3 py-1 rounded-md ${
                handHistory.heroPosition === pos
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Hand */}
      <div>
        <label className="block mb-2 text-sm font-medium">Heroのハンド</label>

        {/* Visual card display */}
        <div className="mb-4 flex items-center">
          <span className="mr-2">選択中:</span>
          {handHistory.heroHand[0]?.rank && handHistory.heroHand[0]?.suit ? (
            <button
              type="button"
              onClick={() => openCardSelector(0)}
              className="hover:scale-105 transition-transform"
            >
              <CardDisplay
                rank={handHistory.heroHand[0].rank}
                suit={handHistory.heroHand[0].suit}
                size="md"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openCardSelector(0)}
              className="inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 bg-gray-800 text-gray-400 h-10 w-12"
            >
              ?
            </button>
          )}

          {handHistory.heroHand[1]?.rank && handHistory.heroHand[1]?.suit ? (
            <button
              type="button"
              onClick={() => openCardSelector(1)}
              className="hover:scale-105 transition-transform"
            >
              <CardDisplay
                rank={handHistory.heroHand[1].rank}
                suit={handHistory.heroHand[1].suit}
                size="md"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openCardSelector(1)}
              className="inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 bg-gray-800 text-gray-400 h-10 w-12"
            >
              ?
            </button>
          )}
        </div>

        {/* Card selection buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => openCardSelector(0)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            カード1を選択
          </button>
          <button
            type="button"
            onClick={() => openCardSelector(1)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            カード2を選択
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isNextDisabled}
        >
          次へ
        </button>
      </div>
    </div>
  );
}
