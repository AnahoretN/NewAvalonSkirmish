/**
 * @file Renders a modal for joining an existing game.
 */

import React, { useState } from 'react';

/**
 * Props for the JoinGameModal component.
 */
interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (gameId: string) => void;
  games: { gameId: string; playerCount: number }[];
}

/**
 * A modal that allows users to join a game either by selecting from a list of
 * active games or by entering a game ID manually.
 * @param {JoinGameModalProps} props The properties for the component.
 * @returns {React.ReactElement | null} The rendered modal or null if not open.
 */
export const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoin, games }) => {
  const [gameIdInput, setGameIdInput] = useState('');

  if (!isOpen) return null;
  
  /**
   * Handles the join action when the user provides a game ID manually.
   */
  const handleJoinWithCode = () => {
    if (gameIdInput.trim()) {
      onJoin(gameIdInput.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6">Join an Existing Game</h2>
        
        {/* List of active games */}
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Active Games</h3>
        <div className="h-[40rem] overflow-y-auto pr-2 border-b border-gray-700 pb-2 mb-6">
            {games.length > 0 ? (
                <ul className="space-y-2">
                    {games.map(game => (
                        <li key={game.gameId}>
                            <button
                                onClick={() => onJoin(game.gameId)}
                                className="w-full text-left p-3 bg-gray-700 hover:bg-indigo-600 rounded-lg transition-colors flex justify-between items-center"
                            >
                                <div>
                                    <span className="text-sm text-gray-400">Game ID:</span>
                                    <span className="block font-mono text-indigo-300">{game.gameId}</span>
                                </div>
                                <span className="bg-gray-600 px-2 py-1 rounded-full text-sm font-bold">
                                    {game.playerCount} / 4
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-center">No active games found. <br/> Why not create one?</p>
                </div>
            )}
        </div>

        {/* Manual join input */}
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Or Join with Code</h3>
        <div className="flex space-x-2">
            <input
                type="text"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                placeholder="Enter Game ID"
                className="flex-grow bg-gray-700 border border-gray-600 text-white font-mono rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyUp={(e) => e.key === 'Enter' && handleJoinWithCode()}
            />
            <button
                onClick={handleJoinWithCode}
                disabled={!gameIdInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                Join
            </button>
        </div>

        <div className="flex justify-end mt-8">
          <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};