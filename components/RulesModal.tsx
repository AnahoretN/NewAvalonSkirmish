/**
 * @file Renders a comprehensive Rules & Tutorial modal acting as an interactive encyclopedia.
 */
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import type { Card as CardType, PlayerColor } from '../types';
import { DeckType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PLAYER_COLORS } from '../constants';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Constants for Demo ---
const RIOT_AGENT_IMG = "https://res.cloudinary.com/dxxh6meej/image/upload/v1763253337/SYN_RIOT_AGENT_jurf4t.png";
const RIOT_AGENT_FALLBACK = "/images/cards/SYN_RIOT_AGENT.png";

const DEMO_CARDS: Record<string, CardType> = {
    riot: {
        id: 'demo_riot',
        name: "Riot Agent",
        deck: DeckType.SynchroTech,
        power: 3,
        imageUrl: RIOT_AGENT_IMG,
        fallbackImage: RIOT_AGENT_FALLBACK,
        ability: "Deploy: Push an adjacent card 1 cell.\nCommit: Stun an adjacent opponent card with threat.",
        types: ["Unit", "SynchroTech"],
        faction: "SynchroTech",
        ownerId: 1
    },
    princeps: {
        id: 'demo_princeps',
        name: "Princeps",
        deck: DeckType.Optimates,
        power: 3,
        imageUrl: "https://res.cloudinary.com/dxxh6meej/image/upload/v1763253332/OPT_PRINCEPS_w3o5lq.png",
        fallbackImage: "/images/cards/OPT_PRINCEPS.png",
        ability: "Deploy: Shield 1. Aim a card with threat.",
        types: ["Unit", "Optimates"],
        faction: "Optimates",
        ownerId: 2
    }
};

const DUMMY_COLOR_MAP = new Map<number, PlayerColor>([
    [1, 'blue'],
    [2, 'red'],
]);

// --- Text Formatter ---
const formatRuleText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-indigo-300">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// --- Visual Sub-Components ---

const VisualWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full h-full bg-board-bg/50 rounded-xl shadow-inner border-2 border-gray-600/50 flex items-center justify-center overflow-hidden relative p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>
        {children}
    </div>
);

const AnatomyVisual = () => {
    return (
        <VisualWrapper>
            <div className="scale-[3.5] origin-center relative">
                 <Card card={DEMO_CARDS.riot} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip />
                 
                 {/* Power Label */}
                 <div className="absolute -top-4 -left-12 flex items-center animate-bounce">
                     <span className="bg-gray-900 text-white text-[5px] font-bold px-1 py-0.5 rounded border border-yellow-500 mr-1 shadow-md">Power</span>
                     <div className="w-4 h-px bg-yellow-500"></div>
                 </div>

                 {/* Name Label */}
                 <div className="absolute top-8 -right-20 flex items-center">
                     <div className="w-4 h-px bg-indigo-400"></div>
                     <span className="bg-gray-900 text-white text-[5px] font-bold px-1 py-0.5 rounded border border-indigo-400 ml-1 shadow-md">Name</span>
                 </div>

                 {/* Ability Label */}
                 <div className="absolute bottom-4 -right-20 flex items-center">
                     <div className="w-4 h-px bg-green-400"></div>
                     <span className="bg-gray-900 text-white text-[5px] font-bold px-1 py-0.5 rounded border border-green-400 ml-1 shadow-md">Abilities</span>
                 </div>
            </div>
        </VisualWrapper>
    );
};

const SupportVisual = () => {
    return (
        <VisualWrapper>
            <div className="grid grid-cols-3 gap-1 w-56 aspect-square mx-auto scale-[1.8] origin-center">
                {/* Row 0 */}
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/50 rounded relative shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-full h-full p-0.5">
                            <Card card={{...DEMO_CARDS.riot, id: 's1'}} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip />
                         </div>
                    </div>
                    {/* Connection Line */}
                    <div className="absolute -bottom-2 left-1/2 w-1 h-4 bg-green-500 z-20 transform -translate-x-1/2 shadow-[0_0_8px_#22c55e]"></div>
                </div>
                <div className="bg-board-cell/30 rounded"></div>

                {/* Row 1 */}
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/50 rounded relative ring-2 ring-green-500 shadow-[0_0_15px_#22c55e] z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-full h-full p-0.5">
                            <Card 
                                card={{...DEMO_CARDS.riot, id: 's2', statuses: [{type: 'Support', addedByPlayerId: 1}]}} 
                                isFaceUp={true} 
                                playerColorMap={DUMMY_COLOR_MAP} 
                                localPlayerId={1} 
                                disableTooltip
                                smallStatusIcons
                            />
                         </div>
                    </div>
                </div>
                <div className="bg-board-cell/30 rounded"></div>

                {/* Row 2 */}
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                <span className="text-green-300 font-black text-2xl bg-gray-900/90 px-4 py-2 rounded-xl border-2 border-green-500 shadow-xl backdrop-blur-sm">
                    SUPPORT
                </span>
            </div>
        </VisualWrapper>
    );
};

const ThreatVisual = () => {
    return (
        <VisualWrapper>
            <div className="grid grid-cols-3 gap-1 w-56 aspect-square mx-auto scale-[1.8] origin-center">
                {/* Row 1 */}
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>

                {/* Row 2: Enemy - Ally - Enemy */}
                <div className="bg-board-cell/50 rounded relative">
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-full h-full p-0.5">
                            <Card card={{...DEMO_CARDS.princeps, id: 't1'}} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip />
                         </div>
                    </div>
                    {/* Arrow Right */}
                    <div className="absolute top-1/2 -right-3 w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-red-600 border-b-[8px] border-b-transparent transform -translate-y-1/2 z-20 filter drop-shadow-md"></div>
                </div>

                <div className="bg-board-cell/50 rounded relative ring-4 ring-red-600 shadow-[0_0_20px_#dc2626] animate-pulse z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-full h-full p-0.5">
                            <Card 
                                card={{...DEMO_CARDS.riot, id: 't2', statuses: [{type: 'Threat', addedByPlayerId: 2}]}} 
                                isFaceUp={true} 
                                playerColorMap={DUMMY_COLOR_MAP} 
                                localPlayerId={1} 
                                disableTooltip
                                smallStatusIcons
                            />
                         </div>
                    </div>
                </div>

                <div className="bg-board-cell/50 rounded relative">
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-full h-full p-0.5">
                            <Card card={{...DEMO_CARDS.princeps, id: 't3'}} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip />
                         </div>
                    </div>
                    {/* Arrow Left */}
                    <div className="absolute top-1/2 -left-3 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-red-600 border-b-[8px] border-b-transparent transform -translate-y-1/2 z-20 filter drop-shadow-md"></div>
                </div>

                {/* Row 3 */}
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>
                <div className="bg-board-cell/30 rounded"></div>
            </div>
             <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                <span className="text-red-400 font-black text-2xl bg-gray-900/90 px-4 py-2 rounded-xl border-2 border-red-500 shadow-xl backdrop-blur-sm">
                    THREATENED
                </span>
            </div>
        </VisualWrapper>
    );
};

const GridLinesVisual = () => {
    return (
        <VisualWrapper>
             <div className="grid grid-cols-4 gap-1 w-64 aspect-square relative scale-[2.2] origin-center">
                 {/* Background Cells */}
                 {Array.from({length: 16}).map((_, i) => (
                     <div key={i} className="bg-board-cell/40 rounded border border-white/5"></div>
                 ))}
                 
                 {/* Highlight Row */}
                 <div className="absolute top-[25%] left-0 right-0 h-[25%] bg-yellow-500/30 border-y-2 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)] pointer-events-none flex items-center justify-end px-2 z-10">
                     <span className="text-[8px] font-black text-yellow-200 uppercase tracking-wider drop-shadow-md">Row</span>
                 </div>

                 {/* Highlight Col */}
                 <div className="absolute top-0 bottom-0 left-[50%] w-[25%] bg-indigo-500/30 border-x-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] pointer-events-none flex items-end justify-center py-2 z-10">
                      <span className="text-[8px] font-black text-indigo-200 uppercase tracking-wider whitespace-nowrap drop-shadow-md mb-1">Column</span>
                 </div>
             </div>
        </VisualWrapper>
    );
};

const DeployVisual = () => {
    return (
         <VisualWrapper>
             <div className="scale-[2.8] origin-center flex flex-col items-center gap-6">
                 {/* Hand */}
                 <div className="flex gap-1 p-1.5 bg-gray-900 rounded-xl border-2 border-gray-600 shadow-xl relative">
                     <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-700 text-[5px] font-bold text-white px-2 py-0.5 rounded-full border border-gray-500 uppercase tracking-wide">Hand</div>
                     <div className="w-10 h-10 opacity-40 blur-[0.5px]"><Card card={DEMO_CARDS.riot} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip/></div>
                     <div className="w-10 h-10 transform -translate-y-3 scale-110 z-20 shadow-2xl ring-1 ring-white"><Card card={DEMO_CARDS.riot} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip/></div>
                     <div className="w-10 h-10 opacity-40 blur-[0.5px]"><Card card={DEMO_CARDS.riot} isFaceUp={true} playerColorMap={DUMMY_COLOR_MAP} localPlayerId={1} disableTooltip/></div>
                 </div>
                 
                 {/* Arrow */}
                 <div className="text-indigo-400 animate-bounce filter drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M12 5v14M19 12l-7 7-7-7" />
                     </svg>
                 </div>

                 {/* Board Slot */}
                 <div className="w-14 h-14 bg-board-cell rounded-lg border-2 border-dashed border-indigo-400/50 flex items-center justify-center shadow-inner">
                     <span className="text-[6px] font-bold text-indigo-300 uppercase tracking-widest">Deploy Here</span>
                 </div>
             </div>
         </VisualWrapper>
    );
};


export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const { resources, t } = useLanguage();
    const r = resources.rules;

    const SECTIONS = [
        { id: 'concept', title: r.conceptTitle, text: r.conceptText, visual: <AnatomyVisual /> },
        { id: 'winCondition', title: r.winConditionTitle, text: r.winConditionText, visual: <VisualWrapper><div className="text-center text-yellow-400 font-black text-8xl font-mono bg-gray-900 p-10 rounded-3xl border-8 border-yellow-500 shadow-[0_0_50px_#eab308] scale-[1.5]">30 <div className="text-lg font-bold text-gray-400 font-sans mt-2 uppercase tracking-widest">Points</div></div></VisualWrapper> },
        { id: 'field', title: r.fieldTitle, text: r.fieldText, visual: <GridLinesVisual /> },
        { id: 'setup', title: r.setupTitle, text: r.setupText, visual: <DeployVisual /> },
        { id: 'statuses', title: r.statusesTitle, text: r.statusesText, visual: <SupportVisual /> },
        { id: 'counters', title: r.countersTitle, text: r.countersText, visual: null },
        { id: 'turn', title: r.turnTitle, text: r.turnText, visual: null },
        { id: 'mechanics', title: r.mechanicsTitle, text: r.mechanicsText, visual: <ThreatVisual /> },
        { id: 'credits', title: r.creditsTitle, text: r.creditsText, visual: null },
    ];

    const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);
    const activeSection = useMemo(() => SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0], [activeSectionId, SECTIONS]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100]" onClick={onClose}>
            <div className="bg-gray-900 w-[95vw] h-[90vh] rounded-xl shadow-2xl flex overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
                
                {/* Navigation Sidebar */}
                <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-gray-700 bg-gray-850">
                        <h2 className="text-xl font-bold text-indigo-400 tracking-wide">{r.title}</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {SECTIONS.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSectionId(section.id)}
                                className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 text-sm font-medium flex items-center justify-between ${
                                    activeSectionId === section.id 
                                    ? 'bg-indigo-600 text-white shadow-lg translate-x-1' 
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                }`}
                            >
                                <span className="truncate">{section.title}</span>
                                {activeSectionId === section.id && <span className="text-indigo-300">▶</span>}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-700">
                        <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition-colors uppercase text-sm tracking-wider">
                            {t('close')}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden bg-gray-900">
                    
                    {/* Text Pane */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="max-w-2xl mx-auto">
                            <h1 className="text-3xl font-black text-white mb-8 pb-4 border-b-2 border-indigo-500/50">
                                {activeSection.title}
                            </h1>
                            <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {formatRuleText(activeSection.text)}
                            </div>
                        </div>
                    </div>

                    {/* Visual Pane (Desktop Only) */}
                    <div className="hidden md:flex w-[40%] bg-gray-850 border-l border-gray-700 flex-col items-center justify-center p-6 relative overflow-hidden">
                        <h3 className="absolute top-4 text-center text-gray-500 text-xs uppercase tracking-[0.3em] font-bold z-20 opacity-70">
                            Visual Example
                        </h3>
                        
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {activeSection.visual ? (
                                activeSection.visual
                            ) : (
                                <div className="text-gray-600 italic flex flex-col items-center opacity-40">
                                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    No visual available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};