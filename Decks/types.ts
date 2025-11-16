import type { DeckType } from "../types.js";

export interface DeckCardEntry {
    cardId: string;
    quantity: number;
}

export interface DeckFile {
    id: DeckType;
    name: string;
    isSelectable: boolean;
    cards: DeckCardEntry[];
}