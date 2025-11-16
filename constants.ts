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
export const PLAYER_COLORS: { [key in PlayerColor]: { bg: string, border: string } } = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500' },
  cyan: { bg: 'bg-cyan-400', border: 'border-cyan-400' },
  red: { bg: 'bg-red-500', border: 'border-red-500' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-500' },
  green: { bg: 'bg-green-500', border: 'border-green-500' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500' },
  pink: { bg: 'bg-pink-400', border: 'border-pink-400' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-400' },
};

/**
 * An array of all available player color names.
 */
export const PLAYER_COLOR_NAMES = Object.keys(PLAYER_COLORS) as PlayerColor[];


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
 */
export const PLAYER_POSITIONS: { [key: number]: string } = {
  1: 'top-16 left-2',
  2: 'top-16 right-2',
  3: 'bottom-2 left-2',
  4: 'bottom-2 right-2',
};