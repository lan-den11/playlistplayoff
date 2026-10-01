export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || '').trim();
export const PRIVACY_EMAIL = (process.env.NEXT_PUBLIC_PRIVACY_EMAIL || '').trim() || CONTACT_EMAIL;
export const LEGAL_ENTITY = (process.env.NEXT_PUBLIC_LEGAL_ENTITY || '').trim() || 'Playlist Playoff';
