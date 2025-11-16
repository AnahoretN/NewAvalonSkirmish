/**
 * @file This script synchronizes the TypeScript deck definitions with the `decks.json` file used by the server.
 * It reads from the authoritative .ts files and writes the structured data to JSON,
 * automating a previously manual process.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Important: Use relative paths that work when this script is run from the project root.
import { cardDatabase } from '../Decks/cards.js';
import { tokenDatabase } from '../Decks/tokens.js';
import { deckFiles } from '../Decks/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The target file is `decks.json` in the project root.
const DECKS_JSON_PATH = path.join(__dirname, '..', 'decks.json');

/**
 * Converts Map instances to plain JavaScript objects, which are serializable to JSON.
 * @param {Map<string, any>} map - The Map to convert.
 * @returns {Record<string, any>} A plain object representation of the Map.
 */
const mapToObject = (map: Map<string, any>): Record<string, any> => {
    const obj: Record<string, any> = {};
    for (const [key, value] of map.entries()) {
        obj[key] = value;
    }
    return obj;
}

// Prepare the final data structure for serialization.
const dataToSync = {
  cardDatabase: mapToObject(cardDatabase),
  tokenDatabase: mapToObject(tokenDatabase),
  deckFiles: deckFiles, // deckFiles is already a plain array of objects.
};

try {
  // Write the data to decks.json with pretty-printing (2-space indentation).
  fs.writeFileSync(DECKS_JSON_PATH, JSON.stringify(dataToSync, null, 2));
  console.log('✅ decks.json has been successfully synchronized with the TypeScript source files.');
} catch (error) {
  console.error('❌ Error synchronizing decks.json:', error);
  // FIX: Replaced `process.exit(1)` to resolve a TypeScript error ("Property 'exit' does not exist on type 'Process'").
  // Throwing the error also exits with an error code to halt any subsequent build steps.
  throw error;
}
