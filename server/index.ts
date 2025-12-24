/**
 * @file Main server entry point for the multiplayer card game.
 * Sets up Express app, WebSocket server, and starts the server.
 */

import express from 'express';
import expressWs from 'express-ws';
import { fileURLToPath } from 'url';
import path from 'path';

import { setupRoutes } from './routes/index.js';
import { setupWebSocket } from './services/websocket.js';
import { initializeContent } from './services/content.js';
import { logger } from './utils/logger.js';
import { validateConfig } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app and enable WebSocket
const app = express();
const wsInstance = expressWs(app);
const wss = wsInstance.getWss();

// Validate configuration
validateConfig();

// Initialize content database
try {
  await initializeContent();
} catch (error) {
  logger.error('Failed to initialize content database:', error);
  process.exit(1);
}

// Setup middleware
app.use(express.json({ limit: '10mb' }));

// Determine static file path based on environment
const isProduction = process.env.NODE_ENV === 'production' || __dirname.includes('dist-server');
const staticPath = isProduction
  ? path.join(__dirname, '../../dist')  // From dist-server/server/ to project/dist
  : path.join(__dirname, '../client/dist'); // Development (not used, dev uses tsx)

app.use(express.static(staticPath));

// Setup routes
setupRoutes(app);

// Setup WebSocket handlers
setupWebSocket(wss);

// Start server
const PORT = process.env.PORT || 8822;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, wss };