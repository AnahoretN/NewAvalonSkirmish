/**
 * @file Renders a modal for a detailed view of a single card.
 */
import React, { useMemo, useState, useEffect } from 'react';
import type { Card as CardType, Player, CardStatus } from '../types';
import { PLAYER_COLORS, DECK_THEMES } from '../constants';
import { formatAbilityText } from '../utils/textFormatters';

interface CardDetailModalProps {
  card: CardType;
  ownerPlayer?: Player;
  onClose: () => void;
  statusDescriptions: Record<string, string>;
  allPlayers: Player[];
}

/**
 * A modal that displays detailed information about a card.
 * @param {CardDetailModalProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered modal.
 */
export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, ownerPlayer, onClose, statusDescriptions, allPlayers }) => {
  const [currentImageSrc, setCurrentImageSrc] = useState(card.imageUrl);

  useEffect(() => {
    setCurrentImageSrc(card.imageUrl);
  }, [card.imageUrl]);

  const handleImageError = () => {
    if (currentImageSrc !== card.fallbackImage) {
      setCurrentImageSrc(card.fallbackImage);
    }
  };
    
  const ownerColorName = ownerPlayer?.color;
  const themeColor = ownerColorName 
    ? PLAYER_COLORS[ownerColorName].border
    : DECK_THEMES[card.deck as keyof typeof DECK_THEMES]?.color || 'border-gray-300';
    
  const teamName = useMemo(() => {
    if (!ownerPlayer || ownerPlayer.teamId === undefined) return null;
    return `Team ${ownerPlayer.teamId}`;
  }, [ownerPlayer]);

  // FIX: Explicitly typed the `statusGroups` variable to ensure its type is inferred correctly
  // by `Object.entries`, resolving the "Property 'length' does not exist on type 'unknown'" error.
  const statusGroups: Record<string, number[]> = (card.statuses ?? []).reduce(
    (acc, status) => {
      if (!acc[status.type]) {
        acc[status.type] = [];
      }
      acc[status.type].push(status.addedByPlayerId);
      return acc;
    },
    {} as Record<string, number[]>
  );

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[102]">
      <div onClick={e => e.stopPropagation()} className={`bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[40rem] p-6 flex gap-6 border-4 ${themeColor}`}>
        {/* Left: Image */}
        <div className="w-1/2 h-full flex-shrink-0">
            {currentImageSrc ? (
                <img src={currentImageSrc} onError={handleImageError} alt={card.name} className="w-full h-full object-contain rounded-lg" />
            ) : (
                <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-2xl font-bold text-center p-4">{card.name}</div>
            )}
        </div>
        {/* Right: Details */}
        <div className="w-1/2 h-full flex flex-col gap-4 overflow-y-auto pr-2 text-left">
            {/* Title & Deck */}
            <div>
                <h2 className="text-4xl font-bold">{card.name}</h2>
                <p className="text-lg text-gray-400 capitalize">{card.deck} Card</p>
            </div>
            
            {/* Core Stats */}
            <div className="bg-gray-900 p-4 rounded-lg">
                <p><strong className="text-indigo-400 text-lg">Power:</strong> <span className="text-xl font-bold">{card.power}</span></p>
                <p className="mt-2"><strong className="text-indigo-400 text-lg">Ability:</strong> <span className="text-gray-200 text-base">{formatAbilityText(card.ability)}</span></p>
            </div>

            {/* Owner Info */}
            {ownerPlayer && (
                 <div className="bg-gray-900 p-4 rounded-lg text-sm">
                     <p><strong className="text-indigo-400">Owner:</strong> {ownerPlayer.name}</p>
                     {teamName && <p className="mt-1"><strong className="text-indigo-400">Team:</strong> {teamName}</p>}
                 </div>
            )}
            
            {/* Statuses */}
            {card.statuses && card.statuses.length > 0 && (
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-indigo-400 text-lg font-bold mb-2">Statuses</h3>
                    <ul className="space-y-2 text-sm">
                        {Object.entries(statusGroups).map(([type, owners]) => (
                             <li key={type}>
                                <strong className="text-gray-200">{type} (x{owners.length})</strong>
                                <p className="text-gray-400 text-xs pl-2">{statusDescriptions[type] || 'No description available.'}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Flavor Text */}
            {card.flavorText && (
                <details className="bg-gray-900 p-4 rounded-lg">
                    <summary className="cursor-pointer text-indigo-400 font-semibold">Flavor Text</summary>
                    <p className="italic text-gray-400 mt-2">{card.flavorText?.split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</p>
                </details>
            )}

            <button onClick={onClose} className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded self-end">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
