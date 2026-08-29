// ============================================================
// SynapseAI — JSON File Storage Service
// Simple file-based storage (can be swapped for MongoDB later)
// ============================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

/**
 * Ensure the data directory and file exist
 */
async function ensureFile(filename) {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    await writeFile(filepath, JSON.stringify([], null, 2));
  }
  return filepath;
}

/**
 * Read all records from a JSON file
 */
export async function readAll(collection) {
  const filepath = await ensureFile(`${collection}.json`);
  const raw = await readFile(filepath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Write all records to a JSON file
 */
export async function writeAll(collection, data) {
  const filepath = await ensureFile(`${collection}.json`);
  await writeFile(filepath, JSON.stringify(data, null, 2));
}

/**
 * Add a record to a collection
 */
export async function addRecord(collection, record) {
  const data = await readAll(collection);
  const newRecord = {
    id: crypto.randomUUID(),
    ...record,
    createdAt: new Date().toISOString(),
  };
  data.push(newRecord);
  await writeAll(collection, data);
  return newRecord;
}

/**
 * Find a record by ID
 */
export async function findById(collection, id) {
  const data = await readAll(collection);
  return data.find(r => r.id === id) || null;
}

/**
 * Update a record by ID
 */
export async function updateRecord(collection, id, updates) {
  const data = await readAll(collection);
  const index = data.findIndex(r => r.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  await writeAll(collection, data);
  return data[index];
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(collection, id) {
  const data = await readAll(collection);
  const filtered = data.filter(r => r.id !== id);
  if (filtered.length === data.length) return false;
  await writeAll(collection, filtered);
  return true;
}

/**
 * Get stats: count of records per collection
 */
export async function getStats() {
  const collections = ['conversations', 'summaries', 'codeReviews', 'sentimentAnalyses'];
  const stats = {};
  for (const col of collections) {
    try {
      const data = await readAll(col);
      stats[col] = data.length;
    } catch {
      stats[col] = 0;
    }
  }
  return stats;
}
