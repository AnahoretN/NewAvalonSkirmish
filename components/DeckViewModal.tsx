/**
 * @file Renders a modal to view the contents of a player's discard pile or deck.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Player, Card as CardType, DragItem, PlayerColor } from '../types';
import { Card } from './Card';

/**
 * Props for the DeckViewModal component.
 */
interface DeckViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  player: Player;
  cards: CardType[];
  setDraggedItem: (item: DragItem | null) => void;
  onCardContextMenu?: (e: React.MouseEvent, cardIndex: number) => void;
  onCardDoubleClick?: (cardIndex: number) => void;
  onCardClick?: (cardIndex: number) => void;
  canInteract: boolean;
  isDeckView?: boolean; // If true, the source of dragged cards is 'deck' instead of 'discard'.
  playerColorMap: Map<number, PlayerColor>;
  localPlayerId: number | null;
  imageRefreshVersion?: number;
  highlightFilter?: (card: CardType) => boolean; // Optional filter to highlight certain cards (e.g. Units)
}

/**
 * A reusable modal component for displaying a collection of cards,
 * such as a player's discard pile or their deck.
 * @param {DeckViewModalProps} props The properties for the component.
 * @returns {React.ReactElement | null} The rendered modal or null if not open.
 */
export const DeckViewModal: React.FC<DeckViewModalProps> = ({ isOpen, onClose, title, player, cards, setDraggedItem, onCardContextMenu, onCardDoubleClick, onCardClick, canInteract, isDeckView = false, playerColorMap, localPlayerId, imageRefreshVersion, highlightFilter }) => {
  // State to track the ID of the card being dragged from the modal, for visual feedback.
  // Using ID is more robust than Index, preventing visibility bugs when lists change.
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset dragged state whenever the modal opens to prevent stuck invisible cards
  useEffect(() => {
      if (isOpen) {
          setDraggedCardId(null);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Handles the drag leave event on the modal itself.
   * This is a UX feature to close the modal if the user drags a card out of it.
   * @param {React.DragEvent} e The drag event.
   */
  const handleDragLeave = (e: React.DragEvent) => {
    // Only close if we are actually dragging a card from THIS modal
    if (draggedCardId !== null && modalRef.current && !modalRef.current.contains(e.relatedTarget as Node)) {
      onClose();
    }
  };
  
  const rowCount = Math.ceil(cards.length / 5);
  const shouldScroll = rowCount > 5;
  // Calculate height for 5 rows of cards (h-28 = 7rem) with gaps (gap-2 = 0.5rem) and padding (p-2 = 0.5rem * 2)
  const heightFor5Rows = `calc(5 * 7rem + 4 * 0.5rem + 1rem)`;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 pointer-events-auto" 
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()} // Block browser context menu on background
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onDragLeave={handleDragLeave}
        className="bg-gray-800 rounded-lg p-4 shadow-xl w-auto max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm">
                Close
            </button>
        </div>
        <div 
            className={`bg-gray-900 rounded p-2 ${shouldScroll ? 'overflow-y-auto' : ''}`}
            style={shouldScroll ? { height: heightFor5Rows } : {}}
        >
          <div className="grid grid-cols-5 gap-2">
            {cards.map((card, index) => {
               const isMatchingFilter = highlightFilter ? highlightFilter(card) : true;
               const isHighlighted = isMatchingFilter;
               const isBeingDragged = draggedCardId === card.id;
               const isInteractive = canInteract && isMatchingFilter;
               
               // Use opacity instead of visibility:hidden to ensure the element always takes up space 
               // and is visible if state glitches.
               // Dim cards that don't match the filter.
               const opacity = isBeingDragged ? 0.3 : (isMatchingFilter ? 1 : 0.3);

               return (
               <div
                key={card.id} // Use stable ID as key
                style={{ opacity }}
                draggable={isInteractive}
                onDragStart={() => {
                  if (isInteractive) {
                    setDraggedCardId(card.id);
                    setDraggedItem({
                      card,
                      source: isDeckView ? 'deck' : 'discard',
                      playerId: player.id,
                      cardIndex: index // Index is still needed for logic, but UI state tracks ID
                    });
                  }
                }}
                onDragEnd={() => {
                  setDraggedCardId(null);
                  setDraggedItem(null);
                }}
                onContextMenu={(e) => {
                    e.preventDefault(); // Stop browser context menu
                    e.stopPropagation();
                    // Allow context menu even if not interactive (e.g. to View dimmed cards)
                    if (onCardContextMenu) {
                        onCardContextMenu(e, index);
                    }
                }}
                onClick={() => isInteractive && onCardClick?.(index)}
                onDoubleClick={() => isInteractive && onCardDoubleClick?.(index)}
                data-interactive={isInteractive}
                className={`w-28 h-28 relative ${isInteractive ? 'cursor-grab' : 'cursor-default'}`}
              >
                <div className={`w-full h-full ${isHighlighted && highlightFilter ? 'ring-4 ring-cyan-400 rounded-md shadow-[0_0_15px_#22d3ee]' : ''}`}>
                    <Card
                        card={card}
                        isFaceUp={true}
                        playerColorMap={playerColorMap}
                        localPlayerId={localPlayerId}
                        imageRefreshVersion={imageRefreshVersion}
                        disableActiveHighlights={!isMatchingFilter} 
                    />
                </div>
               </div>
            )})}
            {cards.length === 0 && <p className="col-span-5 w-full text-center text-gray-400 py-8">Empty</p>}
          </div>
        </div>
      </div>
    </div>
  );
};