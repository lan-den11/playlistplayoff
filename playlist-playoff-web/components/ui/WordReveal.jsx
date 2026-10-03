'use client';

import { Fragment } from 'react';
import { m } from 'framer-motion';
import { useReveal } from '../../hooks/useReveal';

const list = {
  hidden: {},
  show: (delay = 0) => ({ transition: { staggerChildren: 0.055, delayChildren: delay } }),
};

const word = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function WordReveal({ as = 'h2', text, delay = 0, amount, inherit = false, className = '' }) {
  const { viewport } = useReveal({ amount });
  const Tag = m[as];
  const words = text.split(' ');
  const trigger = inherit ? {} : { initial: 'hidden', whileInView: 'show', viewport };

  return (
    <Tag variants={list} custom={delay} className={className} {...trigger}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <m.span variants={word} className="inline-block">
            {w}
          </m.span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}
