import { ImageResponse } from 'next/og';

export const alt = 'Playlist Playoff — Turn any playlist into a showdown';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link-preview card (Discord, iMessage, X, Slack…). Satori only understands
// flexbox + inline styles, so this is the one place inline styles are required.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 82% 18%, rgba(18,64,234,0.6) 0%, rgba(9,9,11,0) 58%)',
          color: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundImage: 'linear-gradient(180deg, #4d74ff 0%, #0A1A6B 100%)',
              marginRight: 18,
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Playlist Playoff</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.04, letterSpacing: -3, maxWidth: 940 }}>
            Turn any playlist into a showdown.
          </div>
          <div style={{ fontSize: 30, color: '#a1a1aa', marginTop: 28, maxWidth: 1000 }}>
            Pick winners, song by song, until one track takes the crown.
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              padding: '18px 34px',
              borderRadius: 999,
              fontSize: 28,
              fontWeight: 700,
              backgroundImage: 'linear-gradient(180deg, #2f57f0 0%, #0A1A6B 100%)',
              border: '2px solid rgba(255,255,255,0.28)',
            }}
          >
            Join the waitlist
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
