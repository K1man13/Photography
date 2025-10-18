// Netlify Function to receive Safaricom STK Push callbacks
// Deploy as netlify/functions/mpesa-callback.js
// NOTE: Writing to the filesystem in serverless environments is ephemeral. This function writes to
// ./data/transactions.json for local testing and examples. For production use a real persistent store
// (S3, FaunaDB, DynamoDB, Postgres, etc.).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const body = JSON.parse(event.body || '{}');
    // Safaricom callback structure varies; store entire payload and a parsed summary
    const record = {
      receivedAt: new Date().toISOString(),
      raw: body,
      summary: extractSummary(body)
    };

    ensureDataFile();
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    existing.push(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2), 'utf8');

    // Respond quickly with 200 to Safaricom
    return { statusCode: 200, body: JSON.stringify({ result: 'ok' }) };
  } catch (err) {
    console.error('Callback error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server error' }) };
  }
};

function extractSummary(body) {
  try {
    const out = {};
    // Many Daraja callbacks include Body.stkCallback
    const stk = body?.Body?.stkCallback || body;
    out.resultCode = stk?.ResultCode ?? null;
    out.resultDesc = stk?.ResultDesc ?? null;
    out.merchantRequestID = stk?.MerchantRequestID ?? null;
    out.checkoutRequestID = stk?.CheckoutRequestID ?? null;
    // callback metadata may be nested; try to pull common fields
    const items = stk?.CallbackMetadata?.Item || stk?.CallbackMetadata || null;
    if (Array.isArray(items)) {
      items.forEach(i => {
        const name = i?.Name || i?.name || i?.Key;
        const value = i?.Value ?? i?.value ?? null;
        if (name && value !== null) out[name] = value;
      });
    }
    return out;
  } catch (e) {
    return { parseError: true };
  }
}
