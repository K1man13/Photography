// Vercel Serverless Function: api/mpesa.js
// Accepts POST { phone, amount, ref, 'g-recaptcha-response' }
// Environment variables required: CONSUMER_KEY, CONSUMER_SECRET, BUSINESS_SHORTCODE, PASSKEY
// Optional: CALLBACK_URL, RECAPTCHA_SECRET, MPESA_ACCOUNT_TYPE, SITE_URL
// Removed: api/mpesa.js
// The user requested all JavaScript files and admin.html be removed.
// This file was replaced with a placeholder to make the repository safe.
module.exports = (req, res) => res.status(410).send('Removed');
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE;
