import React, { useState, useEffect, useRef } from 'react';
import type { Card as CardType, PlayerColor, Player } from '../types';
import { Card } from './Card';
import { ContextMenu } from './ContextMenu';

interface TopDeckViewProps {
    isOpen: boolean;
    player: Player;
    onClose: () => void;
    onReorder: (playerId: number, newTopCards: CardType[]) => void;
    onMoveToBottom: (cardIndex: number) => void;
    onViewCard: (card: CardType) => void;
    playerColorMap: Map<number, PlayerColor>;
    localPlayerId: number | null;
    imageRefreshVersion?: number;
    initialCount?: number;
    isLocked?: boolean; // If true, user cannot change the number of cards viewed
}

export const TopDeckView: React.FC<TopDeckViewProps> = ({ 
    isOpen, 
    player,
    onClose, 
    onReorder,
    onMoveToBottom, 
    onViewCard,
    playerColorMap,
    localPlayerId,
    imageRefreshVersion,
    initialCount = 3,
    isLocked = false
}) => {
    const [viewCount, setViewCount] = useState(initialCount);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, cardIndex: number } | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Sync view count if it changes externally or re-opens
    useEffect(() => {
        if (isOpen) {
            setViewCount(initialCount);
        }
    }, [isOpen, initialCount]);

    if (!isOpen) return null;

    // Slice the actual live deck
    const visibleCards = player.deck.slice(0, Math.min(viewCount, player.deck.length));

    const handleContextMenu = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, cardIndex: index });
    };

    const handleCloseMenu = () => setContextMenu(null);

    const handleIncrement = () => {
        if (!isLocked && viewCount < player.deck.length) {
            setViewCount(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (!isLocked && viewCount > 1) {
            setViewCount(prev => prev - 1);
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image hack if needed, or default
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newCards = [...visibleCards];
        const [movedCard] = newCards.splice(draggedIndex, 1);
        newCards.splice(targetIndex, 0, movedCard);

        // We need to commit this order to the main deck
        onReorder(player.id, newCards);
        setDraggedIndex(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[250] backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-auto max-w-5xl border border-gray-600 relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                
                {/* Header & Counter */}
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Top Deck View</h2>
                
                <div className="flex items-center gap-4 mb-4 bg-gray-900 p-2 rounded-full border border-gray-700">
                    <button 
                        onClick={handleDecrement}
                        disabled={isLocked || viewCount <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-red-600 rounded-full text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        -
                    </button>
                    <span className="text-xl font-mono font-bold text-indigo-400 w-8 text-center">{viewCount}</span>
                    <button 
                        onClick={handleIncrement}
                        disabled={isLocked || viewCount >= player.deck.length}
                        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-green-600 rounded-full text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        +
                    </button>
                </div>

                <p className="text-gray-400 text-xs mb-6 text-center">
                    Drag to reorder. Right click for actions.
                </p>

                {/* Cards Container */}
                <div className="flex justify-center flex-wrap gap-4 mb-8 min-h-[140px] px-4">
                    {visibleCards.map((card, index) => (
                        <div 
                            key={card.id || index}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`w-32 h-32 relative transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105 cursor-grab active:cursor-grabbing'}`}
                            onContextMenu={(e) => handleContextMenu(e, index)}
                        >
                            {/* Visual Indicator of Order */}
                            <div className="absolute -top-3 -left-2 z-20 bg-gray-900 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-600 shadow-md">
                                #{index + 1}
                            </div>
                            
                            <Card 
                                card={card} 
                                isFaceUp={true} 
                                playerColorMap={playerColorMap}
                                localPlayerId={localPlayerId}
                                imageRefreshVersion={imageRefreshVersion}
                            />
                        </div>
                    ))}
                    {visibleCards.length === 0 && (
                        <p className="text-gray-500 italic">Deck is empty.</p>
                    )}
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={onClose}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded shadow-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseMenu}
                    items={[
                        { label: 'View', isBold: true, onClick: () => onViewCard(visibleCards[contextMenu.cardIndex]) },
                        { label: 'Move to Bottom', onClick: () => {
                            onMoveToBottom(contextMenu.cardIndex);
                            setViewCount(prev => Math.max(0, prev - 1));
                        }}
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