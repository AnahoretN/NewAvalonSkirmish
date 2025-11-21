/**
 * @file Defines constants and utility functions used across the application.
 */

import type { Card, DeckType, PlayerColor } from './types';
import { DeckType as DeckTypeEnum } from './types';

/**
 * A mapping of deck types to their thematic properties, like color and ID prefix.
 */
export const DECK_THEMES: { [key in DeckType]: { prefix: string, color: string } } = {
    [DeckTypeEnum.SynchroTech]: { prefix: 'SYN', color: 'border-cyan-400' },
    [DeckTypeEnum.Hoods]: { prefix: 'HOO', color: 'border-purple-500' },
    [DeckTypeEnum.Optimates]: { prefix: 'OPT', color: 'border-red-500' },
    [DeckTypeEnum.Fusion]: { prefix: 'FUS', color: 'border-green-400' },
    [DeckTypeEnum.Command]: { prefix: 'CMD', color: 'border-yellow-500' },
    [DeckTypeEnum.Tokens]: { prefix: 'TKN', color: 'border-gray-400' },
    [DeckTypeEnum.Custom]: { prefix: 'CUS', color: 'border-purple-400' },
};

/**
 * Defines the available player colors and their corresponding Tailwind CSS classes.
 */
export const PLAYER_COLORS: { [key in PlayerColor]: { bg: string, border: string, outline: string } } = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500', outline: 'outline-blue-500' },
  cyan: { bg: 'bg-cyan-400', border: 'border-cyan-400', outline: 'outline-cyan-400' },
  red: { bg: 'bg-red-500', border: 'border-red-500', outline: 'outline-red-500' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-500', outline: 'outline-orange-500' },
  green: { bg: 'bg-green-500', border: 'border-green-500', outline: 'outline-green-500' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500', outline: 'outline-purple-500' },
  pink: { bg: 'bg-pink-400', border: 'border-pink-400', outline: 'outline-pink-400' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-400', outline: 'outline-yellow-400' },
};

/**
 * An array of all available player color names.
 */
export const PLAYER_COLOR_NAMES = Object.keys(PLAYER_COLORS) as PlayerColor[];

/**
 * Image URLs for status icons.
 */
export const STATUS_ICONS: Record<string, string> = {
    'Aim': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478810/Aim_dcct45.png',
    'Exploit': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478810/Exploit_foomty.png',
    'LastPlayed': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478810/LastPlayed_bfkbwb.png',
    'Revealed': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478811/Revealed_w1gbe7.png',
    'Shield': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478810/Shield_z9sjr1.png',
    'Stun': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478811/Stun_cwqroz.png',
    'Support': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478809/Support_ui9qpl.png',
    'Threat': 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763478809/Threat_i1pbko.png',
};

/**
 * Descriptions for various status effects and counters.
 */
export const STATUS_DESCRIPTIONS: Record<string, string> = {
    'Aim': 'This counter has no effect on its own, but it can modify the abilities of cards. This card is easier to destroy.',
    'Exploit': 'This counter has no effect on its own, but it can modify the abilities of cards. Hacker and Programmer cards will have a greater effect on this card.',
    'LastPlayed': 'This card was last played by its owner.',
    'Revealed': "This card's face is visible to the owner of the counter revealed.",
    'Shield': 'If an effect attempts to destroy this card, remove 1 shield counter from it instead.',
    'Stun': 'If this card attempts to gain points, move, use an interpath, or use an activated or triggered ability, remove 1 stun counter from it instead.',
    'Support': 'This counter has no effect on its own, but it can modify the abilities of cards. This card is adjacent to its ally.',
    'Threat': "This counter has no effect on its own, but it can modify the abilities of cards. This card is surrounded and pinned to the edge of the battlefield by an opponent's cards.",
    'Power+': 'Increases the power of the card by 1.',
    'Power-': 'Decreases the power of the card by 1.',
};

/**
 * Available counters for the Counters Modal.
 */
export const AVAILABLE_COUNTERS = [
    { type: 'Aim', label: 'Aim' },
    { type: 'Exploit', label: 'Exploit' },
    { type: 'Shield', label: 'Shield' },
    { type: 'Stun', label: 'Stun' },
    { type: 'Support', label: 'Support' },
    { type: 'Threat', label: 'Threat' },
    { type: 'Power+', label: '+P' },
    { type: 'Power-', label: '-P' },
];

/**
 * An array of predefined counter items that can be placed on cards.
 */
export const COUNTERS: Card[] = [
    { id: 'CTR_BLUE', deck: 'counter', name: 'Blue Counter', imageUrl: '', fallbackImage: '', power: 0, ability: '', color: 'bg-blue-500' },
    { id: 'CTR_PURPLE', deck: 'counter', name: 'Purple Counter', imageUrl: '', fallbackImage: '', power: 0, ability: '', color: 'bg-purple-500' },
    { id: 'CTR_RED', deck: 'counter', name: 'Red Counter', imageUrl: '', fallbackImage: '', power: 0, ability: '', color: 'bg-red-500' },
    { id: 'CTR_GREEN', deck: 'counter', name: 'Green Counter', imageUrl: '', fallbackImage: '', power: 0, ability: '', color: 'bg-green-500' },
];

/**
 * Shuffles an array of cards using the Fisher-Yates (aka Knuth) shuffle algorithm.
 * This function is pure; it returns a new shuffled array without modifying the original.
 * @param deck The array of cards to shuffle.
 * @returns A new array containing the same cards in a random order.
 */
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * A mapping of player IDs to their fixed positions on the screen.
 * Top positions are calculated as Header Height (h-14 = 56px) + 3px gap = 59px.
 * Bottom positions are simply 3px from bottom.
 */
export const PLAYER_POSITIONS: { [key: number]: string } = {
  1: 'top-[59px] left-2',
  2: 'top-[59px] right-2',
  3: 'bottom-[3px] left-2',
  4: 'bottom-[3px] right-2',
};