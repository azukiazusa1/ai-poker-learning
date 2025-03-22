'use client';

import { useState } from 'react';

type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO';
type Card = { rank: string; suit: string };
type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | '?';

interface ActionEntry {
  position: Position;
  action: Action;
  amount?: number;
  isQuestion?: boolean;
}

interface StackEntry {
  position: Position;
  stack: number;
  isHero?: boolean;
}

interface HandHistoryState {
  heroHand: [Card | null, Card | null];
  heroPosition: Position;
  playerCount: number;
  stacks: StackEntry[];
  potSize: number;
  
  preflopActions: Array<ActionEntry>;
  
  flopCards: [Card | null, Card | null, Card | null];
  flopActions: Array<ActionEntry>;
  
  turnCard: Card | null;
  turnActions: Array<ActionEntry>;
  
  riverCard: Card | null;
  riverActions: Array<ActionEntry>;
  
  usedCards: Set<string>; // カードの重複使用を防ぐために使われたカードを追跡
}

export default function PokerForm({ onAnalyze }: { onAnalyze: (handHistory: string) => void }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  // ポジションテーブル - プレイヤー数ごとに有効なポジションを定義
  const positionsByPlayerCount: Record<number, Position[]> = {
    2: ['SB', 'BB'],
    3: ['BTN', 'SB', 'BB'],
    4: ['BTN', 'SB', 'BB', 'CO'],
    5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
    6: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
    7: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'CO'],
    8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
    9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO']
  };
  
  // プレイヤー数に応じた初期スタック配列を生成
  const getInitialStacks = (playerCount: number): StackEntry[] => {
    const positions = positionsByPlayerCount[playerCount] || positionsByPlayerCount[6];
    return positions.map(position => ({
      position,
      stack: 100,
      isHero: position === 'CO' // デフォルトではCOがHero
    }));
  };

  const [handHistory, setHandHistory] = useState<HandHistoryState>({
    heroHand: [null, null],
    heroPosition: 'CO',
    playerCount: 6,
    stacks: getInitialStacks(6),
    potSize: 0,
    
    preflopActions: [],
    
    flopCards: [null, null, null],
    flopActions: [],
    
    turnCard: null,
    turnActions: [],
    
    riverCard: null,
    riverActions: [],
    
    usedCards: new Set<string>()
  });

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['h', 'd', 's', 'c'];
  const actions: Action[] = ['fold', 'check', 'call', 'bet', 'raise', 'all-in', '?'];
  
  // 現在のプレイヤー数に応じた有効なポジションを取得
  const getAvailablePositions = (): Position[] => {
    return positionsByPlayerCount[handHistory.playerCount] || positionsByPlayerCount[6];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const formattedHistory = formatHandHistory();
    onAnalyze(formattedHistory);
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!handHistory.heroHand[0] || !handHistory.heroHand[1]) return false;
    return true;
  };

  const formatHandHistory = (): string => {
    let history = `### 前提条件\n\n`;
    
    // Hero's hand
    const card1 = handHistory.heroHand[0];
    const card2 = handHistory.heroHand[1];
    history += `- Hero のハンド: ${card1?.rank}${card1?.suit} ${card2?.rank}${card2?.suit}\n`;
    
    // Position and players
    history += `- Hero のポジション: ${handHistory.heroPosition}\n`;
    history += `- 残りのプレイヤーの数: ${handHistory.playerCount}\n`;
    
    // スタック情報をポジション名で出力
    history += `- プレイヤーのスタック:\n`;
    handHistory.stacks.forEach(stackEntry => {
      const positionName = stackEntry.isHero ? `${stackEntry.position}(Hero)` : stackEntry.position;
      history += `  - ${positionName}: ${stackEntry.stack}BB\n`;
    });
    
    history += `- 現在のポットサイズ: ${handHistory.potSize}BB\n`;
    
    // Preflop actions
    if (handHistory.preflopActions.length > 0) {
      history += `- プリフロップのアクション:\n`;
      handHistory.preflopActions.forEach(action => {
        // Heroの位置を強調表示
        const positionName = action.position === handHistory.heroPosition ? 
          `${action.position}(Hero)` : action.position;
        const amountText = action.amount ? ` ${action.amount}BB` : '';
        history += `  - ${positionName}: ${action.action}${amountText}\n`;
      });
    }
    
    // Flop
    if (handHistory.flopCards[0]) {
      const flop1 = handHistory.flopCards[0];
      const flop2 = handHistory.flopCards[1];
      const flop3 = handHistory.flopCards[2];
      
      history += `\n### フロップ\n`;
      history += `- フロップのボードカード: ${flop1.rank}${flop1.suit} ${flop2?.rank}${flop2?.suit} ${flop3?.rank}${flop3?.suit}\n`;
      history += `- フロップ時点のポットサイズ: ${handHistory.potSize}BB\n`;
      
      if (handHistory.flopActions.length > 0) {
        history += `- フロップのアクション:\n`;
        handHistory.flopActions.forEach(action => {
          // Heroの位置を強調表示
          const positionName = action.position === handHistory.heroPosition ? 
            `${action.position}(Hero)` : action.position;
          const amountText = action.amount ? ` ${action.amount}BB` : '';
          history += `  - ${positionName}: ${action.action}${amountText}\n`;
        });
      }
    }
    
    // Turn
    if (handHistory.turnCard) {
      const turn = handHistory.turnCard;
      
      history += `\n### ターン\n`;
      history += `- ターンのボードカード: ${turn.rank}${turn.suit}\n`;
      history += `- ターン時点のポットサイズ: ${handHistory.potSize}BB\n`;
      
      if (handHistory.turnActions.length > 0) {
        history += `- ターンのアクション:\n`;
        handHistory.turnActions.forEach(action => {
          // Heroの位置を強調表示
          const positionName = action.position === handHistory.heroPosition ? 
            `${action.position}(Hero)` : action.position;
          const amountText = action.amount ? ` ${action.amount}BB` : '';
          history += `  - ${positionName}: ${action.action}${amountText}\n`;
        });
      }
    }
    
    // River
    if (handHistory.riverCard) {
      const river = handHistory.riverCard;
      
      history += `\n### リバー\n`;
      history += `- リバーのボードカード: ${river.rank}${river.suit}\n`;
      history += `- リバー時点のポットサイズ: ${handHistory.potSize}BB\n`;
      
      if (handHistory.riverActions.length > 0) {
        history += `- リバーのアクション:\n`;
        handHistory.riverActions.forEach(action => {
          // Heroの位置を強調表示
          const positionName = action.position === handHistory.heroPosition ? 
            `${action.position}(Hero)` : action.position;
          const amountText = action.amount ? ` ${action.amount}BB` : '';
          history += `  - ${positionName}: ${action.action}${amountText}\n`;
        });
      }
    }
    
    return history;
  };

  // ポットサイズを計算
  const calculatePotSize = (actions: ActionEntry[]): number => {
    return actions.reduce((pot, action) => {
      if (action.action === 'bet' || action.action === 'call' || action.action === 'raise') {
        return pot + (action.amount || 0);
      }
      return pot;
    }, 0);
  };

  // カードが既に使用されているかチェック
  const isCardUsed = (rank: string, suit: string): boolean => {
    if (!rank || !suit) return false;
    
    const cardKey = `${rank}${suit}`;
    return handHistory.usedCards.has(cardKey);
  };

  // 使用可能なカードのみをフィルタリング
  const getAvailableRanks = (): string[] => {
    return ranks;
  };

  const getAvailableSuits = (selectedRank: string, cardType: 'hero' | 'flop' | 'turn' | 'river', index?: number): string[] => {
    if (!selectedRank) return suits;
    
    return suits.filter(suit => {
      // 現在編集中のカードの場合は、そのカードのスートは選択可能
      if (cardType === 'hero' && index !== undefined && 
          handHistory.heroHand[index]?.rank === selectedRank && 
          handHistory.heroHand[index]?.suit === suit) {
        return true;
      }
      
      if (cardType === 'flop' && index !== undefined && 
          handHistory.flopCards[index]?.rank === selectedRank && 
          handHistory.flopCards[index]?.suit === suit) {
        return true;
      }
      
      if (cardType === 'turn' && 
          handHistory.turnCard?.rank === selectedRank && 
          handHistory.turnCard?.suit === suit) {
        return true;
      }
      
      if (cardType === 'river' && 
          handHistory.riverCard?.rank === selectedRank && 
          handHistory.riverCard?.suit === suit) {
        return true;
      }
      
      return !isCardUsed(selectedRank, suit);
    });
  };

  const updateHeroHand = (cardIndex: 0 | 1, field: 'rank' | 'suit', value: string) => {
    const newHand = [...handHistory.heroHand] as [Card | null, Card | null];
    const currentCard = newHand[cardIndex] || { rank: '', suit: '' };
    const newCard = { ...currentCard, [field]: value };
    
    // 既存のカード情報を usedCards から削除
    if (currentCard.rank && currentCard.suit) {
      const usedCards = new Set(handHistory.usedCards);
      usedCards.delete(`${currentCard.rank}${currentCard.suit}`);
      
      // 新しいカード情報が完全な場合、usedCards に追加
      if (newCard.rank && newCard.suit) {
        usedCards.add(`${newCard.rank}${newCard.suit}`);
      }
      
      newHand[cardIndex] = newCard;
      setHandHistory({ 
        ...handHistory, 
        heroHand: newHand,
        usedCards
      });
    } else {
      // 新しいカード情報が完全な場合
      if (field === 'suit' && currentCard.rank && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${currentCard.rank}${value}`);
        
        newHand[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          heroHand: newHand,
          usedCards
        });
      } else if (field === 'rank' && currentCard.suit && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${value}${currentCard.suit}`);
        
        newHand[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          heroHand: newHand,
          usedCards
        });
      } else {
        // カード情報が不完全
        newHand[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          heroHand: newHand
        });
      }
    }
  };

  const updateFlopCard = (cardIndex: 0 | 1 | 2, field: 'rank' | 'suit', value: string) => {
    const newFlop = [...handHistory.flopCards] as [Card | null, Card | null, Card | null];
    const currentCard = newFlop[cardIndex] || { rank: '', suit: '' };
    const newCard = { ...currentCard, [field]: value };
    
    // 既存のカード情報を usedCards から削除
    if (currentCard.rank && currentCard.suit) {
      const usedCards = new Set(handHistory.usedCards);
      usedCards.delete(`${currentCard.rank}${currentCard.suit}`);
      
      // 新しいカード情報が完全な場合、usedCards に追加
      if (newCard.rank && newCard.suit) {
        usedCards.add(`${newCard.rank}${newCard.suit}`);
      }
      
      newFlop[cardIndex] = newCard;
      setHandHistory({ 
        ...handHistory, 
        flopCards: newFlop,
        usedCards
      });
    } else {
      // 新しいカード情報が完全な場合
      if (field === 'suit' && currentCard.rank && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${currentCard.rank}${value}`);
        
        newFlop[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          flopCards: newFlop,
          usedCards
        });
      } else if (field === 'rank' && currentCard.suit && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${value}${currentCard.suit}`);
        
        newFlop[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          flopCards: newFlop,
          usedCards
        });
      } else {
        // カード情報が不完全
        newFlop[cardIndex] = newCard;
        setHandHistory({ 
          ...handHistory, 
          flopCards: newFlop
        });
      }
    }
  };

  const updateTurnCard = (field: 'rank' | 'suit', value: string) => {
    const currentCard = handHistory.turnCard || { rank: '', suit: '' };
    const newCard = { ...currentCard, [field]: value };
    
    // 既存のカード情報を usedCards から削除
    if (currentCard.rank && currentCard.suit) {
      const usedCards = new Set(handHistory.usedCards);
      usedCards.delete(`${currentCard.rank}${currentCard.suit}`);
      
      // 新しいカード情報が完全な場合、usedCards に追加
      if (newCard.rank && newCard.suit) {
        usedCards.add(`${newCard.rank}${newCard.suit}`);
      }
      
      setHandHistory({
        ...handHistory,
        turnCard: newCard,
        usedCards
      });
    } else {
      // 新しいカード情報が完全な場合
      if (field === 'suit' && currentCard.rank && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${currentCard.rank}${value}`);
        
        setHandHistory({
          ...handHistory,
          turnCard: newCard,
          usedCards
        });
      } else if (field === 'rank' && currentCard.suit && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${value}${currentCard.suit}`);
        
        setHandHistory({
          ...handHistory,
          turnCard: newCard,
          usedCards
        });
      } else {
        // カード情報が不完全
        setHandHistory({
          ...handHistory,
          turnCard: newCard
        });
      }
    }
  };

  const updateRiverCard = (field: 'rank' | 'suit', value: string) => {
    const currentCard = handHistory.riverCard || { rank: '', suit: '' };
    const newCard = { ...currentCard, [field]: value };
    
    // 既存のカード情報を usedCards から削除
    if (currentCard.rank && currentCard.suit) {
      const usedCards = new Set(handHistory.usedCards);
      usedCards.delete(`${currentCard.rank}${currentCard.suit}`);
      
      // 新しいカード情報が完全な場合、usedCards に追加
      if (newCard.rank && newCard.suit) {
        usedCards.add(`${newCard.rank}${newCard.suit}`);
      }
      
      setHandHistory({
        ...handHistory,
        riverCard: newCard,
        usedCards
      });
    } else {
      // 新しいカード情報が完全な場合
      if (field === 'suit' && currentCard.rank && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${currentCard.rank}${value}`);
        
        setHandHistory({
          ...handHistory,
          riverCard: newCard,
          usedCards
        });
      } else if (field === 'rank' && currentCard.suit && value) {
        const usedCards = new Set(handHistory.usedCards);
        usedCards.add(`${value}${currentCard.suit}`);
        
        setHandHistory({
          ...handHistory,
          riverCard: newCard,
          usedCards
        });
      } else {
        // カード情報が不完全
        setHandHistory({
          ...handHistory,
          riverCard: newCard
        });
      }
    }
  };

  const addAction = (stage: 'preflop' | 'flop' | 'turn' | 'river', action: { position: Position, action: Action, amount?: number, isQuestion?: boolean }) => {
    const actionField = `${stage}Actions`;
    const currentActions = [...(handHistory as any)[actionField]];
    
    // 「?」アクションの場合
    if (action.action === '?') {
      action.isQuestion = true;
    }
    
    currentActions.push(action);
    
    // ポットサイズを更新
    let potIncrement = 0;
    if ((action.action === 'bet' || action.action === 'call' || action.action === 'raise') && action.amount) {
      potIncrement = action.amount;
    }
    
    const newState = {
      ...handHistory,
      [actionField]: currentActions,
      potSize: handHistory.potSize + potIncrement
    };
    
    setHandHistory(newState);
    
    // 「?」アクションの場合はすぐに解析実行 - 状態更新後に実行するため setTimeout を使用
    if (action.action === '?') {
      // 次のティックで実行することで、ステート更新が完了することを保証
      // また、最新のハンド履歴を再取得する
      setTimeout(() => {
        // 最新の状態でフォーマット
        const formattedHistory = formatHandHistory();
        onAnalyze(formattedHistory);
        
        // 解析中の状態を視覚的に示す
        // UIが早すぎると解析が始まった感じがしないため、短いディレイを追加
        setTimeout(() => {
          document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }, 10);
    }
  };

  const removeAction = (stage: 'preflop' | 'flop' | 'turn' | 'river', index: number) => {
    const actionField = `${stage}Actions`;
    const currentActions = [...(handHistory as any)[actionField]];
    
    // 削除するアクションがポットサイズに影響する場合、ポットサイズを減少
    const removedAction = currentActions[index];
    let potDecrement = 0;
    if ((removedAction.action === 'bet' || removedAction.action === 'call' || removedAction.action === 'raise') && removedAction.amount) {
      potDecrement = removedAction.amount;
    }
    
    currentActions.splice(index, 1);
    
    setHandHistory({
      ...handHistory,
      [actionField]: currentActions,
      potSize: Math.max(0, handHistory.potSize - potDecrement) // ポットサイズが負にならないよう保証
    });
  };

  const adjustPlayerCount = (delta: number) => {
    const newCount = Math.max(2, Math.min(9, handHistory.playerCount + delta));
    
    // プレイヤー数に合わせたポジションとスタックを再構成
    const newPositions = positionsByPlayerCount[newCount];
    const newStacks = getInitialStacks(newCount);
    
    // Heroのポジションが新しいポジション一覧に含まれているか確認
    const heroPosition = newPositions.includes(handHistory.heroPosition) 
      ? handHistory.heroPosition 
      : newPositions[newPositions.length - 1]; // デフォルトは最後のポジション
    
    // スタックにHeroを設定
    const updatedStacks = newStacks.map(stack => ({
      ...stack,
      isHero: stack.position === heroPosition
    }));
    
    setHandHistory({
      ...handHistory,
      playerCount: newCount,
      stacks: updatedStacks,
      heroPosition
    });
  };

  const updateStack = (position: Position, value: number) => {
    const newStacks = handHistory.stacks.map(stack => 
      stack.position === position 
        ? { ...stack, stack: value } 
        : stack
    );
    
    setHandHistory({
      ...handHistory,
      stacks: newStacks
    });
  };
  
  // Heroのポジションを更新
  const updateHeroPosition = (position: Position) => {
    // 新しいスタック配列を作成し、Hero位置を更新
    const newStacks = handHistory.stacks.map(stack => ({
      ...stack,
      isHero: stack.position === position
    }));
    
    setHandHistory({
      ...handHistory,
      heroPosition: position,
      stacks: newStacks
    });
  };

  // Step 1: Basic Info
  const renderBasicInfoStep = () => (
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
          {handHistory.stacks.map((stackEntry, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center">
                  {stackEntry.position}
                  {stackEntry.isHero && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">Hero</span>
                  )}
                </span>
                <span className="text-sm font-semibold">{stackEntry.stack} BB</span>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <span className="text-xs mr-2">10</span>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="1"
                    value={stackEntry.stack}
                    onChange={(e) => updateStack(stackEntry.position, parseInt(e.target.value))}
                    className={`w-full ${stackEntry.isHero ? 'accent-blue-600' : 'accent-gray-500'}`}
                  />
                  <span className="text-xs ml-2">200</span>
                </div>
                <div className="flex items-center justify-end">
                  <div className="relative w-20">
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={stackEntry.stack}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updateStack(stackEntry.position, value);
                        }
                      }}
                      className={`w-full p-1 text-right pr-7 text-sm bg-white/5 border ${stackEntry.isHero ? 'border-blue-600' : 'border-gray-600'} rounded-md`}
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">BB</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hero Position */}
      <div>
        <label className="block mb-2 text-sm font-medium">Heroのポジション</label>
        <div className="flex flex-wrap gap-2">
          {getAvailablePositions().map(pos => (
            <button
              key={pos}
              type="button"
              onClick={() => updateHeroPosition(pos)}
              className={`px-3 py-1 rounded-md ${
                handHistory.heroPosition === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
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
        {handHistory.heroHand[0]?.rank && handHistory.heroHand[0]?.suit && 
         handHistory.heroHand[1]?.rank && handHistory.heroHand[1]?.suit && (
          <div className="mb-4 flex items-center">
            <span className="mr-2">選択中:</span>
            <div className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 bg-gray-800 font-bold ${handHistory.heroHand[0]?.suit === 'h' || handHistory.heroHand[0]?.suit === 'd' ? 'text-red-500' : 'text-white'}`}>
              {handHistory.heroHand[0]?.rank}
              {handHistory.heroHand[0]?.suit === 'h' ? '♥' : 
               handHistory.heroHand[0]?.suit === 'd' ? '♦' : 
               handHistory.heroHand[0]?.suit === 's' ? '♠' : '♣'}
            </div>
            <div className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 bg-gray-800 font-bold ${handHistory.heroHand[1]?.suit === 'h' || handHistory.heroHand[1]?.suit === 'd' ? 'text-red-500' : 'text-white'}`}>
              {handHistory.heroHand[1]?.rank}
              {handHistory.heroHand[1]?.suit === 'h' ? '♥' : 
               handHistory.heroHand[1]?.suit === 'd' ? '♦' : 
               handHistory.heroHand[1]?.suit === 's' ? '♠' : '♣'}
            </div>
          </div>
        )}
        
        {/* Card selection */}
        <div className="flex space-x-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <label className="block text-xs">カード {index + 1}</label>
              <div className="flex space-x-2">
                <select
                  value={handHistory.heroHand[index]?.rank || ''}
                  onChange={(e) => updateHeroHand(index as 0 | 1, 'rank', e.target.value)}
                  className="p-2 bg-white/5 border border-gray-600 rounded-md"
                >
                  <option value="">ランク</option>
                  {getAvailableRanks().map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                <select
                  value={handHistory.heroHand[index]?.suit || ''}
                  onChange={(e) => updateHeroHand(index as 0 | 1, 'suit', e.target.value)}
                  className="p-2 bg-white/5 border border-gray-600 rounded-md"
                  disabled={!handHistory.heroHand[index]?.rank}
                >
                  <option value="">スート</option>
                  {getAvailableSuits(handHistory.heroHand[index]?.rank || '', 'hero', index as 0 | 1).map(suit => (
                    <option key={suit} value={suit}>{suit}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!handHistory.heroHand[0]?.rank || !handHistory.heroHand[0]?.suit || 
                   !handHistory.heroHand[1]?.rank || !handHistory.heroHand[1]?.suit}
        >
          次へ
        </button>
      </div>
    </div>
  );

  // Action Input Component
  const ActionInputComponent = ({ stage }: { stage: 'preflop' | 'flop' | 'turn' | 'river' }) => {
    const [newAction, setNewAction] = useState<{
      position: Position,
      action: Action,
      amount?: number,
      isQuestion?: boolean
    }>({
      position: handHistory.heroPosition,
      action: 'check',
      amount: undefined
    });

    const needsAmount = ['bet', 'raise', 'call'].includes(newAction.action);
    const isQuestion = newAction.action === '?';

    return (
      <div className="space-y-4 border border-gray-700 rounded-md p-4 mt-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">新しいアクション</h4>
          <div className="text-sm bg-blue-900 px-3 py-1 rounded-md">
            現在のポット: <span className="font-bold">{handHistory.potSize}BB</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1">ポジション</label>
            <select
              value={newAction.position}
              onChange={(e) => setNewAction({...newAction, position: e.target.value as Position})}
              className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
            >
              {getAvailablePositions().map(pos => (
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
              onChange={(e) => setNewAction({...newAction, action: e.target.value as Action})}
              className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
            >
              {actions.map(action => (
                <option key={action} value={action}>{action === '?' ? '? (解析)' : action}</option>
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
                value={newAction.amount || ''}
                onChange={(e) => setNewAction({...newAction, amount: parseFloat(e.target.value) || undefined})}
                className="w-full p-2 bg-white/5 border border-gray-600 rounded-md"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              addAction(stage, newAction);
              // Heroのポジションを保持したまま新しいアクションをセット
              setNewAction({
                position: handHistory.heroPosition,
                action: 'check',
                amount: undefined
              });
            }}
            className={`px-3 py-1 ${isQuestion ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md`}
            disabled={needsAmount && !newAction.amount}
          >
            {isQuestion ? '解析する' : '追加'}
          </button>
          
          {isQuestion && (
            <div className="text-yellow-400 text-sm italic">
              「?」を追加すると、この時点での最適なアクションを解析します
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step 2: Preflop
  const renderPreflopStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">プリフロップ</h3>
      
      <div>
        <label className="block mb-2 text-sm font-medium">プリフロップのアクション</label>
        
        {handHistory.preflopActions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {handHistory.preflopActions.map((action, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded-md ${action.action === '?' ? 'bg-green-900' : action.position === handHistory.heroPosition ? 'bg-blue-900' : 'bg-gray-800'}`}>
                <span>
                  {action.position === handHistory.heroPosition ? `${action.position} (Hero)` : action.position}: {action.action === '?' ? '分析を求める' : action.action}
                  {action.amount !== undefined ? ` ${action.amount}BB` : ''}
                </span>
                <button 
                  type="button"
                  onClick={() => removeAction('preflop', index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-4">アクションが記録されていません。</p>
        )}
        
        <ActionInputComponent stage="preflop" />
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          次へ
        </button>
      </div>
    </div>
  );

  // Step 3: Flop
  const renderFlopStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">フロップ</h3>
      
      {/* Flop Cards */}
      <div>
        <label className="block mb-2 text-sm font-medium">フロップカード</label>
        
        {/* Visual card display */}
        {handHistory.flopCards[0]?.rank && handHistory.flopCards[0]?.suit && 
         handHistory.flopCards[1]?.rank && handHistory.flopCards[1]?.suit &&
         handHistory.flopCards[2]?.rank && handHistory.flopCards[2]?.suit && (
          <div className="mb-4 flex items-center flex-wrap">
            <span className="mr-2">ボード:</span>
            {handHistory.flopCards.map((card, idx) => (
              card && (
                <div key={idx} className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${card.suit === 'h' || card.suit === 'd' ? 'text-red-500' : 'text-white'}`}>
                  {card.rank}
                  {card.suit === 'h' ? '♥' : 
                  card.suit === 'd' ? '♦' : 
                  card.suit === 's' ? '♠' : '♣'}
                </div>
              )
            ))}
          </div>
        )}
        
        {/* Card selection */}
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="block text-xs">カード {index + 1}</label>
              <div className="flex space-x-2">
                <select
                  value={handHistory.flopCards[index]?.rank || ''}
                  onChange={(e) => updateFlopCard(index as 0 | 1 | 2, 'rank', e.target.value)}
                  className="p-2 bg-white/5 border border-gray-600 rounded-md"
                >
                  <option value="">ランク</option>
                  {getAvailableRanks().map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                <select
                  value={handHistory.flopCards[index]?.suit || ''}
                  onChange={(e) => updateFlopCard(index as 0 | 1 | 2, 'suit', e.target.value)}
                  className="p-2 bg-white/5 border border-gray-600 rounded-md"
                  disabled={!handHistory.flopCards[index]?.rank}
                >
                  <option value="">スート</option>
                  {getAvailableSuits(handHistory.flopCards[index]?.rank || '', 'flop', index as 0 | 1 | 2).map(suit => (
                    <option key={suit} value={suit}>{suit}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Flop Actions */}
      <div>
        <label className="block mb-2 text-sm font-medium">フロップのアクション</label>
        
        {handHistory.flopActions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {handHistory.flopActions.map((action, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded-md ${action.action === '?' ? 'bg-green-900' : action.position === handHistory.heroPosition ? 'bg-blue-900' : 'bg-gray-800'}`}>
                <span>
                  {action.position === handHistory.heroPosition ? `${action.position} (Hero)` : action.position}: {action.action === '?' ? '分析を求める' : action.action}
                  {action.amount !== undefined ? ` ${action.amount}BB` : ''}
                </span>
                <button 
                  type="button"
                  onClick={() => removeAction('flop', index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-4">アクションが記録されていません。</p>
        )}
        
        <ActionInputComponent stage="flop" />
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!handHistory.flopCards[0]?.rank || !handHistory.flopCards[0]?.suit || 
                  !handHistory.flopCards[1]?.rank || !handHistory.flopCards[1]?.suit ||
                  !handHistory.flopCards[2]?.rank || !handHistory.flopCards[2]?.suit}
        >
          次へ
        </button>
      </div>
    </div>
  );

  // Step 4: Turn
  const renderTurnStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">ターン</h3>
      
      {/* Turn Card */}
      <div>
        <label className="block mb-2 text-sm font-medium">ターンカード</label>
        
        {/* Visual card display */}
        {handHistory.turnCard?.rank && handHistory.turnCard?.suit && (
          <div className="mb-4 flex items-center flex-wrap">
            <span className="mr-2">ターン:</span>
            <div className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${handHistory.turnCard.suit === 'h' || handHistory.turnCard.suit === 'd' ? 'text-red-500' : 'text-white'}`}>
              {handHistory.turnCard.rank}
              {handHistory.turnCard.suit === 'h' ? '♥' : 
               handHistory.turnCard.suit === 'd' ? '♦' : 
               handHistory.turnCard.suit === 's' ? '♠' : '♣'}
            </div>
          </div>
        )}
        
        {/* Card selection */}
        <div className="flex space-x-2">
          <select
            value={handHistory.turnCard?.rank || ''}
            onChange={(e) => updateTurnCard('rank', e.target.value)}
            className="p-2 bg-white/5 border border-gray-600 rounded-md"
          >
            <option value="">ランク</option>
            {getAvailableRanks().map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
          <select
            value={handHistory.turnCard?.suit || ''}
            onChange={(e) => updateTurnCard('suit', e.target.value)}
            className="p-2 bg-white/5 border border-gray-600 rounded-md"
            disabled={!handHistory.turnCard?.rank}
          >
            <option value="">スート</option>
            {getAvailableSuits(handHistory.turnCard?.rank || '', 'turn').map(suit => (
              <option key={suit} value={suit}>{suit}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Turn Actions */}
      <div>
        <label className="block mb-2 text-sm font-medium">ターンのアクション</label>
        
        {handHistory.turnActions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {handHistory.turnActions.map((action, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded-md ${action.action === '?' ? 'bg-green-900' : action.position === handHistory.heroPosition ? 'bg-blue-900' : 'bg-gray-800'}`}>
                <span>
                  {action.position === handHistory.heroPosition ? `${action.position} (Hero)` : action.position}: {action.action === '?' ? '分析を求める' : action.action}
                  {action.amount !== undefined ? ` ${action.amount}BB` : ''}
                </span>
                <button 
                  type="button"
                  onClick={() => removeAction('turn', index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-4">アクションが記録されていません。</p>
        )}
        
        <ActionInputComponent stage="turn" />
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={() => setStep(5)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!handHistory.turnCard?.rank || !handHistory.turnCard?.suit}
        >
          次へ
        </button>
      </div>
    </div>
  );

  // Step 5: River
  const renderRiverStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">リバー</h3>
      
      {/* River Card */}
      <div>
        <label className="block mb-2 text-sm font-medium">リバーカード</label>
        
        {/* Visual card display */}
        {handHistory.riverCard?.rank && handHistory.riverCard?.suit && (
          <div className="mb-4 flex items-center flex-wrap">
            <span className="mr-2">リバー:</span>
            <div className={`inline-flex items-center justify-center rounded-md border border-gray-600 text-2xl px-2 py-1 mx-1 mb-2 bg-gray-800 font-bold ${handHistory.riverCard.suit === 'h' || handHistory.riverCard.suit === 'd' ? 'text-red-500' : 'text-white'}`}>
              {handHistory.riverCard.rank}
              {handHistory.riverCard.suit === 'h' ? '♥' : 
               handHistory.riverCard.suit === 'd' ? '♦' : 
               handHistory.riverCard.suit === 's' ? '♠' : '♣'}
            </div>
          </div>
        )}
        
        {/* Card selection */}
        <div className="flex space-x-2">
          <select
            value={handHistory.riverCard?.rank || ''}
            onChange={(e) => updateRiverCard('rank', e.target.value)}
            className="p-2 bg-white/5 border border-gray-600 rounded-md"
          >
            <option value="">ランク</option>
            {getAvailableRanks().map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
          <select
            value={handHistory.riverCard?.suit || ''}
            onChange={(e) => updateRiverCard('suit', e.target.value)}
            className="p-2 bg-white/5 border border-gray-600 rounded-md"
            disabled={!handHistory.riverCard?.rank}
          >
            <option value="">スート</option>
            {getAvailableSuits(handHistory.riverCard?.rank || '', 'river').map(suit => (
              <option key={suit} value={suit}>{suit}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* River Actions */}
      <div>
        <label className="block mb-2 text-sm font-medium">リバーのアクション</label>
        
        {handHistory.riverActions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {handHistory.riverActions.map((action, index) => (
              <div key={index} className={`flex items-center justify-between p-2 rounded-md ${action.action === '?' ? 'bg-green-900' : action.position === handHistory.heroPosition ? 'bg-blue-900' : 'bg-gray-800'}`}>
                <span>
                  {action.position === handHistory.heroPosition ? `${action.position} (Hero)` : action.position}: {action.action === '?' ? '分析を求める' : action.action}
                  {action.amount !== undefined ? ` ${action.amount}BB` : ''}
                </span>
                <button 
                  type="button"
                  onClick={() => removeAction('river', index)}
                  className="text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))})
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-4">アクションが記録されていません。</p>
        )}
        
        <ActionInputComponent stage="river" />
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(4)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={() => setStep(6)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!handHistory.riverCard?.rank || !handHistory.riverCard?.suit}
        >
          確認して解析
        </button>
      </div>
    </div>
  );

  // Step 6: Review and Submit
  const renderReviewStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">確認と解析</h3>
      
      <div className="bg-gray-800 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
        {formatHandHistory()}
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(5)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800"
        >
          {isLoading ? '解析中...' : 'ハンド解析する'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">ポーカーハンド解析</h2>
      
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <button
              key={stepNum}
              type="button"
              onClick={() => {
                if (stepNum <= step) {
                  setStep(stepNum)
                }
              }}
              disabled={stepNum > step}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                stepNum === step
                  ? 'bg-blue-600 text-white'
                  : stepNum < step
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-700 text-white opacity-50'
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
      
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg">
        {step === 1 && renderBasicInfoStep()}
        {step === 2 && renderPreflopStep()}
        {step === 3 && renderFlopStep()}
        {step === 4 && renderTurnStep()}
        {step === 5 && renderRiverStep()}
        {step === 6 && renderReviewStep()}
      </form>
    </div>
  );
}