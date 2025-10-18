// Vercel Serverless Function: api/mpesa.js
// Accepts POST { phone, amount, ref, 'g-recaptcha-response' }
// Environment variables required: CONSUMER_KEY, CONSUMER_SECRET, BUSINESS_SHORTCODE, PASSKEY
// Optional: CALLBACK_URL, RECAPTCHA_SECRET, MPESA_ACCOUNT_TYPE, SITE_URL

const fetch = global.fetch;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE;
const PASSKEY = process.env.PASSKEY;
const MPESA_ACCOUNT_TYPE = (process.env.MPESA_ACCOUNT_TYPE || 'paybill').toLowerCase();

const TRANSACTION_TYPE = MPESA_ACCOUNT_TYPE === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

const CALLBACK_URL = process.env.CALLBACK_URL || (process.env.SITE_URL ? `${(process.env.SITE_URL || '').replace(/\/$/, '')}/api/mpesa-callback` : '/api/mpesa-callback');

function getTimestamp() {
  const pad = (n) => n.toString().padStart(2, '0');
  const d = new Date();
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${y}${m}${day}${hh}${mm}${ss}`;
}

async function getOAuthToken() {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error('Missing consumer key/secret');
  const resp = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64') }
  });
  return resp.json();
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return true;
  const resp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`, { method: 'POST' });
  const data = await resp.json();
  return data.success && (data.score === undefined || data.score >= 0.3);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const { phone, amount, ref, 'g-recaptcha-response': recaptcha } = req.body || {};
    if (recaptcha) {
      const ok = await verifyRecaptcha(recaptcha);
      if (!ok) return res.status(403).json({ error: 'reCAPTCHA verification failed' });
    }
    if (!phone || !amount) return res.status(400).json({ error: 'Missing phone or amount' });

    const tokenResp = await getOAuthToken();
    const token = tokenResp.access_token;
    if (!token) return res.status(500).json({ error: 'Failed to get OAuth token' });

    const timestamp = getTimestamp();
    const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const body = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: TRANSACTION_TYPE,
      Amount: amount,
      PartyA: phone,
      PartyB: BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: ref || 'KymCreates',
      TransactionDesc: ref || 'Payment'
    };

    const resp = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    return res.status(resp.status || 200).json(data);
  } catch (err) {
    console.error('mpesa error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
