import { ImageResponse } from 'next/og';
import BrandIcon from '../components/ui/BrandIcon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(180deg, #4d74ff 0%, #0A1A6B 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '55%',
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        <BrandIcon size={124} color="#fafafa" strokeWidth={2.5} />
      </div>
    ),
    { ...size }
  );
}
