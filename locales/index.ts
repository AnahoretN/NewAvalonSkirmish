import { TranslationResource, LanguageCode, CardTranslation, CounterTranslation } from './types';
import { ru } from './ru';
import { cardDatabase, tokenDatabase, countersDatabase } from '../contentDatabase';

// --- Static English UI & Rules Definitions ---

const enUI = {
    startGame: "Start Game",
    joinGame: "Join Game",
    deckBuilding: "Deck Building",
    rules: "Rules & Tutorial",
    settings: "Settings",
    language: "Language",
    serverAddress: "Server Address",
    saveApply: "Save & Apply",
    cancel: "Cancel",
    close: "Close",
    tokens: "Tokens",
    counters: "Counters",
    phase: "Phase",
    autoAbility: "Auto-Ability",
    newGame: "New Game",
    exit: "Exit",
    surrender: "Surrender",
    mode: "Mode",
    size: "Size",
    dummies: "Dummies",
    spectatorMode: "Spectator Mode",
    spectatorMsg: "You are watching the game.",
    readyCheck: "Ready to Start?",
    imReady: "I'm Ready",
    waiting: "Waiting...",
    cancelStart: "Cancel Start",
    assignTeams: "Assign Teams",
    confirmTeams: "Confirm Teams & Start",
    unassigned: "Unassigned Players",
    team: "Team",
    deck: "DECK",
    discard: "DISCARD",
    showcase: "Showcase",
    customDeck: "Custom Deck",
    loadDeck: "Load",
    clear: "Clear",
    save: "Save",
    filter: "Filter",
    currentDeck: "Current Deck",
    emptyDeck: "Your deck is empty.",
    clickToAdd: "Click cards on the left to add them.",
    view: "View",
    play: "Play",
    playFaceDown: "Play Face Down",
    toHand: "To Hand",
    toDiscard: "To Discard",
    revealToAll: "Reveal to All",
    requestReveal: "Request Reveal",
    flipUp: "Flip Face Up",
    flipDown: "Flip Face Down"
};

const enRules = {
    title: "",
    conceptTitle: "",
    conceptText: "",
    winConditionTitle: "",
    winConditionText: "",
    fieldTitle: "",
    fieldText: "",
    setupTitle: "",
    setupText: "",
    abilitiesTitle: "",
    abilitiesText: "",
    statusesTitle: "",
    statusesText: "",
    countersTitle: "",
    countersText: "",
    turnTitle: "",
    turnText: "",
    mechanicsTitle: "",
    mechanicsText: "",
    creditsTitle: "",
    creditsText: ""
};

// Build English Card Translations
const enCards: Record<string, CardTranslation> = {};
cardDatabase.forEach((def, id) => {
    enCards[id] = {
        name: def.name,
        ability: def.ability,
        flavorText: def.flavorText
    };
});
tokenDatabase.forEach((def, id) => {
    enCards[id] = {
        name: def.name,
        ability: def.ability,
        flavorText: def.flavorText
    };
});

// Build English Counter Translations
const enCounters: Record<string, CounterTranslation> = {};
Object.entries(countersDatabase).forEach(([key, def]) => {
    enCounters[key] = {
        name: def.name,
        description: def.description
    };
});

const en: TranslationResource = {
    ui: enUI,
    rules: enRules,
    cards: enCards,
    counters: enCounters
};

export const resources: Record<LanguageCode, TranslationResource> = {
    en,
    ru,
    de: en, fr: en, it: en, pt: en, zh: en, hi: en, es: en, ar: en, uk: en, be: en, tt: en, sr: en
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: 'English',
    ru: 'Русский',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
    pt: 'Português',
    zh: '中文',
    hi: 'हिन्दी',
    es: 'Español',
    ar: 'العربية',
    uk: 'Українська',
    be: 'Беларуская',
    tt: 'Татарча',
    sr: 'Српски'
};