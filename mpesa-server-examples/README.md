M-Pesa Server Examples for Kym Creates

This folder contains example server code to trigger Safaricom Daraja STK Push (M-Pesa) for collecting deposits/payments from clients.

Deployment
- For Express: deploy to any Node.js host (Heroku, Railway, Render) and set the env vars there.
- For Vercel: place the `api/` functions at the repository root under `api/` (this workspace already includes `api/mpesa.js`, `api/mpesa-callback.js`, and `api/mpesa-list.js`) and set environment variables in the Vercel project settings.

Vercel quick guide
1. Move or ensure serverless functions live under `api/` (this repo already contains `api/` functions).
2. In your Vercel project settings → Environment Variables, add the following variables:
   - CONSUMER_KEY
   - CONSUMER_SECRET
   - BUSINESS_SHORTCODE
   - PASSKEY
   - CALLBACK_URL (optional)
   - RECAPTCHA_SECRET (optional)
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (server only)
   - SUPABASE_ANON_KEY (public)
3. Deploy via the Vercel dashboard or the Vercel CLI. Your functions will be available at `https://<your-site>/api/mpesa` and related paths.

Callback function
- The repo includes `api/mpesa-callback.js`. Set your Daraja callback URL to `https://<your-site>/api/mpesa-callback` or set `CALLBACK_URL` to the same value.

MPESA account type (Paybill vs Till)
- If you use a Till (BuyGoods) instead of a Paybill, set the environment variable `MPESA_ACCOUNT_TYPE` to `till`. The function will automatically use the Daraja transaction type `CustomerBuyGoodsOnline` for tills; otherwise it defaults to `CustomerPayBillOnline`.

Example Vercel env vars for a Till:
 - BUSINESS_SHORTCODE=123456
 - MPESA_ACCOUNT_TYPE=till
 - PASSKEY=your_passkey_here


Security
- Never commit credentials to source control.
- Validate and store callbacks server-side; send a receipt to the user after successful payment.

Notes
- The example code is minimal and intended to help you get started quickly.
- If you want, I can wire this to a real sandbox account, test the flow end-to-end, and add database-backed transaction persistence and a webhook verification mechanism.
