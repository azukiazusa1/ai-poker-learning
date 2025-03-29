"use client";

import { Card } from "./types";
import CardDisplay from "./CardDisplay";

interface CardSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (rank: string, suit: string) => void;
  isCardAvailable: (rank: string, suit: string) => boolean;
  currentCardType: "hero" | "flop" | "turn" | "river";
  currentCardIndex?: 0 | 1; // Only for hero
  currentFlopIndex?: 0 | 1 | 2; // Only for flop
}

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits = ["h", "d", "s", "c"];

export default function CardSelectorModal({
  isOpen,
  onClose,
  onSelectCard,
  isCardAvailable,
  currentCardType,
  currentCardIndex,
  currentFlopIndex,
}: CardSelectorModalProps) {
  if (!isOpen) return null;

  let title = "カードを選択";
  if (currentCardType === "hero" && currentCardIndex !== undefined) {
    title = `ヒーロー カード${currentCardIndex + 1}を選択`;
  } else if (currentCardType === "flop" && currentFlopIndex !== undefined) {
    title = `フロップ カード${currentFlopIndex + 1}を選択`;
  } else if (currentCardType === "turn") {
    title = "ターンカードを選択";
  } else if (currentCardType === "river") {
    title = "リバーカードを選択";
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {ranks.flatMap((rank) =>
            suits.map((suit) => {
              const available = isCardAvailable(rank, suit);
              return (
                <button
                  key={`${rank}${suit}`}
                  type="button"
                  disabled={!available}
                  onClick={() => available && onSelectCard(rank, suit)}
                  className={`${
                    available
                      ? "cursor-pointer hover:scale-110 transition-transform"
                      : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  <CardDisplay rank={rank} suit={suit} size="md" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
