import { cache } from 'react';
import ShareResult from '../../components/share/ShareResult';
import { buildRounds, decodeBracket } from '../../lib/shareBracket';
import { getTracksByIds } from '../../lib/spotifyTracks';

const loadResult = cache(async (code) => {
  const decoded = decodeBracket(code);
  if (!decoded) return null;
  try {
    const tracks = await getTracksByIds(decoded.ids.filter((id) => id !== '_'));
    const rounds = buildRounds(decoded.ids, decoded.bits, tracks);
    const champion = rounds[rounds.length - 1]?.[0]?.winner;
    return champion ? { rounds, champion } : null;
  } catch (e) {
    console.error('Share page error:', e.message);
    return null;
  }
});

export async function generateMetadata({ searchParams }) {
  const { b } = await searchParams;
  const result = await loadResult(b);
  const robots = { index: false, follow: false };
  if (!result) return { robots };

  const { champion } = result;
  const title = `${champion.name} took the crown — Playlist Playoff`;
  const description = 'See every pick in this bracket, then build your own.';
  const images = champion.imageLarge ? [champion.imageLarge] : undefined;

  return {
    title,
    description,
    robots,
    openGraph: { type: 'website', siteName: 'Playlist Playoff', title, description, images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images },
  };
}

export default async function SharePage({ searchParams }) {
  const { b } = await searchParams;
  const result = await loadResult(b);
  return <ShareResult rounds={result?.rounds ?? null} />;
}
