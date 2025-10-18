// Vercel Serverless Function: api/mpesa.js
// Accepts POST { phone, amount, ref, 'g-recaptcha-response' }
// Environment variables required: CONSUMER_KEY, CONSUMER_SECRET, BUSINESS_SHORTCODE, PASSKEY
// Optional: CALLBACK_URL, RECAPTCHA_SECRET, MPESA_ACCOUNT_TYPE, SITE_URL
// removed
module.exports = () => {};
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE;
