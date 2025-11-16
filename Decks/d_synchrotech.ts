import { DeckType } from "../types.js";
import type { DeckFile } from "./types.js";

const synchrotech: DeckFile = {
    id: DeckType.SynchroTech,
    name: 'SynchroTech',
    isSelectable: true,
    cards: [
        { cardId: 'ipDeptAgent', quantity: 2 },
        { cardId: 'tacticalAgent', quantity: 2 },
        { cardId: 'patrolAgent', quantity: 2 },
        { cardId: 'riotAgent', quantity: 2 },
        { cardId: 'threatAnalyst', quantity: 2 },
        { cardId: 'overwatch', quantity: 1 },
        { cardId: 'repositioning', quantity: 1 },
        { cardId: 'mobilization', quantity: 1 },
        { cardId: 'inspiration', quantity: 1 },
        { cardId: 'dataInterception', quantity: 1 },
    ]
};

export default synchrotech;