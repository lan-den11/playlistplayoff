'use client';

import { useLayoutEffect, useRef } from 'react';
import { trackLabel } from '../../lib/bracketEngine';

// True bye = permanently a single entrant (round-0 padding only). A later
// round with a null side is just pending, not a bye — it still renders.
function isTrueByeSlot(m, roundIdx) {
  if (roundIdx !== 0) return false;
  return !m || (m.a && !m.b) || (!m.a && m.b) || (!m.a && !m.b);
}

// FIX (this round): root cause of the Round-of-128/256 freeze.
//
// This function used to measure `wrapEl` (the scrollable outer div) and
// then write `width`/`height` attributes onto the <svg> that lives INSIDE
// that same `wrapEl`. Because the svg is a positioned child with an
// explicit size, writing a new size onto it can itself change
// `wrapEl.scrollWidth/scrollHeight` by a subpixel (rounding). The
// ResizeObserver below was watching `wrapEl`, so that subpixel change
// re-fired the observer, which redrew the svg, which changed the size
// again — an unbounded feedback loop. On a 32-song bracket the rounding
// error was too small to notice. On a 128/256-song bracket (much wider
// content, hundreds of connector paths to rebuild on every single frame of
// the loop) the loop ran fast enough to pin the main thread solid — that's
// the "freezing, unplayable" symptom.
//
// The fix has two parts, both required:
//   1. Measure a dedicated CONTENT node (the column of boxes) instead of
//      the wrap node the <svg> also lives in. Resizing the svg can never
//      change the content node's size, since they're siblings — so the
//      observer below (which now watches the content node) can never be
//      re-triggered by our own writes. The loop is structurally impossible.
//   2. Skip re-touching the DOM entirely when the measured size hasn't
//      actually changed, so a plain re-render (e.g. after every pick, since
//      `rounds` is a new array reference each time) doesn't force a full
//      recompute + innerHTML rewrite unless the geometry genuinely moved.
function drawConnectors(wrapEl, contentEl, svgEl, rounds, lastSizeRef) {
  if (!wrapEl || !contentEl || !svgEl) return;
  const width = contentEl.scrollWidth;
  const height = contentEl.scrollHeight;

  if (lastSizeRef.current.width === width && lastSizeRef.current.height === height) return;
  lastSizeRef.current = { width, height };

  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);
  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const wrapRect = wrapEl.getBoundingClientRect();
  const roundEls = contentEl.querySelectorAll('[data-tree-round]');
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
  const contentRef = useRef(null);
  const svgRef = useRef(null);
  const lastSizeRef = useRef({ width: -1, height: -1 });

  useLayoutEffect(() => {
    const wrapEl = wrapRef.current;
    const contentEl = contentRef.current;
    if (!wrapEl || !contentEl) return;

    // A genuine data change (new bracket, new round shape) should always
    // force one real redraw even if the pixel size happens to coincide with
    // whatever was measured last.
    lastSizeRef.current = { width: -1, height: -1 };

    let rafId = null;
    const redraw = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() =>
        drawConnectors(wrapEl, contentEl, svgRef.current, rounds, lastSizeRef)
      );
    };
    redraw();

    // Only the CONTENT node is observed — see the drawConnectors comment
    // above for why watching `wrapEl` (which also contains the svg this
    // effect resizes) was the actual bug.
    const observer = new ResizeObserver(redraw);
    observer.observe(contentEl);
    window.addEventListener('resize', redraw);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
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
        <div ref={contentRef} className="flex w-max gap-10 px-2">
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
                    // NOTE: no backdrop-blur here on purpose — with 128/256
                    // song brackets this can render 100+ of these boxes at
                    // once, and a blur filter on every single one is
                    // expensive to composite. At this box size the blur
                    // was doing almost nothing visually anyway (there's
                    // barely any background behind a 48px-wide box), so
                    // dropping it is effectively a free perf win.
                    className={`w-48 overflow-hidden rounded-xl border ${
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
