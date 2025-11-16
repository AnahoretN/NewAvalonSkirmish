import { DeckType } from "../types.js";
import type { DeckFile } from "./types.js";

const hoods: DeckFile = {
    id: DeckType.Hoods,
    name: 'Hoods',
    isSelectable: true,
    cards: [
        { cardId: 'recklessProvocateur', quantity: 2 },
        { cardId: 'dataLiberator', quantity: 2 },
        { cardId: 'cautiousAvenger', quantity: 2 },
        { cardId: 'vigilantSpotter', quantity: 2 },
        { cardId: 'inventiveMaker', quantity: 2 },
        { cardId: 'overwatch', quantity: 1 },
        { cardId: 'repositioning', quantity: 1 },
        { cardId: 'mobilization', quantity: 1 },
        { cardId: 'inspiration', quantity: 1 },
        { cardId: 'dataInterception', quantity: 1 },
    ]
};

export default hoods;