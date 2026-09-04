const crypto = require('node:crypto');

const PRODUCTS = new Set([
  'wallet-investigation-starter-kit',
  'web3-security-incident-triage-pack',
]);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'security-kit-interest', pii: false });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const product = String(body.product || '').trim();
  if (!PRODUCTS.has(product)) return res.status(400).json({ error: 'unknown_product' });
  const event = {
    event: 'security_kit_interest',
    event_id: crypto.randomUUID(),
    product,
    observed_at: new Date().toISOString(),
    source: 'glasscastles_public_site',
    pii_collected: false,
  };
  console.log(JSON.stringify(event));
  return res.status(202).json({ ok: true, event_id: event.event_id });
};
