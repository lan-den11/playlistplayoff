// Pure bracket logic, ported directly from the original app.js. Nothing here
// touches the DOM or does I/O — it's just data in, data out — so the reducer
// in useBracket.js can call it deterministically and it stays trivially
// testable on its own.

export function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function pairUp(arr) {
  const m = [];
  for (let i = 0; i < arr.length; i += 2) m.push([arr[i], arr[i + 1] ?? null]);
  return m;
}

// Reorders a padded (power-of-two-length) seed array so byes (nulls, always
// at the tail after padding) get distributed as 1-real-vs-1-bye pairs instead
// of clumping into wasted bye-vs-bye pairs.
export function standardSeed(arr) {
  const n = arr.length;
  const result = new Array(n);
  for (let i = 0; i < n / 2; i++) {
    result[i * 2] = arr[i];
    result[i * 2 + 1] = arr[n - 1 - i];
  }
  return result;
}

export function buildTreeStructure(seeds) {
  const rounds = [];
  rounds.push(pairUp(seeds).map(([a, b]) => ({ a, b, winner: null })));
  let matchCount = seeds.length / 4;
  while (matchCount >= 1) {
    const arr = [];
    for (let i = 0; i < matchCount; i++) arr.push({ a: null, b: null, winner: null });
    rounds.push(arr);
    matchCount /= 2;
  }
  return rounds;
}

export function autoPickBracketSize(total) {
  const options = [4, 8, 16, 32, 64, 128, 256];
  for (const opt of options) if (total <= opt) return opt;
  return 256; // biggest supported size; overflow still handled via the wildcard round
}

// Wildcard slots scale with how much overflow there actually is, instead of
// always reserving half the bracket regardless of how close total is to size.
export function computeWildcardSplit(total, size) {
  if (total <= size) return { autoSlots: total, wildcardSlots: 0, wildcardPool: 0, needsWildcard: false };
  const overflow = total - size;
  let wildcardSlots = Math.min(nextPowerOfTwo(overflow), size / 2);
  wildcardSlots = Math.max(wildcardSlots, 1);
  const autoSlots = size - wildcardSlots;
  const wildcardPool = total - autoSlots;
  return { autoSlots, wildcardSlots, wildcardPool, needsWildcard: wildcardPool > wildcardSlots };
}

export function bracketBreakdownText(total, size, wildcardEnabled) {
  if (!wildcardEnabled) {
    if (total <= size) return `All ${total} songs fit directly.`;
    return `Wildcard round disabled — only the top ${size} most-recently-added songs make the bracket; the other ${
      total - size
    } are left out entirely.`;
  }
  const split = computeWildcardSplit(total, size);
  if (!split.needsWildcard) return `All ${total} songs fit directly — no wildcard round needed.`;
  return `Top ${split.autoSlots} most-recently-added songs go straight into the main bracket. The other ${split.wildcardPool} battle in a wildcard round for the remaining ${split.wildcardSlots} spots.`;
}

export function trackLabel(t) {
  return t ? `${t.name} — ${t.artists}` : 'BYE';
}

export function roundLabelText(phase, roundLength) {
  const prefix = phase === 'wildcard' ? 'Wildcard • ' : '';
  const name = roundLength === 2 ? 'Final' : roundLength === 4 ? 'Semifinal' : `Round of ${roundLength}`;
  return prefix + name;
}

export function buildFetchOrder(matchesArr) {
  const order = [];
  matchesArr.forEach(([a, b]) => {
    if (a) order.push(a);
    if (b) order.push(b);
  });
  return order;
}

// Scoped to the main bracket only (not the wildcard qualifier) — the
// wildcard round decides who *qualifies*, not final placement.
export function computeStandings(mainBracketRounds) {
  const standings = [];
  if (!mainBracketRounds) return standings;
  const rounds = mainBracketRounds;
  const champion = rounds[rounds.length - 1][0]?.winner;
  if (champion) standings.push({ label: 'Champion', tracks: [champion], roundSize: 0 });

  for (let ri = rounds.length - 1; ri >= 0; ri--) {
    const losers = [];
    rounds[ri].forEach((m) => {
      if (m.winner && m.a && m.b) {
        const loser = m.winner.id === m.a.id ? m.b : m.a;
        if (loser) losers.push(loser);
      }
    });
    if (!losers.length) continue;
    const roundSize = rounds[ri].length * 2;
    let label;
    if (ri === rounds.length - 1) label = 'Runner-up';
    else if (roundSize === 4) label = 'Reached Semifinal';
    else if (roundSize === 8) label = 'Reached Quarterfinal';
    else label = `Reached Round of ${roundSize}`;
    standings.push({ label, tracks: losers, roundSize });
  }
  return standings;
}

export function buildResultsText(standings) {
  const lines = ['🏆 Bracket Results 🏆', ''];
  standings.forEach((s) => {
    if (s.roundSize > 16) {
      lines.push(`${s.label}: ${s.tracks.length} songs`);
    } else {
      lines.push(`${s.label}${s.tracks.length > 1 ? ` (${s.tracks.length})` : ''}:`);
      s.tracks.forEach((t) => lines.push(`  • ${t.name} — ${t.artists}`));
    }
    lines.push('');
  });
  return lines.join('\n').trim();
}
