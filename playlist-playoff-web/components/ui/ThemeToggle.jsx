'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { subscribeTheme, toggleTheme } from '../../lib/theme';

// Round glass icon button, same construction as GlassIconBadge, but
// interactive. Renders nothing until mounted so the icon never flashes the
// wrong state during hydration (the page itself is never wrong — see the
// inline script in app/layout.jsx — only this icon's *label* briefly
// wouldn't know which way to point).
export default function ThemeToggle({ className = '' }) {
  const [theme, setThemeState] = useState(null);

  useEffect(() => subscribeTheme(setThemeState), []);

  if (!theme) {
    return <span aria-hidden="true" className={`h-9 w-9 flex-none rounded-2xl ${className}`} />;
  }

  const isLight = theme === 'light';

  return (
    <m.button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative inline-flex h-9 w-9 flex-none items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-b from-brand/45 via-brand/25 to-brand-deep/40 text-zinc-50 backdrop-blur-xl backdrop-saturate-150 [data-theme=light]:border-black/10 [data-theme=light]:from-white [data-theme=light]:via-zinc-100 [data-theme=light]:to-zinc-200 [data-theme=light]:text-zinc-700 [data-theme=light]:shadow-sm ${className}`}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </m.button>
  );
}
