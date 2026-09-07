'use client';

import { useLayoutEffect, useRef } from 'react';
import { trackLabel } from '../../lib/bracketEngine';

// True bye = permanently a single entrant (round-0 padding only). A later
// round with a null side is just pending, not a bye — it still renders.
function isTrueByeSlot(m, roundIdx) {
  if (roundIdx !== 0) return false;
  return !m || (m.a && !m.b) || (!m.a && m.b) || (!m.a && !m.b);
}

function drawConnectors(wrapEl, svgEl, rounds) {
  if (!wrapEl || !svgEl) return;
  const width = wrapEl.scrollWidth;
  const height = wrapEl.scrollHeight;
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);
  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const wrapRect = wrapEl.getBoundingClientRect();
  const roundEls = wrapEl.querySelectorAll('[data-tree-round]');
  let paths = '';

  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const fromRoundEl = roundEls[ri];
    const toRoundEl = roundEls[ri + 1];
    if (!fromRoundEl || !toRoundEl) continue;
    rounds[ri].forEach((m, i) => {
      if (isTrueByeSlot(m, ri)) return;
      const parentIdx = Math.floor(i / 2);
      const fromEl = fromRoundEl.querySelector(`[data-match-idx="${i}"]`);
      const toEl = toRoundEl.querySelector(`[data-match-idx="${parentIdx}"]`);
      if (!fromEl || !toEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const x1 = fromRect.right - wrapRect.left + wrapEl.scrollLeft;
      const y1 = fromRect.top - wrapRect.top + fromRect.height / 2 + wrapEl.scrollTop;
      const x2 = toRect.left - wrapRect.left + wrapEl.scrollLeft;
      const y2 = toRect.top - wrapRect.top + toRect.height / 2 + wrapEl.scrollTop;
      const midX = (x1 + x2) / 2;
      paths += `<path d="M ${x1} ${y1} H ${midX} V ${y2} H ${x2}" stroke="url(#tree-connector-gradient)" stroke-width="2" fill="none" />`;
    });
  }
  svgEl.innerHTML = `<defs><linearGradient id="tree-connector-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8b5cf6" /><stop offset="100%" stop-color="#6366f1" /></linearGradient></defs>${paths}`;
}

function TreeBlock({ rounds, heading, isActiveBlock, activeRoundIdx, activeMatchIndex }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const wrapEl = wrapRef.current;
    if (!wrapEl) return;
    const redraw = () => requestAnimationFrame(() => drawConnectors(wrapEl, svgRef.current, rounds));
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(wrapEl);
    window.addEventListener('resize', redraw);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', redraw);
    };
  }, [rounds]);

  return (
    <div className="mb-10">
      <p className="mb-4 text-center font-display text-sm font-bold uppercase tracking-widest text-zinc-500">
        {heading}
      </p>
      <div ref={wrapRef} className="relative overflow-x-auto pb-4">
        <div className="flex w-max gap-10 px-2">
          {rounds.map((r, roundIdx) => (
            <div key={roundIdx} data-tree-round className="flex flex-col justify-around gap-4">
              {r.map((m, i) => {
                if (roundIdx === 0 && isTrueByeSlot(m, 0)) return null;
                const aLabel = m.a ? trackLabel(m.a) : 'TBD';
                const bLabel = m.b ? trackLabel(m.b) : 'TBD';
                const aWon = m.winner && m.a && m.winner.id === m.a.id;
                const bWon = m.winner && m.b && m.winner.id === m.b.id;
                const isActive = isActiveBlock && roundIdx === activeRoundIdx && i === activeMatchIndex && !m.winner;

                return (
                  <div
                    key={i}
                    data-match-idx={i}
                    className={`w-48 overflow-hidden rounded-xl border backdrop-blur-md ${
                      isActive ? 'border-violet-400/50 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div
                      className={`truncate border-b border-white/5 px-3 py-2 text-xs ${
                        !m.a ? 'text-zinc-600' : aWon ? 'font-semibold text-zinc-50' : m.winner ? 'text-zinc-600 line-through' : 'text-zinc-300'
                      }`}
                    >
                      {aLabel}
                    </div>
                    <div
                      className={`truncate px-3 py-2 text-xs ${
                        !m.b ? 'text-zinc-600' : bWon ? 'font-semibold text-zinc-50' : m.winner ? 'text-zinc-600 line-through' : 'text-zinc-300'
                      }`}
                    >
                      {bLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <svg ref={svgRef} className="pointer-events-none absolute left-0 top-0" />
      </div>
    </div>
  );
}

export default function BracketTree({ wildcardBracketRounds, mainBracketRounds, phase, currentRoundIdx, matchIndex }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
      {wildcardBracketRounds && (
        <TreeBlock
          rounds={wildcardBracketRounds}
          heading="Wildcard Qualifier"
          isActiveBlock={phase === 'wildcard'}
          activeRoundIdx={currentRoundIdx}
          activeMatchIndex={matchIndex}
        />
      )}
      {mainBracketRounds && (
        <TreeBlock
          rounds={mainBracketRounds}
          heading="Main Bracket"
          isActiveBlock={phase === 'main'}
          activeRoundIdx={currentRoundIdx}
          activeMatchIndex={matchIndex}
        />
      )}
    </div>
  );
}
