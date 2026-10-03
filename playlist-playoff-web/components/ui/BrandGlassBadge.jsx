import BrandIcon from './BrandIcon';

export default function BrandGlassBadge({ size, flat = false, iconRatio = 0.46, strokeWidth = 1.75 }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: flat ? 0 : Math.round(size * 0.44),
        overflow: 'hidden',
        backgroundColor: '#09090b',
        border: flat ? 'none' : '1px solid rgba(255,255,255,0.3)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'linear-gradient(180deg, rgba(18,64,234,0.85) 0%, rgba(18,64,234,0.55) 50%, rgba(10,26,107,0.8) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      <BrandIcon size={Math.round(size * iconRatio)} color="#fafafa" strokeWidth={strokeWidth} />
    </div>
  );
}
