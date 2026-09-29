const ID_RE = /^[A-Za-z0-9]{22}$/;
const MAX_TRACKS = 16;

export function encodeBracket(rounds) {
  const first = rounds?.[0];
  if (!first?.length) return null;
  const ids = [];
  first.forEach((m) => ids.push(m.a?.id ?? '_', m.b?.id ?? '_'));
  const bits = rounds
    .flat()
    .map((m) => (m.winner && m.b && m.winner.id === m.b.id ? '1' : '0'))
    .join('');
  return `${ids.join('.')}-${bits}`;
}

export function decodeBracket(code) {
  if (typeof code !== 'string') return null;
  const [idPart, bits, extra] = code.split('-');
  if (!idPart || !bits || extra !== undefined) return null;
  const ids = idPart.split('.');
  const n = ids.length;
  if (n < 2 || n > MAX_TRACKS || (n & (n - 1)) !== 0) return null;
  if (bits.length !== n - 1 || !/^[01]+$/.test(bits)) return null;
  if (!ids.every((id) => id === '_' || ID_RE.test(id))) return null;
  return { ids, bits };
}

export function buildRounds(ids, bits, tracksById) {
  let current = ids.map((id) => tracksById[id] || null);
  const rounds = [];
  let bitIndex = 0;
  while (current.length > 1) {
    const matches = [];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      const winner = bits[bitIndex++] === '1' ? b : a;
      matches.push({ a, b, winner });
      next.push(winner);
    }
    rounds.push(matches);
    current = next;
  }
  return rounds;
}
