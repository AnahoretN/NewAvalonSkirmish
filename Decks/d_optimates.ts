import { DeckType } from "../types.js";
import type { DeckFile } from "./types.js";

const optimates: DeckFile = {
    id: DeckType.Optimates,
    name: 'Optimates',
    isSelectable: true,
    cards: [
        { cardId: 'faber', quantity: 2 },
        { cardId: 'censor', quantity: 2 },
        { cardId: 'princeps', quantity: 2 },
        { cardId: 'immunis', quantity: 2 },
        { cardId: 'centurion', quantity: 2 },
        { cardId: 'overwatch', quantity: 1 },
        { cardId: 'repositioning', quantity: 1 },
        { cardId: 'mobilization', quantity: 1 },
        { cardId: 'inspiration', quantity: 1 },
        { cardId: 'dataInterception', quantity: 1 },
    ]
};

export default optimates;