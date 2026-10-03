import { ImageResponse } from 'next/og';
import BrandGlassBadge from '../components/ui/BrandGlassBadge';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<BrandGlassBadge size={180} flat iconRatio={0.5} />, { ...size });
}
