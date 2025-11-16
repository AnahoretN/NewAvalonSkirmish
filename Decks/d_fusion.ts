import { DeckType } from "../types.js";
import type { DeckFile } from "./types.js";

const fusion: DeckFile = {
    id: DeckType.Fusion,
    name: 'Fusion',
    isSelectable: true,
    cards: [
        { cardId: 'codeKeeper', quantity: 2 },
        { cardId: 'devoutSynthetic', quantity: 2 },
        { cardId: 'unwaveringIntegrator', quantity: 2 },
        { cardId: 'signalProphet', quantity: 2 },
        { cardId: 'zealousMissionary', quantity: 2 },
        { cardId: 'overwatch', quantity: 1 },
        { cardId: 'repositioning', quantity: 1 },
        { cardId: 'mobilization', quantity: 1 },
        { cardId: 'inspiration', quantity: 1 },
        { cardId: 'dataInterception', quantity: 1 },
    ]
};

export default fusion;