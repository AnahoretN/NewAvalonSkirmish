/**
 * @file Renders a single game card, including its art, text, and status effects.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Card as CardType, PlayerColor, CardStatus } from '../types';
import { DeckType } from '../types';
import { DECK_THEMES, PLAYER_COLORS } from '../constants';
import { Tooltip } from './Tooltip';

/**
 * Props for the Card component.
 */
interface CardProps {
  card: CardType;
  isFaceUp: boolean;
  playerColorMap: Map<number, PlayerColor>;
  localPlayerId?: number | null;
}

const STATUS_ICONS: Record<string, string> = {
    'Aim': '/images/counters/Aim.png',
    'Exploit': '/images/counters/Exploit.png',
    'LastPlayed': '/images/counters/LastPlayed.png',
    'Revealed': '/images/counters/Revealed.png',
    'Shield': '/images/counters/Shield.png',
    'Stun': '/images/counters/Stun.png',
    'Support': '/images/counters/Support.png',
    'Threat': '/images/counters/Threat.png',
};

/**
 * Parses a single line of ability text for keywords.
 * @param {string} line - A single line of text.
 * @returns {React.ReactNodeArray} An array of React nodes with formatted text.
 */
const formatLine = (line: string) => {
    const keywords = {
        bold: ['Support', 'Threat', 'Act', 'Pas', 'Trg'],
        italic: ['Exploit', 'Aim', 'Stun', 'Shield'],
    };
    const parts = line.split(/(\s+|[.,:⇒()])/);
    return parts.map((part, index) => {
        if (!part) return null;
        const cleanedPart = part.replace(/[.,:()]/g, '');
        if (keywords.bold.includes(cleanedPart)) {
            return <strong key={index} className="text-white">{part}</strong>;
        }
        if (keywords.italic.includes(cleanedPart)) {
            return <em key={index} className="text-gray-300 not-italic font-semibold">{part}</em>;
        }
        return part;
    });
};


/**
 * Parses and formats a card's ability text, supporting keywords and newlines.
 * @param {string} ability - The raw ability string.
 * @returns {React.ReactNode} A React node with formatted text.
 */
const formatAbilityText = (ability: string) => {
    if (!ability) return '';
    return ability.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {i > 0 && <br />}
            {formatLine(line)}
        </React.Fragment>
    ));
};


/**
 * A component that displays a single card. It can render in different states:
 * face up, face down, as a counter, or with status effect overlays.
 * @param {CardProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered card.
 */
export const Card: React.FC<CardProps> = ({ card, isFaceUp, playerColorMap, localPlayerId }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef<number | null>(null);

  const [currentImageSrc, setCurrentImageSrc] = useState(card.imageUrl);

  useEffect(() => {
    // Reset image source when the card prop itself changes
    setCurrentImageSrc(card.imageUrl);
  }, [card.imageUrl]);

  const handleImageError = () => {
    // If the primary image fails, switch to the fallback.
    // Prevent an infinite loop if the fallback also fails.
    if (currentImageSrc !== card.fallbackImage) {
      setCurrentImageSrc(card.fallbackImage);
    }
  };


  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = window.setTimeout(() => {
        setTooltipVisible(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
    }
    setTooltipVisible(false);
  };
  
  const handleMouseDown = () => {
      if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
      }
      setTooltipVisible(false);
  }
  
  // Aggregate statuses by type and store the owners.
  const statusGroups = (card.statuses ?? []).reduce((acc, status) => {
    if (!acc[status.type]) {
        acc[status.type] = [];
    }
    acc[status.type].push(status.addedByPlayerId);
    return acc;
  }, {} as Record<string, number[]>);

  // Status icon sub-component for reusability
  const StatusIcon = ({ statusType }: { statusType: string }) => {
    const owners = statusGroups[statusType];
    if (!owners || owners.length === 0) return null;

    const count = owners.length;
    const statusColorName = playerColorMap.get(owners[0]); 
    const statusBg = statusColorName ? PLAYER_COLORS[statusColorName].bg : 'bg-gray-500';
    
    const iconUrl = STATUS_ICONS[statusType];
    const isSingleInstance = ['Support', 'Threat', 'Revealed', 'LastPlayed'].includes(statusType);
    const showCount = !isSingleInstance && count > 1;

    // When count is shown, icon padding is larger to make the icon smaller.
    const iconPaddingClass = showCount ? 'p-1.5' : 'p-1';

    return (
        <div
            className={`relative w-8 h-8 flex items-center justify-center ${statusBg} bg-opacity-80 rounded-sm shadow-md flex-shrink-0`}
            title={`${statusType}${!isSingleInstance && count > 0 ? ` (${count})` : ''}`}
        >
            {iconUrl ? (
                <img 
                    src={iconUrl} 
                    alt={statusType} 
                    className={`object-contain w-full h-full transition-all duration-150 ${iconPaddingClass}`}
                />
            ) : (
                <span className={`text-white font-black transition-all duration-150 ${showCount ? 'text-base' : 'text-lg'}`} style={{ textShadow: '0 0 2px black' }}>
                    {statusType.charAt(0)}
                </span>
            )}

            {showCount && (
                <span
                    className="absolute top-0 right-0.5 text-white font-bold text-xs leading-none"
                    style={{ textShadow: '1px 1px 2px black' }}
                >
                    {count}
                </span>
            )}
        </div>
    );
  };

  // Special rendering for 'counter' type cards.
  if (card.deck === 'counter') {
    return (
      <div
        title={card.name}
        className={`w-full h-full ${card.color} shadow-md`}
        style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
      ></div>
    );
  }

  // Render the card back if it's not face up.
  if (!isFaceUp) {
    const ownerColorName = card.ownerId ? playerColorMap.get(card.ownerId) : null;
    const backColorClass = ownerColorName ? PLAYER_COLORS[ownerColorName].bg : 'bg-card-back';
    const borderColorClass = ownerColorName ? PLAYER_COLORS[ownerColorName].border : 'border-blue-300';
    const lastPlayedStatus = statusGroups['LastPlayed'];

    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        className={`relative w-full h-full ${backColorClass} rounded-md shadow-md border-2 ${borderColorClass} flex-shrink-0`}
        title="Card Back"
      >
        {lastPlayedStatus && (
            <div className="absolute bottom-[3px] left-[3px] pointer-events-none">
                <StatusIcon statusType="LastPlayed" />
            </div>
        )}
      </div>
    );
  }
  
  const ownerColorName = card.ownerId ? playerColorMap.get(card.ownerId) : null;
  const themeColor = ownerColorName 
    ? PLAYER_COLORS[ownerColorName].border
    : DECK_THEMES[card.deck as keyof typeof DECK_THEMES]?.color || 'border-gray-300';
    
  const cardBg = card.deck === DeckType.Tokens ? card.color : 'bg-card-face';
  const textColor = card.deck === DeckType.Tokens ? 'text-black' : 'text-black';
  const uniqueStatusTypes = Object.keys(statusGroups);
  
  // Categorize statuses for new layout
  const positiveStatusTypesList = ['Support', 'Shield'];
  const positiveStatuses = uniqueStatusTypes.filter(s => positiveStatusTypesList.includes(s));
  const negativeStatuses = uniqueStatusTypes.filter(s => !positiveStatusTypesList.includes(s) && s !== 'LastPlayed');
  const lastPlayedStatus = uniqueStatusTypes.find(s => s === 'LastPlayed');

  // Combine positive statuses for rendering. LastPlayed goes first to appear at bottom-left.
  const combinedPositiveStatuses = lastPlayedStatus
    ? [lastPlayedStatus, ...positiveStatuses]
    : positiveStatuses;


  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        className={`relative w-full h-full ${cardBg} rounded-md shadow-md border-4 ${themeColor} ${textColor} flex-shrink-0 select-none overflow-hidden`}
      >
        {currentImageSrc ? (
          <img src={currentImageSrc} onError={handleImageError} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full p-1 flex items-center justify-center">
              <span className="text-center text-sm font-bold">
                {card.name}
              </span>
          </div>
        )}
        
        {/* Status effect overlay */}
        {isFaceUp && uniqueStatusTypes.length > 0 && (
           <>
            {/* Negative Statuses: Top-right, flowing left then down */}
            <div className="absolute top-[3px] left-[3px] right-[3px] flex flex-row-reverse flex-wrap justify-start items-start z-10 pointer-events-none">
              {negativeStatuses.map((statusType) => (
                <StatusIcon key={statusType} statusType={statusType} />
              ))}
            </div>

            {/* Positive Statuses Area: Bottom-left, flowing right then up */}
            <div className="absolute bottom-[3px] left-[3px] right-[30px] flex flex-wrap-reverse content-start items-end z-10 pointer-events-none">
                {combinedPositiveStatuses.map((statusType) => (
                    <StatusIcon key={statusType} statusType={statusType} />
                ))}
            </div>
          </>
        )}
        
        {/* Power Display */}
        {isFaceUp && card.power > 0 && (
            <div 
                className={`absolute bottom-[5px] right-[5px] w-8 h-8 rounded-full ${ownerColorName ? PLAYER_COLORS[ownerColorName].bg : 'bg-gray-600'} border-[3px] border-white flex items-center justify-center z-20 shadow-md`}
            >
                <span className="text-white font-bold text-lg leading-none" style={{ textShadow: '0 0 2px black' }}>{card.power}</span>
            </div>
        )}
      </div>

      {tooltipVisible && (isFaceUp || (!isFaceUp && localPlayerId === card.ownerId)) && (
        <Tooltip x={tooltipPos.x} y={tooltipPos.y}>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold border-b border-gray-600 pb-1">
              {card.name} - <span className="font-normal capitalize text-gray-400">{card.deck}</span>
            </h3>
            <div className="bg-gray-800 p-2 rounded">
              <p><strong className="text-indigo-400">Power:</strong> <strong>{card.power}</strong></p>
              <p className="mt-1"><strong className="text-indigo-400">Ability:</strong> <span className="text-gray-300">{formatAbilityText(card.ability)}</span></p>
            </div>
            
            {Object.keys(statusGroups).length > 0 && (
                <div className="bg-gray-800 p-2 rounded">
                    <strong className="text-indigo-400">Statuses: </strong>
                    <span className="text-gray-300">
                        {Object.entries(statusGroups)
                            .map(([type, owners]) => `${type} (x${owners.length})`)
                            .join(', ')}
                    </span>
                </div>
            )}

            {card.ownerName && (
              <p className="text-sm text-gray-500 pt-1 border-t border-gray-800 mt-1">
                Owner: {card.ownerName}
              </p>
            )}
          </div>
        </Tooltip>
      )}
    </>
  );
};