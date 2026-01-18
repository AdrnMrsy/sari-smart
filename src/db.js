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

// Replace with the URL you got from the terminal
db.cloud.configure({
  databaseUrl: "https://zmgtmkvz4.dexie.cloud",
  requireAuth: true // This forces the login screen to appear
});