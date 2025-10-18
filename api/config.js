// Public config endpoint for admin UI. Returns only public keys (SUPABASE_URL and SUPABASE_ANON_KEY)
module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
  return res.status(200).json({ SUPABASE_URL, SUPABASE_ANON_KEY });
};
