/**
 * @file Renders a modal displaying available tokens that can be dragged onto the board.
 */

import React from 'react';
import type { DragItem, Card as CardType } from '../types';
import { DeckType } from '../types';
import { decksData } from '../decks';
import { Card } from './Card';

/**
 * Props for the TokensModal component.
 */
interface TokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  setDraggedItem: (item: DragItem | null) => void;
  openContextMenu: (e: React.MouseEvent, type: 'token_panel_item', data: { card: CardType }) => void;
  canInteract: boolean;
  anchorEl: { top: number; left: number } | null;
}

/**
 * A modal that displays a list of predefined tokens. Users can drag these
 * tokens onto the game board to create new instances.
 * @param {TokensModalProps} props The properties for the component.
 * @returns {React.ReactElement | null} The rendered modal or null if not open.
 */
export const TokensModal: React.FC<TokensModalProps> = ({ isOpen, onClose, setDraggedItem, openContextMenu, canInteract, anchorEl }) => {
  if (!isOpen || !anchorEl) return null;

  const tokenCards = decksData[DeckType.Tokens] || [];
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${anchorEl.top + 8}px`, // 8px for a small gap
    left: `${anchorEl.left}px`,
    zIndex: 40,
  };

  return (
    <div style={modalStyle} className="pointer-events-auto">
      <div className="bg-gray-800 rounded-lg p-4 shadow-xl w-96 max-w-[90vw] h-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Tokens</h2>
            <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm">
                Close
            </button>
        </div>
        <div className="flex-grow bg-gray-900 rounded p-2 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {tokenCards.map((token) => (
              <div
                key={token.id}
                draggable={canInteract}
                onDragStart={() => canInteract && setDraggedItem({
                  card: token,
                  source: 'token_panel',
                })}
                onDragEnd={() => setDraggedItem(null)}
                onContextMenu={(e) => canInteract && openContextMenu(e, 'token_panel_item', { card: token })}
                data-interactive={canInteract}
                className={`w-24 h-24 ${canInteract ? 'cursor-grab' : 'cursor-not-allowed'}`}
                title={token.name}
              >
                <Card card={token} isFaceUp={true} playerColorMap={new Map()} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};