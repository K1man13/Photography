// Vercel Serverless Function: api/mpesa-callback.js
// Receives Safaricom callback and persists to ./data/transactions.json for demo purposes
// In production, replace with a DB-backed persistence

const fs = require('fs');
const path = require('path');
const fetch = global.fetch;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // keep this secret

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// removed
module.exports = () => {};
    const stk = body?.Body?.stkCallback || body;
