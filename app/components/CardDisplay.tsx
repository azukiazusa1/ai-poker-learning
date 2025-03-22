'use client';

import React from 'react';

interface CardProps {
  rank: string;
  suit: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CardDisplay({ rank, suit, size = 'md' }: CardProps) {
  if (!rank || !suit) return null;
  
  // Size classes
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };
  
  // Suit symbols and colors
  const suitSymbol = getSuitSymbol(suit);
  const suitColor = getSuitColor(suit);
  
  return (
    <div className={`inline-flex items-center justify-center rounded-md border border-gray-600 ${sizeClasses[size]} px-2 py-1 mx-1 bg-gray-800 font-bold ${suitColor}`}>
      {rank}{suitSymbol}
    </div>
  );
}

export function CardsDisplay({ cards, size = 'md' }: { cards: Array<{rank: string, suit: string} | null>, size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex space-x-1">
      {cards.filter(card => card !== null).map((card, index) => (
        card && <CardDisplay key={index} rank={card.rank} suit={card.suit} size={size} />
      ))}
    </div>
  );
}

// Helper functions
function getSuitSymbol(suit: string): string {
  switch(suit.toLowerCase()) {
    case 'h': return '♥'; // hearts
    case 'd': return '♦'; // diamonds
    case 's': return '♠'; // spades
    case 'c': return '♣'; // clubs
    default: return '';
  }
}

function getSuitColor(suit: string): string {
  switch(suit.toLowerCase()) {
    case 'h': 
    case 'd': 
      return 'text-red-500';
    case 's':
    case 'c':
      return 'text-white';
    default:
      return '';
  }
}