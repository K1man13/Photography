// Netlify function: mpesa.js
// Deploy this as netlify/functions/mpesa.js
// This function expects POST { phone, amount, ref, 'g-recaptcha-response' }
// Environment variables to set in Netlify site settings:
// CONSUMER_KEY, CONSUMER_SECRET, BUSINESS_SHORTCODE, PASSKEY, CALLBACK_URL, RECAPTCHA_SECRET

const fetch = require('node-fetch');

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE;
const PASSKEY = process.env.PASSKEY;
// If CALLBACK_URL is not set, default to the Netlify callback function path (useful for quick Netlify deploys)
const CALLBACK_URL = process.env.CALLBACK_URL || process.env.SITE_URL ? `${(process.env.SITE_URL || '').replace(/\/$/, '')}/.netlify/functions/mpesa-callback` : `/.netlify/functions/mpesa-callback`;
// Optional: set MPESA_ACCOUNT_TYPE to 'till' for Till (CustomerBuyGoodsOnline) or 'paybill' for Paybill (CustomerPayBillOnline)
const MPESA_ACCOUNT_TYPE = (process.env.MPESA_ACCOUNT_TYPE || 'paybill').toLowerCase();

const TRANSACTION_TYPE = MPESA_ACCOUNT_TYPE === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

async function getOAuthToken() {
  const resp = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64') }
  });
  return resp.json();
}

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

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return true;
  const resp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`, { method: 'POST' });
  const data = await resp.json();
  return data.success && data.score && data.score >= 0.3;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { phone, amount, ref, 'g-recaptcha-response': recaptcha } = JSON.parse(event.body || '{}');
    if (recaptcha) {
      const ok = await verifyRecaptcha(recaptcha);
      if (!ok) return { statusCode: 403, body: JSON.stringify({ error: 'reCAPTCHA verification failed' }) };
    }
    if (!phone || !amount) return { statusCode: 400, body: JSON.stringify({ error: 'Missing phone or amount' }) };

    const tokenResp = await getOAuthToken();
    const token = tokenResp.access_token;

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
    return { statusCode: resp.status, body: JSON.stringify(data) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
