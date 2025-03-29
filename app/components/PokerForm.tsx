"use client";

import { useState } from "react";
import {
  HandHistoryState,
  Position,
  Card,
  // Action, // Removed as it's not directly used here (used in StreetActionsForm)
  ActionEntry,
  StackEntry,
  Street,
} from "./types"; // Import types
// CardDisplay is used indirectly via CardSelectorModal
import BasicInfoForm from "./BasicInfoForm";
import StreetActionsForm from "./StreetActionsForm";
import BoardCardInput from "./BoardCardInput";
import ReviewDisplay from "./ReviewDisplay";
import CardSelectorModal from "./CardSelectorModal";

// Constants used within this component
const positionsByPlayerCount: Record<number, Position[]> = {
  2: ["SB", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "CO"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "MP", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "MP+1", "HJ", "CO"],
};

export default function PokerForm({
  onAnalyze,
}: {
  onAnalyze: (handHistory: string) => void;
}) {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [cardSelectorOpen, setCardSelectorOpen] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<0 | 1>(0);
  const [currentCardType, setCurrentCardType] = useState<
    "hero" | "flop" | "turn" | "river"
  >("hero");
  const [currentFlopIndex, setCurrentFlopIndex] = useState<0 | 1 | 2>(0);

  // Initial Stacks Helper
  const getInitialStacks = (playerCount: number): StackEntry[] => {
    const positions =
      positionsByPlayerCount[playerCount] || positionsByPlayerCount[6];
    return positions.map((position) => ({
      position,
      stack: 100.0,
      isHero: position === "CO", // Default Hero position
    }));
  };

  // Hand History State
  const [handHistory, setHandHistory] = useState<HandHistoryState>({
    heroHand: [null, null],
    heroPosition: "CO",
    playerCount: 6,
    stacks: getInitialStacks(6),
    potSize: 2.5, // Initial pot: BB + SB + Ante (as per Issue #6)
    preflopActions: [],
    flopCards: [null, null, null],
    flopActions: [],
    turnCard: null,
    turnActions: [],
    riverCard: null,
    riverActions: [],
    usedCards: new Set<string>(),
  });

  // --- Helper Functions ---

  const getAvailablePositions = (): Position[] => {
    const basePositions =
      positionsByPlayerCount[handHistory.playerCount] ||
      positionsByPlayerCount[6];

    const foldedPositions = new Set<Position>();
    const allActions: ActionEntry[] = [
      ...handHistory.preflopActions,
      ...handHistory.flopActions,
      ...handHistory.turnActions,
      ...handHistory.riverActions, // Typo fixed: history -> handHistory
    ];

    allActions.forEach((action) => {
      if (action.action === "fold") {
        foldedPositions.add(action.position);
      }
    });

    return basePositions.filter((pos) => !foldedPositions.has(pos));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const formattedHistory = formatHandHistory();
    setTimeout(() => {
      onAnalyze(formattedHistory);
      // Consider resetting isLoading state here or within onAnalyze callback
      // setIsLoading(false);
    }, 500);
  };

  const formatHandHistory = (): string => {
    let history = `### 前提条件\n\n`;
    const card1 = handHistory.heroHand[0];
    const card2 = handHistory.heroHand[1];
    history += `- Hero のハンド: ${card1?.rank ?? "?"}${card1?.suit ?? ""} ${
      card2?.rank ?? "?"
    }${card2?.suit ?? ""}\n`;
    history += `- Hero のポジション: ${handHistory.heroPosition}\n`;
    history += `- プレイヤー数: ${handHistory.playerCount}\n`;
    history += `- プレイヤーのスタック:\n`;
    handHistory.stacks.forEach((stackEntry) => {
      const positionName = stackEntry.isHero
        ? `${stackEntry.position}(Hero)`
        : stackEntry.position;
      history += `  - ${positionName}: ${stackEntry.stack.toFixed(1)}BB\n`;
    });
    history += `- 現在のポットサイズ: ${handHistory.potSize.toFixed(1)}BB\n`;

    const formatActions = (street: Street, title: string) => {
      const actions = handHistory[`${street}Actions`];
      if (actions.length > 0) {
        history += `\n### ${title}\n`;
        // Pot size is already included in the board card section for flop/turn/river
        if (street === "preflop") {
          history += `- プリフロップのアクション:\n`;
        } else {
          history += `- ${title}のアクション:\n`;
        }
        actions.forEach((action) => {
          const positionName =
            action.position === handHistory.heroPosition
              ? `${action.position}(Hero)`
              : action.position;
          const amountText = action.amount
            ? ` ${action.amount.toFixed(1)}BB`
            : "";
          const actionText =
            action.action === "?" ? "分析を求める" : action.action;
          history += `  - ${positionName}: ${actionText}${amountText}\n`;
        });
      }
    };

    formatActions("preflop", "プリフロップ");

    const flop1 = handHistory.flopCards[0];
    const flop2 = handHistory.flopCards[1];
    const flop3 = handHistory.flopCards[2];
    if (flop1 || flop2 || flop3) {
      history += `\n### フロップ\n`;
      history += `- フロップのボードカード: ${flop1?.rank ?? "?"}${
        flop1?.suit ?? ""
      } ${flop2?.rank ?? "?"}${flop2?.suit ?? ""} ${flop3?.rank ?? "?"}${
        flop3?.suit ?? ""
      }\n`;
      history += `- フロップ時点のポットサイズ: ${handHistory.potSize.toFixed(
        1
      )}BB\n`; // Pot size reflects state *after* preflop actions
      formatActions("flop", "フロップ");
    }

    const turn = handHistory.turnCard;
    if (turn) {
      history += `\n### ターン\n`;
      history += `- ターンのボードカード: ${turn.rank}${turn.suit}\n`;
      history += `- ターン時点のポットサイズ: ${handHistory.potSize.toFixed(
        1
      )}BB\n`; // Pot size reflects state *after* flop actions
      formatActions("turn", "ターン");
    }

    const river = handHistory.riverCard;
    if (river) {
      history += `\n### リバー\n`;
      history += `- リバーのボードカード: ${river.rank}${river.suit}\n`;
      history += `- リバー時点のポットサイズ: ${handHistory.potSize.toFixed(
        1
      )}BB\n`; // Pot size reflects state *after* turn actions
      formatActions("river", "リバー");
    }

    return history;
  };

  // --- Pot Calculation Helper ---
  const calculatePotSize = (history: HandHistoryState): number => {
    let totalPot = 1.0 + 0.5 + 1.0; // Initial pot: BB + SB + Ante

    const allActions: ActionEntry[] = [
      ...history.preflopActions,
      ...history.flopActions,
      ...history.turnActions,
      ...history.riverActions,
    ];

    allActions.forEach((action) => {
      if (
        (action.action === "bet" ||
          action.action === "call" ||
          action.action === "raise") &&
        action.amount &&
        action.amount > 0
      ) {
        totalPot += action.amount;
      }
      // Note: 'all-in' might need specific handling depending on stack sizes,
      // but for now, assume 'amount' reflects the contributed amount.
      if (action.action === "all-in" && action.amount && action.amount > 0) {
        totalPot += action.amount;
      }
    });

    return totalPot;
  };

  // --- Card Update Handlers ---
  const updateCardState = (
    cardIdentifier:
      | { type: "hero"; index: 0 | 1 }
      | { type: "flop"; index: 0 | 1 | 2 }
      | { type: "turn" }
      | { type: "river" },
    newCard: Card | null
  ) => {
    setHandHistory((prev) => {
      const newState = { ...prev };
      const usedCards = new Set(prev.usedCards);
      let currentCard: Card | null = null;

      // Identify current card and update state structure
      if (cardIdentifier.type === "hero") {
        currentCard = newState.heroHand[cardIdentifier.index];
        newState.heroHand = [...newState.heroHand] as [
          Card | null,
          Card | null
        ];
        newState.heroHand[cardIdentifier.index] = newCard;
      } else if (cardIdentifier.type === "flop") {
        currentCard = newState.flopCards[cardIdentifier.index];
        newState.flopCards = [...newState.flopCards] as [
          Card | null,
          Card | null,
          Card | null
        ];
        newState.flopCards[cardIdentifier.index] = newCard;
      } else if (cardIdentifier.type === "turn") {
        currentCard = newState.turnCard;
        newState.turnCard = newCard;
      } else if (cardIdentifier.type === "river") {
        currentCard = newState.riverCard;
        newState.riverCard = newCard;
      }

      // Update usedCards set
      if (currentCard?.rank && currentCard?.suit) {
        usedCards.delete(`${currentCard.rank}${currentCard.suit}`);
      }
      if (newCard?.rank && newCard?.suit) {
        if (usedCards.has(`${newCard.rank}${newCard.suit}`)) {
          console.error("Error: Trying to add an already used card:", newCard);
        }
        usedCards.add(`${newCard.rank}${newCard.suit}`);
      }
      newState.usedCards = usedCards;
      return newState;
    });
  };

  // --- Action Handlers ---
  const addAction = (stage: Street, action: ActionEntry) => {
    const actionField = `${stage}Actions` as keyof HandHistoryState;
    setHandHistory((prev) => {
      const currentActions = [...(prev[actionField] as ActionEntry[])];
      const newAction = { ...action };
      if (newAction.action === "?") {
        newAction.isQuestion = true;
      } else {
        newAction.isQuestion = false;
      }
      currentActions.push(newAction);

      // Create a temporary state to pass to calculatePotSize
      const tempState = {
        ...prev,
        [actionField]: currentActions,
      };

      return {
        ...prev,
        [actionField]: currentActions,
        potSize: calculatePotSize(tempState), // Recalculate pot size
      };
    });
  };

  const removeAction = (stage: Street, index: number) => {
    const actionField = `${stage}Actions` as keyof HandHistoryState;
    setHandHistory((prev) => {
      const currentActions = [...(prev[actionField] as ActionEntry[])];
      // const removedAction = currentActions[index]; // Pot calculation doesn't need this directly
      // let potDecrement = 0; // Removed unused variable
      /* // Original decrement logic removed
      if (
        (removedAction.action === "bet" ||
          removedAction.action === "call" ||
          removedAction.action === "raise") &&
        removedAction.amount &&
        removedAction.amount > 0
      ) {
         potDecrement = removedAction.amount; // Removed unused variable assignment
      }
      */
      currentActions.splice(index, 1);

      // Create a temporary state to pass to calculatePotSize
      const tempState = {
        ...prev,
        [actionField]: currentActions,
      };

      return {
        ...prev,
        [actionField]: currentActions,
        potSize: calculatePotSize(tempState), // Recalculate pot size
      };
    });
  };

  // --- Basic Info Handlers ---
  const adjustPlayerCount = (delta: number) => {
    setHandHistory((prev) => {
      const newCount = Math.max(2, Math.min(9, prev.playerCount + delta));
      if (newCount === prev.playerCount) return prev;

      const newPositions = positionsByPlayerCount[newCount];
      const newStacks = getInitialStacks(newCount);
      const heroPosition = newPositions.includes(prev.heroPosition)
        ? prev.heroPosition
        : newPositions[newPositions.length - 1];
      const updatedStacks = newStacks.map((stack) => ({
        ...stack,
        isHero: stack.position === heroPosition,
      }));
      return {
        ...prev,
        playerCount: newCount,
        stacks: updatedStacks,
        heroPosition,
      };
    });
  };

  const updateStack = (position: Position, value: number) => {
    setHandHistory((prev) => ({
      ...prev,
      stacks: prev.stacks.map((stack) =>
        stack.position === position
          ? { ...stack, stack: Math.max(0, value) }
          : stack
      ),
    }));
  };

  const updateHeroPosition = (position: Position) => {
    setHandHistory((prev) => ({
      ...prev,
      heroPosition: position,
      stacks: prev.stacks.map((stack) => ({
        ...stack,
        isHero: stack.position === position,
      })),
    }));
  };

  // --- Card Selector Modal Handlers ---
  const openCardSelector = (index: 0 | 1) => {
    setCurrentCardIndex(index);
    setCurrentCardType("hero");
    setCardSelectorOpen(true);
  };

  const openFlopCardSelector = (index: 0 | 1 | 2) => {
    setCurrentFlopIndex(index);
    setCurrentCardType("flop");
    setCardSelectorOpen(true);
  };

  const openTurnCardSelector = () => {
    setCurrentCardType("turn");
    setCardSelectorOpen(true);
  };

  const openRiverCardSelector = () => {
    setCurrentCardType("river");
    setCardSelectorOpen(true);
  };

  const selectCard = (rank: string, suit: string) => {
    if (!isCardAvailableForModal(rank, suit)) {
      console.error("Selected card is not available:", rank, suit);
      return;
    }

    const newCard: Card = { rank, suit };
    let identifier:
      | { type: "hero"; index: 0 | 1 }
      | { type: "flop"; index: 0 | 1 | 2 }
      | { type: "turn" }
      | { type: "river" };

    if (currentCardType === "hero") {
      identifier = { type: "hero", index: currentCardIndex };
    } else if (currentCardType === "flop") {
      identifier = { type: "flop", index: currentFlopIndex };
    } else if (currentCardType === "turn") {
      identifier = { type: "turn" };
    } else {
      identifier = { type: "river" };
    }

    updateCardState(identifier, newCard);
    setCardSelectorOpen(false);
  };

  const isCardAvailableForModal = (rank: string, suit: string): boolean => {
    // const cardKey = `${rank}${suit}`; // Removed as unused
    let isUsedElsewhere = false;

    // Check Hero Hand
    [0, 1].forEach((idx) => {
      if (!(currentCardType === "hero" && currentCardIndex === idx)) {
        if (
          handHistory.heroHand[idx]?.rank === rank &&
          handHistory.heroHand[idx]?.suit === suit
        ) {
          isUsedElsewhere = true;
        }
      }
    });
    if (isUsedElsewhere) return false;

    // Check Flop Cards
    [0, 1, 2].forEach((idx) => {
      if (!(currentCardType === "flop" && currentFlopIndex === idx)) {
        if (
          handHistory.flopCards[idx]?.rank === rank &&
          handHistory.flopCards[idx]?.suit === suit
        ) {
          isUsedElsewhere = true;
        }
      }
    });
    if (isUsedElsewhere) return false;

    // Check Turn Card
    if (!(currentCardType === "turn")) {
      if (
        handHistory.turnCard?.rank === rank &&
        handHistory.turnCard?.suit === suit
      ) {
        isUsedElsewhere = true;
      }
    }
    if (isUsedElsewhere) return false;

    // Check River Card
    if (!(currentCardType === "river")) {
      if (
        handHistory.riverCard?.rank === rank &&
        handHistory.riverCard?.suit === suit
      ) {
        isUsedElsewhere = true;
      }
    }
    if (isUsedElsewhere) return false;

    return true; // Card is not used elsewhere
  };

  // --- Navigation ---
  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // --- Render Logic ---
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">ポーカーハンド解析</h2>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <button
              key={stepNum}
              type="button"
              onClick={() => {
                if (stepNum <= step) {
                  setStep(stepNum);
                }
              }}
              disabled={stepNum > step}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                stepNum === step
                  ? "bg-blue-600 text-white font-bold"
                  : stepNum < step
                  ? "bg-blue-800 text-white hover:bg-blue-700"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {stepNum}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>基本情報</span>
          <span>プリフロップ</span>
          <span>フロップ</span>
          <span>ターン</span>
          <span>リバー</span>
          <span>確認</span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg">
        {step === 1 && (
          <BasicInfoForm
            handHistory={handHistory}
            getAvailablePositions={getAvailablePositions}
            adjustPlayerCount={adjustPlayerCount}
            updateStack={updateStack}
            updateHeroPosition={updateHeroPosition}
            openCardSelector={openCardSelector}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <StreetActionsForm
            stage="preflop"
            handHistory={handHistory}
            getAvailablePositions={getAvailablePositions}
            addAction={addAction}
            removeAction={removeAction}
            onAnalyze={onAnalyze}
            formatHandHistory={formatHandHistory}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <div className="space-y-6">
            <BoardCardInput
              stage="flop"
              handHistory={handHistory}
              openFlopCardSelector={openFlopCardSelector}
            />
            <StreetActionsForm
              stage="flop"
              handHistory={handHistory}
              getAvailablePositions={getAvailablePositions}
              addAction={addAction}
              removeAction={removeAction}
              onAnalyze={onAnalyze}
              formatHandHistory={formatHandHistory}
              onNext={() => {}} // Disable internal nav
              onBack={() => {}} // Disable internal nav
            />
            {/* Flop Step Navigation */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  !handHistory.flopCards[0]?.rank ||
                  !handHistory.flopCards[0]?.suit ||
                  !handHistory.flopCards[1]?.rank ||
                  !handHistory.flopCards[1]?.suit ||
                  !handHistory.flopCards[2]?.rank ||
                  !handHistory.flopCards[2]?.suit
                }
              >
                次へ
              </button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <BoardCardInput
              stage="turn"
              handHistory={handHistory}
              openTurnCardSelector={openTurnCardSelector}
            />
            <StreetActionsForm
              stage="turn"
              handHistory={handHistory}
              getAvailablePositions={getAvailablePositions}
              addAction={addAction}
              removeAction={removeAction}
              onAnalyze={onAnalyze}
              formatHandHistory={formatHandHistory}
              onNext={() => {}} // Disable internal nav
              onBack={() => {}} // Disable internal nav
            />
            {/* Turn Step Navigation */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  !handHistory.turnCard?.rank || !handHistory.turnCard?.suit
                }
              >
                次へ
              </button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6">
            <BoardCardInput
              stage="river"
              handHistory={handHistory}
              openRiverCardSelector={openRiverCardSelector}
            />
            <StreetActionsForm
              stage="river"
              handHistory={handHistory}
              getAvailablePositions={getAvailablePositions}
              addAction={addAction}
              removeAction={removeAction}
              onAnalyze={onAnalyze}
              formatHandHistory={formatHandHistory}
              onNext={() => {}} // Disable internal nav
              onBack={() => {}} // Disable internal nav
            />
            {/* River Step Navigation */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={nextStep} // Go to Review Step
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  !handHistory.riverCard?.rank || !handHistory.riverCard?.suit
                }
              >
                確認して解析
              </button>
            </div>
          </div>
        )}
        {step === 6 && (
          <ReviewDisplay
            formattedHistory={formatHandHistory()}
            isLoading={isLoading}
            onBack={prevStep}
            onSubmit={handleSubmit}
          />
        )}
      </form>

      {/* Card Selector Modal */}
      <CardSelectorModal
        isOpen={cardSelectorOpen}
        onClose={() => setCardSelectorOpen(false)}
        onSelectCard={selectCard}
        isCardAvailable={isCardAvailableForModal}
        currentCardType={currentCardType}
        currentCardIndex={currentCardIndex}
        currentFlopIndex={currentFlopIndex}
      />
    </div>
  );
}
