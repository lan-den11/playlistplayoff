'use client';

import { motion } from 'framer-motion';
import GlassSurface from './GlassSurface';

export default function GlassButton({ children, onClick, type = 'button', className = '' }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
    >
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={999}
        backgroundOpacity={0.08}
        opacity={0.85}
        blur={7}
        brightness={55}
        saturation={1.3}
        style={{ position: 'absolute', inset: 0 }}
      />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-zinc-50">
        {children}
      </span>
    </motion.button>
  );
}
