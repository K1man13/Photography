// Vercel Serverless Function: api/mpesa-list.js
// WARNING: Demo only. Protect with auth in production.

const fs = require('fs');
const path = require('path');
const fetch = global.fetch;

const DATA_FILE = path.join(__dirname, '..', 'data', 'transactions.json');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchFromSupabase() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/transactions?select=*`;
  const resp = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!resp.ok) throw new Error('Supabase fetch failed');
  return resp.json();
}

// Verify JWT with Supabase (get user info). Returns user object if token valid.
async function verifySupabaseToken(token) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY || '' } });
  if (!resp.ok) return null;
  return resp.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  try {
    // If Supabase is configured, require a valid Bearer token from client
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) {
        // Allow demo header for local testing: x-demo-password: letmein
        const demo = req.headers['x-demo-password'];
        if (demo === 'letmein') {
          // fall through to file fallback below
        } else {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } else {
        const token = auth.split(' ')[1];
        const user = await verifySupabaseToken(token);
        if (!user || !user.email) return res.status(401).json({ error: 'Invalid token' });
        // Optional: restrict to certain admin emails here using an allowlist env var
        // If verified, read from Supabase using service role key
        try {
          const rows = await fetchFromSupabase();
          return res.status(200).json(rows);
        } catch (err) {
          console.error('Supabase read error', err);
          // fallback to file
        }
      }
    }

    // fallback: return file-based transactions (demo)
    if (!fs.existsSync(DATA_FILE)) return res.status(200).json([]);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
