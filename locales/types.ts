export type LanguageCode = 'en' | 'ru' | 'de' | 'fr' | 'it' | 'pt' | 'zh' | 'hi' | 'es' | 'ar' | 'uk' | 'be' | 'tt' | 'sr';

export interface CardTranslation {
  name: string;
  ability: string;
  flavorText?: string;
}

export interface CounterTranslation {
  name: string;
  description: string;
}

export interface TranslationResource {
  ui: {
    startGame: string;
    joinGame: string;
    deckBuilding: string;
    rules: string;
    settings: string;
    language: string;
    serverAddress: string;
    saveApply: string;
    cancel: string;
    close: string;
    tokens: string;
    counters: string;
    phase: string;
    autoAbility: string;
    newGame: string;
    exit: string;
    surrender: string;
    mode: string;
    size: string;
    dummies: string;
    spectatorMode: string;
    spectatorMsg: string;
    readyCheck: string;
    imReady: string;
    waiting: string;
    cancelStart: string;
    assignTeams: string;
    confirmTeams: string;
    unassigned: string;
    team: string;
    deck: string;
    discard: string;
    showcase: string;
    customDeck: string;
    loadDeck: string;
    clear: string;
    save: string;
    filter: string;
    currentDeck: string;
    emptyDeck: string;
    clickToAdd: string;
    view: string;
    play: string;
    playFaceDown: string;
    toHand: string;
    toDiscard: string;
    revealToAll: string;
    requestReveal: string;
    flipUp: string;
    flipDown: string;
  };
  rules: {
    title: string;
    conceptTitle: string;
    conceptText: string;
    winConditionTitle: string;
    winConditionText: string;
    fieldTitle: string;
    fieldText: string;
    setupTitle: string;
    setupText: string;
    abilitiesTitle: string;
    abilitiesText: string;
    statusesTitle: string;
    statusesText: string;
    countersTitle: string;
    countersText: string;
    turnTitle: string;
    turnText: string;
    mechanicsTitle: string;
    mechanicsText: string;
    creditsTitle: string;
    creditsText: string;
  };
  cards: Record<string, CardTranslation>;
  counters: Record<string, CounterTranslation>;
}