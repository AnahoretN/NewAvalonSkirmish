/**
 * @file Renders the main game board and its cells.
 */

import React from 'react';
import type { Board, GridSize, DragItem, DropTarget, Card as CardType, Player, PlayerColor } from '../types';
import { Card } from './Card';

/**
 * Props for the GameBoard component.
 */
interface GameBoardProps {
  board: Board;
  isGameStarted: boolean;
  activeGridSize: GridSize;
  handleDrop: (item: DragItem, target: DropTarget) => void;
  draggedItem: DragItem | null;
  setDraggedItem: (item: DragItem | null) => void;
  openContextMenu: (e: React.MouseEvent, type: 'boardItem', data: any) => void;
  playMode: { card: CardType; sourceItem: DragItem; faceDown?: boolean } | null;
  setPlayMode: (mode: null) => void;
  highlight: { type: 'row' | 'col' | 'cell', row?: number, col?: number} | null;
  playerColorMap: Map<number, PlayerColor>;
  localPlayerId: number | null;
}

/**
 * Represents a single cell on the game board. It handles dropping cards,
 * click-to-play actions, and displaying cards.
 * @param {object} props The properties for the component.
 * @returns {React.ReactElement} A single grid cell.
 */
const GridCell: React.FC<{
  row: number;
  col: number;
  cell: { card: CardType | null };
  isGameStarted: boolean;
  handleDrop: (item: DragItem, target: DropTarget) => void;
  draggedItem: DragItem | null;
  setDraggedItem: (item: DragItem | null) => void;
  openContextMenu: GameBoardProps['openContextMenu'];
  playMode: GameBoardProps['playMode'];
  setPlayMode: GameBoardProps['setPlayMode'];
  playerColorMap: Map<number, PlayerColor>;
  localPlayerId: number | null;
}> = ({ row, col, cell, isGameStarted, handleDrop, draggedItem, setDraggedItem, openContextMenu, playMode, setPlayMode, playerColorMap, localPlayerId }) => {
  const [isOver, setIsOver] = React.useState(false);

  /**
   * Handles the drop event on the cell.
   * @param {React.DragEvent<HTMLDivElement>} e The drag event.
   */
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedItem) {
      handleDrop(draggedItem, { target: 'board', boardCoords: { row, col } });
    }
    setIsOver(false);
  };
  
  /**
   * Handles click events on the cell, specifically for "Play Mode".
   */
  const handleClick = () => {
    if (playMode) {
      const itemToDrop: DragItem = {
        ...playMode.sourceItem,
        card: { ...playMode.sourceItem.card }, // Create a copy to avoid mutating state
      };
      // Explicitly set face down status. `!!playMode.faceDown` handles `true` and `undefined` cases correctly.
      itemToDrop.card.isFaceDown = !!playMode.faceDown;
      handleDrop(itemToDrop, { target: 'board', boardCoords: { row, col } });
      setPlayMode(null);
    }
  };

  /**
   * Handles the drag-over event to provide visual feedback.
   * @param {React.DragEvent<HTMLDivElement>} e The drag event.
   */
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!cell.card) {
        setIsOver(true);
    }
  };

  /**
   * Resets the visual feedback when a dragged item leaves the cell.
   */
  const onDragLeave = () => {
    setIsOver(false);
  };

  const isInPlayMode = !!playMode;
  const isOccupied = !!cell.card;
  const baseClasses = "w-full h-full rounded-lg transition-colors duration-200 flex items-center justify-center";
  const canDrop = !!draggedItem && !isOccupied;
  const canPlay = isInPlayMode && !isOccupied;

  const cellClasses = `bg-board-cell-active ${isOver && canDrop ? 'bg-indigo-400 opacity-80' : ''} ${canPlay ? 'cursor-pointer ring-2 ring-green-400' : ''} ${isInPlayMode && isOccupied ? 'cursor-not-allowed' : ''}`;

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={handleClick}
      className={`${baseClasses} ${cellClasses}`}
    >
      {cell.card && (
        <div
          draggable={isGameStarted}
          onDragStart={() => setDraggedItem({
              card: cell.card!,
              source: 'board',
              boardCoords: { row, col },
          })}
          onDragEnd={() => setDraggedItem(null)}
          onContextMenu={(e) => openContextMenu(e, 'boardItem', { card: cell.card, boardCoords: { row, col }})}
          className={`w-full h-full ${isGameStarted ? 'cursor-grab' : 'cursor-default'}`}
          data-interactive="true"
        >
            <Card
              card={cell.card}
              isFaceUp={(() => {
                const card = cell.card;
                if (!card) return false;
                
                const isRevealedToAll = card.revealedTo === 'all';
                const isRevealedToMeExplicitly = localPlayerId !== null && Array.isArray(card.revealedTo) && card.revealedTo.includes(localPlayerId);
                const isRevealedByRequest = localPlayerId !== null && card.statuses?.some(s => s.type === 'Revealed' && s.addedByPlayerId === localPlayerId);

                return !card.isFaceDown || isRevealedToAll || isRevealedToMeExplicitly || isRevealedByRequest;
              })()}
              playerColorMap={playerColorMap}
              localPlayerId={localPlayerId}
            />
        </div>
      )}
    </div>
  );
};

/**
 * A mapping of grid sizes to their corresponding Tailwind CSS classes.
 */
const gridSizeClasses: { [key in GridSize]: string } = {
    4: 'grid-cols-4 grid-rows-4',
    5: 'grid-cols-5 grid-rows-5',
    6: 'grid-cols-6 grid-rows-6',
    7: 'grid-cols-7 grid-rows-7',
};

/**
 * The main GameBoard component, which displays the grid of cells and handles board-level interactions.
 * It dynamically renders a subsection of the total board based on `activeGridSize`.
 * @param {GameBoardProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered game board.
 */
export const GameBoard: React.FC<GameBoardProps> = ({ board, isGameStarted, activeGridSize, handleDrop, draggedItem, setDraggedItem, openContextMenu, playMode, setPlayMode, highlight, playerColorMap, localPlayerId }) => {
  const totalSize = board.length;
  // Calculate the offset to center the active grid within the total board area.
  const offset = Math.floor((totalSize - activeGridSize) / 2);
  
  const activeBoard = board
    .slice(offset, offset + activeGridSize)
    .map(row => row.slice(offset, offset + activeGridSize));

  /**
   * A sub-component responsible for rendering the highlight effect over a row or column.
   * @returns {React.ReactElement | null} The highlight element or null.
   */
  const HighlightContent = () => {
    if (!highlight) return null;

    const { type, row, col } = highlight;
    const baseClasses = "outline outline-[5px] outline-yellow-400 rounded-lg";

    // Highlight a row
    if (type === 'row' && row !== undefined && row >= offset && row < offset + activeGridSize) {
      const gridRow = row - offset + 1; // CSS grid lines are 1-based
      return (
        <div 
          className={baseClasses}
          style={{
            gridArea: `${gridRow} / 1 / ${gridRow + 1} / ${activeGridSize + 1}`,
          }}
        ></div>
      );
    }

    // Highlight a column
    if (type === 'col' && col !== undefined && col >= offset && col < offset + activeGridSize) {
      const gridCol = col - offset + 1;
      return (
        <div 
          className={baseClasses}
          style={{
            gridArea: `1 / ${gridCol} / ${activeGridSize + 1} / ${gridCol + 1}`,
          }}
        ></div>
      );
    }

    // Highlight a cell
    if (type === 'cell' && row !== undefined && col !== undefined && row >= offset && row < offset + activeGridSize && col >= offset && col < offset + activeGridSize) {
      const gridRow = row - offset + 1;
      const gridCol = col - offset + 1;
      return (
        <div 
          className={baseClasses}
          style={{
            gridArea: `${gridRow} / ${gridCol} / ${gridRow + 1} / ${gridCol + 1}`,
          }}
        ></div>
      );
    }
    
    return null;
  };

  return (
    <div className={`relative p-2 bg-board-bg rounded-xl shadow-2xl h-full aspect-square transition-all duration-300 ${playMode ? 'ring-4 ring-green-500 shadow-green-500/50' : ''}`}>
      {/* Main content grid */}
      <div className={`grid ${gridSizeClasses[activeGridSize]} gap-0.5 h-full w-full`}>
        {activeBoard.map((rowItems, rowIndex) =>
          rowItems.map((cell, colIndex) => {
            const originalRowIndex = rowIndex + offset;
            const originalColIndex = colIndex + offset;
            return (
              <GridCell
                key={`${originalRowIndex}-${originalColIndex}`}
                row={originalRowIndex}
                col={originalColIndex}
                cell={cell}
                isGameStarted={isGameStarted}
                handleDrop={handleDrop}
                draggedItem={draggedItem}
                setDraggedItem={setDraggedItem}
                openContextMenu={openContextMenu}
                playMode={playMode}
                setPlayMode={setPlayMode}
                playerColorMap={playerColorMap}
                localPlayerId={localPlayerId}
              />
            )
          })
        )}
      </div>
      
      {/* Overlay grid for highlight effect */}
      {highlight && (
        <div className={`absolute top-2 right-2 bottom-2 left-2 grid ${gridSizeClasses[activeGridSize]} gap-0.5 pointer-events-none z-20`}>
          <HighlightContent />
        </div>
      )}
    </div>
  );
};
