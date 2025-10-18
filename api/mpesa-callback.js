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

function extractSummary(body) {
  try {
    const out = {};
    const stk = body?.Body?.stkCallback || body;
    out.resultCode = stk?.ResultCode ?? null;
    out.resultDesc = stk?.ResultDesc ?? null;
    out.merchantRequestID = stk?.MerchantRequestID ?? null;
    out.checkoutRequestID = stk?.CheckoutRequestID ?? null;
    const items = stk?.CallbackMetadata?.Item || stk?.CallbackMetadata || null;
    if (Array.isArray(items)) {
      items.forEach(i => {
        const name = i?.Name || i?.name || i?.Key;
        const value = i?.Value ?? i?.value ?? null;
        if (name && value !== null) out[name] = value;
      });
    }
    return out;
  } catch (e) { return { parseError: true }; }
}

async function persistToSupabase(record) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase not configured');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/transactions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify([{ raw: record.raw, summary: record.summary, received_at: record.receivedAt }])
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error('Supabase insert failed: ' + t);
  }
  return resp.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const body = req.body || {};
    const record = { receivedAt: new Date().toISOString(), raw: body, summary: extractSummary(body) };
    // Try Supabase first (production). If not configured, fall back to local file (demo/test).
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await persistToSupabase(record);
        return res.status(200).json({ result: 'ok', persisted: 'supabase' });
      } catch (err) {
        console.error('Supabase persist error', err);
        // fallback to file
      }
    }

    ensureDataFile();
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    existing.push(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return res.status(200).json({ result: 'ok', persisted: 'file' });
  } catch (err) {
    console.error('callback error', err);
    return res.status(500).json({ error: 'server error' });
  }
};
