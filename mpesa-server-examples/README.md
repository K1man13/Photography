M-Pesa Server Examples for Kym Creates

This folder contains example server code to trigger Safaricom Daraja STK Push (M-Pesa) for collecting deposits/payments from clients.

Files
- express-server.js - A simple Express server demonstrating OAuth and STK Push.
- netlify-function-mpesa.js - A Netlify Function (serverless) example that does the same.

How it works
1. The client (your website) collects phone number (MSISDN in format 2547XXXXXXXX) and amount.
2. The client POSTs to your server endpoint (e.g., /api/mpesa/stkpush).
3. The server obtains an OAuth token from Safaricom Daraja, constructs the STK Push payload (including a timestamp and password computed via BusinessShortCode + Passkey + Timestamp), and calls the Daraja STK Push API.
4. Safaricom sends back an immediate response and also calls your configured Callback URL with the final transaction status.

Configuration
Set these environment variables:
- CONSUMER_KEY
- CONSUMER_SECRET
- BUSINESS_SHORTCODE (e.g., 174379 for sandbox)
- PASSKEY
- CALLBACK_URL (public URL for incoming callbacks, e.g., https://yourdomain.com/api/mpesa/callback)
 - RECAPTCHA_SECRET (optional) - the secret key for server-side reCAPTCHA v3 verification.

Client-side reCAPTCHA
- If you enable reCAPTCHA v3 on the site, obtain a SITE_KEY from Google and set it in the front-end (replace RECAPTCHA_SITE_KEY in `index.html`). The server should be configured with the matching RECAPTCHA_SECRET to verify tokens.

Sandbox vs Production
- Use the Daraja sandbox credentials for local testing. Your BusinessShortCode and Passkey differ between sandbox and production.
- In production, ensure HTTPS for callbacks and secure storage of your credentials.

Deployment
- For Express: deploy to any Node.js host (Heroku, Railway, Render) and set the env vars there.
- For Netlify: place the netlify function under netlify/functions and set env vars in Netlify site settings.
 
Netlify deployment (quick guide)
1. Add the `netlify/functions/mpesa.js` function to your repo (this workspace has an example under `netlify/functions/mpesa.js`).
2. In your Netlify site settings -> Build & deploy -> Environment, add the following variables:
	- CONSUMER_KEY
	- CONSUMER_SECRET
	- BUSINESS_SHORTCODE
	- PASSKEY
	- CALLBACK_URL (public URL for incoming callbacks)
	- RECAPTCHA_SECRET (optional; leave blank to disable server-side verification)
3. Deploy the site. The function will be available at `https://<your-site>/.netlify/functions/mpesa`.
4. Update `index.html` PAYMENT_ENDPOINT if you host the function at a different path or domain.

Callback function
- This repo includes a Netlify callback function at `netlify/functions/mpesa-callback.js`. If you deploy both functions to Netlify you can set `CALLBACK_URL` to `https://<your-site>/.netlify/functions/mpesa-callback` or leave `CALLBACK_URL` blank; the mpesa function will default to `/.netlify/functions/mpesa-callback` (and will prepend `SITE_URL` if set in Netlify env vars).

MPESA account type (Paybill vs Till)
- If you use a Till (BuyGoods) instead of a Paybill, set the environment variable `MPESA_ACCOUNT_TYPE` to `till` in Netlify. The function will automatically use the Daraja transaction type `CustomerBuyGoodsOnline` for tills; otherwise it defaults to `CustomerPayBillOnline`.

Example Netlify env vars for a Till:
 - BUSINESS_SHORTCODE=123456
 - MPESA_ACCOUNT_TYPE=till
 - PASSKEY=your_passkey_here


Security
- Never commit credentials to source control.
- Validate and store callbacks server-side; send a receipt to the user after successful payment.

Notes
- The example code is minimal and intended to help you get started quickly.
- If you want, I can wire this to a real sandbox account, test the flow end-to-end, and add database-backed transaction persistence and a webhook verification mechanism.
