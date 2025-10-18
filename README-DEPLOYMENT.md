Vercel + Supabase deployment notes

1) Vercel project
- Import this repo into Vercel.
- Ensure build settings serve static files from the repo root (Vercel does this by default for static sites).

2) Environment variables (Vercel Project → Settings → Environment Variables)
- CONSUMER_KEY — Safaricom Daraja consumer key (sandbox or production)
- CONSUMER_SECRET — Safaricom Daraja consumer secret
- BUSINESS_SHORTCODE — Your Paybill or Till number
- PASSKEY — Lipa na M-Pesa Online passkey
- CALLBACK_URL — optional, defaults to https://<your-vercel-domain>/api/mpesa-callback
- MPESA_ACCOUNT_TYPE — 'till' or 'paybill' (affects TransactionType)

Supabase (persistence & auth)
- SUPABASE_URL — e.g. https://xyzcompany.supabase.co
- SUPABASE_SERVICE_ROLE_KEY — service_role key (server-side only, keep secret)
- SUPABASE_ANON_KEY — anon/public key (used by admin client for auth)

3) Supabase setup
- In Supabase SQL editor run `db/create_transactions.sql` to create the `transactions` table.
- Configure Auth settings and enable email sign-ins (magic links) or an OAuth provider for admin accounts.

4) Callback URL
- In Safaricom Daraja set the callback URL to:
  https://<your-vercel-domain>/api/mpesa-callback

5) Notes
- `api/mpesa-callback.js` and `api/mpesa-list.js` will use Supabase REST API when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. If not present they fall back to file persistence in `data/transactions.json` (demo only).
- Protect admin UI in production: use Supabase Auth and only allow admin emails.
