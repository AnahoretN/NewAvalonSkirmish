/**
 * @file Renders a modal displaying available counters that can be dragged onto cards.
 */

import React from 'react';
import type { DragItem } from '../types';
import { COUNTERS } from '../constants';
import { Card } from './Card';

/**
 * Props for the CountersModal component.
 */
interface CountersModalProps {
  isOpen: boolean;
  onClose: () => void;
  setDraggedItem: (item: DragItem | null) => void;
  canInteract: boolean;
}

/**
 * A modal that displays a list of predefined counters. Users can drag these
 * counters onto cards on the board.
 * @param {CountersModalProps} props The properties for the component.
 * @returns {React.ReactElement | null} The rendered modal or null if not open.
 */
export const CountersModal: React.FC<CountersModalProps> = ({ isOpen, onClose, setDraggedItem, canInteract }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-[26rem] z-40 pointer-events-auto">
      <div className="bg-gray-800 rounded-lg p-4 shadow-xl w-64 max-w-[90vw] h-auto flex flex-col" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Counters</h2>
            <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm">
                Close
            </button>
        </div>
        <div className="flex-grow bg-gray-900 rounded p-4">
          <div className="grid grid-cols-4 gap-y-4">
            {COUNTERS.map((counter) => (
              <div
                key={counter.id}
                draggable={canInteract}
                onDragStart={() => canInteract && setDraggedItem({
                  card: counter,
                  source: 'counter_panel',
                })}
                onDragEnd={() => setDraggedItem(null)}
                className={`w-10 h-10 mx-auto ${canInteract ? 'cursor-grab' : 'cursor-not-allowed'}`}
                title={counter.name}
              >
                <Card card={counter} isFaceUp={true} playerColorMap={new Map()} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};