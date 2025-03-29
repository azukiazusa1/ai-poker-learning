"use client";

import { HandHistoryState, Card } from "./types";
import CardDisplay from "./CardDisplay";

interface BoardCardInputProps {
  stage: "flop" | "turn" | "river";
  handHistory: HandHistoryState;
  openFlopCardSelector?: (index: 0 | 1 | 2) => void;
  openTurnCardSelector?: () => void;
  openRiverCardSelector?: () => void;
}

export default function BoardCardInput({
  stage,
  handHistory,
  openFlopCardSelector,
  openTurnCardSelector,
  openRiverCardSelector,
}: BoardCardInputProps) {
  const renderFlopInput = () => (
    <div>
      <label className="block mb-2 text-sm font-medium">フロップカード</label>
      {/* Visual card display */}
      {handHistory.flopCards[0]?.rank &&
        handHistory.flopCards[0]?.suit &&
        handHistory.flopCards[1]?.rank &&
        handHistory.flopCards[1]?.suit &&
        handHistory.flopCards[2]?.rank &&
        handHistory.flopCards[2]?.suit && (
          <div className="mb-4 flex items-center flex-wrap">
            <span className="mr-2">ボード:</span>
            {handHistory.flopCards.map(
              (card, idx) =>
                card && (
                  <div
                    key={idx}
                    className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${
                      card.suit === "h" || card.suit === "d"
                        ? "text-red-500"
                        : "text-white"
                    }`}
                  >
                    {card.rank}
                    {card.suit === "h"
                      ? "♥"
                      : card.suit === "d"
                      ? "♦"
                      : card.suit === "s"
                      ? "♠"
                      : "♣"}
                  </div>
                )
            )}
          </div>
        )}

      {/* Card selection */}
      <div className="flex flex-wrap gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <label className="block text-xs">カード {index + 1}</label>
            <div>
              {handHistory.flopCards[index]?.rank &&
              handHistory.flopCards[index]?.suit ? (
                <button
                  type="button"
                  onClick={() => openFlopCardSelector?.(index as 0 | 1 | 2)}
                  className="hover:scale-105 transition-transform"
                >
                  <CardDisplay
                    rank={handHistory.flopCards[index]!.rank}
                    suit={handHistory.flopCards[index]!.suit}
                    size="md"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openFlopCardSelector?.(index as 0 | 1 | 2)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-4 py-2 mx-1 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors h-10 w-16"
                >
                  選択
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTurnInput = () => (
    <div>
      <label className="block mb-2 text-sm font-medium">ターンカード</label>
      {/* Visual card display */}
      {handHistory.turnCard?.rank && handHistory.turnCard?.suit && (
        <div className="mb-4 flex items-center flex-wrap">
          <span className="mr-2">ターン:</span>
          <div
            className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${
              handHistory.turnCard.suit === "h" ||
              handHistory.turnCard.suit === "d"
                ? "text-red-500"
                : "text-white"
            }`}
          >
            {handHistory.turnCard.rank}
            {handHistory.turnCard.suit === "h"
              ? "♥"
              : handHistory.turnCard.suit === "d"
              ? "♦"
              : handHistory.turnCard.suit === "s"
              ? "♠"
              : "♣"}
          </div>
        </div>
      )}

      {/* Card selection */}
      <div>
        {handHistory.turnCard?.rank && handHistory.turnCard?.suit ? (
          <button
            type="button"
            onClick={openTurnCardSelector}
            className="hover:scale-105 transition-transform"
          >
            <CardDisplay
              rank={handHistory.turnCard.rank}
              suit={handHistory.turnCard.suit}
              size="md"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={openTurnCardSelector}
            className="inline-flex items-center justify-center rounded-md border border-gray-600 text-lg px-4 py-2 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
          >
            ターンカードを選択
          </button>
        )}
      </div>
    </div>
  );

  const renderRiverInput = () => (
    <div>
      <label className="block mb-2 text-sm font-medium">リバーカード</label>
      {/* Visual card display */}
      {handHistory.riverCard?.rank && handHistory.riverCard?.suit && (
        <div className="mb-4 flex items-center flex-wrap">
          <span className="mr-2">リバー:</span>
          <div
            className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${
              handHistory.riverCard.suit === "h" ||
              handHistory.riverCard.suit === "d"
                ? "text-red-500"
                : "text-white"
            }`}
          >
            {handHistory.riverCard.rank}
            {handHistory.riverCard.suit === "h"
              ? "♥"
              : handHistory.riverCard.suit === "d"
              ? "♦"
              : handHistory.riverCard.suit === "s"
              ? "♠"
              : "♣"}
          </div>
        </div>
      )}

      {/* Card selection */}
      <div>
        {handHistory.riverCard?.rank && handHistory.riverCard?.suit ? (
          <button
            type="button"
            onClick={openRiverCardSelector}
            className="hover:scale-105 transition-transform"
          >
            <CardDisplay
              rank={handHistory.riverCard.rank}
              suit={handHistory.riverCard.suit}
              size="md"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={openRiverCardSelector}
            className="inline-flex items-center justify-center rounded-md border border-gray-600 text-lg px-4 py-2 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
          >
            リバーカードを選択
          </button>
        )}
      </div>
    </div>
  );

  switch (stage) {
    case "flop":
      return renderFlopInput();
    case "turn":
      return renderTurnInput();
    case "river":
      return renderRiverInput();
    default:
      return null;
  }
}
