/**
 * @file Renders a comprehensive Rules & Tutorial modal acting as an interactive encyclopedia.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './Card';
import type { Card as CardType, PlayerColor } from '../types';
import { DeckType } from '../types';
import { PLAYER_COLORS } from '../constants';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RuleSection {
  id: string;
  title: string;
  content: React.ReactNode;
  // Optional configuration for the 3x3 demo board
  demoConfig?: (number | null)[]; // Array of 9 items, representing card owner IDs (1=Blue, 2=Red). null = empty.
  demoCardStatuses?: Record<number, { type: string; addedByPlayerId: number }[]>; // Map index (0-8) to status list
}

// --- Constants for Image URLs ---
const RIOT_AGENT_IMG = "https://res.cloudinary.com/dxxh6meej/image/upload/v1763253337/SYN_RIOT_AGENT_jurf4t.png";
const RIOT_AGENT_FALLBACK = "/images/cards/SYN_RIOT_AGENT.png";
const PRINCEPS_IMG = "https://res.cloudinary.com/dxxh6meej/image/upload/v1763253332/OPT_PRINCEPS_w3o5lq.png";
const PRINCEPS_FALLBACK = "/images/cards/OPT_PRINCEPS.png";

// --- Mock Data & Helpers for Demo ---

const createDummyCard = (ownerId: number): CardType => {
    const isBlue = ownerId === 1;
    
    if (isBlue) {
        // Riot Agent (SynchroTech) - Player 1
        return {
            id: `demo-riot-${Math.random()}`,
            deck: DeckType.SynchroTech,
            name: "Riot Agent",
            imageUrl: RIOT_AGENT_IMG,
            fallbackImage: RIOT_AGENT_FALLBACK,
            power: 3,
            ability: "Support ⇒ Act: Place 1 stun on adjacent card. \nAct: Push an adjacent card 1 cell. Мay take its place.",
            ownerId: 1,
            ownerName: 'Player 1',
            statuses: [],
            types: ["Unit", "SynchroTech"]
        };
    } else {
        // Princeps (Optimates) - Player 2
        return {
            id: `demo-princeps-${Math.random()}`,
            deck: DeckType.Optimates,
            name: "Princeps",
            imageUrl: PRINCEPS_IMG,
            fallbackImage: PRINCEPS_FALLBACK,
            power: 3,
            ability: "Act: Destroy a card in a row if it has a target or threat. \nSupport ⇒ Shield 1.",
            ownerId: 2,
            ownerName: 'Player 2',
            statuses: [],
            types: ["Unit", "Optimates"]
        };
    }
};

const DUMMY_COLOR_MAP = new Map<number, PlayerColor>([
    [1, 'blue'],
    [2, 'red'],
]);

/**
 * Rules data structure containing text and demo configurations.
 */
const RULES: RuleSection[] = [
    {
        id: 'intro',
        title: '1. Introduction',
        content: (
            <div className="text-left">
                <p className="mb-2"><strong>"New Avalon: Skirmish"</strong> is a tactical card game where opponents control units simultaneously on a limited battlefield (grid).</p>
                <p>The game uses a <strong>Priority System</strong>: whenever a player performs an action, other players get a chance to respond with Command cards.</p>
            </div>
        ),
        demoConfig: [null, 1, null, null, 2, null, null, null, null],
    },
    {
        id: 'components',
        title: '2. Components',
        content: (
            <div className="text-left">
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Deck:</strong> 15–100 cards (Units and Commands).</li>
                    <li><strong>Battlefield:</strong> Grid of 5x5, 6x6, or 7x7 cells.</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'turn_order',
        title: '3. Turn Order',
        content: (
            <div className="text-left">
                <p className="mb-2">A turn consists of the following phases:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>Deployment Phase:</strong> Players place units on the board.</li>
                    <li><strong>Abilities Phase:</strong> Players trigger unit abilities.</li>
                    <li><strong>Scoring Phase:</strong> Players score points from rows/columns.</li>
                    <li><strong>Draw Phase:</strong> Draw cards up to 6.</li>
                    <li><strong>End Phase:</strong> Pass the First Player token.</li>
                </ol>
                <p className="mt-2 italic text-gray-400">Note: Command cards can be played at any time a player has Priority.</p>
            </div>
        ),
    },
    {
        id: 'priority',
        title: '4. Priority',
        content: (
            <div className="text-left">
                <p className="mb-2"><strong>Priority</strong> is the right to perform an action.</p>
                <p className="mb-2">A player receives priority:</p>
                <ul className="list-disc list-inside ml-2 mb-2">
                    <li>After declaring an action.</li>
                    <li>After their action fully resolves.</li>
                    <li>When phases change.</li>
                    <li>After an opponent declares an action (to respond).</li>
                </ul>
                <p>When you have priority, you can: <strong>Play a Command</strong>, <strong>Activate an Ability</strong>, or <strong>Pass</strong>.</p>
            </div>
        ),
    },
    {
        id: 'stack',
        title: '5. The Stack',
        content: (
            <div className="text-left">
                <p className="mb-2">Actions that can be interrupted go into the <strong>Stack</strong>.</p>
                <ul className="list-disc list-inside ml-2 mb-2">
                    <li>Commands</li>
                    <li>Active Abilities</li>
                    <li>Triggered Abilities</li>
                </ul>
                <p className="mb-2"><strong>LIFO (Last In, First Out):</strong> The last action added to the stack is resolved first.</p>
                <p className="text-gray-400 italic">Passive abilities do not use the stack.</p>
            </div>
        ),
    },
    {
        id: 'statuses_support',
        title: '6. Status: Support',
        content: (
            <div className="text-left">
                <p className="mb-4">A unit gains <strong>Support</strong> if an allied unit is orthogonally adjacent (up, down, left, or right) to it.</p>
                <p>Many card abilities become stronger if the unit has Support.</p>
            </div>
        ),
        demoConfig: [null, null, null, null, 1, 1, null, null, null], // Two adjacent blue cards
        demoCardStatuses: {
            4: [{ type: 'Support', addedByPlayerId: 1 }],
            5: [{ type: 'Support', addedByPlayerId: 1 }],
        }
    },
    {
        id: 'statuses_threat',
        title: '6. Status: Threat',
        content: (
            <div className="text-left">
                <p className="mb-4">A unit gains <strong>Threat</strong> in two situations:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>It is "sandwiched" between two enemy units (orthogonally).</li>
                    <li>It is "pinned" against the edge of the board by an enemy unit.</li>
                </ul>
                <p className="mt-2">Threatened units are often vulnerable to destruction or debuffs.</p>
            </div>
        ),
        demoConfig: [null, 2, null, null, 1, null, null, 2, null], // Blue sandwiched by Reds
        demoCardStatuses: {
            4: [{ type: 'Threat', addedByPlayerId: 2 }]
        }
    },
    {
        id: 'deployment',
        title: '7. Deployment Phase',
        content: (
            <div className="text-left">
                <p className="mb-2">Replaces old mechanics. The Active Player declares: "I am placing a unit."</p>
                <p>Priority passes around. If everyone passes, the unit is placed face-up on an empty cell.</p>
                <p className="mt-2">Units cannot be placed on occupied cells.</p>
            </div>
        ),
        demoConfig: [null, null, null, null, 1, null, null, null, null],
    },
    {
        id: 'abilities',
        title: '8. Abilities Phase',
        content: (
             <div className="text-left">
                <p>Players take turns activating their units' abilities.</p>
                <p>Announce ability &rarr; Place in Stack &rarr; Opponents respond &rarr; Resolve.</p>
             </div>
        )
    },
    {
        id: 'scoring',
        title: '9. Scoring Phase',
        content: (
            <div className="text-left">
                <p>A player selects <strong>one row or column</strong>.</p>
                <p>They gain points equal to the total <strong>Power</strong> of all their units in that line.</p>
                <p>Bonuses and penalties from statuses are applied.</p>
            </div>
        ),
        demoConfig: [1, 1, 1, null, null, null, null, null, null] // A row of blue cards
    },
    {
        id: 'draw',
        title: '10. Draw Phase',
        content: (
            <div className="text-left">
                <p>Each player draws cards from their deck until they have <strong>6 cards</strong> in hand.</p>
            </div>
        )
    },
    {
        id: 'endgame',
        title: '12. End Game',
        content: (
            <div className="text-left">
                <p>The first player to reach <strong>30 points</strong> triggers the final round.</p>
                <p>Every other player gets one last turn to try and beat that score.</p>
                <p>The player with the highest score wins.</p>
            </div>
        )
    },
    {
        id: 'glossary',
        title: '13. Glossary',
        content: (
            <dl className="space-y-2 text-left">
                <dt className="font-bold text-indigo-400">Priority</dt>
                <dd className="ml-4">The right to act.</dd>
                <dt className="font-bold text-indigo-400">Stack</dt>
                <dd className="ml-4">LIFO queue for resolving actions.</dd>
                <dt className="font-bold text-indigo-400">Command</dt>
                <dd className="ml-4">One-time use card played from hand.</dd>
                <dt className="font-bold text-indigo-400">Unit</dt>
                <dd className="ml-4">Card placed on the battlefield.</dd>
            </dl>
        )
    }
];

/**
 * A simplified 3x3 board for demonstrating rules.
 */
const MiniBoard: React.FC<{ config?: (number | null)[], cardStatuses?: Record<number, { type: string; addedByPlayerId: number }[]> }> = ({ config, cardStatuses }) => {
    // Default empty board if no config
    const cells = config || Array(9).fill(null);

    return (
        <div className="bg-board-bg p-2 rounded-lg shadow-xl aspect-square w-full max-w-[400px] mx-auto grid grid-cols-3 grid-rows-3 gap-1">
            {cells.map((ownerId, index) => {
                const card = ownerId ? createDummyCard(ownerId) : null;
                if (card && cardStatuses && cardStatuses[index]) {
                    card.statuses = cardStatuses[index];
                }

                return (
                    <div key={index} className="bg-board-cell rounded flex items-center justify-center relative">
                        {card ? (
                            <div className="w-full h-full p-0.5">
                                <Card 
                                    card={card} 
                                    isFaceUp={true} 
                                    playerColorMap={DUMMY_COLOR_MAP} 
                                    localPlayerId={1} // Assume viewer is Player 1
                                />
                            </div>
                        ) : (
                            <div className="w-1 h-1 bg-gray-600 rounded-full opacity-20"></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/**
 * The main Rules & Tutorial Modal component.
 */
export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(RULES[0].id);

    const activeSection = useMemo(() => RULES.find(r => r.id === activeSectionId) || RULES[0], [activeSectionId]);

    // Preload images when the modal is opened
    useEffect(() => {
        if (isOpen) {
            const imagesToLoad = [
                RIOT_AGENT_IMG,
                PRINCEPS_IMG,
                RIOT_AGENT_FALLBACK,
                PRINCEPS_FALLBACK
            ];

            imagesToLoad.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]" onClick={onClose}>
            <div className="bg-gray-900 w-[95vw] h-[90vh] rounded-xl shadow-2xl flex overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
                
                {/* Left Panel: Navigation */}
                <div className="w-1/4 min-w-[250px] bg-gray-800 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-700 bg-gray-800">
                        <h2 className="text-xl font-bold text-white">Encyclopedia</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {RULES.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSectionId(section.id)}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                                    activeSectionId === section.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-700">
                        <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition-colors">
                            Close Rules
                        </button>
                    </div>
                </div>

                {/* Center Panel: Text Content */}
                <div className="w-2/5 p-8 overflow-y-auto border-r border-gray-700 bg-gray-900 text-left">
                    <h1 className="text-3xl font-bold text-white mb-6 border-b border-indigo-500 pb-2 inline-block">
                        {activeSection.title}
                    </h1>
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed text-left">
                        {activeSection.content}
                    </div>
                </div>

                {/* Right Panel: Visual Demo */}
                <div className="w-[35%] bg-gray-800 flex flex-col items-center justify-center p-8 relative">
                    <h3 className="absolute top-6 left-0 right-0 text-center text-gray-400 text-sm uppercase tracking-widest font-bold">
                        Visual Demonstration
                    </h3>
                    
                    <div className="w-full">
                        <MiniBoard 
                            config={activeSection.demoConfig} 
                            cardStatuses={activeSection.demoCardStatuses} 
                        />
                    </div>

                    <div className="mt-8 text-center text-gray-500 text-sm italic max-w-xs">
                        Example of the rule in action on a 3x3 grid snippet. <br/>
                        <span className="text-blue-400 font-bold">Riot Agent</span> = Friendly, <span className="text-red-400 font-bold">Princeps</span> = Enemy.
                    </div>
                </div>

            </div>
        </div>
    );
};