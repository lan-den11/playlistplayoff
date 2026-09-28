import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
          backgroundImage: 'linear-gradient(180deg, #4d74ff 0%, #0A1A6B 100%)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafafa"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3v-7a9 9 0 1 1 18 0v7h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
