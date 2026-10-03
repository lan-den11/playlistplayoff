import { ImageResponse } from 'next/og';
import BrandGlassBadge from '../components/ui/BrandGlassBadge';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<BrandGlassBadge size={64} iconRatio={0.5} strokeWidth={2} />, { ...size });
}
