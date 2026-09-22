// Soft ambient section glow. These used to be big `rounded-full blur-[110px]`
// blobs — a 100px+ gaussian blur on a ~600px element is expensive to
// rasterize and to keep in GPU memory on phones. A radial gradient paints the
// same soft falloff with no filter at all, so it costs effectively nothing.
// Positioning and size come from `className`; keep tones in sync with the
// brand tokens in tailwind.config.js.
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
