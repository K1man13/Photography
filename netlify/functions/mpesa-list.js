// Netlify Function to list stored transactions (for admin UI)
// Deploy as netlify/functions/mpesa-list.js
// WARNING: In production, protect this function with authentication. This example returns the JSON contents
// of ./data/transactions.json for convenience.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'transactions.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    if (!fs.existsSync(DATA_FILE)) return { statusCode: 200, body: '[]' };
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return { statusCode: 200, body: data };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server error' }) };
  }
};
