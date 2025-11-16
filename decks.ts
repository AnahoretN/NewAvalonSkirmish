/**
 * @file This file dynamically constructs the complete deck data from the modular definition files
 * located in the `Decks/` directory. It serves as the single source of truth for playable decks
 * for both the client-side application and the server-side logic (via the generated decks.json).
 */

// FIX: Changed `import type` to a value import for `DeckType` because it's an enum used at runtime.
import { DeckType, type Card } from './types.js';
import { cardDatabase } from './Decks/cards.js';
import { tokenDatabase } from './Decks/tokens.js';
import type { CardDefinition } from './Decks/cards.js';
// FIX: Changed import path to be more explicit to avoid module resolution confusion between the `decks.ts` file and the `Decks/` directory, which was causing circular dependency and casing errors.
import { deckFiles as df } from './Decks/index.js';

type DecksData = Record<DeckType, Card[]>;

// A set of card IDs that are considered "Command" cards.
export const commandCardIds = new Set([
    'overwatch',
    'repositioning',
    'mobilization',
    'inspiration',
    'dataInterception',
]);

export const deckFiles = df;

/**
 * Processes the modular deck files into a complete, playable deck data structure.
 * It combines card definitions with deck lists, expands card quantities,
 * and generates unique, dynamic IDs for each card instance. This function intelligently
 * identifies command cards within the deck lists and assigns them the correct properties.
 * @returns {DecksData} The fully constructed deck data object.
 */
function buildDecksData(): DecksData {
    const builtDecks = {} as DecksData;

    for (const deckFile of deckFiles) {
        const deckCardList: Card[] = [];

        // Iterate through the card list in the deck definition file
        for (const deckEntry of deckFile.cards) {
            const cardDef = cardDatabase.get(deckEntry.cardId);
            if (!cardDef) {
                console.warn(`Card definition not found for ID: ${deckEntry.cardId} in deck: ${deckFile.name}`);
                continue;
            }

            const isCommandCard = commandCardIds.has(deckEntry.cardId);

            // Add the specified quantity of each card to the deck
            for (let i = 0; i < deckEntry.quantity; i++) {
                const cardKey = deckEntry.cardId.toUpperCase().replace(/-/g, '_');
                
                if (isCommandCard) {
                    // Command cards get a special deck type and ID format.
                    // The quantity is expected to be 1, so no index is needed for the ID.
                    deckCardList.push({
                        ...cardDef,
                        deck: DeckType.Command,
                        id: `CMD_${cardKey}`,
                    });
                } else {
                    // Standard faction cards get a faction-specific deck type and a unique ID per instance.
                    deckCardList.push({
                        ...cardDef,
                        deck: deckFile.id,
                        id: `${deckFile.id.substring(0, 3).toUpperCase()}_${cardKey}_${i + 1}`,
                    });
                }
            }
        }
        
        builtDecks[deckFile.id] = deckCardList;
    }

    // Ensure Command and Tokens decks are included, even if empty or special
    builtDecks[DeckType.Command] = [];
    builtDecks[DeckType.Tokens] = Array.from(tokenDatabase.values()).map(tokenDef => ({
         id: `TKN_${tokenDef.name.toUpperCase().replace(/\s/g, '_')}`,
         deck: DeckType.Tokens,
         name: tokenDef.name,
         imageUrl: tokenDef.imageUrl,
         fallbackImage: tokenDef.fallbackImage,
         power: tokenDef.power,
         ability: tokenDef.ability,
         color: tokenDef.color,
    }));


    return builtDecks;
}

export const decksData: DecksData = buildDecksData();

/**
 * A utility function to get all selectable deck definitions for the UI.
 * @returns An array of deck file definitions that are marked as selectable.
 */
export const getSelectableDecks = () => {
    return deckFiles.filter(df => df.isSelectable);
};

/**
 * Retrieves a card's base definition by its ID.
 * @param {string} cardId The ID of the card (e.g., 'ipDeptAgent').
 * @returns {CardDefinition | undefined} The card definition or undefined if not found.
 */
export function getCardDefinition(cardId: string): CardDefinition | undefined {
    return cardDatabase.get(cardId);
}

/**
 * Retrieves a list of all non-token cards for use in the deck builder library.
 * @returns An array of objects, each containing the card's ID and its definition.
 */
export function getAllCards(): { id: string, card: CardDefinition }[] {
    return Array.from(cardDatabase.entries()).map(([id, card]) => ({ id, card }));
}