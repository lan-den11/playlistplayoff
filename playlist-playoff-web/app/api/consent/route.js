const CONSENT_REQUIRED = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'JE', 'GG', 'IM', 'CH',
]);

export async function GET(request) {
  const h = request.headers;
  const country = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country-code') || '')
    .trim()
    .toUpperCase();
  const known = /^[A-Z]{2}$/.test(country) && country !== 'XX';
  return Response.json({ required: known ? CONSENT_REQUIRED.has(country) : null }, { headers: { 'Cache-Control': 'no-store' } });
}
