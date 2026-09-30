import { ImageResponse } from 'next/og';
import { buildRounds, decodeBracket } from '../../../lib/shareBracket';
import { getTracksByIds } from '../../../lib/spotifyTracks';
import { limited } from '../../../lib/rateLimit';

const CROWN_PATHS = [
  'M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z',
  'M5 21h14',
];

function Crown({ size, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#fbbf24"
      stroke="#fbbf24"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {CROWN_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export async function GET(request) {
  const blocked = limited(request, 'share-image', 20, 60_000);
  if (blocked) return blocked;

  const code = new URL(request.url).searchParams.get('b');
  let champion = null;

  try {
    const decoded = decodeBracket(code);
    if (decoded) {
      const tracks = await getTracksByIds(decoded.ids.filter((id) => id !== '_'));
      const rounds = buildRounds(decoded.ids, decoded.bits, tracks);
      champion = rounds[rounds.length - 1]?.[0]?.winner ?? null;
    }
  } catch (e) {
    console.error('Share image error:', e.message);
  }

  const art = champion?.imageLarge || champion?.image || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 80px',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 82% 18%, rgba(18,64,234,0.6) 0%, rgba(9,9,11,0) 58%)',
          color: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', position: 'relative', width: 420, height: 420, flexShrink: 0 }}>
          {art ? (
            <>
              <img
                src={art}
                width={420}
                height={420}
                style={{ width: 420, height: 420, borderRadius: 44, objectFit: 'cover', border: '4px solid rgba(124,156,255,0.75)' }}
              />
              <Crown size={132} style={{ position: 'absolute', top: -78, left: 144, transform: 'rotate(-8deg)' }} />
            </>
          ) : (
            <div
              style={{
                width: 420,
                height: 420,
                borderRadius: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'linear-gradient(180deg, #4d74ff 0%, #0A1A6B 100%)',
                border: '4px solid rgba(255,255,255,0.25)',
              }}
            >
              <Crown size={220} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'linear-gradient(180deg, #4d74ff 0%, #0A1A6B 100%)',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3v-7a9 9 0 1 1 18 0v7h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
              </svg>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Playlist Playoff</div>
          </div>

          <div style={{ display: 'flex', marginTop: 44 }}>
            <div
              style={{
                display: 'flex',
                padding: '8px 22px',
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 3,
                color: '#fcd34d',
                backgroundColor: 'rgba(245,158,11,0.14)',
                border: '2px solid rgba(251,191,36,0.4)',
              }}
            >
              CHAMPION
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: champion ? 68 : 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              lineClamp: 2,
            }}
          >
            {champion ? champion.name : 'Turn any playlist into a showdown.'}
          </div>

          {champion && (
            <div style={{ display: 'flex', marginTop: 18, fontSize: 32, color: '#a1a1aa', lineClamp: 1 }}>
              {champion.artists}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    }
  );
}
