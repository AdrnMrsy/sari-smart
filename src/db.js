// src/db.js
import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

export const db = new Dexie('SariSmartDB', { addons: [dexieCloud] });

db.version(4).stores({
  products: '@id, name, category, barcode, retailPrice, stock',
  customers: '@id, name, balance',
  credit_logs: '@id, customerId, items, totalAmount, date',
  sales: '@id, total, items, date'
});

// Cloud sync configuration (optional)
// Get URL from: https://dex.cloud/
const cloudUrl = import.meta.env.VITE_DEXIE_CLOUD_URL;

if (cloudUrl) {
  db.cloud.configure({
    databaseUrl: cloudUrl,
    requireAuth: false // Login is optional; only needed for sync
  });
} else if (import.meta.env.DEV) {
  console.warn('Dexie Cloud not configured. Cloud sync disabled. Set VITE_DEXIE_CLOUD_URL in .env.local to enable.');
}