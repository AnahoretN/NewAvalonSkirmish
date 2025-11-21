/**
 * @file This is the root component of the application, orchestrating the entire UI and game state.
 */

import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { PlayerPanel } from './components/PlayerPanel';
import { Header } from './components/Header';
import { JoinGameModal } from './components/JoinGameModal';
import { DiscardModal } from './components/DiscardModal';
import { TokensModal } from './components/TokensModal';
import { CountersModal } from './components/CountersModal';
import { TeamAssignmentModal } from './components/TeamAssignmentModal';
import { ReadyCheckModal } from './components/ReadyCheckModal';
import { CardDetailModal } from './components/CardDetailModal';
import { RevealRequestModal } from './components/RevealRequestModal';
import { DeckBuilderModal } from './components/DeckBuilderModal';
import { SettingsModal } from './components/SettingsModal';
import { RulesModal } from './components/RulesModal';
import { useGameState } from './hooks/useGameState';
import type { Player, Card, DragItem, DropTarget, PlayerColor, CardStatus, CustomDeckFile, HighlightData } from './types';
import { DeckType, GameMode } from './types';
import { STATUS_ICONS, STATUS_DESCRIPTIONS } from './constants';

/**
 * Defines the different types of items that can appear in a context menu.
 */
type ContextMenuItem =
  // A standard clickable button item.
  | { label: string; onClick: () => void; disabled?: boolean; isBold?: boolean }
  // A visual separator line.
  | { isDivider: true }
  // A special control for incrementing/decrementing a status.
  | {
      type: 'statusControl';
      label: string;
      onAdd: () => void;
      onRemove: () => void;
      removeDisabled?: boolean;
    };

/**
 * Props for the ContextMenu component.
 */
interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * A generic context menu component that displays a list of actions at a specific screen position.
 * It automatically adjusts its position to stay within the viewport.
 * @param {ContextMenuProps} props The properties for the context menu.
 * @returns {React.ReactElement} The rendered context menu.
 */
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    // Corrects the menu's position to prevent it from rendering off-screen.
    const correctedX = x + 200 > window.innerWidth ? window.innerWidth - 210 : x;
    const menuHeight = items.reduce((acc, item) => acc + ('isDivider' in item ? 9 : 32), 0);
    const correctedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;


    return (
        <div 
            className="fixed bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] py-1"
            style={{ top: correctedY, left: correctedX }}
            onClick={(e) => e.stopPropagation()} // Prevents the window click listener from closing the menu immediately.
        >
            {/* FIX: Used `if/else if/else` with unique property checks to ensure TypeScript correctly narrows the `item` union type in each branch. This resolves errors where properties were accessed on the wrong member of the union. */}
            {items.map((item, index) => {
                if ('isDivider' in item) {
                    return <hr key={`divider-${index}`} className="border-gray-700 my-1" />;
                } else if ('onClick' in item) { // This item is a standard button.
                    return (
                        <button
                            key={index}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.onClick();
                                    onClose();
                                }
                            }}
                            disabled={item.disabled}
                            className="block w-full text-left px-4 py-1 text-sm text-white hover:bg-indigo-600 disabled:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-800"
                            style={{ fontWeight: item.isBold ? 'bold' : 'normal' }}
                        >
                            {item.label}
                        </button>
                    );
                } else { // This item must be a statusControl.
                    return (
                        <div key={index} className="flex items-center justify-between px-4 py-1 text-sm text-white w-full space-x-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); item.onRemove(); }}
                                disabled={item.removeDisabled}
                                className="w-7 h-6 flex items-center justify-center bg-gray-700 hover:bg-red-600 rounded disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed font-mono text-lg"
                            >
                                -
                            </button>
                            <span className="flex-grow text-center">{item.label}</span>
                             <button
                                onClick={(e) => { e.stopPropagation(); item.onAdd(); }}
                                className="w-7 h-6 flex items-center justify-center bg-gray-700 hover:bg-green-600 rounded font-mono text-lg"
                            >
                                +
                            </button>
                        </div>
                    );
                }
            })}
        </div>
    );
};

/**
 * Defines the parameters required to open a context menu.
 */
type ContextMenuParams = {
  x: number;
  y: number;
  type: 'boardItem' | 'handCard' | 'discardCard' | 'deckPile' | 'discardPile' | 'token_panel_item' | 'deckCard' | 'announcedCard' | 'emptyBoardCell';
  data: any; // Context-specific data (e.g., card, player, coordinates).
}

/**
 * The main application component. It manages the overall layout, modals,
 * and interactions between different parts of the game interface.
 * @returns {React.ReactElement} The rendered application.
 */
export default function App() {
  const {
    gameState,
    localPlayerId,
    setLocalPlayerId,
    createGame,
    joinGame,
    startReadyCheck,
    playerReady,
    assignTeams,
    setGameMode,
    setGamePrivacy,
    setActiveGridSize,
    setDummyPlayerCount,
    updatePlayerName,
    changePlayerColor,
    updatePlayerScore,
    changePlayerDeck,
    loadCustomDeck,
    drawCard,
    handleDrop,
    draggedItem,
    setDraggedItem,
    connectionStatus,
    gamesList,
    requestGamesList,
    exitGame,
    moveItem,
    shufflePlayerDeck,
    addBoardCardStatus,
    removeBoardCardStatus,
    modifyBoardCardPower,
    addAnnouncedCardStatus,
    removeAnnouncedCardStatus,
    modifyAnnouncedCardPower,
    flipBoardCard,
    flipBoardCardFaceDown,
    revealHandCard,
    revealBoardCard,
    requestCardReveal,
    respondToRevealRequest,
    syncGame,
    removeRevealedStatus,
    resetGame,
    toggleActiveTurnPlayer,
    forceReconnect,
    triggerHighlight,
    latestHighlight,
  } = useGameState();

  // State for managing UI modals.
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [isDeckBuilderOpen, setDeckBuilderOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isTokensModalOpen, setTokensModalOpen] = useState(false);
  const [isCountersModalOpen, setCountersModalOpen] = useState(false);
  const [isRulesModalOpen, setRulesModalOpen] = useState(false);
  const [tokensModalAnchor, setTokensModalAnchor] = useState<{ top: number; left: number } | null>(null);
  const [countersModalAnchor, setCountersModalAnchor] = useState<{ top: number; left: number } | null>(null);
  const [isTeamAssignOpen, setTeamAssignOpen] = useState(false);
  const [viewingDiscard, setViewingDiscard] = useState<{ player: Player } | null>(null);
  const [viewingDeck, setViewingDeck] = useState<Player | null>(null);
  const [viewingCard, setViewingCard] = useState<{ card: Card; player?: Player } | null>(null);
  const [isListMode, setIsListMode] = useState(true);
  
  // State for forcing image refreshes
  const [imageRefreshVersion, setImageRefreshVersion] = useState<number>(Date.now());

  // State for the context menu.
  const [contextMenuProps, setContextMenuProps] = useState<ContextMenuParams | null>(null);
  
  // State for "Play Mode", where clicking a board cell plays the selected card.
  const [playMode, setPlayMode] = useState<{ card: Card; sourceItem: DragItem; faceDown?: boolean } | null>(null);
  
  // State for "Cursor Stack", where clicking the board applies counters.
  const [cursorStack, setCursorStack] = useState<{ type: string; count: number } | null>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);
  const lastClickPos = useRef<{x: number, y: number} | null>(null);
  
  // State for highlighting a row or column on the board.
  const [highlight, setHighlight] = useState<HighlightData | null>(null);
  
  // References and state for List Mode dynamic layout
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number | undefined>(undefined);

  const activePlayerCount = useMemo(() => gameState.players.filter(p => !p.isDummy && !p.isDisconnected).length, [gameState.players]);
  const isSpectator = localPlayerId === null && gameState.gameId !== null;
  const realPlayerCount = useMemo(() => gameState.players.filter(p => !p.isDummy).length, [gameState.players]);
  const isHost = localPlayerId === 1;

  const localPlayer = useMemo(() => gameState.players.find(p => p.id === localPlayerId), [gameState.players, localPlayerId]);
  const isGameActive = gameState.gameId && (localPlayer || isSpectator);

  const playerColorMap = useMemo(() => {
    const map = new Map<number, PlayerColor>();
    gameState.players.forEach(p => map.set(p.id, p.color));
    return map;
  }, [gameState.players]);

  useEffect(() => {
      const checkListMode = () => {
          const savedMode = localStorage.getItem('ui_list_mode');
          // Default to true if not set, otherwise parse 'true'/'false' string
          setIsListMode(savedMode === null ? true : savedMode === 'true');
      };
      checkListMode();
      
      window.addEventListener('storage', checkListMode);
      return () => window.removeEventListener('storage', checkListMode);
  }, []);

  // List Mode Layout Calculation
  useLayoutEffect(() => {
      if (!isListMode) {
          setLeftPanelWidth(undefined);
          return;
      }

      const calculateWidth = () => {
          if (boardContainerRef.current) {
              const windowWidth = window.innerWidth;
              const boardRect = boardContainerRef.current.getBoundingClientRect();
              
              // Safety check: if board hasn't sized yet, don't calculate
              if (boardRect.width === 0) return;

              // Calculate precise width to ensure 10px gap
              // Board is centered, so space to left is (Window - Board) / 2
              const centeredLeftSpace = (windowWidth - boardRect.width) / 2;
              const gap = 10;
              const targetWidth = centeredLeftSpace - gap;
              
              setLeftPanelWidth(Math.max(0, targetWidth));
          }
      };

      const observer = new ResizeObserver(calculateWidth);
      if (boardContainerRef.current) observer.observe(boardContainerRef.current);
      window.addEventListener('resize', calculateWidth);

      // Initial check
      calculateWidth();
      
      // Force a recalculation after a short delay to handle any layout shifts/animations
      const timer = setTimeout(calculateWidth, 100);

      return () => {
          observer.disconnect();
          window.removeEventListener('resize', calculateWidth);
          clearTimeout(timer);
      };
  }, [isListMode, localPlayerId, gameState.activeGridSize, localPlayer, gameState.isGameStarted, gameState.players.length]);


  // Ensure cursor follower position is initialized immediately upon stack creation
  useLayoutEffect(() => {
      if (cursorStack && cursorFollowerRef.current && lastClickPos.current) {
          cursorFollowerRef.current.style.left = `${lastClickPos.current.x + 1}px`;
          cursorFollowerRef.current.style.top = `${lastClickPos.current.y + 1}px`;
      }
  }, [cursorStack]);

  // Mouse tracking for cursor stack
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (cursorFollowerRef.current && cursorStack) {
              cursorFollowerRef.current.style.left = `${e.clientX + 1}px`;
              cursorFollowerRef.current.style.top = `${e.clientY + 1}px`;
          }
      };

      if (cursorStack) {
          window.addEventListener('mousemove', handleMouseMove);
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
      };
  }, [cursorStack]);

  // Clear cursor stack on right click or escape
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              setCursorStack(null);
              setPlayMode(null);
          }
      };
      
      const handleRightClick = (e: MouseEvent) => {
          if (cursorStack || playMode) {
              e.preventDefault();
              setCursorStack(null);
              setPlayMode(null);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('contextmenu', handleRightClick);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('contextmenu', handleRightClick);
      }
  }, [cursorStack, playMode]);

  // Effect to handle incoming highlights from the server
  useEffect(() => {
      if (latestHighlight) {
          setHighlight(latestHighlight);
          const timer = setTimeout(() => setHighlight(null), 1000);
          return () => clearTimeout(timer);
      }
  }, [latestHighlight]);


  /**
   * Closes all currently open modals.
   */
  const closeAllModals = () => {
      setTokensModalOpen(false);
      setCountersModalOpen(false);
      setViewingDiscard(null);
      setViewingDeck(null);
      setViewingCard(null);
      setRulesModalOpen(false);
  };
  
  const handleStartGameSequence = () => {
      if (!isHost) return;
      if (gameState.gameMode === GameMode.FreeForAll) {
          startReadyCheck();
      } else {
          setTeamAssignOpen(true);
      }
  };
  
  const handleTeamAssignment = (teamAssignments: Record<number, number[]>) => {
      assignTeams(teamAssignments);
      setTeamAssignOpen(false);
      startReadyCheck();
  };

  const handleJoinGame = (gameId: string) => {
    joinGame(gameId);
    setJoinModalOpen(false);
  };

  const handleCreateGame = () => {
    createGame();
    setLocalPlayerId(1);
  };
  
  const handleOpenJoinModal = () => {
    requestGamesList();
    setJoinModalOpen(true);
  };

  const handleSaveSettings = (url: string) => {
    localStorage.setItem('custom_ws_url', url.trim());
    
    // Also re-check list mode
    const savedMode = localStorage.getItem('ui_list_mode');
    setIsListMode(savedMode === null ? true : savedMode === 'true');
    
    setSettingsModalOpen(false);
    forceReconnect();
  };
  
  const handleSyncAndRefresh = () => {
      setImageRefreshVersion(Date.now());
      syncGame();
  };

  const handleTriggerHighlight = (coords: { type: 'row' | 'col' | 'cell', row?: number, col?: number}) => {
      if (localPlayerId === null) return;
      triggerHighlight({
          ...coords,
          playerId: localPlayerId
      });
  };

  const closeContextMenu = () => {
    setContextMenuProps(null);
  };
  
  const openContextMenu = (
    e: React.MouseEvent,
    type: ContextMenuParams['type'],
    data: any
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (localPlayerId === null || !gameState.isGameStarted) return;
    setContextMenuProps({ x: e.clientX, y: e.clientY, type, data });
  };
  
    const handleDoubleClickBoardCard = (card: Card, boardCoords: { row: number, col: number }) => {
        const isOwner = card.ownerId === localPlayerId;

        if (isOwner && card.isFaceDown) {
            flipBoardCard(boardCoords);
            return;
        }

        const owner = card.ownerId ? gameState.players.find(p => p.id === card.ownerId) : undefined;
        const isRevealedByRequest = card.statuses?.some(s => s.type === 'Revealed' && s.addedByPlayerId === localPlayerId);
        const isVisibleForMe = !card.isFaceDown || card.revealedTo === 'all' || (Array.isArray(card.revealedTo) && card.revealedTo.includes(localPlayerId!)) || isRevealedByRequest;

        if (isVisibleForMe || isOwner) {
            setViewingCard({ card, player: owner });
        } else if (localPlayerId !== null) {
            requestCardReveal({ source: 'board', ownerId: card.ownerId!, boardCoords }, localPlayerId);
        }
    };
    
    const handleDoubleClickEmptyCell = (boardCoords: { row: number, col: number }) => {
        handleTriggerHighlight({ type: 'cell', row: boardCoords.row, col: boardCoords.col });
    };

    const handleDoubleClickHandCard = (player: Player, card: Card, cardIndex: number) => {
        if (player.id === localPlayerId) {
            closeAllModals();
            const sourceItem: DragItem = { card, source: 'hand', playerId: player.id, cardIndex };
            setPlayMode({ card, sourceItem, faceDown: false });
        } else if (localPlayerId !== null) {
            const isRevealedToAll = card.revealedTo === 'all';
            const isRevealedToMe = Array.isArray(card.revealedTo) && card.revealedTo.includes(localPlayerId);
            const isRevealedByRequest = card.statuses?.some(s => s.type === 'Revealed' && s.addedByPlayerId === localPlayerId);
            const isVisible = isRevealedToAll || isRevealedToMe || isRevealedByRequest || !!player.isDummy || !!player.isDisconnected;

            if (isVisible) {
                setViewingCard({ card, player });
            } else {
                requestCardReveal({ source: 'hand', ownerId: player.id, cardIndex }, localPlayerId);
            }
        }
    };

    const handleDoubleClickPileCard = (player: Player, card: Card, cardIndex: number, source: 'deck' | 'discard') => {
        const sourceItem: DragItem = { card, source, playerId: player.id, cardIndex };
        moveItem(sourceItem, { target: 'hand', playerId: player.id });
    };

  const handleViewDeck = (player: Player) => {
    setViewingDiscard(null);
    setViewingDeck(player);
  };
  const handleViewDiscard = (player: Player) => {
    setViewingDeck(null);
    setViewingDiscard({ player });
  };
  
  const renderedContextMenu = useMemo(() => {
    if (!contextMenuProps || localPlayerId === null) return null;

    const { type, data, x, y } = contextMenuProps;
    let items: ContextMenuItem[] = [];
    
    if (type === 'emptyBoardCell') {
        items.push({ label: 'Highlight Cell', onClick: () => handleTriggerHighlight({ type: 'cell', row: data.boardCoords.row, col: data.boardCoords.col }) });
        items.push({ label: 'Highlight Column', onClick: () => handleTriggerHighlight({ type: 'col', col: data.boardCoords.col }) });
        items.push({ label: 'Highlight Row', onClick: () => handleTriggerHighlight({ type: 'row', row: data.boardCoords.row }) });

    } else if (type === 'boardItem' || type === 'announcedCard') {
        const isBoardItem = type === 'boardItem';
        const card = isBoardItem ? gameState.board[data.boardCoords.row][data.boardCoords.col].card : data.card;
        const player = isBoardItem ? null : data.player;
        
        if (!card) {
            setContextMenuProps(null);
            return null;
        }
        
        const owner = card.ownerId ? gameState.players.find(p => p.id === card.ownerId) : undefined;
        const isOwner = card.ownerId === localPlayerId;
        const isDummyCard = !!owner?.isDummy;
        const canControl = isOwner || isDummyCard;

        const isRevealedByRequest = card.statuses?.some(s => s.type === 'Revealed' && (s.addedByPlayerId === localPlayerId));
        const isVisible = !card.isFaceDown || card.revealedTo === 'all' || (Array.isArray(card.revealedTo) && card.revealedTo.includes(localPlayerId)) || isRevealedByRequest;

        if (isVisible || (isOwner && card.isFaceDown)) {
            items.push({ label: 'View', isBold: true, onClick: () => setViewingCard({ card, player: owner }) });
        }
        if (isBoardItem && canControl) {
             if (card.isFaceDown) {
                items.push({ label: 'Flip Face Up', isBold: true, onClick: () => flipBoardCard(data.boardCoords) });
            } else {
                items.push({ label: 'Flip Face Down', onClick: () => flipBoardCardFaceDown(data.boardCoords) });
            }
        }

        const sourceItem: DragItem = isBoardItem
          ? { card, source: 'board', boardCoords: data.boardCoords }
          : { card, source: 'announced', playerId: player!.id };
        
        const ownerId = card.ownerId;
        const isSpecialItem = card?.deck === DeckType.Tokens || card?.deck === 'counter';
        
        if (isBoardItem) {
            if (canControl && card.isFaceDown) {
                items.push({ label: 'Reveal to All', onClick: () => revealBoardCard(data.boardCoords, 'all') });
            }
            if (!isOwner && !isVisible) {
                items.push({ label: 'Request Reveal', onClick: () => requestCardReveal({ source: 'board', ownerId: card.ownerId!, boardCoords: data.boardCoords }, localPlayerId) });
            }
            if (card.statuses?.some(s => s.type === 'Revealed')) {
                items.push({ label: 'Remove Revealed', onClick: () => removeRevealedStatus({ source: 'board', boardCoords: data.boardCoords }) });
            }
        }
        
        if (items.length > 0) items.push({ isDivider: true });

        if (canControl && isVisible) {
            items.push({ label: 'To Hand', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'hand', playerId: ownerId }) });
            if (ownerId) {
                const discardLabel = isSpecialItem ? 'Remove' : 'To Discard';
                items.push({ label: discardLabel, onClick: () => moveItem(sourceItem, { target: 'discard', playerId: ownerId }) });
                items.push({ label: 'To Deck Top', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'deck', playerId: ownerId, deckPosition: 'top'}) });
                items.push({ label: 'To Deck Bottom', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'deck', playerId: ownerId, deckPosition: 'bottom'}) });
            }
        }
        
        if (isBoardItem) {
            items.push({ isDivider: true });
            items.push({ label: 'Highlight Cell', onClick: () => handleTriggerHighlight({ type: 'cell', row: data.boardCoords.row, col: data.boardCoords.col }) });
            items.push({ label: 'Highlight Column', onClick: () => handleTriggerHighlight({ type: 'col', col: data.boardCoords.col }) });
            items.push({ label: 'Highlight Row', onClick: () => handleTriggerHighlight({ type: 'row', row: data.boardCoords.row }) });
        }

        if (isVisible) {
            const allStatusTypes = ['Aim', 'Exploit', 'Stun', 'Shield', 'Support', 'Threat'];
            const visibleStatusItems: ContextMenuItem[] = [];

            allStatusTypes.forEach(status => {
                const currentCount = card.statuses?.filter((s: CardStatus) => s.type === status).length || 0;
                
                if (currentCount > 0) {
                    visibleStatusItems.push({
                        type: 'statusControl',
                        label: status,
                        onAdd: () => isBoardItem ? addBoardCardStatus(data.boardCoords, status, localPlayerId) : addAnnouncedCardStatus(player.id, status, localPlayerId),
                        onRemove: () => isBoardItem ? removeBoardCardStatus(data.boardCoords, status) : removeAnnouncedCardStatus(player.id, status),
                        removeDisabled: false
                    });
                }
            });

            if (visibleStatusItems.length > 0) {
                 if (items.length > 0 && !('isDivider' in items[items.length - 1])) items.push({ isDivider: true });
                items.push(...visibleStatusItems);
            }

             if (items.length > 0 && !('isDivider' in items[items.length - 1])) items.push({ isDivider: true });
             items.push({
                type: 'statusControl',
                label: 'Power',
                onAdd: () => isBoardItem ? modifyBoardCardPower(data.boardCoords, 1) : modifyAnnouncedCardPower(player.id, 1),
                onRemove: () => isBoardItem ? modifyBoardCardPower(data.boardCoords, -1) : modifyAnnouncedCardPower(player.id, -1),
                removeDisabled: false
             });
        }
        
    } else if (type === 'token_panel_item') {
        const { card } = data;
        const sourceItem: DragItem = { card, source: 'token_panel' };

        items.push({ label: 'View', isBold: true, onClick: () => setViewingCard({ card }) });
        items.push({ isDivider: true });
        items.push({ label: 'Play Face Up', isBold: true, onClick: () => {
            closeAllModals();
            setPlayMode({ card, sourceItem, faceDown: false });
        }});
        items.push({ label: 'Play Face Down', onClick: () => {
            closeAllModals();
            setPlayMode({ card, sourceItem, faceDown: true });
        }});

    } else if (['handCard', 'discardCard', 'deckCard'].includes(type)) {
        const { card, boardCoords, player, cardIndex } = data;
        const canControl = player.id === localPlayerId || !!player.isDummy;
        const localP = gameState.players.find(p => p.id === localPlayerId);
        const isTeammate = localP?.teamId !== undefined && player.teamId === localP.teamId;
        const isRevealedToMe = card.revealedTo === 'all' || (Array.isArray(card.revealedTo) && card.revealedTo.includes(localPlayerId));
        const isRevealedByRequest = card.statuses?.some(s => s.type === 'Revealed' && s.addedByPlayerId === localPlayerId);
        
        const isVisible = (() => {
            if (type !== 'handCard') return true;
            return player.id === localPlayerId || isTeammate || !!player.isDummy || !!player.isDisconnected || isRevealedToMe || isRevealedByRequest;
        })();
        
        let source: DragItem['source'];
        if (type === 'handCard') source = 'hand';
        else if (type === 'discardCard') source = 'discard';
        else source = 'deck';

        const sourceItem: DragItem = { card, source, playerId: player?.id, cardIndex, boardCoords };
        const ownerId = card.ownerId;
        const isSpecialItem = card?.deck === DeckType.Tokens || card?.deck === 'counter';

        if (isVisible) {
            const owner = card.ownerId ? gameState.players.find(p => p.id === card.ownerId) : undefined;
            items.push({ label: 'View', isBold: true, onClick: () => setViewingCard({ card, player: owner }) });
        }

        if (canControl) {
            if (type === 'handCard') {
                items.push({ label: 'Play', isBold: true, onClick: () => {
                    closeAllModals();
                    setPlayMode({ card, sourceItem, faceDown: false });
                }});
                 items.push({ label: 'Play Face Down', onClick: () => {
                    closeAllModals();
                    setPlayMode({ card, sourceItem, faceDown: true });
                }});
            } else if (isVisible && ['discardCard', 'deckCard'].includes(type)) {
                 items.push({ label: 'Play Face Up', isBold: true, onClick: () => {
                    closeAllModals();
                    setPlayMode({ card, sourceItem, faceDown: false });
                }});
                items.push({ label: 'Play Face Down', onClick: () => {
                    closeAllModals();
                    setPlayMode({ card, sourceItem, faceDown: true });
                }});
            }
            
            if (items.length > 0) items.push({ isDivider: true });
            
            if (type === 'handCard') {
                 if (card.statuses?.some(s => s.type === 'Revealed')) {
                    items.push({ label: 'Remove Revealed', onClick: () => removeRevealedStatus({ source: 'hand', playerId: player.id, cardIndex }) });
                }
                items.push({ label: 'Reveal to All', onClick: () => revealHandCard(player.id, cardIndex, 'all') });
            }

            if (items.length > 0 && !('isDivider' in items[items.length - 1])) items.push({ isDivider: true });

            if (type === 'discardCard') {
                items.push({ label: 'To Hand', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'hand', playerId: ownerId }) });
            } else if (type === 'handCard') {
                items.push({ label: 'To Discard', onClick: () => moveItem(sourceItem, { target: 'discard', playerId: ownerId }) });
            }
            
            if (['handCard', 'discardCard'].includes(type) && ownerId) {
                 items.push({ label: 'To Deck Top', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'deck', playerId: ownerId, deckPosition: 'top'}) });
                 items.push({ label: 'To Deck Bottom', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'deck', playerId: ownerId, deckPosition: 'bottom'}) });
            }
             if (type === 'deckCard') {
                 items.push({ label: 'To Hand', disabled: isSpecialItem, onClick: () => moveItem(sourceItem, { target: 'hand', playerId: player.id }) });
                 items.push({ label: 'To Discard', onClick: () => moveItem(sourceItem, { target: 'discard', playerId: player.id }) });
             }
        } 
        else if (type === 'handCard' && !isVisible) {
             items.push({ label: 'Request Reveal', onClick: () => requestCardReveal({ source: 'hand', ownerId: player.id, cardIndex }, localPlayerId) });
        }

    } else if (type === 'deckPile') {
        const { player } = data;
        const canControl = player.id === localPlayerId || !!player.isDummy;
        if (canControl) {
            items.push({ label: 'Draw Card', onClick: () => drawCard(player.id) });
            items.push({ label: 'Shuffle', onClick: () => shufflePlayerDeck(player.id) });
        }
        items.push({ label: 'View', onClick: () => handleViewDeck(player) });
    } else if (type === 'discardPile') {
        const { player } = data;
        items.push({ label: 'View', onClick: () => handleViewDiscard(player) });
    }
    
    items = items.filter((item, index) => {
        if (!('isDivider' in item)) return true;
        if (index === 0 || index === items.length - 1) return false;
        if ('isDivider' in items[index-1]) return false;
        return true;
    });
    
    return <ContextMenu x={x} y={y} items={items} onClose={closeContextMenu} />;
  }, [gameState, localPlayerId, moveItem, handleTriggerHighlight, addBoardCardStatus, removeBoardCardStatus, modifyBoardCardPower, addAnnouncedCardStatus, removeAnnouncedCardStatus, modifyAnnouncedCardPower, drawCard, shufflePlayerDeck, flipBoardCard, flipBoardCardFaceDown, revealHandCard, revealBoardCard, requestCardReveal, removeRevealedStatus]);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    
    const handleContextMenu = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('[data-interactive]')) {
             closeContextMenu();
        }
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
        window.removeEventListener('click', closeContextMenu);
        window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if (draggedItem) {
      closeContextMenu();
    }
  }, [draggedItem]);

  const handleOpenTokensModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isTokensModalOpen) {
      setTokensModalOpen(false);
      setTokensModalAnchor(null);
    } else {
        setCountersModalOpen(false);
        setCountersModalAnchor(null);
      const rect = event.currentTarget.getBoundingClientRect();
      setTokensModalAnchor({ top: rect.top, left: rect.left });
      setTokensModalOpen(true);
    }
  };

  const handleOpenCountersModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isCountersModalOpen) {
        setCountersModalOpen(false);
        setCountersModalAnchor(null);
    } else {
        setTokensModalOpen(false);
        setTokensModalAnchor(null);
        const rect = event.currentTarget.getBoundingClientRect();
        setCountersModalAnchor({ top: rect.top, left: rect.left });
        setCountersModalOpen(true);
    }
  };

  const handleCounterClick = (type: string, e: React.MouseEvent) => {
      lastClickPos.current = { x: e.clientX, y: e.clientY };
      
      setCursorStack(prev => {
          if (prev && prev.type === type) {
              return { type, count: prev.count + 1 };
          }
          return { type, count: 1 };
      });
  };

  if (!isGameActive) {
    const buttonClass = "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed";
    const socialLinkClass = "text-gray-400 hover:text-white transition-colors";
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800">
        <div className="text-center p-4 flex flex-col items-center">
          <h1 className="text-5xl font-bold mb-12">New Avalon: Skirmish</h1>
          <div className="flex flex-col space-y-4 w-64">
            <div className="flex items-center space-x-2">
                <button onClick={handleCreateGame} className={`${buttonClass} flex-grow`}>
                  Start Game
                </button>
                <button 
                  onClick={() => setSettingsModalOpen(true)} 
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-3 rounded-lg transition-colors aspect-square"
                  title="Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
            </div>
            <button onClick={handleOpenJoinModal} className={buttonClass}>
              Join Game
            </button>
             <button onClick={() => setDeckBuilderOpen(true)} className={buttonClass}>
              Deck Building
            </button>
             <button disabled className={buttonClass}>
              Story Mode
            </button>
             <button disabled className={buttonClass}>
              Puzzles
            </button>
             <button onClick={() => setRulesModalOpen(true)} className={buttonClass}>
              Rules & Tutorial
            </button>
          </div>
           <div className="mt-16 flex items-center space-x-8">
            <a href="https://t.me/NikitaAnahoretTriakin" target="_blank" rel="noopener noreferrer" className={socialLinkClass} title="Telegram">
               <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Telegram_Messenger.png" alt="Telegram" className="h-8 w-8 object-contain" />
            </a>
            <a href="https://discord.gg/U5zKADsZZY" target="_blank" rel="noopener noreferrer" className={socialLinkClass} title="Discord">
               <img src="https://cdn-icons-png.flaticon.com/512/2111/2111370.png" alt="Discord" className="h-8 w-8 object-contain" />
            </a>
             <a href="https://www.patreon.com/c/AnchoriteComics" target="_blank" rel="noopener noreferrer" className={socialLinkClass} title="Patreon">
                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968722.png" alt="Patreon" className="h-8 w-8 object-contain" />
            </a>
          </div>
          <JoinGameModal
            isOpen={isJoinModalOpen}
            onClose={() => setJoinModalOpen(false)}
            onJoin={handleJoinGame}
            games={gamesList}
          />
          <DeckBuilderModal 
            isOpen={isDeckBuilderOpen}
            onClose={() => setDeckBuilderOpen(false)}
            setViewingCard={setViewingCard}
          />
           <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            onSave={handleSaveSettings}
          />
          <RulesModal 
            isOpen={isRulesModalOpen}
            onClose={() => setRulesModalOpen(false)}
          />
          {viewingCard && (
            <CardDetailModal
              card={viewingCard.card}
              ownerPlayer={viewingCard.player}
              onClose={() => setViewingCard(null)}
              statusDescriptions={STATUS_DESCRIPTIONS}
              allPlayers={gameState.players}
              imageRefreshVersion={imageRefreshVersion}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${cursorStack ? 'cursor-none' : ''}`}>
      <Header
        gameId={gameState.gameId}
        isGameStarted={gameState.isGameStarted}
        onStartGame={handleStartGameSequence}
        onResetGame={resetGame}
        activeGridSize={gameState.activeGridSize}
        onGridSizeChange={setActiveGridSize}
        dummyPlayerCount={gameState.dummyPlayerCount}
        onDummyPlayerCountChange={setDummyPlayerCount}
        realPlayerCount={realPlayerCount}
        connectionStatus={connectionStatus}
        onExitGame={exitGame}
        onOpenTokensModal={handleOpenTokensModal}
        onOpenCountersModal={handleOpenCountersModal}
        gameMode={gameState.gameMode}
        onGameModeChange={setGameMode}
        isPrivate={gameState.isPrivate}
        onPrivacyChange={setGamePrivacy}
        isHost={isHost}
        onSyncGame={handleSyncAndRefresh}
      />
      
      {/* Main Content Layout - Switching based on listMode */}
      {isListMode ? (
        <div className="relative h-full w-full pt-14 overflow-hidden bg-gray-900">
            {/* Left Column: Local Player - Absolute Left */}
            {localPlayer && (
                <div 
                    ref={leftPanelRef}
                    className="absolute left-0 top-14 bottom-[2px] z-30 bg-panel-bg shadow-xl flex flex-col border-r border-gray-700 w-fit min-w-0 pl-[2px] py-[2px] pr-0 transition-all duration-100 overflow-hidden"
                    style={{ width: leftPanelWidth }}
                >
                     <PlayerPanel
                        key={localPlayer.id}
                        player={localPlayer}
                        isLocalPlayer={true}
                        localPlayerId={localPlayerId}
                        isSpectator={isSpectator}
                        isGameStarted={gameState.isGameStarted}
                        position={localPlayer.id}
                        onNameChange={(name) => updatePlayerName(localPlayer.id, name)}
                        onColorChange={(color) => changePlayerColor(localPlayer.id, color)}
                        onScoreChange={(delta) => updatePlayerScore(localPlayer.id, delta)}
                        onDeckChange={(deckType) => changePlayerDeck(localPlayer.id, deckType)}
                        onLoadCustomDeck={(deckFile) => loadCustomDeck(localPlayer.id, deckFile)}
                        onDrawCard={() => drawCard(localPlayer.id)}
                        handleDrop={handleDrop}
                        draggedItem={draggedItem}
                        setDraggedItem={setDraggedItem}
                        openContextMenu={openContextMenu}
                        onHandCardDoubleClick={handleDoubleClickHandCard}
                        playerColorMap={playerColorMap}
                        allPlayers={gameState.players}
                        localPlayerTeamId={localPlayer?.teamId}
                        activeTurnPlayerId={gameState.activeTurnPlayerId}
                        onToggleActiveTurn={toggleActiveTurnPlayer}
                        imageRefreshVersion={imageRefreshVersion}
                        layoutMode="list-local"
                     />
                </div>
            )}

            {/* Center Column: Game Board - Absolute Centered */}
            <div 
                className="absolute top-14 bottom-0 z-10 flex items-center justify-center pointer-events-none w-full left-0"
            >
                 <div 
                    ref={boardContainerRef}
                    className="pointer-events-auto h-full aspect-square flex items-center justify-center py-[2px]"
                 >
                     <GameBoard
                        board={gameState.board}
                        isGameStarted={gameState.isGameStarted}
                        activeGridSize={gameState.activeGridSize}
                        handleDrop={handleDrop}
                        draggedItem={draggedItem}
                        setDraggedItem={setDraggedItem}
                        openContextMenu={openContextMenu}
                        playMode={playMode}
                        setPlayMode={setPlayMode}
                        highlight={highlight}
                        playerColorMap={playerColorMap}
                        localPlayerId={localPlayerId}
                        onCardDoubleClick={handleDoubleClickBoardCard}
                        onEmptyCellDoubleClick={handleDoubleClickEmptyCell}
                        imageRefreshVersion={imageRefreshVersion}
                        cursorStack={cursorStack}
                        setCursorStack={setCursorStack}
                     />
                 </div>
            </div>

            {/* Right Column: Opponents - Absolute Right */}
            <div className="absolute right-0 top-14 bottom-0 z-30 w-[32rem] bg-panel-bg shadow-xl flex flex-col pt-[3px] pb-[3px] border-l border-gray-700 gap-[3px]">
                 {gameState.players
                    .filter(p => p.id !== localPlayerId)
                    .map(player => (
                        <div key={player.id} className="w-full flex-1 min-h-0">
                            <PlayerPanel
                                player={player}
                                isLocalPlayer={false}
                                localPlayerId={localPlayerId}
                                isSpectator={isSpectator}
                                isGameStarted={gameState.isGameStarted}
                                position={player.id}
                                onNameChange={(name) => updatePlayerName(player.id, name)}
                                onColorChange={(color) => changePlayerColor(player.id, color)}
                                onScoreChange={(delta) => updatePlayerScore(player.id, delta)}
                                onDeckChange={(deckType) => changePlayerDeck(player.id, deckType)}
                                onLoadCustomDeck={(deckFile) => loadCustomDeck(player.id, deckFile)}
                                onDrawCard={() => drawCard(player.id)}
                                handleDrop={handleDrop}
                                draggedItem={draggedItem}
                                setDraggedItem={setDraggedItem}
                                openContextMenu={openContextMenu}
                                onHandCardDoubleClick={handleDoubleClickHandCard}
                                playerColorMap={playerColorMap}
                                allPlayers={gameState.players}
                                localPlayerTeamId={localPlayer?.teamId}
                                activeTurnPlayerId={gameState.activeTurnPlayerId}
                                onToggleActiveTurn={toggleActiveTurnPlayer}
                                imageRefreshVersion={imageRefreshVersion}
                                layoutMode="list-remote"
                            />
                        </div>
                    ))
                 }
            </div>
        </div>
      ) : (
        /* Standard Mode Layout */
        <main className="pt-14 h-screen w-full flex items-center justify-center py-[2px] px-[2px]">
            <GameBoard
            board={gameState.board}
            isGameStarted={gameState.isGameStarted}
            activeGridSize={gameState.activeGridSize}
            handleDrop={handleDrop}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
            openContextMenu={openContextMenu}
            playMode={playMode}
            setPlayMode={setPlayMode}
            highlight={highlight}
            playerColorMap={playerColorMap}
            localPlayerId={localPlayerId}
            onCardDoubleClick={handleDoubleClickBoardCard}
            onEmptyCellDoubleClick={handleDoubleClickEmptyCell}
            imageRefreshVersion={imageRefreshVersion}
            cursorStack={cursorStack}
            setCursorStack={setCursorStack}
            />
            
             {/* Player panels (Absolute Positioning) */}
            {gameState.players.map((player) => (
                <PlayerPanel
                key={player.id}
                player={player}
                isLocalPlayer={player.id === localPlayerId}
                localPlayerId={localPlayerId}
                isSpectator={isSpectator}
                isGameStarted={gameState.isGameStarted}
                position={player.id}
                onNameChange={(name) => updatePlayerName(player.id, name)}
                onColorChange={(color) => changePlayerColor(player.id, color)}
                onScoreChange={(delta) => updatePlayerScore(player.id, delta)}
                onDeckChange={(deckType) => changePlayerDeck(player.id, deckType)}
                onLoadCustomDeck={(deckFile) => loadCustomDeck(player.id, deckFile)}
                onDrawCard={() => drawCard(player.id)}
                handleDrop={handleDrop}
                draggedItem={draggedItem}
                setDraggedItem={setDraggedItem}
                openContextMenu={openContextMenu}
                onHandCardDoubleClick={handleDoubleClickHandCard}
                playerColorMap={playerColorMap}
                allPlayers={gameState.players}
                localPlayerTeamId={localPlayer?.teamId}
                activeTurnPlayerId={gameState.activeTurnPlayerId}
                onToggleActiveTurn={toggleActiveTurnPlayer}
                imageRefreshVersion={imageRefreshVersion}
                layoutMode="standard"
                />
            ))}
        </main>
      )}
      
      {/* Cursor Stack Follower */}
      {cursorStack && (
          <div 
            ref={cursorFollowerRef}
            className="fixed pointer-events-none z-[1000] flex items-center justify-center"
          >
              <div className="relative w-12 h-12 rounded-full bg-gray-500 border-[3px] border-white flex items-center justify-center shadow-xl">
                   {(() => {
                       let iconUrl = STATUS_ICONS[cursorStack.type];
                       if (iconUrl && imageRefreshVersion) iconUrl = `${iconUrl}?v=${imageRefreshVersion}`;
                       const isPower = cursorStack.type.startsWith('Power');
                       
                       return iconUrl ? (
                           <img src={iconUrl} alt={cursorStack.type} className="w-full h-full object-contain p-1" />
                       ) : (
                           <span className={`font-bold text-white ${isPower ? 'text-sm' : 'text-lg'}`} style={{ textShadow: '0 0 2px black' }}>
                                {isPower ? (cursorStack.type === 'Power+' ? '+P' : '-P') : cursorStack.type.charAt(0)}
                           </span>
                       );
                   })()}
                   <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white">
                       {cursorStack.count}
                   </div>
              </div>
          </div>
      )}

      {/* Spectator Mode overlay */}
      {isSpectator && !isListMode && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 p-4 rounded-lg z-50">
          <p className="text-xl font-bold text-center">Spectator Mode</p>
          <p className="text-center text-gray-300">You are watching the game.</p>
        </div>
      )}

      {/* Reveal Request Modal */}
      {(() => {
          const request = gameState.revealRequests.find(r => r.toPlayerId === localPlayerId);
          if (!request) return null;
          const fromPlayer = gameState.players.find(p => p.id === request.fromPlayerId);
          return fromPlayer ? (
            <RevealRequestModal
              fromPlayer={fromPlayer}
              cardCount={request.cardIdentifiers.length}
              onAccept={() => respondToRevealRequest(request.fromPlayerId, true)}
              onDecline={() => respondToRevealRequest(request.fromPlayerId, false)}
            />
          ) : null;
      })()}
      
      {/* Team Assignment Modal */}
      {isTeamAssignOpen && isHost && (
        <TeamAssignmentModal
          players={gameState.players.filter(p => !p.isDisconnected)}
          gameMode={gameState.gameMode}
          onCancel={() => setTeamAssignOpen(false)}
          onConfirm={handleTeamAssignment}
        />
      )}
      
      {/* Ready Check Modal */}
      {gameState.isReadyCheckActive && !isSpectator && localPlayer && (
        <ReadyCheckModal
            players={gameState.players.filter(p => !p.isDummy && !p.isDisconnected)}
            localPlayer={localPlayer}
            onReady={playerReady}
        />
      )}

      {/* Discard Pile Modal */}
      {viewingDiscard && (() => {
          const playerInState = gameState.players.find(p => p.id === viewingDiscard.player.id);
          const currentCards = playerInState ? playerInState.discard : [];
          return (
            <DiscardModal
              isOpen={!!viewingDiscard}
              onClose={() => setViewingDiscard(null)}
              title={`${viewingDiscard.player.name}'s Discard Pile`}
              player={viewingDiscard.player}
              cards={currentCards}
              setDraggedItem={setDraggedItem}
              onCardContextMenu={(e, cardIndex) => openContextMenu(e, 'discardCard', { card: currentCards[cardIndex], player: viewingDiscard.player, cardIndex })}
              onCardDoubleClick={(cardIndex) => handleDoubleClickPileCard(viewingDiscard.player, currentCards[cardIndex], cardIndex, 'discard')}
              canInteract={(localPlayerId !== null && gameState.isGameStarted && (viewingDiscard.player.id === localPlayerId || !!viewingDiscard.player.isDummy))}
              playerColorMap={playerColorMap}
              localPlayerId={localPlayerId}
              imageRefreshVersion={imageRefreshVersion}
            />
          );
      })()}

      {/* Deck View Modal */}
       {viewingDeck && (() => {
          const playerInState = gameState.players.find(p => p.id === viewingDeck.id);
          const currentCards = playerInState ? playerInState.deck : [];
          return (
            <DiscardModal
              isOpen={!!viewingDeck}
              onClose={() => setViewingDeck(null)}
              title={`${viewingDeck.name}'s Deck`}
              player={viewingDeck}
              cards={currentCards}
              setDraggedItem={setDraggedItem}
              onCardContextMenu={(e, cardIndex) => openContextMenu(e, 'deckCard', { card: currentCards[cardIndex], player: viewingDeck, cardIndex })}
              onCardDoubleClick={(cardIndex) => handleDoubleClickPileCard(viewingDeck, currentCards[cardIndex], cardIndex, 'deck')}
              canInteract={localPlayerId !== null && gameState.isGameStarted && (viewingDeck.id === localPlayerId || !!viewingDeck.isDummy)}
              isDeckView={true}
              playerColorMap={playerColorMap}
              localPlayerId={localPlayerId}
              imageRefreshVersion={imageRefreshVersion}
            />
          );
      })()}

      {/* Tokens and Counters Modals */}
       <TokensModal
        isOpen={isTokensModalOpen}
        onClose={() => setTokensModalOpen(false)}
        setDraggedItem={setDraggedItem}
        openContextMenu={openContextMenu}
        canInteract={localPlayerId !== null && gameState.isGameStarted}
        anchorEl={tokensModalAnchor}
        imageRefreshVersion={imageRefreshVersion}
        draggedItem={draggedItem}
      />

      <CountersModal
        isOpen={isCountersModalOpen}
        onClose={() => setCountersModalOpen(false)}
        setDraggedItem={setDraggedItem}
        canInteract={localPlayerId !== null && gameState.isGameStarted}
        anchorEl={countersModalAnchor}
        imageRefreshVersion={imageRefreshVersion}
        onCounterClick={handleCounterClick}
        cursorStack={cursorStack}
      />

      {viewingCard && (
        <CardDetailModal
          card={viewingCard.card}
          ownerPlayer={viewingCard.player}
          onClose={() => setViewingCard(null)}
          statusDescriptions={STATUS_DESCRIPTIONS}
          allPlayers={gameState.players}
          imageRefreshVersion={imageRefreshVersion}
        />
      )}

      {/* Render the context menu if active */}
      {renderedContextMenu}
    </div>
  );
}