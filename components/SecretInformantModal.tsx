import React, { useState } from 'react';
import type { Card as CardType, PlayerColor } from '../types';
import { Card } from './Card';
import { ContextMenu } from './ContextMenu';

interface SecretInformantModalProps {
    isOpen: boolean;
    cards: CardType[];
    onClose: () => void;
    onMoveToBottom: (cardIndex: number) => void;
    onViewCard: (card: CardType) => void;
    playerColorMap: Map<number, PlayerColor>;
    localPlayerId: number | null;
    imageRefreshVersion?: number;
}

export const SecretInformantModal: React.FC<SecretInformantModalProps> = ({ 
    isOpen, 
    cards, 
    onClose, 
    onMoveToBottom, 
    onViewCard,
    playerColorMap,
    localPlayerId,
    imageRefreshVersion 
}) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, cardIndex: number } | null>(null);

    if (!isOpen) return null;

    const handleContextMenu = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, cardIndex: index });
    };

    const handleCloseMenu = () => setContextMenu(null);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[250] backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-auto max-w-4xl border border-gray-600 relative">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Secret Informant</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">
                    Top 3 cards of the deck. <br/>
                    <span className="text-xs text-gray-500">Left Click: Move to Bottom. Right Click: Menu.</span>
                </p>

                <div className="flex justify-center gap-4 mb-8">
                    {cards.map((card, index) => (
                        <div 
                            key={card.id || index} 
                            className="w-32 h-32 cursor-pointer hover:scale-105 transition-transform relative"
                            onClick={() => onMoveToBottom(index)}
                            onContextMenu={(e) => handleContextMenu(e, index)}
                        >
                            <Card 
                                card={card} 
                                isFaceUp={true} 
                                playerColorMap={playerColorMap}
                                localPlayerId={localPlayerId}
                                imageRefreshVersion={imageRefreshVersion}
                            />
                        </div>
                    ))}
                    {cards.length === 0 && (
                        <p className="text-gray-500 italic">No cards remaining.</p>
                    )}
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={onClose}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded shadow-lg transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseMenu}
                    items={[
                        { label: 'View', isBold: true, onClick: () => onViewCard(cards[contextMenu.cardIndex]) },
                        { label: 'Move to Bottom', onClick: () => onMoveToBottom(contextMenu.cardIndex) }
                    ]}
                />
            )}
            
            {/* Invisible backdrop for context menu closing */}
            {contextMenu && (
                <div className="fixed inset-0 z-[255]" onClick={handleCloseMenu} />
            )}
        </div>
    );
};