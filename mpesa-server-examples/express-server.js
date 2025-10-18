/*
Express example server to trigger M-Pesa STK Push via Safaricom Daraja API.
Configuration (set environment variables):
  - CONSUMER_KEY
  - CONSUMER_SECRET
  - BUSINESS_SHORTCODE
  - PASSKEY
  - CALLBACK_URL (your public /mpesa/callback route)

This example demonstrates obtaining an OAuth token and performing an STK Push request.
This is educational; in production secure your secrets and validate incoming callbacks.
*/

const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE; // e.g., 174379
const PASSKEY = process.env.PASSKEY; // Daraja passkey
const CALLBACK_URL = process.env.CALLBACK_URL; // public URL to receive stk push callback

if (!CONSUMER_KEY || !CONSUMER_SECRET || !BUSINESS_SHORTCODE || !PASSKEY || !CALLBACK_URL) {
  console.warn('Please set CONSUMER_KEY, CONSUMER_SECRET, BUSINESS_SHORTCODE, PASSKEY, and CALLBACK_URL in env');
}

async function getOAuthToken() {
  const resp = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    }
  });
  return resp.json();
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return true; // treat as disabled
  const resp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`, { method: 'POST' });
  const data = await resp.json();
  return data.success && data.score && data.score >= 0.3; // adjust score threshold as needed
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

app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, ref, 'g-recaptcha-response': recaptcha } = req.body;
    if (recaptcha) {
      const ok = await verifyRecaptcha(recaptcha);
      if (!ok) return res.status(403).json({ error: 'reCAPTCHA verification failed' });
    }
    if (!phone || !amount) return res.status(400).json({ error: 'Missing phone or amount' });

    const tokenResp = await getOAuthToken();
    const token = tokenResp.access_token;

    const timestamp = getTimestamp();
    const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const body = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
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
    return res.status(resp.status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/mpesa/callback', (req, res) => {
  // Safaricom will POST callback here; you should validate and store the result.
  console.log('STK Callback received', JSON.stringify(req.body));
  // respond 200 quickly
  res.json({ result: 'ok' });
});

app.listen(PORT, () => console.log(`MPesa example server running on ${PORT}`));
