/**
 * @file This file contains the WebSocket server for the multiplayer card table game.
 * It manages game states, player connections, and broadcasting updates.
 */

import express from 'express';
import expressWs from 'express-ws';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DECKS_FILE_PATH = path.join(__dirname, 'contentDatabase.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// In-memory storage for game states. A database would be used in a production environment.
const gameStates = new Map(); // gameId -> gameState
const clientGameMap = new Map(); // ws_client -> gameId
const gameLogs = new Map(); // gameId -> string[]
const gameTerminationTimers = new Map(); // gameId -> NodeJS.Timeout (Empty game timeout)
const gameInactivityTimers = new Map(); // gameId -> NodeJS.Timeout (Idle game timeout)
const playerDisconnectTimers = new Map(); // Key: `${gameId}-${playerId}` -> NodeJS.Timeout (Player conversion timeout)

const MAX_PLAYERS = 4;
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

// SECURITY: Constants for rate limiting and validation
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB max WebSocket message
const MAX_GAME_STATE_SIZE = 10 * 1024 * 1024; // 10MB max game state
const MAX_ACTIVE_GAMES = 1000; // Maximum concurrent games
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_STRING_LENGTH = 1000; // Max string length for user input

let cardDatabase = {};
let tokenDatabase = {};
let deckFiles = [];

// SECURITY: Rate limiting maps for DoS protection
const messageCounts = new Map(); // Connection -> [timestamps]

// SECURITY: Input sanitization utilities
const sanitizeString = (input, maxLength = MAX_STRING_LENGTH) => {
    if (typeof input !== 'string') return '';
    // Remove dangerous characters and limit length
    return input
        .replace(/[<>\"'&]/g, '') // Remove HTML special chars
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .substring(0, maxLength);
};

const sanitizePlayerName = (name) => {
    return sanitizeString(String(name), 50).trim() || 'Anonymous';
};

const sanitizeGameId = (gameId) => {
    if (typeof gameId !== 'string') return null;
    // Only allow alphanumeric, hyphens, underscores
    const sanitized = gameId.replace(/[^a-zA-Z0-9\-_]/g, '');
    return sanitized.length <= 50 && sanitized.length >= 1 ? sanitized : null;
};

const sanitizeForBroadcast = (data) => {
    if (typeof data === 'string') {
        return sanitizeString(data, 1000);
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeForBroadcast);
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[sanitizeString(key, 100)] = sanitizeForBroadcast(value);
        }
        return sanitized;
    }
    return data;
};

const checkMessageRateLimit = (ws) => {
    const now = Date.now();
    const messages = messageCounts.get(ws) || [];

    // Allow 60 messages per minute per connection
    const recentMessages = messages.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (recentMessages.length >= 60) {
        return false;
    }

    recentMessages.push(now);
    messageCounts.set(ws, recentMessages);
    return true;
};

// SECURITY: Security event logging
const logSecurityEvent = (event, details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [SECURITY] ${event}: ${JSON.stringify(details)}\n`;

    try {
        fs.appendFileSync(path.join(LOGS_DIR, 'security.log'), logEntry);
    } catch (error) {
        console.error('Failed to write security log:', error);
    }

    console.log(`[SECURITY] ${event}`, details);
};
try {
    const rawData = fs.readFileSync(DECKS_FILE_PATH, 'utf-8');
    const allDecksData = JSON.parse(rawData);

    // SECURITY: Validate structure of loaded data
    if (!allDecksData || typeof allDecksData !== 'object') {
        throw new Error('Invalid content database format: not an object');
    }

    // SECURITY: Sanitize and validate card database
    cardDatabase = {};
    if (allDecksData.cardDatabase && typeof allDecksData.cardDatabase === 'object') {
        for (const [cardId, card] of Object.entries(allDecksData.cardDatabase)) {
            if (typeof card === 'object' && card && card.id && card.name) {
                cardDatabase[cardId] = {
                    id: sanitizeString(String(card.id)),
                    name: sanitizeString(String(card.name)),
                    // Only copy known safe properties
                    ...(card.cost && { cost: Number(card.cost) || 0 }),
                    ...(card.attack && { attack: Number(card.attack) || 0 }),
                    ...(card.health && { health: Number(card.health) || 0 }),
                    ...(card.text && { text: sanitizeString(String(card.text), 500) }),
                    ...(card.image && { image: sanitizeString(String(card.image)) })
                };
            }
        }
    }

    tokenDatabase = allDecksData.tokenDatabase || {};
    deckFiles = Array.isArray(allDecksData.deckFiles) ?
        allDecksData.deckFiles.filter(deck => deck && deck.id && deck.name) : [];

    console.log(`Deck data loaded successfully: ${Object.keys(cardDatabase).length} cards, ${deckFiles.length} decks.`);
} catch (error) {
    console.error('Fatal: Could not read or parse contentDatabase.json. The server cannot start.', error);
    process.exit(1);
}

// --- Server-side Game Logic Utilities ---
const PLAYER_COLORS = ['blue', 'purple', 'red', 'green', 'yellow', 'orange', 'pink', 'brown'];

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array<any>} deck The array to shuffle.
 * @returns {Array<any>} A new, shuffled array.
 */
const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const commandCardIds = new Set([
    'overwatch',
    'repositioning',
    'tacticalManeuver',
    'mobilization',
    'inspiration',
    'dataInterception',
    'falseOrders'
]);

/**
 * Creates a new, shuffled deck for a player, assigning ownership to each card.
 * @param {string} deckType The type of deck to create (e.g., 'SynchroTech').
 * @param {number} playerId The ID of the player who will own the deck.
 * @param {string} playerName The name of the player.
 * @returns {Array<object>} The created deck of cards.
 */
const createDeck = (deckType, playerId, playerName) => {
    const deckFile = deckFiles.find(df => df.id === deckType);
    if (!deckFile) {
        console.error(`Invalid deckType requested: ${deckType}`);
        return [];
    }

    const deckList = [];
    for (const deckEntry of deckFile.cards) {
        const cardDef = cardDatabase[deckEntry.cardId];
        if (!cardDef) {
            console.warn(`Card definition not found for ID: ${deckEntry.cardId} in deck: ${deckFile.name}`);
            continue;
        }

        const isCommandCard = commandCardIds.has(deckEntry.cardId);

        for (let i = 0; i < deckEntry.quantity; i++) {
            const cardKey = deckEntry.cardId.toUpperCase().replace(/-/g, '_');
            let card;
            if (isCommandCard) {
                card = {
                    ...cardDef,
                    deck: "Command",
                    id: `CMD_${cardKey}`,
                    baseId: deckEntry.cardId,
                    ownerId: playerId,
                    ownerName: playerName,
                };
            } else {
                card = {
                    ...cardDef,
                    deck: deckFile.id,
                    id: `${deckFile.id.substring(0, 3).toUpperCase()}_${cardKey}_${i + 1}`,
                    baseId: deckEntry.cardId,
                    ownerId: playerId,
                    ownerName: playerName,
                };
            }
            deckList.push(card);
        }
    }
    return shuffleDeck(deckList);
};

/**
 * Generates a unique, URL-friendly token for player session identification.
 * @returns {string} A new player token.
 */
const generatePlayerToken = () => Math.random().toString(36).substring(2);

/**
 * Creates a new player object with a default deck and a unique session token.
 * @param {number} id The ID for the new player.
 * @returns {object} The new player object.
 */
const createNewPlayer = (id) => {
    const initialDeck = deckFiles.find(df => df.isSelectable);
    if (!initialDeck) {
        console.error("No selectable decks found in contentDatabase.json!");
        process.exit(1); // Cannot create players without decks
    }
    const initialDeckType = initialDeck.id;

    const newPlayer = {
        id,
        name: sanitizePlayerName(`Player ${id}`),
        score: 0,
        hand: [],
        deck: [], // Deck will be created with the correct name.
        discard: [],
        selectedDeck: initialDeckType,
        color: PLAYER_COLORS[id-1] || 'blue',
        isDummy: false,
        isDisconnected: false,
        playerToken: generatePlayerToken(),
        isReady: false,
        boardHistory: [],
    };
    newPlayer.deck = createDeck(initialDeckType, id, newPlayer.name);
    return newPlayer;
};

// --- Logging and Game Lifecycle Helpers ---

/**
 * Adds a timestamped message to a game's log.
 * @param {string} gameId The ID of the game.
 * @param {string} message The message to log.
 */
const logToGame = (gameId, message) => {
    if (!gameId) return;
    const logMessages = gameLogs.get(gameId);
    if (logMessages) {
        logMessages.push(`[${new Date().toISOString()}] ${message}`);
    }
};

/**
 * Ends a game, saves its log, and cleans up all associated data.
 * @param {string} gameId The ID of the game to end.
 * @param {string} reason A reason for ending the game, for logging purposes.
 */
const endGame = (gameId, reason) => {
    logToGame(gameId, `Game ending due to: ${reason}.`);
    console.log(`Ending game ${gameId} due to: ${reason}.`);
    
    // 1. Save the log file
    const logData = gameLogs.get(gameId);
    if (logData && logData.length > 0) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = path.join(LOGS_DIR, `game-${gameId}-${timestamp}.log`);
        try {
            fs.writeFileSync(filename, logData.join('\n'));
            console.log(`Log for game ${gameId} saved to ${filename}`);
        } catch (error) {
            console.error(`Failed to write log for game ${gameId}:`, error);
        }
    }

    // 2. Clean up all in-memory data
    gameStates.delete(gameId);
    gameLogs.delete(gameId);
    
    const timerId = gameTerminationTimers.get(gameId);
    if (timerId) {
        clearTimeout(timerId);
        gameTerminationTimers.delete(gameId);
    }

    const inactivityTimerId = gameInactivityTimers.get(gameId);
    if (inactivityTimerId) {
        clearTimeout(inactivityTimerId);
        gameInactivityTimers.delete(gameId);
    }
    
    // Clean up any pending player conversion timers for this game
    for (const [key, timer] of playerDisconnectTimers.entries()) {
        if (key.startsWith(`${gameId}-`)) {
            clearTimeout(timer);
            playerDisconnectTimers.delete(key);
        }
    }
    
    // 3. Disconnect any remaining clients (spectators) in that game
    const clients = wss.clients;
    clients.forEach(client => {
        if (client.gameId === gameId) {
            client.terminate(); // Forcefully close the connection
        }
    });

    // 4. Update the public games list for all clients
    broadcastGamesList();
};

/**
 * Resets the inactivity timer for a game. 
 * If the timer expires, the game is terminated.
 * @param {string} gameId The ID of the game.
 */
const resetInactivityTimer = (gameId) => {
    if (!gameId) return;

    // Clear existing timer
    if (gameInactivityTimers.has(gameId)) {
        clearTimeout(gameInactivityTimers.get(gameId));
    }

    // Set new timer
    const timerId = setTimeout(() => {
        const gameState = gameStates.get(gameId);
        if (gameState) {
            logToGame(gameId, 'Game terminated due to inactivity (20 minutes without action).');
            endGame(gameId, '20 minutes inactivity');
        }
    }, INACTIVITY_TIMEOUT_MS);

    gameInactivityTimers.set(gameId, timerId);
};

/**
 * Converts a disconnected player into a dummy player.
 * @param {string} gameId The game ID.
 * @param {number} playerId The player ID.
 */
const convertPlayerToDummy = (gameId, playerId) => {
    const gameState = gameStates.get(gameId);
    if (!gameState) return;

    const player = gameState.players.find(p => p.id === playerId);
    if (player && player.isDisconnected) {
        logToGame(gameId, `Player ${playerId} (${player.name}) failed to reconnect and is now a Dummy.`);
        console.log(`Converting Player ${playerId} in game ${gameId} to Dummy.`);
        
        player.isDummy = true;
        player.isDisconnected = false; // Dummies are "connected" (part of game state) but not human
        player.name = `Dummy ${player.id}`;
        player.playerToken = null; // Prevent reconnection as this player

        // Remove the timer tracking this conversion
        playerDisconnectTimers.delete(`${gameId}-${playerId}`);

        broadcastState(gameId, gameState);
    }
};

/**
 * Schedules a game to be terminated after a delay if no real players are active.
 * @param {string} gameId The ID of the game.
 */
const scheduleGameTermination = (gameId) => {
    if (gameTerminationTimers.has(gameId)) return; // Timer already scheduled

    logToGame(gameId, 'Last real player disconnected. Starting 1-minute shutdown timer.');
    console.log(`Scheduling termination for game ${gameId} in 1 minute.`);

    const timerId = setTimeout(() => {
        const gameState = gameStates.get(gameId);
        // An active player is one who is not a dummy and not disconnected.
        const activePlayers = gameState ? gameState.players.filter(p => !p.isDummy && !p.isDisconnected) : [];
        if (activePlayers.length === 0) {
            endGame(gameId, 'inactivity timeout (empty game)');
        } else {
             gameTerminationTimers.delete(gameId); // A player reconnected, so just delete the timer
        }
    }, 60 * 1000); // 1 minute

    gameTerminationTimers.set(gameId, timerId);
};

/**
 * Cancels a scheduled game termination, usually because a player has reconnected.
 * @param {string} gameId The ID of the game.
 */
const cancelGameTermination = (gameId) => {
    if (gameTerminationTimers.has(gameId)) {
        clearTimeout(gameTerminationTimers.get(gameId));
        gameTerminationTimers.delete(gameId);
        logToGame(gameId, 'Shutdown timer cancelled due to player activity.');
        console.log(`Termination cancelled for game ${gameId}.`);
    }
};

// --- HTTP Server (for serving static files) ---
const app = express();

// Apply express-ws middleware to enable WebSocket support
const wsInstance = expressWs(app);

// This server is now primarily for WebSocket upgrades and serving the production build.
// For development, use the Vite dev server (`npm run dev`).

// Health check endpoint
app.get('/health', (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        activeGames: gameStates.size,
        connectedClients: wsInstance.getWss().clients.size,
        nodeEnv: process.env.NODE_ENV || 'development'
    };

    res.set({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.json(healthData);
});

// Set /docs as static root directory
const DOCS_PATH = path.join(__dirname, 'docs');

// Serve /docs as static root without validation
app.use(express.static(DOCS_PATH, {
    // Serve files as-is without additional validation
    // No UGC (User Generated Content) in docs directory
    setHeaders: (res, filePath) => {
        const extname = String(path.extname(filePath)).toLowerCase();

        if (['.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(extname)) {
            // For images, tell the browser to always re-validate
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else if (['.js', '.css'].includes(extname)) {
            // For JS and CSS files with hashes, cache forever
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (extname === '.html') {
            // For HTML files, always re-validate
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

// --- WebSocket Server Logic ---

const wss = wsInstance.getWss();

/**
 * Sends the current game state to all clients connected to a specific game.
 * @param {string} gameId The ID of the game to broadcast.
 * @param {object} gameState The current state of the game.
 * @param {WebSocket} [excludeClient=null] A client to exclude from the broadcast (usually the sender).
 */
const broadcastState = (gameId, gameState, excludeClient = null) => {
    // SECURITY: Sanitize game state before broadcasting to prevent XSS
    const sanitizedGameState = sanitizeForBroadcast(gameState);
    const message = JSON.stringify(sanitizedGameState);

    const clients = wss.clients;
    clients.forEach(client => {
        // FIX: Used `WebSocket.OPEN` to correctly check the client's ready state. `client.OPEN` is undefined.
        if (client !== excludeClient && client.readyState === WebSocket.OPEN && clientGameMap.get(client) === gameId) {
            try {
                client.send(message);
            } catch (error) {
                logSecurityEvent('BROADCAST_ERROR', {
                    gameId,
                    clientIP: client.ipAddress,
                    error: error.message
                });
            }
        }
    });
};

/**
 * Sends the list of all active games to every connected client.
 */
const broadcastGamesList = () => {
    const gamesList = Array.from(gameStates.entries())
        .filter(([gameId, gameState]) => !gameState.isPrivate)
        .map(([gameId, gameState]) => ({
            gameId: sanitizeString(gameId, 50),
            playerCount: Math.max(0, gameState.players ? gameState.players.filter(p => !p.isDummy && !p.isDisconnected).length : 0)
        }));
    const message = JSON.stringify({ type: 'GAMES_LIST', games: gamesList });

    const clients = wss.clients;
    clients.forEach(client => {
        // FIX: Used `WebSocket.OPEN` to correctly check the client's ready state. `client.OPEN` is undefined.
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (error) {
                logSecurityEvent('BROADCAST_GAMES_LIST_ERROR', {
                    clientIP: client.ipAddress,
                    error: error.message
                });
            }
        }
    });
};

/**
 * Handles the logic for a player disconnecting from a game.
 * It marks the player as disconnected, leaving their slot open.
 * @param {string} gameId The ID of the game.
 * @param {number} playerId The ID of the player leaving.
 * @param {boolean} isManualExit If true, do not schedule a dummy conversion timer.
 */
const handlePlayerLeave = (gameId, playerId, isManualExit = false) => {
    if (!gameId || playerId === null || playerId === undefined) return;
    const numericPlayerId = Number(playerId);
    const gameState = gameStates.get(gameId);
    if (!gameState) return;

    let playerFound = false;
    const updatedPlayers = gameState.players.map(p => {
        if (p.id === numericPlayerId && !p.isDisconnected) {
            playerFound = true;
            logToGame(gameId, `Player ${p.name} (ID: ${numericPlayerId}) disconnected${isManualExit ? ' (Manual Exit)' : ''}.`);
            return { ...p, isDisconnected: true, isReady: false };
        }
        return p;
    });

    if (!playerFound) return;
    
    const updatedGameState = { ...gameState, players: updatedPlayers };
    gameStates.set(gameId, updatedGameState);
    
    // Clear existing conversion timer for this player if any
    const timerKey = `${gameId}-${numericPlayerId}`;
    if (playerDisconnectTimers.has(timerKey)) {
        clearTimeout(playerDisconnectTimers.get(timerKey));
        playerDisconnectTimers.delete(timerKey);
    }

    // If NOT a manual exit, schedule conversion to dummy in 60 seconds
    if (!isManualExit) {
        console.log(`Scheduling conversion to Dummy for Player ${numericPlayerId} in game ${gameId} in 60s.`);
        const timerId = setTimeout(() => {
            convertPlayerToDummy(gameId, numericPlayerId);
        }, 60 * 1000); // 1 minute
        playerDisconnectTimers.set(timerKey, timerId);
    }

    // An active player is a human who is currently connected.
    const activePlayers = updatedPlayers.filter(p => !p.isDummy && !p.isDisconnected);

    if (activePlayers.length === 0) {
        scheduleGameTermination(gameId);
    }
    
    broadcastState(gameId, updatedGameState);
    broadcastGamesList();
};

app.ws('/', (ws, req) => {
    // Store IP address and connection time on the WebSocket
    ws.ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    ws.connectionTime = Date.now();

    console.log('Client connected via WebSocket');
    logSecurityEvent('WEBSOCKET_CONNECTION_ESTABLISHED', {
        ip: ws.ipAddress,
        userAgent: req.headers['user-agent']
    });

    ws.on('message', message => {
        try {
            // SECURITY: Rate limit messages per connection
            if (!checkMessageRateLimit(ws)) {
                logSecurityEvent('WEBSOCKET_MESSAGE_RATE_LIMIT_EXCEEDED', {
                    ip: ws.ipAddress
                });
                ws.close(1008, 'Message rate limit exceeded');
                return;
            }

            // SECURITY: Validate message size to prevent memory exhaustion
            if (message.length > MAX_MESSAGE_SIZE) {
                logSecurityEvent('WEBSOCKET_MESSAGE_TOO_LARGE', {
                    ip: ws.ipAddress,
                    size: message.length
                });
                ws.close(1009, 'Message too large');
                return;
            }

            // SECURITY: Safe JSON parsing with validation
            let data;
            try {
                const messageString = message.toString();
                if (messageString.length > MAX_MESSAGE_SIZE) {
                    throw new Error('Message string too large');
                }
                data = JSON.parse(messageString);
            } catch (parseError) {
                logSecurityEvent('WEBSOCKET_INVALID_JSON', {
                    ip: ws.ipAddress,
                    error: parseError.message
                });
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    message: 'Invalid message format'
                }));
                return;
            }

            // SECURITY: Basic message structure validation
            if (!data || typeof data !== 'object' || !data.type) {
                logSecurityEvent('WEBSOCKET_INVALID_MESSAGE_STRUCTURE', {
                    ip: ws.ipAddress,
                    messageData: JSON.stringify(data)
                });
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    message: 'Invalid message structure'
                }));
                return;
            }

            // SECURITY: Sanitize and validate gameId
            let gameId = data.gameId;
            if (gameId) {
                gameId = sanitizeGameId(gameId);
                if (!gameId) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Invalid game ID'
                    }));
                    return;
                }
            }

            const gameState = gameId ? gameStates.get(gameId) : null;

            switch(data.type) {
                case 'GET_GAMES_LIST': {
                    const gamesList = Array.from(gameStates.entries())
                        .filter(([gId, gState]) => !gState.isPrivate)
                        .map(([gId, gState]) => ({
                            gameId: gId,
                            playerCount: gState.players.filter(p => !p.isDummy && !p.isDisconnected).length
                        }));
                    ws.send(JSON.stringify({ type: 'GAMES_LIST', games: gamesList }));
                    break;
                }
                case 'JOIN_GAME': {
                    const { playerToken } = data;
                    if (!gameState) {
                        ws.send(JSON.stringify({ type: 'ERROR', message: `Game with code ${gameId} not found.` }));
                        return;
                    }

                    clientGameMap.set(ws, gameId);
                    ws.gameId = gameId;
                    
                    resetInactivityTimer(gameId); // Activity: Player joined

                    // --- 1. Reconnection Logic ---
                    if (playerToken) {
                        const playerToReconnect = gameState.players.find(p => p.playerToken === playerToken && p.isDisconnected);
                        if (playerToReconnect) {
                            cancelGameTermination(gameId);
                            playerToReconnect.isDisconnected = false;
                            
                            // Clear pending dummy conversion timer
                            const timerKey = `${gameId}-${playerToReconnect.id}`;
                            if (playerDisconnectTimers.has(timerKey)) {
                                clearTimeout(playerDisconnectTimers.get(timerKey));
                                playerDisconnectTimers.delete(timerKey);
                                logToGame(gameId, `Cancelled dummy conversion timer for Player ${playerToReconnect.id}.`);
                            }

                            ws.playerId = playerToReconnect.id;
                            ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', playerId: playerToReconnect.id, playerToken: playerToReconnect.playerToken }));
                            logToGame(gameId, `Player ${playerToReconnect.id} (${playerToReconnect.name}) reconnected.`);
                            broadcastState(gameId, gameState);
                            broadcastGamesList();
                            console.log(`Player ${playerToReconnect.id} reconnected to game ${gameId}.`);
                            return;
                        }
                    }

                    // --- 2. Takeover "Ghost" Player Slot ---
                    const playerToTakeOver = gameState.players.find(p => p.isDisconnected);
                    if (playerToTakeOver) {
                        cancelGameTermination(gameId);
                        playerToTakeOver.isDisconnected = false;
                        playerToTakeOver.name = sanitizePlayerName(`Player ${playerToTakeOver.id}`);
                        playerToTakeOver.playerToken = generatePlayerToken();

                        // Clear pending dummy conversion timer for the slot being taken over
                        const timerKey = `${gameId}-${playerToTakeOver.id}`;
                        if (playerDisconnectTimers.has(timerKey)) {
                            clearTimeout(playerDisconnectTimers.get(timerKey));
                            playerDisconnectTimers.delete(timerKey);
                        }

                        ws.playerId = playerToTakeOver.id;
                        ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', playerId: playerToTakeOver.id, playerToken: playerToTakeOver.playerToken }));
                        logToGame(gameId, `A new player took over slot ${playerToTakeOver.id}.`);
                        broadcastState(gameId, gameState);
                        broadcastGamesList();
                        return;
                    }

                    // --- 3. Join as New Player if Space Available ---
                    const activePlayers = gameState.players.filter(p => !p.isDummy && !p.isDisconnected);
                    const dummyPlayers = gameState.players.filter(p => p.isDummy);
                    if (activePlayers.length + dummyPlayers.length < MAX_PLAYERS) {
                        cancelGameTermination(gameId);
                        const existingIds = new Set(gameState.players.map(p => p.id));
                        let newPlayerId = 1;
                        while(existingIds.has(newPlayerId)) {
                            newPlayerId++;
                        }

                        const newPlayer = createNewPlayer(newPlayerId);
                        gameState.players.push(newPlayer);
                        gameState.players.sort((a, b) => a.id - b.id);
                        
                        ws.playerId = newPlayerId;
                        ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', playerId: newPlayerId, playerToken: newPlayer.playerToken }));
                        logToGame(gameId, `Player ${newPlayerId} (${newPlayer.name}) joined the game.`);
                        broadcastState(gameId, gameState);
                        broadcastGamesList();
                        console.log(`New player ${newPlayerId} added to game ${gameId}.`);
                        return;
                    }

                    // --- 4. Join as Spectator ---
                    ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', playerId: null }));
                    ws.send(JSON.stringify(gameState));
                    console.log(`Client joined game ${gameId} as a spectator.`);
                    logToGame(gameId, 'A spectator joined.');
                    break;
                }
                case 'SUBSCRIBE': {
                    clientGameMap.set(ws, gameId);
                    ws.gameId = gameId;
                    console.log(`Client subscribed to game: ${gameId}`);
                    if (gameState) {
                        ws.send(JSON.stringify(gameState));
                    }
                    break;
                }
                case 'UPDATE_STATE': {
                    const { gameState: updatedGameState } = data;

                    // SECURITY: Validate game state object
                    if (!updatedGameState || typeof updatedGameState !== 'object') {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            message: 'Invalid game state data'
                        }));
                        logSecurityEvent('INVALID_GAME_STATE_UPDATE', {
                            ip: ws.ipAddress,
                            playerId: ws.playerId
                        });
                        break;
                    }

                    const gameIdToUpdate = sanitizeGameId(updatedGameState.gameId);

                    if (gameIdToUpdate && gameStates.has(gameIdToUpdate)) {
                        // SECURITY: Validate game state size to prevent memory exhaustion
                        const gameStateSize = JSON.stringify(updatedGameState).length;
                        if (gameStateSize > MAX_GAME_STATE_SIZE) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                message: 'Game state too large'
                            }));
                            logSecurityEvent('GAME_STATE_TOO_LARGE', {
                                ip: ws.ipAddress,
                                playerId: ws.playerId,
                                size: gameStateSize
                            });
                            break;
                        }

                        if (!clientGameMap.has(ws) || clientGameMap.get(ws) !== gameIdToUpdate) {
                            clientGameMap.set(ws, gameIdToUpdate);
                            ws.gameId = gameIdToUpdate;
                        }

                        resetInactivityTimer(gameIdToUpdate); // Activity: Game state updated

                        logToGame(gameIdToUpdate, `Game state updated by player ${ws.playerId || 'spectator'}.`);
                        gameStates.set(gameIdToUpdate, updatedGameState);
                        broadcastState(gameIdToUpdate, updatedGameState, ws);
                    } else if (gameIdToUpdate) {
                        // SECURITY: Limit number of concurrent games
                        if (gameStates.size >= MAX_ACTIVE_GAMES) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                message: 'Too many active games'
                            }));
                            logSecurityEvent('MAX_GAMES_EXCEEDED', {
                                ip: ws.ipAddress,
                                totalGames: gameStates.size
                            });
                            break;
                        }

                        // SECURITY: Validate new game state size
                        const gameStateSize = JSON.stringify(updatedGameState).length;
                        if (gameStateSize > MAX_GAME_STATE_SIZE) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                message: 'Game state too large'
                            }));
                            logSecurityEvent('NEW_GAME_STATE_TOO_LARGE', {
                                ip: ws.ipAddress,
                                size: gameStateSize
                            });
                            break;
                        }

                        gameStates.set(gameIdToUpdate, updatedGameState);

                        resetInactivityTimer(gameIdToUpdate); // Activity: Game created

                        gameLogs.set(gameIdToUpdate, []);
                        logToGame(gameIdToUpdate, `Game created with ID: ${gameIdToUpdate}`);
                        broadcastGamesList();
                        broadcastState(gameIdToUpdate, updatedGameState, ws);
                    }
                    break;
                }
                 case 'FORCE_SYNC': {
                    const { gameState: hostGameState } = data;
                    const gameIdToSync = hostGameState ? hostGameState.gameId : null;

                    if (gameIdToSync && gameStates.has(gameIdToSync)) {
                        // Only the host (player 1) can force a sync
                        if (ws.playerId === 1) {
                            resetInactivityTimer(gameIdToSync); // Activity: Force sync

                            logToGame(gameIdToSync, `Host (Player 1) forced a game state synchronization.`);
                            console.log(`Host forcing sync for game ${gameIdToSync}.`);
                            gameStates.set(gameIdToSync, hostGameState);
                            // Broadcast to ALL clients, including the host to confirm.
                            broadcastState(gameIdToSync, hostGameState); 
                        } else {
                            console.warn(`Non-host player ${ws.playerId} attempted to force sync game ${gameIdToSync}.`);
                        }
                    }
                    break;
                }
                case 'UPDATE_DECK_DATA': {
                    // SECURITY: Only allow host (player 1) to update deck data
                    if (!ws.playerId || ws.playerId !== 1) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            message: 'Unauthorized: Only host can update deck data'
                        }));
                        logSecurityEvent('UNAUTHORIZED_DECK_UPDATE', {
                            ip: ws.ipAddress,
                            playerId: ws.playerId,
                            attemptedAccess: true
                        });
                        break;
                    }

                    const { deckData } = data;

                    // SECURITY: Validate deck data structure
                    if (!deckData || typeof deckData !== 'object') {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            message: 'Invalid deck data format'
                        }));
                        logSecurityEvent('INVALID_DECK_DATA_FORMAT', {
                            ip: ws.ipAddress,
                            playerId: ws.playerId
                        });
                        break;
                    }

                    // SECURITY: Validate deck data size
                    const deckDataSize = JSON.stringify(deckData).length;
                    if (deckDataSize > 5 * 1024 * 1024) { // 5MB limit for deck data
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            message: 'Deck data too large'
                        }));
                        logSecurityEvent('DECK_DATA_TOO_LARGE', {
                            ip: ws.ipAddress,
                            playerId: ws.playerId,
                            size: deckDataSize
                        });
                        break;
                    }

                    // SECURITY: Sanitize and validate card database
                    const sanitizedCardDatabase = {};
                    if (deckData.cardDatabase && typeof deckData.cardDatabase === 'object') {
                        for (const [cardId, card] of Object.entries(deckData.cardDatabase)) {
                            if (typeof card === 'object' && card && card.id && card.name) {
                                sanitizedCardDatabase[cardId] = {
                                    id: sanitizeString(String(card.id)),
                                    name: sanitizeString(String(card.name)),
                                    // Only copy known safe properties
                                    ...(card.cost !== undefined && { cost: Number(card.cost) || 0 }),
                                    ...(card.attack !== undefined && { attack: Number(card.attack) || 0 }),
                                    ...(card.health !== undefined && { health: Number(card.health) || 0 }),
                                    ...(card.text && { text: sanitizeString(String(card.text), 1000) }),
                                    ...(card.image && { image: sanitizeString(String(card.image), 500) })
                                };
                            }
                        }
                    }

                    // SECURITY: Validate deck files array
                    const sanitizedDeckFiles = Array.isArray(deckData.deckFiles) ?
                        deckData.deckFiles.filter(deck => {
                            if (!deck || typeof deck !== 'object') return false;
                            return deck.id && deck.name && typeof deck.id === 'string' && typeof deck.name === 'string';
                        }).map(deck => ({
                            id: sanitizeString(String(deck.id), 50),
                            name: sanitizeString(String(deck.name), 100),
                            ...(deck.isSelectable !== undefined && { isSelectable: Boolean(deck.isSelectable) }),
                            ...(deck.cards && Array.isArray(deck.cards) && { cards: deck.cards })
                        })) : [];

                    console.log(`Received and sanitized updated deck data from host player ${ws.playerId}`);
                    logSecurityEvent('DECK_DATA_UPDATED', {
                        playerId: ws.playerId,
                        cardsCount: Object.keys(sanitizedCardDatabase).length,
                        decksCount: sanitizedDeckFiles.length
                    });

                    cardDatabase = sanitizedCardDatabase;
                    tokenDatabase = deckData.tokenDatabase || {};
                    deckFiles = sanitizedDeckFiles;
                    break;
                }
                case 'LEAVE_GAME': {
                    const { playerId } = data;
                    if (!gameState) return;

                    const activePlayers = gameState.players.filter(p => !p.isDummy && !p.isDisconnected);
                    const isLeavingPlayerActive = activePlayers.some(p => p.id === playerId);
                    
                    if (isLeavingPlayerActive && activePlayers.length === 1) {
                        // This was the last active human player. End the game immediately.
                        logToGame(gameId, `Player ${playerId} exited. They were the last active player.`);
                        endGame(gameId, 'last player left');
                    } else {
                        // Other active players remain, so just mark this one as disconnected.
                        // Pass TRUE for manual exit to prevent dummy conversion timer
                        handlePlayerLeave(gameId, playerId, true);
                    }
                    
                    clientGameMap.delete(ws);
                    delete ws.playerId;
                    delete ws.gameId;
                    break;
                }
                case 'SET_GAME_MODE': {
                    if (gameState && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Game settings change
                        gameState.gameMode = data.mode;
                        broadcastState(gameId, gameState);
                    }
                    break;
                }
                case 'SET_GAME_PRIVACY': {
                    if (gameState && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Privacy change
                        gameState.isPrivate = data.isPrivate;
                        broadcastState(gameId, gameState);
                        broadcastGamesList(); // Update everyone's public list
                    }
                    break;
                }
                 case 'ASSIGN_TEAMS': {
                    if (gameState && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Team assignment
                        const { assignments } = data; // e.g., { 1: [1, 3], 2: [2, 4] }
                        const playerMap = new Map(gameState.players.map(p => [p.id, p]));
                        
                        // Clear old teams and assign new ones
                        gameState.players.forEach(p => delete p.teamId);
                        for (const teamId in assignments) {
                            const playerIds = assignments[teamId];
                            const teamCaptain = playerMap.get(playerIds[0]);
                            if (!teamCaptain) continue;

                            playerIds.forEach(playerId => {
                                const player = playerMap.get(playerId);
                                if (player) {
                                    player.teamId = Number(teamId);
                                    player.color = teamCaptain.color; // Sync color to captain
                                }
                            });
                        }
                        broadcastState(gameId, gameState);
                    }
                    break;
                }
                case 'START_READY_CHECK': {
                    if (gameState && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Ready check start
                        // Reset all ready statuses
                        gameState.players.forEach(p => p.isReady = false);
                        gameState.isReadyCheckActive = true;
                        broadcastState(gameId, gameState);
                    }
                    break;
                }
                case 'CANCEL_READY_CHECK': {
                    if (gameState && gameState.isReadyCheckActive && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Ready check canceled
                        gameState.isReadyCheckActive = false;
                        // Reset ready statuses to keep state clean
                        gameState.players.forEach(p => p.isReady = false);
                        broadcastState(gameId, gameState);
                    }
                    break;
                }
                case 'PLAYER_READY': {
                    const { playerId } = data;
                    if (gameState && gameState.isReadyCheckActive && !gameState.isGameStarted) {
                        resetInactivityTimer(gameId); // Activity: Player ready
                        const player = gameState.players.find(p => p.id === playerId);
                        if (player) {
                            player.isReady = true;
                        }
                        
                        // Check if all non-dummy, connected players are ready
                        const allReady = gameState.players
                            .filter(p => !p.isDummy && !p.isDisconnected)
                            .every(p => p.isReady);

                        if (allReady) {
                            gameState.isGameStarted = true;
                            gameState.isReadyCheckActive = false;

                            // Randomly select starting player from active real players
                            const activePlayers = gameState.players.filter(p => !p.isDummy && !p.isDisconnected);
                            if (activePlayers.length > 0) {
                                const randomIndex = Math.floor(Math.random() * activePlayers.length);
                                gameState.activeTurnPlayerId = activePlayers[randomIndex].id;
                                logToGame(gameId, `Game started. Player ${gameState.activeTurnPlayerId} is starting.`);
                            } else {
                                logToGame(gameId, `Game started. No active players found to select start?`);
                            }
                        }
                        broadcastState(gameId, gameState);
                    }
                    break;
                }
                case 'TRIGGER_HIGHLIGHT': {
                    const { highlightData } = data;
                    if (gameState) {
                        resetInactivityTimer(gameId); // Activity: Highlight triggered
                        // Broadcast the highlight event to all clients in the game (including sender)
                        const highlightMessage = JSON.stringify({ type: 'HIGHLIGHT_TRIGGERED', highlightData });
                        const clients = wss.clients;
                        clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN && clientGameMap.get(client) === gameId) {
                                client.send(highlightMessage);
                            }
                        });
                    }
                    break;
                }
                case 'TRIGGER_NO_TARGET': {
                    const { coords, timestamp } = data;
                    if (gameState) {
                        const message = JSON.stringify({ type: 'NO_TARGET_TRIGGERED', coords, timestamp });
                        const clients = wss.clients;
                        clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN && clientGameMap.get(client) === gameId) {
                                client.send(message);
                            }
                        });
                    }
                    break;
                }
                case 'TRIGGER_FLOATING_TEXT': {
                    const { floatingTextData } = data;
                    if (gameState) {
                        const message = JSON.stringify({ type: 'FLOATING_TEXT_TRIGGERED', floatingTextData });
                        const clients = wss.clients;
                        clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN && clientGameMap.get(client) === gameId) {
                                client.send(message);
                            }
                        });
                    }
                    break;
                }
                case 'TRIGGER_FLOATING_TEXT_BATCH': {
                    const { batch } = data;
                    if (gameState) {
                        const message = JSON.stringify({ type: 'FLOATING_TEXT_BATCH_TRIGGERED', batch });
                        const clients = wss.clients;
                        clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN && clientGameMap.get(client) === gameId) {
                                client.send(message);
                            }
                        });
                    }
                    break;
                }
                default:
                    console.warn(`Received unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Failed to process WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        logSecurityEvent('WEBSOCKET_CONNECTION_CLOSED', {
            ip: ws.ipAddress,
            playerId: ws.playerId,
            connectionDuration: Date.now() - ws.connectionTime
        });

        // SECURITY: Clean up rate limiting data
        messageCounts.delete(ws);

        const gameId = ws.gameId;
        const playerId = ws.playerId;
        if (gameId && playerId !== undefined) {
            // Unexpected close: pass false for isManualExit
            handlePlayerLeave(gameId, playerId, false);
        }
        clientGameMap.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
    });
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log('WebSocket is available on the same port (ws://).');
});

export { app, server };

// --- Server Admin CLI ---
console.log('Server admin CLI is active. Type "clear" and press Enter to reset all games.');

process.stdin.on('data', (data) => {
    const command = data.toString().trim().toLowerCase();

    if (command === 'clear') {
        console.log('Received "clear" command. Resetting all game sessions...');

        // 1. Notify and disconnect all clients
        const clients = wss.clients;
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ERROR', message: 'The server administrator has reset all active games. Please create or join a new game.' }));
                client.terminate(); // Forcefully close the connection
            }
        });

        // 2. Clear all in-memory game data
        gameStates.clear();
        clientGameMap.clear();
        gameLogs.clear();

        // 3. Clear any pending termination timers
        gameTerminationTimers.forEach(timerId => clearTimeout(timerId));
        gameTerminationTimers.clear();
        gameInactivityTimers.forEach(timerId => clearTimeout(timerId));
        gameInactivityTimers.clear();
        
        playerDisconnectTimers.forEach(timerId => clearTimeout(timerId));
        playerDisconnectTimers.clear();

        console.log('All game sessions cleared. The server is ready for new games.');
    }
});