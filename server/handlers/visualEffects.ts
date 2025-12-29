/**
 * @file Visual effects handlers
 * Handles triggering visual effects on clients
 */

import { logger } from '../utils/logger.js';
import { getGameState } from '../services/gameState.js';
import type { WebSocket } from 'ws';

interface ExtendedWebSocket extends WebSocket {
  server?: any;
  playerId?: number;
  gameId?: string;
  clientGameMap?: Map<any, string>;
}

/**
 * Handle TRIGGER_HIGHLIGHT message
 * Broadcasts a highlight effect to all clients in the game
 */
export function handleTriggerHighlight(ws: ExtendedWebSocket, data: any) {
  try {
    // Input validation
    if (!data || typeof data !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid data format'
      }));
      return;
    }

    const { gameId, highlightData } = data;

    if (!gameId || typeof gameId !== 'string') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing gameId'
      }));
      return;
    }

    if (!highlightData || typeof highlightData !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing highlightData'
      }));
      return;
    }

    const gameState = getGameState(gameId);

    if (!gameState) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Game not found'
      }));
      return;
    }

    // Broadcast the highlight event to all clients in the game
    const highlightMessage = JSON.stringify({
      type: 'HIGHLIGHT_TRIGGERED',
      highlightData
    });

    // Use the same broadcasting approach as broadcastToGame
    const wss = ws.server;
    if (wss && wss.clients) {
      wss.clients.forEach((client: ExtendedWebSocket) => {
        if (client.readyState === 1 && wss.clientGameMap && wss.clientGameMap.get(client) === gameId) {
          try {
            client.send(highlightMessage);
          } catch (err: any) {
            logger.error('Error sending highlight to client:', err);
          }
        }
      });
    }

    logger.debug(`Highlight triggered in game ${gameId}`);
  } catch (err: any) {
    logger.error('Failed to trigger highlight:', err);
  }
}

/**
 * Handle TRIGGER_NO_TARGET message
 * Broadcasts a "no target" overlay to all clients in the game
 */
export function handleTriggerNoTarget(ws: ExtendedWebSocket, data: any) {
  try {
    // Input validation
    if (!data || typeof data !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid data format'
      }));
      return;
    }

    const { gameId, coords, timestamp } = data;

    if (!gameId || typeof gameId !== 'string') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing gameId'
      }));
      return;
    }

    if (!coords || typeof coords !== 'object' || typeof coords.row !== 'number' || typeof coords.col !== 'number') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing coords'
      }));
      return;
    }

    const gameState = getGameState(gameId);

    if (!gameState) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Game not found'
      }));
      return;
    }

    // Broadcast the no-target event to all clients in the game
    const message = JSON.stringify({
      type: 'NO_TARGET_TRIGGERED',
      coords,
      timestamp
    });

    // Use the same broadcasting approach as broadcastToGame
    const wss = ws.server;
    if (wss && wss.clients) {
      wss.clients.forEach((client: ExtendedWebSocket) => {
        if (client.readyState === 1 && wss.clientGameMap && wss.clientGameMap.get(client) === gameId) {
          try {
            client.send(message);
          } catch (err: any) {
            logger.error('Error sending no-target to client:', err);
          }
        }
      });
    }

    logger.debug(`No target overlay triggered in game ${gameId}`);
  } catch (err: any) {
    logger.error('Failed to trigger no target overlay:', err);
  }
}

/**
 * Handle TRIGGER_FLOATING_TEXT message
 * Broadcasts a floating text effect to all clients in the game
 */
export function handleTriggerFloatingText(ws: ExtendedWebSocket, data: any) {
  try {
    // Input validation
    if (!data || typeof data !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid data format'
      }));
      return;
    }

    const { gameId, floatingTextData } = data;

    if (!gameId || typeof gameId !== 'string') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing gameId'
      }));
      return;
    }

    if (!floatingTextData || typeof floatingTextData !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing floatingTextData'
      }));
      return;
    }

    const gameState = getGameState(gameId);

    if (!gameState) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Game not found'
      }));
      return;
    }

    // Broadcast the floating text event to all clients in the game
    const message = JSON.stringify({
      type: 'FLOATING_TEXT_TRIGGERED',
      floatingTextData
    });

    const wss = ws.server;
    if (wss && wss.clients) {
      wss.clients.forEach((client: ExtendedWebSocket) => {
        if (client.readyState === 1 && wss.clientGameMap && wss.clientGameMap.get(client) === gameId) {
          try {
            client.send(message);
          } catch (err: any) {
            logger.error('Error sending floating text to client:', err);
          }
        }
      });
    }

    logger.debug(`Floating text triggered in game ${gameId}`);
  } catch (err: any) {
    logger.error('Failed to trigger floating text:', err);
  }
}

/**
 * Handle TRIGGER_FLOATING_TEXT_BATCH message
 * Broadcasts a batch of floating text effects to all clients in the game
 */
export function handleTriggerFloatingTextBatch(ws: ExtendedWebSocket, data: any) {
  try {
    // Input validation
    if (!data || typeof data !== 'object') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid data format'
      }));
      return;
    }

    const { gameId, batch } = data;

    if (!gameId || typeof gameId !== 'string') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing gameId'
      }));
      return;
    }

    if (!Array.isArray(batch)) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid or missing batch array'
      }));
      return;
    }

    const gameState = getGameState(gameId);

    if (!gameState) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Game not found'
      }));
      return;
    }

    // Broadcast the floating text batch event to all clients in the game
    const message = JSON.stringify({
      type: 'FLOATING_TEXT_BATCH_TRIGGERED',
      batch
    });

    const wss = ws.server;
    if (wss && wss.clients) {
      wss.clients.forEach((client: ExtendedWebSocket) => {
        if (client.readyState === 1 && wss.clientGameMap && wss.clientGameMap.get(client) === gameId) {
          try {
            client.send(message);
          } catch (err: any) {
            logger.error('Error sending floating text batch to client:', err);
          }
        }
      });
    }

    logger.debug(`Floating text batch triggered in game ${gameId}`);
  } catch (err: any) {
    logger.error('Failed to trigger floating text batch:', err);
  }
}
