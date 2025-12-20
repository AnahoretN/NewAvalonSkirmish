# New Avalon: Skirmish - Development Guide

## Setup

```bash
npm i         # Install dependencies
npm run dev   # Start development server only!
```

**IMPORTANT**: Use `npm run dev` for development - do not use npm start or docker during development.

## Workflow

### Development
1. **Development**: `npm run dev` (localhost:8080)
**MANDATORY**: Always update CLAUDE.md ## Project Structure, ## Key Dependencies, ## API Flow IF there are any changes to:
- Added/removed files
- Modified component props or function signatures
- Changed API endpoints or data flow
- Updated dependencies or build configuration
- Altered WebSocket message types or game state structure

### Merge
- **Build & Test with docker**:
   ```bash
   docker build -t newavalonskirmish .
   docker run -d -p 8822:8080 --name test newavalonskirmish
   ```
   Test on `http://localhost:8822`
   - check static files served and contain changes
   - make request to server to check it works
   - establish websocket connection
   - IF something wrong use `docker logs newavalonskirmish` and find root cause, dive in and start fixing
- **Create branch**: `git checkout -b feature-name` (mandatory)
- **Commit & Push**: `git add . && git commit -m "desc" && git push`
- **Code Review**: Wait 2-5 mins, read GitHub PR comments from coderabbit
- **Merge**: If OK, squash merge to master
- **Deploy**: Ask user to manual deploy after merge

## Project Structure

```
/
├── components/                   # React UI components (23 files)
│   ├── GameBoard.tsx             # React.FC({board: Board, isGameStarted: boolean, activeGridSize: GridSize, handleDrop: (item: DragItem, target: DropTarget) => void, draggedItem: DragItem | null, setDraggedItem: (item: DragItem | null) => void, openContextMenu: (e: React.MouseEvent, type: 'boardItem' | 'emptyBoardCell', data: any) => void, playMode: { card: Card; sourceItem: DragItem; faceDown?: boolean } | null, setPlayMode: (mode: null) => void, highlight: HighlightData | null, playerColorMap: Map<number, PlayerColor>, localPlayerId: number | null, onCardDoubleClick: (card: Card, boardCoords: { row: number; col: number }) => void, onEmptyCellDoubleClick: (boardCoords: { row: number; col: number }) => void, imageRefreshVersion?: number, cursorStack: { type: string; count: number } | null, setCursorStack: (stack: null) => void, currentPhase?: number, activeTurnPlayerId?: number, onCardClick?: (card: Card, boardCoords: { row: number; col: number }) => void, onEmptyCellClick?: (boardCoords: { row: number; col: number }) => void, validTargets?: {row: number, col: number}[], noTargetOverlay?: {row: number, col: number} | null, disableActiveHighlights?: boolean, activeFloatingTexts?: FloatingTextData[]})
│   ├── PlayerPanel.tsx           # React.FC({player: Player, deck: Card[], discard: Card[], announcedCard?: Card | null, isListMode: boolean, canInteract: boolean, localPlayerId: number | null, imageRefreshVersion?: number, onCardClick?: (card: Card, source: 'hand' | 'discard' | 'announced') => void, onCardDoubleClick?: (card: Card, source: 'hand' | 'discard' | 'announced') => void, onCardRightClick?: (e: React.MouseEvent, card: Card, source: 'hand' | 'discard' | 'announced') => void, onDrop?: (item: DragItem, target: DragSource) => void, draggedItem?: DragItem | null, setDraggedItem?: (item: DragItem | null) => void, validDropTargets?: DragSource[], activePhaseIndex?: number, activeTurnPlayerId?: number})
│   ├── Card.tsx                  # React.FC({card: Card, isFaceUp: boolean, playerColorMap: Map<number, PlayerColor>, localPlayerId?: number | null, imageRefreshVersion?: number, disableTooltip?: boolean, smallStatusIcons?: boolean, activePhaseIndex?: number, activeTurnPlayerId?: number, disableActiveHighlights?: boolean, extraPowerSpacing?: boolean, hidePower?: boolean})
│   ├── Header.tsx                # React.FC({gameState: GameState | null, currentPlayerId: number | null, onDisconnect: () => void, t: (key: string) => string})
│   ├── MainMenu.tsx              # React.FC({onNewGame: () => void, onJoinGame: () => void, onDeckBuilding: () => void, onRules: () => void, onSettings: () => void, onExit: () => void, t: (key: string) => string})
│   ├── TopDeckView.tsx           # React.FC({players: Player[], localPlayerId: number | null, gameState: GameState | null, onPlayerClick: (playerId: number) => void, t: (key: string) => string})
│   ├── JoinGameModal.tsx         # React.FC({isOpen: boolean, onClose: () => void, onJoin: (data: { playerName: string; gameCode: string }) => void, games: any[]})
│   ├── TeamAssignmentModal.tsx   # React.FC({players: Player[], gameMode: GameMode, onCancel: () => void, onConfirm: (teams: any) => void})
│   ├── ReadyCheckModal.tsx       # React.FC({players: Player[], localPlayer: Player, onReady: () => void, onCancel: () => void})
│   ├── CardDetailModal.tsx       # React.FC({card: Card | null, ownerPlayer: Player | null, onClose: () => void, statusDescriptions: Record<string, string>, allPlayers: Player[], imageRefreshVersion?: number})
│   ├── DeckViewModal.tsx         # React.FC({isOpen: boolean, onClose: () => void, title: string, player: Player, cards: Card[], setDraggedItem: (item: DragItem | null) => void, onCardContextMenu: (e: React.MouseEvent, card: Card, source: string) => void, onCardDoubleClick: (card: Card, source: string) => void, onCardClick: (card: Card, source: string) => void, canInteract: boolean, isDeckView?: boolean, playerColorMap: Map<number, PlayerColor>, localPlayerId: number | null, imageRefreshVersion?: number, highlightFilter?: string})
│   ├── TokensModal.tsx           # React.FC({isOpen: boolean, onClose: () => void, setDraggedItem: (item: DragItem | null) => void, openContextMenu: (e: React.MouseEvent, type: string, data: any) => void, canInteract: boolean, anchorEl: HTMLElement | null, imageRefreshVersion?: number, draggedItem: DragItem | null})
│   ├── CountersModal.tsx         # React.FC({isOpen: boolean, onClose: () => void, setDraggedItem: (item: DragItem | null) => void, canInteract: boolean, anchorEl: HTMLElement | null, imageRefreshVersion?: number, onCounterMouseDown: (counter: any) => void, cursorStack: { type: string; count: number } | null})
│   ├── DeckBuilderModal.tsx      # React.FC({isOpen: boolean, onClose: () => void, setViewingCard: (card: Card | null) => void})
│   ├── EditCardModal.tsx         # (empty file)
│   ├── SettingsModal.tsx         # React.FC({isOpen: boolean, onClose: () => void, onSave: (settings: any) => void})
│   ├── RulesModal.tsx            # React.FC({isOpen: boolean, onClose: () => void})
│   ├── CommandModal.tsx          # React.FC({isOpen: boolean, card: Card | null, playerColorMap: Map<number, PlayerColor>, onConfirm: (command: string) => void, onCancel: () => void})
│   ├── CounterSelectionModal.tsx # React.FC({isOpen: boolean, data: any, onConfirm: (counterId: string) => void, onCancel: () => void})
│   ├── RevealRequestModal.tsx    # React.FC({fromPlayer: Player, cardCount: number, onAccept: () => void, onDecline: () => void})
│   ├── RoundEndModal.tsx         # React.FC({gameState: GameState, onConfirm: () => void, localPlayerId: number | null, onExit: () => void})
│   ├── ContextMenu.tsx           # React.FC({x: number, y: number, items: ContextMenuItem[], onClose: () => void})
│   ├── Tooltip.tsx               # React.FC({x: number; y: number; children: React.ReactNode})
│   └── Tooltip.tsx               # export { Tooltip, CardTooltipContent }
├── contexts/                     # React Context providers (1 active file)
│   ├── LanguageContext.tsx       # React.FC({children: React.ReactNode}) + export const useLanguage: () => {language: LanguageCode; setLanguage: (lang: LanguageCode) => void; t: (key: keyof TranslationResource['ui']) => string; getCardTranslation: (cardId: string) => CardTranslation | undefined; getCounterTranslation: (type: string) => { name: string; description: string } | undefined; resources: TranslationResource; isRTL: boolean}
│   └── DecksContext.tsx          # (empty file)
├── hooks/                        # Custom React hooks (4 files)
│   ├── useGameState.ts           # useGameState: () => {gameState: GameState, localPlayerId: number | null, setLocalPlayerId: (id: number | null) => void, draggedItem: DragItem | null, setDraggedItem: (item: DragItem | null) => void, connectionStatus: string, gamesList: any[], latestHighlight: HighlightData | null, latestFloatingTexts: FloatingTextData[], latestNoTarget: {row: number, col: number} | null, createGame: (gameData: any) => void, joinGame: (joinData: any) => void, requestGamesList: () => void, exitGame: () => void, startReadyCheck: () => void, cancelReadyCheck: () => void, playerReady: () => void, assignTeams: (teams: any) => void, setGameMode: (mode: GameMode) => void, setGamePrivacy: (isPrivate: boolean) => void, setActiveGridSize: (size: GridSize) => void, setDummyPlayerCount: (count: number) => void, updatePlayerName: (name: string) => void, changePlayerColor: (color: PlayerColor) => void, updatePlayerScore: (score: number) => void, changePlayerDeck: (deckType: DeckType) => void, loadCustomDeck: (deck: CustomDeckFile) => void, drawCard: () => void, shufflePlayerDeck: () => void, playCard: (card: Card, coords: {row: number, col: number}) => void, moveCard: (fromCoords: {row: number, col: number}, toCoords: {row: number, col: number}) => void, returnCardToHand: (card: Card) => void, announceCard: (card: Card) => void, endTurn: () => void, playCounter: (counter: Card, targetCard: Card, targetCoords: {row: number, col: number}) => void, playToken: (token: Card, coords: {row: number, col: number}) => void, destroyCard: (card: Card, coords: {row: number, col: number}) => void, addCommand: (commandData: any) => void, cancelPendingCommand: () => void, executePendingCommand: () => void, handleQuickDrop: (item: DragItem, target: DropTarget) => void}
│   ├── useAppCommand.ts          # useAppCommand: ({gameState, localPlayerId, draggedItem, setDraggedItem, openContextMenu, playMode, setPlayMode, setCursorStack, playerColorMap}) => {playCard, moveCard, returnCardToHand, announceCard, endTurn, playCounter, playToken, destroyCard, addCommand, cancelPendingCommand, executePendingCommand, handleQuickDrop}
│   ├── useAppAbilities.ts        # useAppAbilities: ({gameState, localPlayerId, setCursorStack, playerColorMap}) => {handleDeployAbility}
│   └── useAppCounters.ts         # useAppCounters: ({gameState, localPlayerId}) => {handleStackInteraction}
├── utils/                        # Business logic utilities (5 files)
│   ├── boardUtils.ts             # createInitialBoard: () => Board, recalculateBoardStatuses: (gameState: GameState) => Board
│   ├── targeting.ts              # validateTarget: (action: AbilityAction, sourceCardId: string, targetCardId: string, sourceCoords: {row: number, col: number}, targetCoords: {row: number, col: number}, gameState: GameState, playerId: number) => boolean, calculateValidTargets: (action: AbilityAction, sourceCardId: string, sourceCoords: {row: number, col: number}, gameState: GameState, playerId: number, commandContext?: CommandContext) => {row: number, col: number}[], checkActionHasTargets: (action: AbilityAction, currentGameState: GameState, playerId: number | null, commandContext?: CommandContext) => boolean
│   ├── commandLogic.ts           # getCommandAction: (cardId: string) => AbilityAction[]
│   ├── autoAbilities.ts          # canActivateAbility: (card: Card, phaseIndex: number, activeTurnPlayerId: number | undefined) => boolean, getCardAbilityAction: (card: Card, gameState: GameState, trigger: 'deploy' | 'turn_start' | 'turn_end', sourceCoords?: {row: number, col: number}) => AbilityAction[]
│   └── textFormatters.ts         # formatAbilityText: (ability: string) => React.ReactNode
├── locales/                      # Translation system (3 files)
│   ├── index.ts                  # export const resources: Record<LanguageCode, TranslationResource>, export const LANGUAGE_NAMES: Record<LanguageCode, string>
│   ├── types.ts                  # type LanguageCode, interface CardTranslation, interface CounterTranslation, interface TranslationResource
│   └── ru.ts                     # const translations: TranslationResource
├── server.js                     # export { app: Express, server: WebSocketServer }
├── server-dev.js                 # (no exports - imports from server.js)
├── index.tsx                     # ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider><App /></LanguageProvider></React.StrictMode>)
├── App.tsx                       # export default function App
├── types.ts                      # enum DeckType, enum GameMode, type SpecialItemType, type PlayerColor, type GridSize, interface CardStatus, interface CounterDefinition, interface Card, interface Player, interface Cell, type Board, type CardIdentifier, interface RevealRequest, interface HighlightData, interface FloatingTextData, interface GameState, interface DragItem, interface DropTarget, interface CustomDeckCard, interface CustomDeckFile, type ContextMenuItem, type ContextMenuParams, interface CursorStackState, interface CommandContext
├── constants.ts                  # export const MAX_PLAYERS, DECK_THEMES, PLAYER_COLORS, FLOATING_TEXT_COLORS, PLAYER_COLOR_NAMES, TURN_PHASES, STATUS_ICONS, STATUS_DESCRIPTIONS, AVAILABLE_COUNTERS, COUNTERS, shuffleDeck, PLAYER_POSITIONS
├── contentDatabase.ts            # export const rawJsonData, export type CardDefinition, export const cardDatabase, export const tokenDatabase, export const countersDatabase, export const deckFiles, export const commandCardIds, export const decksData, export const getSelectableDecks, export function getCardDefinition, export function getCardDefinitionByName, export function getAllCards
├── vite.config.ts                # export default defineConfig: (options: { command: string }) => UserConfig
├── postcss.config.cjs            # module.exports: { plugins: { tailwindcss: {}, autoprefixer: {} } }
├── tailwind.config.cjs           # module.exports: { content: string[], theme: { extend: { colors: Record<string, string> } } }
├── Dockerfile                    # (no exports - build configuration)
├── index.css                     # (no exports - global styles)
├── index.html                    # (no exports - HTML template)
├── tsconfig.json                 # (no exports - TypeScript config)
├── tsconfig.node.json            # (no exports - Node TypeScript config)
├── package.json                  # (no exports - dependencies and scripts)
└── package-lock.json             # (no exports - locked dependency versions)
```

## Key Dependencies

### Core Runtime
- **React 18.2.0**: UI framework (components + hooks)
- **Express 5.2.1**: HTTP server + middleware
- **express-ws 5.0.2**: WebSocket integration
- **ws 8.17.1**: WebSocket protocol implementation
- **Vite 5.2.11**: Build tool + dev server + HMR

### Build & Styling
- **@vitejs/plugin-react 4.2.1**: React JSX support
- **Tailwind CSS 3.4.3**: Utility-first CSS framework
- **PostCSS 8.4.38**: CSS processing pipeline
- **Autoprefixer 10.4.19**: CSS vendor prefixing
- **TypeScript 5.4.5**: Type checking and compilation

## API Flow

### Server-to-Client Game State Broadcast
1. **server.js#488** - `broadcastState(gameId, gameState, excludeClient)`
2. **server.js#491** - `JSON.stringify(sanitizedGameState)`
3. **server.js#494-499** - Loop: `client.send(message)` to all connected clients in game
4. **hooks/useGameState.ts#201** - `ws.current.onmessage = (event) =>`
5. **hooks/useGameState.ts#203** - `const data = JSON.parse(event.data)`
6. **hooks/useGameState.ts#244** - `setGameState(data)` → React state update

### Client-to-Server Action Flow
1. **hooks/useGameState.ts#283** - `ws.current.send(JSON.stringify(payload))`
2. **server.js#604** - `ws.on('message', message =>`
3. **server.js#632** - `data = JSON.parse(messageString)`
4. **server.js#673** - `switch(data.type)` → case handling
5. **server.js#488** - `broadcastState(gameId, updatedGameState)`

### Games List Request
1. **hooks/useGameState.ts#317** - `ws.current.send(JSON.stringify({ type: 'GET_GAMES_LIST' }))`
2. **server.js#674** - `case 'GET_GAMES_LIST':`
3. **server.js#675-680** - Filter public games, map to `{gameId, playerCount}`
4. **server.js#681** - `ws.send(JSON.stringify({ type: 'GAMES_LIST', games: gamesList }))`
5. **hooks/useGameState.ts#204** - `if (data.type === 'GAMES_LIST') { setGamesList(data.games) }`

### Game Join Flow
1. **hooks/useGameState.ts#188-194** - `ws.current.send(JSON.stringify({ type: 'JOIN_GAME', gameId, playerToken }))`
2. **server.js#684** - `case 'JOIN_GAME':`
3. **server.js#691** - `clientGameMap.set(ws, gameId)`
4. **server.js#712** - `ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', playerId, playerToken }))`
5. **server.js#714** - `broadcastState(gameId, gameState)`
6. **hooks/useGameState.ts#206** - `if (data.type === 'JOIN_SUCCESS') { setLocalPlayerId(data.playerId) }`

### Host Game Creation & Deck Sync
1. **hooks/useGameState.ts#311** - Player 1 sends: `ws.current.send(JSON.stringify({ type: 'UPDATE_DECK_DATA', deckData: rawJsonData }))`
2. **server.js#887** - `case 'UPDATE_DECK_DATA':` (only host allowed)
3. **hooks/useGameState.ts#221-224** - Delay 500ms: `ws.current.send(JSON.stringify({ type: 'UPDATE_DECK_DATA', deckData: rawJsonData }))`
4. **server.js#896** - Load deck data: `cardDatabase = deckData.cards; tokenDatabase = deckData.tokens;`

### Real-time Visual Effects
#### Highlight Trigger
1. **hooks/useGameState.ts#1391** - `ws.current.send(JSON.stringify({ type: 'TRIGGER_HIGHLIGHT', gameId, highlightData }))`
2. **server.js#1091** - `case 'TRIGGER_HIGHLIGHT':`
3. **server.js#1096** - Broadcast: `JSON.stringify({ type: 'HIGHLIGHT_TRIGGERED', highlightData })`
4. **hooks/useGameState.ts#235** - `if (data.type === 'HIGHLIGHT_TRIGGERED') { setLatestHighlight(data.highlightData) }`

#### Floating Text
1. **hooks/useGameState.ts#1400** - `ws.current.send(JSON.stringify({ type: 'TRIGGER_FLOATING_TEXT_BATCH', gameId, batch }))`
2. **hooks/useGameState.ts#239-242** - `if (data.type === 'FLOATING_TEXT_BATCH_TRIGGERED') { setLatestFloatingTexts(data.batch) }`

#### No Target Overlay
1. **hooks/useGameState.ts#1410** - `ws.current.send(JSON.stringify({ type: 'TRIGGER_NO_TARGET', gameId, coords, timestamp }))`
2. **hooks/useGameState.ts#237-238** - `if (data.type === 'NO_TARGET_TRIGGERED') { setLatestNoTarget({ coords: data.coords, timestamp: data.timestamp }) }`

### Game State Updates
#### Ready Check System
1. **hooks/useGameState.ts#348** - `ws.current.send(JSON.stringify({ type: 'START_READY_CHECK', gameId }))`
2. **server.js#1039** - `case 'START_READY_CHECK':` → `gameState.isReadyCheckActive = true`
3. **server.js#1045** - `broadcastState(gameId, gameState)`
4. **hooks/useGameState.ts#356** - `ws.current.send(JSON.stringify({ type: 'PLAYER_READY', gameId, playerId }))`
5. **server.js#1059** - `case 'PLAYER_READY':` → `player.isReady = true`
6. **server.js#1087** - `broadcastState(gameId, gameState)`
