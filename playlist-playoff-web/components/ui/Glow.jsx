const TONES = {
  brand:
    'bg-[radial-gradient(closest-side,rgba(18,64,234,0.17),rgba(18,64,234,0.07)_55%,transparent)]',
  deep:
    'bg-[radial-gradient(closest-side,rgba(10,26,107,0.45),rgba(10,26,107,0.18)_55%,transparent)]',
  amber:
    'bg-[radial-gradient(closest-side,rgba(245,158,11,0.22),rgba(249,115,22,0.09)_55%,transparent)]',
};

export default function Glow({ tone = 'brand', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 ${TONES[tone] ?? TONES.brand} ${className}`}
    />
  );
}
