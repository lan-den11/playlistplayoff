'use client';

import { m } from 'framer-motion';
import { useReveal } from '../../hooks/useReveal';

export default function Reveal({ as = 'div', delay = 0, distance, amount, className = '', children, ...rest }) {
  const { item, viewport, isMobile } = useReveal({ distance, amount });
  const Tag = m[as];

  return (
    <Tag
      variants={item}
      custom={isMobile ? 0 : delay}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
