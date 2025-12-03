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
    title: "Game Rules: \"New Avalon: Skirmish\"",
    conceptTitle: "I. General Concept",
    conceptText: "**Genre & Role:** New Avalon: Skirmish is a fast-paced tactical duel card game played on a restricted grid battlefield. Players act as faction leaders, deploying Units and Commands to seize control of key lines.\n\n**Explanation:** The game focuses on positional control and the timing of ability activation rather than just direct attacks. Victory is achieved by accumulating Victory Points (VP) based on the power of your units in selected lines.",
    winConditionTitle: "II. Victory Conditions",
    winConditionText: "**Match Victory:** A match is played until a player wins 2 rounds. The first player to reach 2 round wins immediately wins the match.\n**Match Draw:** If multiple players reach 2 round wins simultaneously after any round, they are all declared match winners.\n\n**Round Victory (Thresholds & Limits):** A round ends as soon as one or more players reach the Victory Point (VP) threshold, or after the 5th turn is completed.\n**Turn Limit:** Each round is limited to 5 full turns per player. If the VP threshold is not met, a final scoring occurs at the end of Turn 5 to determine the winner.\n\n**Thresholds:**\n- Round 1: 20 Victory Points (VP).\n- Round 2: 30 Victory Points (VP).\n- Round 3+: Threshold increases by +10 VP from the previous round (e.g., Round 3 is 40 VP).\n\n**Determining Round Winner:** The winner is the player who hits the threshold first, or the player with the highest VP after the turn limit.\n**Round Draw:** If two or more players have the same highest score at the end of a round, they all are declared winners of that round.",
    fieldTitle: "III. Game Board & Components",
    fieldText: "**Battlefield (Grid):** The game takes place on a square grid, the size of which depends on the total number of participating players.\n**Sizes:**\n- 2 Players: 5x5 grid.\n- 3 Players: 6x6 grid.\n- 4 Players: 7x7 grid.\n\n**Positioning Definitions:**\n- **Line:** Refers to an entire horizontal Row or vertical Column. Used for the Scoring mechanic.\n- **Adjacency:** Cells are considered adjacent only horizontally and vertically (orthogonally). Diagonal adjacency does not count unless specified otherwise on a card.\n\n**Cards:** Two main types of cards are played from Hand:\n- **Units:** The main combat entities, possessing Power and Abilities. They remain on the battlefield until destroyed.\n- **Commands:** Instant-effect cards. They are played, execute their effect (often offering a \"Choose 1 of 2 options\" choice), and are then sent to the Discard pile.\n\n**Game Zones:**\n- **Hand:** Cards hidden from opponents.\n- **Discard:** The zone where destroyed Units and played Commands go.\n- **Showcase/Announced:** A temporary zone where a Command card is placed before it resolves.",
    setupTitle: "IV. Game Start (Setup)",
    setupText: "**Deck Construction:** Before the match begins, each player selects a faction or builds a deck according to construction rules (minimum 30 cards).\n**Explanation:** Decks are shuffled.\n\n**Starting Hand:** Each player draws 6 cards from their deck to form their starting hand.\n**Hidden Information:** Cards in hand are hidden from opponents.\n\n**First Player Determination:** Determine the first active player by any convenient method (e.g., coin toss).\n**Explanation:** Play proceeds in turn order, starting with the first player. The first player begins their first turn directly in the Setup Phase.",
    statusesTitle: "V. Dynamic Statuses (Positioning)",
    statusesText: "Dynamic statuses are calculated automatically and constantly updated with any change on the board. Units with the Stun status cannot provide or participate in the calculation of these statuses.\n\n**Support:** A unit has the Support status if there is an allied unit in at least one adjacent cell (horizontal or vertical).\n**Stun/Support:** A unit with a Stun token is ignored when calculating Support for adjacent allies.\n**Significance:** Having Support is a condition for activating many powerful abilities, denoted by the syntax **Support ⇒ [Effect]**.\n\n**Threat:** A unit receives the Threat status if it is in a dangerous position created by enemy units.\n**Conditions:** Threat status is assigned in one of two cases:\n1. **Pinned:** The unit is sandwiched between cards of a single opponent on any two sides (two adjacent or two opposite sides).\n2. **Cornered:** The unit is on the edge of the battlefield and has at least one opponent card adjacent to it.\n**Stun/Threat:** A unit with a Stun token is ignored when calculating Threat for adjacent enemies.\n**Significance:** Units under Threat are vulnerable targets for powerful control and destruction abilities.",
    countersTitle: "VI. Counters",
    countersText: "Counters are persistent markers placed by card abilities. They remain on a unit until removed or the unit is destroyed.\n\n**Stun (O):**\n- **Effect:** A Stunned unit generates 0 VP during the Scoring Phase, cannot activate its abilities, and cannot be moved by its owner (but can be moved by opponents).\n- **Removal:** At the end of the Commit Phase, 1 Stun token is automatically removed from every unit owned by the active player.\n\n**Shield (S):**\n- **Effect:** If an ability attempts to Destroy this unit, the destruction effect is prevented, and 1 Shield token is removed instead. The unit remains on the field.\n\n**Revealed & Face-down:**\n- **Revealed:** Allows the player who owns the Revealed token to see the hidden information (face) of the card.\n- **Face-down Explanation:** A card played face-down has 0 Power and no Abilities. If such a card receives a Revealed token, its info becomes visible to the opponent, but it is still mechanically considered Face-down (0 Power, no abilities).\n\n**Special Tokens (Aim, Exploit):**\n- **Aim (A) & Exploit (E):** These tokens act as markers for faction interactions (e.g., Snipers or Hackers). By themselves, they have no inherent game effect.\n\n**Last Played:**\n- **Effect:** A temporary status automatically assigned to the last card played onto the battlefield by the active player this turn. This status determines the line the player must choose for Scoring.",
    turnTitle: "VII. Turn Structure & Timing",
    turnText: "The turn passes from player to player. Card abilities only trigger during their owner's turn. The active player's turn consists of four sequential phases:\n\n**1. Setup Phase:**\n- **Draw Card:** The active player draws 1 card from their deck.\n- **Abilities:** Abilities of all cards on the board with the keyword **Setup:** trigger.\n**Explanation:** This phase is for replenishing the hand and initial unit positioning.\n\n**2. Main Phase (Action / Deploy):**\n- **Main Action:** The active player may perform one of the following:\n  - Play a Unit card (**Deploy:**) from hand to any empty cell. Its **Deploy:** ability triggers immediately.\n  - Play a Command card from hand.\n  - Pass.\n**Command Explanation:** Command cards can be played in any quantity during this phase — before, after, or between unit deployments.\n\n**3. Commit Phase:**\n- **Abilities:** Abilities of all cards on the board with the keyword **Commit:** trigger.\n- **Remove Stun:** At the end of this phase, 1 Stun token is automatically removed from every unit owned by the active player.\n**Explanation:** This phase is used for applying control effects and gaining resources before scoring.\n\n**4. Scoring Phase:**\n- **Line Selection:** The active player must choose one Line (Row or Column) that passes through their card with the **Last Played** status.\n- **Counting:** The Power of all units owned by the active player in the chosen line is summed up, and the total is added to the player's score.",
    mechanicsTitle: "VIII. Conflict Resolution & Key Mechanics",
    mechanicsText: "**Stun & Scoring:**\n- **Effect:** A unit with Stun status or one that is Face-down contributes 0 points during the Scoring Phase, regardless of its base Power, permanent modifiers, or passive abilities that generate points (e.g., Spotter).\n\n**Last Played Transfer:**\n- **Destruction:** If the card with Last Played status leaves the battlefield (destroyed, returned to hand/deck) before the Scoring Phase, the status is transferred to the *previous* card played by that player (the one that was Last Played in the previous turn/action).\n- **Movement:** If the card with Last Played moves to another cell, the player chooses lines based on its new position during Scoring.\n- **Absence:** If a player has no cards on the board with Last Played status, they cannot choose a line and gain no points this turn.\n\n**Unit Movement (Push, Swap):**\n- **Push:** A unit forces another card to move to an adjacent cell. The push is blocked (does not happen) if the destination is an occupied cell or the edge of the board. Other effects of the ability still apply to the target.\n- **Swap:** Allows two cards to trade places, even if both cells are occupied.\n\n**Resurrect:**\n- **Burnout Mechanic:** A card returned to the battlefield from the Discard pile (resurrected) immediately gains the **Resurrected** status upon Deploy. At the start of the next phase (phase change), this status is removed, and the card receives two Stun tokens.",
    creditsTitle: "IX. Credits",
    creditsText: "**Author:** Nikita Anahoret\n\n**Powered By:**\n- Google AI Studio\n- Gemini\n- ChatGPT\n\n**Special Thanks:**\n- Vasilisa Versus\n- Kirill Tomashchuk\n- Andrey Markosov\n- Mitya Shepelin\n\nFor all questions and suggestions, contact us on Telegram or Discord.\nYou can support the game's development and authors via DonationAlerts and Patreon."
};

// --- Dynamic Generation from Database ---

const enCards: Record<string, CardTranslation> = {};
const enCounters: Record<string, CounterTranslation> = {};

// 1. Map Cards from Database
cardDatabase.forEach((def, id) => {
    // Default mapping
    enCards[id] = {
        name: def.name,
        ability: def.ability,
        flavorText: def.flavorText
    };

    // Special Override for Zius to match the detailed ability logic
    if (id === 'ziusIJ') {
        enCards[id].ability = "Deploy: Exploit any card.\nSupport ⇒ Setup: Exploit any card. Then select a line intersecting this unit. Gain 1 point for each of your exploits in that line.";
    }
});

// 2. Map Tokens from Database
tokenDatabase.forEach((def, id) => {
    enCards[id] = {
        name: def.name,
        ability: def.ability,
        flavorText: def.flavorText
    };
});

// 3. Map Counters from Database
Object.entries(countersDatabase).forEach(([id, def]) => {
    enCounters[id] = {
        name: def.name,
        description: def.description
    };
});

// Manual entry for Secret Informant (fallback if not in database yet, but it should be)
if (!enCards['secretInformant']) {
    enCards['secretInformant'] = {
      name: "Secret Informant",
      ability: "Deploy: Look at the top 3 cards of any deck. Put any number of them on the bottom of their owner's deck. Draw a card.",
      flavorText: "Knowledge is power. And leverage."
    };
}

const en: TranslationResource = {
    ui: enUI,
    rules: enRules,
    cards: enCards,
    counters: enCounters
};

// Helper to create a partial translation based on English for rapid prototyping
const createLocale = (overrides: Partial<TranslationResource['ui']>, ruleTitle: string): TranslationResource => {
    return {
        ui: { ...en.ui, ...overrides },
        rules: { ...en.rules, title: ruleTitle },
        cards: en.cards, // Fallback to English cards for now
        counters: en.counters // Fallback to English counters for now
    };
};

export const resources: Record<LanguageCode, TranslationResource> = {
    en,
    ru,
    de: createLocale({ startGame: "Spiel Starten", settings: "Einstellungen", rules: "Regeln", language: "Sprache", exit: "Verlassen", surrender: "Aufgeben" }, "Spielregeln"),
    fr: createLocale({ startGame: "Démarrer", settings: "Paramètres", rules: "Règles", language: "Langue", exit: "Quitter", surrender: "Abandonner" }, "Règles du jeu"),
    it: createLocale({ startGame: "Inizia Gioco", settings: "Impostazioni", rules: "Regole", language: "Lingua", exit: "Esci", surrender: "Arrendersi" }, "Regole del gioco"),
    pt: createLocale({ startGame: "Iniciar Jogo", settings: "Configurações", rules: "Regras", language: "Idioma", exit: "Sair", surrender: "Desistir" }, "Regras do Jogo"),
    es: createLocale({ startGame: "Iniciar Juego", settings: "Ajustes", rules: "Reglas", language: "Idioma", exit: "Salir", surrender: "Rendirse" }, "Reglas del Juego"),
    zh: createLocale({ startGame: "开始游戏", settings: "设置", rules: "规则", language: "语言", exit: "退出", surrender: "投降" }, "游戏规则"),
    hi: createLocale({ startGame: "खेल शुरू करें", settings: "सेटिंग्स", rules: "नियम", language: "भाषा", exit: "बाहर जाएं", surrender: "समर्पण" }, "खेल के नियम"),
    ar: createLocale({ startGame: "ابدأ اللعبة", settings: "الإعدادات", rules: "القواعد", language: "لغة", exit: "خروج", surrender: "استسلام" }, "قواعد اللعبة"),
    uk: createLocale({ startGame: "Почати гру", settings: "Налаштування", rules: "Правила", language: "Мова", exit: "Вихід", surrender: "Здатися" }, "Правила гри"),
    be: createLocale({ startGame: "Пачаць гульню", settings: "Налады", rules: "Правілы", language: "Мова", exit: "Выхад", surrender: "Здацца" }, "Правілы гульні"),
    tt: createLocale({ startGame: "Уенны башлау", settings: "Көйләүләр", rules: "Кагыйдәләр", language: "Тел", exit: "Чыгу", surrender: "Бирелү" }, "Уен кагыйдәләре"),
    sr: createLocale({ startGame: "Започни игру", settings: "Подешавања", rules: "Правила", language: "Језик", exit: "Излаз", surrender: "Предај се" }, "Правила игре"),
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: "English",
    ru: "Русский",
    de: "Deutsch",
    fr: "Français",
    it: "Italiano",
    pt: "Português",
    es: "Español",
    zh: "中文",
    hi: "हिन्दी",
    ar: "العربية",
    uk: "Українська",
    be: "Беларуская",
    tt: "Татарча",
    sr: "Српски"
};