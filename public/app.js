// ---------- Spotify iFrame API bootstrap ----------
let IFrameAPI = null;
let iframeReadyResolve;
const iframeReadyPromise = new Promise((res) => (iframeReadyResolve = res));
window.onSpotifyIframeApiReady = (API) => {
  IFrameAPI = API;
  iframeReadyResolve();
};

function createController(elementId) {
  return new Promise((resolve) => {
    const element = document.getElementById(elementId);
    const embedHeight = window.innerWidth <= 600 ? '80' : '152';
    IFrameAPI.createController(element, { width: '100%', height: embedHeight, uri: '' }, (EmbedController) => {
      resolve(EmbedController);
    });
  });
}

let controllerA, controllerB, controllerChamp;

async function ensureMatchControllers() {
  await iframeReadyPromise;
  if (!controllerA) controllerA = await createController('embed-a');
  if (!controllerB) controllerB = await createController('embed-b');
}

async function ensureChampController() {
  await iframeReadyPromise;
  if (!controllerChamp) controllerChamp = await createController('embed-champ');
  return controllerChamp;
}

// ---------- screen management ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => (s.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
  document.getElementById('exit-bracket-btn').style.display = id === 'bracket-screen' ? 'inline-flex' : 'none';
  document.getElementById('header-progress').style.display = id === 'bracket-screen' || id === 'champion-screen' ? 'block' : 'none';
  document.querySelector('header').classList.toggle('no-sticky', id === 'bracket-screen');
  const bgDisplay = id === 'bracket-screen' ? 'block' : 'none';
  document.getElementById('side-bg-a').style.display = bgDisplay;
  document.getElementById('side-bg-b').style.display = bgDisplay;
}

document.getElementById('exit-bracket-btn').addEventListener('click', () => {
  showScreen('setup-screen');
});


async function findUserPlaylists() {
  const username = document.getElementById('spotify-username-input').value.trim();
  const errorEl = document.getElementById('setup-error');
  const wrap = document.getElementById('user-playlists-wrap');
  const select = document.getElementById('user-playlists');
  errorEl.textContent = '';
  if (!username) {
    errorEl.textContent = 'Type a Spotify username first.';
    return;
  }
  const btn = document.getElementById('find-user-playlists-btn');
  btn.disabled = true;
  btn.textContent = 'Finding…';
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(username)}/playlists`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not find that user.');
    if (!data.length) throw new Error('That user has no public playlists on their profile.');
    select.innerHTML = '<option value="">Select a playlist…</option>';
    data.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.tracks} tracks)`;
      select.appendChild(opt);
    });
    wrap.style.display = 'block';
  } catch (e) {
    errorEl.textContent = e.message;
    wrap.style.display = 'none';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Find';
  }
}

document.getElementById('find-user-playlists-btn').addEventListener('click', findUserPlaylists);
document.getElementById('user-playlists').addEventListener('change', (e) => {
  if (e.target.value) loadPlaylist(e.target.value);
});

// ---------- loading a playlist ----------
let loadedTracks = [];
let masterSortedTracks = []; // recency-priority order, fixed once at load time

async function loadPlaylist(idOrUrl) {
  const errorEl = document.getElementById('setup-error');
  errorEl.textContent = '';
  const loadBtn = document.getElementById('load-btn');
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading…';
  try {
    const res = await fetch(`/api/playlist/${encodeURIComponent(idOrUrl)}/tracks`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load playlist');
    if (data.tracks.length < 2) throw new Error('Playlist needs at least 2 songs to make a bracket.');
    loadedTracks = data.tracks;
    document.getElementById('options-title').textContent = `${loadedTracks.length} songs loaded`;
    document.getElementById('bracket-size-select').value = autoPickBracketSize(loadedTracks.length);
    updateBracketBreakdown();
    // The recency-priority order is computed exactly once, right here, and reused
    // by startTournament() later — "the order is already made" the moment the
    // playlist loads, regardless of what bracket size gets picked afterward.
    // Last.fm lookups start immediately against this same order, so whichever
    // songs actually end up in the bracket already have a head start by the time
    // Start Bracket is clicked.
    masterSortedTracks = loadedTracks.slice().sort((x, y) => new Date(y.addedAt) - new Date(x.addedAt));
    queuePrefetch(masterSortedTracks);
    showScreen('options-screen');
  } catch (e) {
    errorEl.textContent = e.message;
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load';
  }
}

document.getElementById('load-btn').addEventListener('click', () => {
  const val = document.getElementById('playlist-input').value.trim();
  if (!val) {
    document.getElementById('setup-error').textContent = 'Paste a playlist link or ID first.';
    return;
  }
  loadPlaylist(val);
});

document.getElementById('back-btn').addEventListener('click', () => showScreen('setup-screen'));

// ---------- bracket size auto-selection + wildcard split (shared math) ----------
function autoPickBracketSize(total) {
  const options = [4, 8, 16, 32, 64, 128, 256];
  for (const opt of options) if (total <= opt) return opt;
  return 256; // biggest supported size; overflow still handled via the wildcard round
}

// Wildcard slots scale with how much overflow there actually is, instead of
// always reserving half the bracket regardless of how close total is to size.
function computeWildcardSplit(total, size) {
  if (total <= size) return { autoSlots: total, wildcardSlots: 0, wildcardPool: 0, needsWildcard: false };
  const overflow = total - size;
  let wildcardSlots = Math.min(nextPowerOfTwo(overflow), size / 2);
  wildcardSlots = Math.max(wildcardSlots, 1);
  const autoSlots = size - wildcardSlots;
  const wildcardPool = total - autoSlots;
  return { autoSlots, wildcardSlots, wildcardPool, needsWildcard: wildcardPool > wildcardSlots };
}

function updateBracketBreakdown() {
  const size = parseInt(document.getElementById('bracket-size-select').value, 10);
  const wildcardEnabled = document.getElementById('wildcard-check').checked;
  const el = document.getElementById('bracket-breakdown');
  const total = loadedTracks.length;
  if (!wildcardEnabled) {
    if (total <= size) {
      el.textContent = `All ${total} songs fit directly.`;
    } else {
      el.textContent = `Wildcard round disabled — only the top ${size} most-recently-added songs make the bracket; the other ${total - size} are left out entirely.`;
    }
    return;
  }
  const split = computeWildcardSplit(total, size);
  if (!split.needsWildcard) {
    el.textContent = `All ${total} songs fit directly — no wildcard round needed.`;
  } else {
    el.textContent = `Top ${split.autoSlots} most-recently-added songs go straight into the main bracket. The other ${split.wildcardPool} battle in a wildcard round for the remaining ${split.wildcardSlots} spots.`;
  }
}
document.getElementById('bracket-size-select').addEventListener('change', updateBracketBreakdown);
document.getElementById('wildcard-check').addEventListener('change', updateBracketBreakdown);

// ---------- bracket engine ----------
let phase = 'main'; // 'wildcard' | 'main'
let round = [];
let matches = [];
let matchIndex = 0;
let winners = [];
let pendingA = null;
let pendingB = null;
let currentRoundIdx = 0;
let wildcardSlotsNeeded = 0;
let totalRealMatchesOverall = 0;
let completedRealMatchesOverall = 0;
let isFirstReveal = true;
let pendingAutoSeeds = [];
let wildcardBracketRounds = null;
let mainBracketRounds = null;
let currentTree = null;
let historyStack = [];
let showDetails = true;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function pairUp(arr) {
  const m = [];
  for (let i = 0; i < arr.length; i += 2) m.push([arr[i], arr[i + 1] ?? null]);
  return m;
}

// Reorders a padded (power-of-two-length) seed array so byes (nulls, always at
// the tail after padding) get distributed as 1-real-vs-1-bye pairs instead of
// clumping into wasted bye-vs-bye pairs. This guarantees every round produces
// exactly half as many winners as entrants, with no dropped/wasted slots.
function standardSeed(arr) {
  const n = arr.length;
  const result = new Array(n);
  for (let i = 0; i < n / 2; i++) {
    result[i * 2] = arr[i];
    result[i * 2 + 1] = arr[n - 1 - i];
  }
  return result;
}

function buildTreeStructure(seeds) {
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

document.getElementById('start-bracket-btn').addEventListener('click', startTournament);

function startTournament() {
  const size = parseInt(document.getElementById('bracket-size-select').value, 10);
  const doShuffle = document.getElementById('shuffle-check').checked;
  const wildcardEnabled = document.getElementById('wildcard-check').checked;
  const sorted = masterSortedTracks;

  historyStack = [];
  wildcardBracketRounds = null;
  mainBracketRounds = null;
  completedRealMatchesOverall = 0;
  isFirstReveal = true;
  document.querySelector('.bottom-progress').classList.remove('docked');

  if (sorted.length <= size || !wildcardEnabled) {
    const seeds = sorted.slice(0, size);
    totalRealMatchesOverall = seeds.length - 1;
    beginMainPhase(doShuffle ? shuffle(seeds) : seeds);
    return;
  }

  const split = computeWildcardSplit(sorted.length, size);
  wildcardSlotsNeeded = split.wildcardSlots;
  const autoSeeds = sorted.slice(0, split.autoSlots);
  const wildcardPool = sorted.slice(split.autoSlots);

  if (!split.needsWildcard) {
    totalRealMatchesOverall = sorted.length - 1;
    beginMainPhase(doShuffle ? shuffle(autoSeeds.concat(wildcardPool)) : autoSeeds.concat(wildcardPool));
    return;
  }

  // Every real match, whether in the wildcard round or the main bracket,
  // eliminates exactly one entrant — so the total real-match budget is simply
  // (wildcard eliminations needed) + (main bracket entrants - 1), independent
  // of how byes happen to be distributed.
  totalRealMatchesOverall = (wildcardPool.length - split.wildcardSlots) + (size - 1);

  pendingAutoSeeds = autoSeeds;
  phase = 'wildcard';
  const seeds = doShuffle ? shuffle(wildcardPool) : wildcardPool;
  const padded = nextPowerOfTwo(seeds.length);
  while (seeds.length < padded) seeds.push(null);
  round = standardSeed(seeds);
  startRound();
  winners = [];
  currentRoundIdx = 0;
  wildcardBracketRounds = buildTreeStructure(round);
  currentTree = wildcardBracketRounds;
  renderBracketTreeUI();
  queuePrefetch(buildFetchOrder(matches));
  nextMatch();
}

function beginMainPhase(seeds) {
  phase = 'main';
  const padded = nextPowerOfTwo(seeds.length);
  while (seeds.length < padded) seeds.push(null);
  round = standardSeed(seeds);
  startRound();
  winners = [];
  currentRoundIdx = 0;
  mainBracketRounds = buildTreeStructure(round);
  currentTree = mainBracketRounds;
  renderBracketTreeUI();
  queuePrefetch(buildFetchOrder(matches));
  nextMatch();
}

let realMatchCountThisRound = 0;
let realMatchIndexThisRound = 0;

function startRound() {
  matches = pairUp(round);
  matchIndex = 0;
  realMatchCountThisRound = matches.filter(([a, b]) => a && b).length;
  realMatchIndexThisRound = 0;
}

function resolveInTree(track) {
  const roundArr = currentTree[currentRoundIdx];
  const slot = roundArr[matchIndex];
  slot.winner = track;
  if (currentTree[currentRoundIdx + 1]) {
    const nextSlot = currentTree[currentRoundIdx + 1][Math.floor(matchIndex / 2)];
    if (matchIndex % 2 === 0) nextSlot.a = track;
    else nextSlot.b = track;
  }
}

function nextMatch() {
  while (matchIndex < matches.length) {
    const [a, b] = matches[matchIndex];
    if (a && !b) {
      resolveInTree(a);
      winners.push(a);
      matchIndex++;
      continue;
    }
    if (b && !a) {
      resolveInTree(b);
      winners.push(b);
      matchIndex++;
      continue;
    }
    if (!a && !b) {
      matchIndex++;
      continue;
    }
    renderBracketTreeUI();
    realMatchIndexThisRound++;
    showMatch(a, b);
    return;
  }
  renderBracketTreeUI();

  if (phase === 'wildcard') {
    if (winners.length <= wildcardSlotsNeeded) {
      finishWildcard();
      return;
    }
  } else if (winners.length === 1) {
    showChampion(winners[0]);
    return;
  }

  currentRoundIdx++;
  round = winners;
  winners = [];
  startRound();
  nextMatch();
}

function finishWildcard() {
  const doShuffle = document.getElementById('shuffle-check').checked;
  const combined = pendingAutoSeeds.concat(winners);
  beginMainPhase(doShuffle ? shuffle(combined) : combined);
}

function trackLabel(t) {
  return t ? `${t.name} — ${t.artists}` : 'BYE';
}

function roundLabelText() {
  const prefix = phase === 'wildcard' ? 'Wildcard • ' : '';
  const name = round.length === 2 ? 'Final' : round.length === 4 ? 'Semifinal' : `Round of ${round.length}`;
  return prefix + name;
}

function preloadSideBg(elId, url) {
  const el = document.getElementById(elId);
  el.classList.remove('loaded');
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    // guard against a stale slow-loading image landing after the user already moved on
    if (el.dataset.pendingUrl !== url) return;
    el.style.backgroundImage = `url(${url})`;
    el.classList.add('loaded');
  };
  el.dataset.pendingUrl = url;
  img.src = url;
}

let lastFlashKey = null;

function maybeFlashRound() {
  const key = `${phase}:${round.length}`;
  if (key === lastFlashKey) return;
  lastFlashKey = key;
  const flashEl = document.getElementById('round-flash');
  const centerPanel = document.querySelector('.center-panel');
  document.getElementById('round-flash-text').textContent = roundLabelText();
  flashEl.classList.remove('playing');
  // force reflow so the animation can restart even if the same class was just removed
  void flashEl.offsetWidth;
  flashEl.classList.add('playing');
  centerPanel.classList.add('flash-hidden');
  setTimeout(() => centerPanel.classList.remove('flash-hidden'), 1100);
}

function showMatch(a, b, skipTransition) {
  const battleStage = document.querySelector('.battle-stage');
  const render = () => {
    pendingA = a;
    pendingB = b;
    const sideAEl = document.getElementById('side-a');
    const sideBEl = document.getElementById('side-b');
    sideAEl.classList.remove('winner', 'loser', 'reveal-left');
    sideBEl.classList.remove('winner', 'loser', 'reveal-right');
    if (isFirstReveal) {
      void sideAEl.offsetWidth; // force reflow so the animation can restart
      sideAEl.classList.add('reveal-left');
      sideBEl.classList.add('reveal-right');
      isFirstReveal = false;
      const hint = document.getElementById('scroll-hint');
      hint.classList.remove('dismissed');
      hint.classList.add('visible');
      const dismissHint = () => {
        hint.classList.add('dismissed');
        document.querySelector('.bottom-progress').classList.add('docked');
        window.removeEventListener('scroll', dismissHint);
      };
      window.addEventListener('scroll', dismissHint, { once: true });
    }
    preloadSideBg('side-bg-a', a.image);
    preloadSideBg('side-bg-b', b.image);
    document.getElementById('embed-loading-a').classList.remove('hidden');
    document.getElementById('embed-loading-b').classList.remove('hidden');
    renderMeta('meta-a', a);
    renderMeta('meta-b', b);
    document.getElementById('round-label').textContent = roundLabelText();
    document.getElementById('progress').textContent = `Battle ${realMatchIndexThisRound} / ${realMatchCountThisRound}`;
    const pct = realMatchCountThisRound ? Math.round(((realMatchIndexThisRound - 1) / realMatchCountThisRound) * 100) : 0;
    const fillEl = document.getElementById('progress-fill');
    fillEl.style.width = `${pct}%`;
    fillEl.classList.remove('sweeping');
    void fillEl.offsetWidth; // force reflow so the animation can restart
    fillEl.classList.add('sweeping');
    maybeFlashRound();
    showScreen('bracket-screen');
    ensureMatchControllers().then(() => {
      controllerA.loadUri(a.uri);
      controllerB.loadUri(b.uri);
      // The iFrame API doesn't expose a reliable "this specific track is ready"
      // event on reused controllers, so this is a heuristic delay rather than a
      // true readiness signal — good enough to avoid a jarring blank flash.
      setTimeout(() => document.getElementById('embed-loading-a').classList.add('hidden'), 550);
      setTimeout(() => document.getElementById('embed-loading-b').classList.add('hidden'), 550);
    });
    battleStage.classList.remove('transitioning');
    saveStateToStorage();
  };
  if (skipTransition) {
    render();
  } else {
    battleStage.classList.add('transitioning');
    setTimeout(render, 140);
  }
}

function renderMeta(elId, track) {
  const el = document.getElementById(elId);
  if (!showDetails) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const added = track.addedAt ? new Date(track.addedAt).toLocaleDateString() : 'unknown';
  const albumBit = track.albumName ? `${track.albumName}${track.releaseYear ? ` (${track.releaseYear})` : ''}` : null;
  const entry = lastfmData[track.id];
  let playsText;
  let tagsHtml = '';
  if (!entry || entry.status !== 'ready') {
    playsText = 'Loading plays…';
  } else if (!lastfmEnabledFlag) {
    playsText = 'Last.fm not configured';
  } else {
    playsText = entry.playcount === null || entry.playcount === undefined ? 'not found on Last.fm' : `${entry.playcount} plays`;
    if (entry.tags && entry.tags.length) {
      tagsHtml = `<div class="tag-row">${entry.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>`;
    }
  }
  const lines = [];
  if (albumBit) lines.push(`<div>${escapeHtml(albumBit)}</div>`);
  lines.push(`<div>Added: <span>${added}</span> · <span>${playsText}</span></div>`);
  el.innerHTML = lines.join('') + tagsHtml;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- background Last.fm prefetch, ordered by bracket appearance ----------
let lastfmData = {}; // trackId -> { status: 'pending'|'loading'|'ready', playcount, track }
let lastfmEnabledFlag = true; // optimistic until first response says otherwise
let prefetchRunning = false;

function buildFetchOrder(matchesArr) {
  const order = [];
  matchesArr.forEach(([a, b]) => {
    if (a) order.push(a);
    if (b) order.push(b);
  });
  return order;
}

function queuePrefetch(trackList) {
  trackList.forEach((t) => {
    if (!lastfmData[t.id]) lastfmData[t.id] = { status: 'pending', playcount: null, tags: [], track: t };
  });
  runPrefetch();
}

function maybeRefreshVisibleMeta(trackId) {
  if (pendingA && pendingA.id === trackId) renderMeta('meta-a', pendingA);
  if (pendingB && pendingB.id === trackId) renderMeta('meta-b', pendingB);
}

async function runPrefetch() {
  if (prefetchRunning) return;
  prefetchRunning = true;
  while (true) {
    const nextId = Object.keys(lastfmData).find((id) => lastfmData[id].status === 'pending');
    if (!nextId) break;
    const entry = lastfmData[nextId];
    entry.status = 'loading';
    try {
      const primaryArtist = entry.track.artists.split(',')[0].trim();
      let url = `/api/lastfm/playcount?artist=${encodeURIComponent(primaryArtist)}&track=${encodeURIComponent(entry.track.name)}`;
      if (lastfmUsernameOverride) url += `&username=${encodeURIComponent(lastfmUsernameOverride)}`;
      const res = await fetch(url);
      const data = await res.json();
      lastfmEnabledFlag = data.enabled;
      entry.playcount = data.playcount;
      entry.tags = data.tags || [];
    } catch (e) {
      entry.playcount = null;
      entry.tags = [];
    }
    entry.status = 'ready';
    maybeRefreshVisibleMeta(nextId);
  }
  prefetchRunning = false;
}

let picking = false;

function pushHistory() {
  historyStack.push({
    phase,
    round: round.slice(),
    matches: matches.map((m) => m.slice()),
    matchIndex,
    winners: winners.slice(),
    currentRoundIdx,
    pendingAutoSeeds: pendingAutoSeeds.slice(),
    wildcardSlotsNeeded,
    tree: structuredClone(currentTree),
    treeIsWildcard: currentTree === wildcardBracketRounds,
    realMatchCountThisRound,
    realMatchIndexThisRound,
    completedRealMatchesOverall,
  });
}

function updateHeaderProgress() {
  const fill = document.getElementById('header-progress-fill');
  if (!totalRealMatchesOverall) {
    fill.style.width = '0%';
    return;
  }
  const pct = Math.min(100, Math.round((completedRealMatchesOverall / totalRealMatchesOverall) * 100));
  fill.style.width = `${pct}%`;
}

function pick(track) {
  if (picking || !track) return;
  picking = true;
  pushHistory();
  const isA = track === pendingA;
  document.getElementById(isA ? 'side-a' : 'side-b').classList.add('winner');
  document.getElementById(isA ? 'side-b' : 'side-a').classList.add('loser');
  setTimeout(() => {
    resolveInTree(track);
    winners.push(track);
    matchIndex++;
    completedRealMatchesOverall++;
    updateHeaderProgress();
    picking = false;
    nextMatch();
  }, 300);
}

document.getElementById('pick-a').addEventListener('click', () => pick(pendingA));
document.getElementById('pick-b').addEventListener('click', () => pick(pendingB));

document.addEventListener('keydown', (e) => {
  if (document.getElementById('bracket-screen').style.display === 'none') return;
  if (e.key === 'ArrowLeft') pick(pendingA);
  if (e.key === 'ArrowRight') pick(pendingB);
});

// ---------- undo ----------
document.getElementById('undo-btn').addEventListener('click', () => {
  if (!historyStack.length || picking) return;
  const prev = historyStack.pop();
  phase = prev.phase;
  round = prev.round;
  matches = prev.matches;
  matchIndex = prev.matchIndex;
  winners = prev.winners;
  currentRoundIdx = prev.currentRoundIdx;
  pendingAutoSeeds = prev.pendingAutoSeeds;
  wildcardSlotsNeeded = prev.wildcardSlotsNeeded;
  realMatchCountThisRound = prev.realMatchCountThisRound;
  realMatchIndexThisRound = prev.realMatchIndexThisRound;
  completedRealMatchesOverall = prev.completedRealMatchesOverall;
  updateHeaderProgress();
  if (prev.treeIsWildcard) {
    wildcardBracketRounds = prev.tree;
    currentTree = wildcardBracketRounds;
  } else {
    mainBracketRounds = prev.tree;
    currentTree = mainBracketRounds;
  }
  renderBracketTreeUI();
  const [a, b] = matches[matchIndex];
  showMatch(a, b, true);
});

// ---------- coin flip ----------
document.getElementById('coinflip-btn').addEventListener('click', () => {
  if (picking) return;
  pick(Math.random() < 0.5 ? pendingA : pendingB);
});

// ---------- shuffle: swap current song with one from a future matchup ----------
document.getElementById('shuffle-btn').addEventListener('click', () => {
  if (picking) return;
  const futureIndices = [];
  for (let i = matchIndex + 1; i < matches.length; i++) futureIndices.push(i);
  if (!futureIndices.length) return;
  const futureIdx = futureIndices[Math.floor(Math.random() * futureIndices.length)];
  const mySide = Math.random() < 0.5 ? 0 : 1;
  const theirSide = Math.random() < 0.5 ? 0 : 1;
  if (!matches[futureIdx][theirSide]) return;

  const temp = matches[matchIndex][mySide];
  matches[matchIndex][mySide] = matches[futureIdx][theirSide];
  matches[futureIdx][theirSide] = temp;

  const roundArr = currentTree[currentRoundIdx];
  roundArr[matchIndex][mySide === 0 ? 'a' : 'b'] = matches[matchIndex][mySide];
  roundArr[futureIdx][theirSide === 0 ? 'a' : 'b'] = matches[futureIdx][theirSide];
  renderBracketTreeUI();

  showMatch(matches[matchIndex][0], matches[matchIndex][1], true);
});

// ---------- skip: "think about it later" ----------
// Swaps the whole current matchup with the last resolvable matchup remaining in
// this round, so it keeps getting pushed to the back. If you skip it again once
// it's near the end, it just keeps cycling to the back until it's genuinely the
// only one left — at which point there's nowhere left to defer to.
function findSkipTarget() {
  for (let i = matches.length - 1; i > matchIndex; i--) {
    const [x, y] = matches[i];
    if (x && y) return i;
  }
  return -1;
}

document.getElementById('skip-btn').addEventListener('click', () => {
  if (picking) return;
  const target = findSkipTarget();
  if (target === -1) return; // nothing left to defer to — this is the last one
  const temp = matches[matchIndex];
  matches[matchIndex] = matches[target];
  matches[target] = temp;

  const roundArr = currentTree[currentRoundIdx];
  roundArr[matchIndex].a = matches[matchIndex][0];
  roundArr[matchIndex].b = matches[matchIndex][1];
  roundArr[target].a = matches[target][0];
  roundArr[target].b = matches[target][1];
  renderBracketTreeUI();

  showMatch(matches[matchIndex][0], matches[matchIndex][1], true);
});

// ---------- settings ----------
document.getElementById('settings-btn').addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  panel.hidden = !panel.hidden;
});
document.getElementById('show-details-toggle').addEventListener('change', (e) => {
  showDetails = e.target.checked;
  if (pendingA) renderMeta('meta-a', pendingA);
  if (pendingB) renderMeta('meta-b', pendingB);
  saveStateToStorage();
});

// ---------- Last.fm username override (no OAuth needed for read-only lookups) ----------
let lastfmUsernameOverride = '';
try {
  lastfmUsernameOverride = localStorage.getItem('lastfmUsernameOverride') || '';
} catch (e) {}
document.getElementById('lastfm-username-input').value = lastfmUsernameOverride;
document.getElementById('lastfm-username-input').addEventListener('change', (e) => {
  lastfmUsernameOverride = e.target.value.trim();
  try {
    localStorage.setItem('lastfmUsernameOverride', lastfmUsernameOverride);
  } catch (err) {}
});

// ---------- bracket tree rendering ----------
function renderTreeBlock(rounds, heading, blockClass, isActiveBlock, blockId) {
  let html = `<div class="tree-block ${blockClass}"><div class="tree-heading">${heading}</div><div class="tree-rounds" id="tree-rounds-${blockId}">`;
  rounds.forEach((r, roundIdx) => {
    html += `<div class="tree-round">`;
    r.forEach((m, i) => {
      // Only round 0 has true, permanent byes (from bracket padding) — a null
      // slot in any later round just means "waiting on a feeder match," not
      // "will never exist." Skipping those would make boxes pop into existence
      // mid-tournament, which is exactly what was causing everything to shove
      // around — so every round beyond 0 always renders its full, final box
      // count immediately, using TBD placeholders until a feeder resolves.
      if (roundIdx === 0) {
        const isTrueBye = (m.a && !m.b) || (!m.a && m.b) || (!m.a && !m.b);
        if (isTrueBye) return;
      }
      const aLabel = m.a ? escapeHtml(trackLabel(m.a)) : 'TBD';
      const bLabel = m.b ? escapeHtml(trackLabel(m.b)) : 'TBD';
      const aClass = m.winner && m.a && m.winner.id === m.a.id ? 'decided-winner' : m.winner ? 'decided-loser' : '';
      const bClass = m.winner && m.b && m.winner.id === m.b.id ? 'decided-winner' : m.winner ? 'decided-loser' : '';
      const isActive = isActiveBlock && roundIdx === currentRoundIdx && i === matchIndex && !m.winner;
      html += `<div class="tree-match${isActive ? ' active-match' : ''}" data-round-idx="${roundIdx}" data-match-idx="${i}">
        <div class="tree-slot ${aClass}${!m.a ? ' pending' : ''}">${aLabel}</div>
        <div class="tree-slot ${bClass}${!m.b ? ' pending' : ''}">${bLabel}</div>
      </div>`;
    });
    html += `</div>`;
  });
  html += `<svg class="tree-connectors" id="tree-connectors-${blockId}"></svg>`;
  html += `</div></div>`;
  return html;
}

function renderBracketTreeUI() {
  const container = document.getElementById('bracket-tree');
  let html = '';
  if (wildcardBracketRounds) {
    html += renderTreeBlock(wildcardBracketRounds, 'Wildcard Qualifier', 'wildcard-block', phase === 'wildcard', 'wildcard');
  }
  if (mainBracketRounds) {
    html += renderTreeBlock(mainBracketRounds, 'Main Bracket', 'main-block', phase === 'main', 'main');
  }
  container.innerHTML = html;
  // Wait a frame so layout has actually settled before measuring positions.
  requestAnimationFrame(() => {
    if (wildcardBracketRounds) drawConnectors('wildcard', wildcardBracketRounds);
    if (mainBracketRounds) drawConnectors('main', mainBracketRounds);
  });
}

// True bye = permanently a single entrant (round 0 padding only). A later
// round with a null side is just pending, not a bye — it still gets rendered.
function isTrueByeSlot(m, roundIdx) {
  if (roundIdx !== 0) return false;
  return !m || (m.a && !m.b) || (!m.a && m.b) || (!m.a && !m.b);
}

// Draws real elbow connector lines between each match and the box it feeds into
// in the next round, using actual measured DOM positions rather than guessed
// CSS margins — this stays correct regardless of how tall any given match box
// happens to render (song titles wrap to different lengths).
function drawConnectors(blockId, rounds) {
  const wrap = document.getElementById(`tree-rounds-${blockId}`);
  const svg = document.getElementById(`tree-connectors-${blockId}`);
  if (!wrap || !svg) return;
  const width = wrap.scrollWidth;
  const height = wrap.scrollHeight;
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const wrapRect = wrap.getBoundingClientRect();
  const roundEls = wrap.querySelectorAll('.tree-round');
  let paths = '';
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const fromRoundEl = roundEls[ri];
    const toRoundEl = roundEls[ri + 1];
    if (!fromRoundEl || !toRoundEl) continue;
    rounds[ri].forEach((m, i) => {
      if (isTrueByeSlot(m, ri)) return; // no box exists for a true round-0 bye
      const parentIdx = Math.floor(i / 2);
      // The target box always exists now (rounds beyond 0 always render), so
      // no need to check whether it's "resolved" — just find it and connect.
      const fromEl = fromRoundEl.querySelector(`.tree-match[data-match-idx="${i}"]`);
      const toEl = toRoundEl.querySelector(`.tree-match[data-match-idx="${parentIdx}"]`);
      if (!fromEl || !toEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const x1 = fromRect.right - wrapRect.left + wrap.scrollLeft;
      const y1 = fromRect.top - wrapRect.top + fromRect.height / 2 + wrap.scrollTop;
      const x2 = toRect.left - wrapRect.left + wrap.scrollLeft;
      const y2 = toRect.top - wrapRect.top + toRect.height / 2 + wrap.scrollTop;
      const midX = (x1 + x2) / 2;
      paths += `<path d="M ${x1} ${y1} H ${midX} V ${y2} H ${x2}" stroke="#2a2f26" stroke-width="2" fill="none" />`;
    });
  }
  svg.innerHTML = paths;
}

let connectorRedrawTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(connectorRedrawTimer);
  connectorRedrawTimer = setTimeout(() => {
    if (wildcardBracketRounds) drawConnectors('wildcard', wildcardBracketRounds);
    if (mainBracketRounds) drawConnectors('main', mainBracketRounds);
  }, 150);
});

// ---------- champion ----------
function launchConfetti() {
  const colors = ['#1db954', '#f2f4ee', '#14833b', '#8b9186'];
  const container = document.getElementById('champion-screen');
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.2 + Math.random() * 1}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function computeStandings() {
  // Scoped to the main bracket only (not the wildcard qualifier round) — the
  // wildcard round decides who *qualifies*, not final placement.
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

function buildResultsText() {
  const standings = computeStandings();
  const lines = ['🏆 Bracket Results 🏆', ''];
  standings.forEach((s) => {
    // Early rounds in a big bracket can eliminate dozens at once — listing every
    // one of them reads like a wall of ties, so those get a simple count instead.
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

document.getElementById('copy-results-btn').addEventListener('click', () => {
  const status = document.getElementById('share-status');
  navigator.clipboard
    .writeText(buildResultsText())
    .then(() => (status.textContent = 'Copied to clipboard!'))
    .catch(() => (status.textContent = 'Could not copy — clipboard permission blocked?'));
});

function buildShareCardHtml() {
  const standings = computeStandings();
  const champ = standings.find((s) => s.label === 'Champion');
  const rest = standings.filter((s) => s.label !== 'Champion');

  let html = `<div class="share-card-title">🏆 Playlist Playoff Results</div>`;
  if (champ) {
    const t = champ.tracks[0];
    html += `<div class="share-card-champ">
      <div class="crown">👑</div>
      ${t.image ? `<img src="${t.image}" crossorigin="anonymous" />` : ''}
      <div class="name">${escapeHtml(t.name)}</div>
      <div class="artist">${escapeHtml(t.artists)}</div>
    </div>`;
  }
  // Only show detailed tiers down through Quarterfinal (roundSize <= 8) — deeper
  // rounds get summarized as a count so the image stays short and readable.
  rest.forEach((s) => {
    html += `<div class="share-card-tier"><div class="share-card-tier-label">${escapeHtml(s.label)}</div>`;
    if (s.roundSize > 8) {
      html += `<div class="share-card-row"><span class="track">${s.tracks.length} songs eliminated here</span></div>`;
    } else {
      s.tracks.forEach((t) => {
        html += `<div class="share-card-row"><span class="track">${escapeHtml(t.name)}</span><span class="artist">${escapeHtml(t.artists)}</span></div>`;
      });
    }
    html += `</div>`;
  });
  html += `<div class="share-card-footer">Made with Playlist Playoff</div>`;
  return html;
}

document.getElementById('download-image-btn').addEventListener('click', async () => {
  const status = document.getElementById('share-status');
  status.textContent = 'Generating image…';
  const shareCard = document.getElementById('share-card');
  shareCard.innerHTML = buildShareCardHtml();
  try {
    const canvas = await html2canvas(shareCard, { backgroundColor: '#0a0c09', useCORS: true });
    const link = document.createElement('a');
    link.download = 'bracketbeats-results.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    status.textContent = 'Results image downloaded!';
  } catch (e) {
    status.textContent = 'Could not generate image — album art may be blocking cross-origin capture.';
  }
});

function renderStandingsPreview() {
  const el = document.getElementById('champion-standings-preview');
  const standings = computeStandings().filter((s) => s.label !== 'Champion');
  // Keep the on-screen preview short and celebratory — just runner-up plus
  // semifinalists/quarterfinalists, not the full elimination history.
  const preview = standings.filter((s) => s.roundSize <= 8);
  if (!preview.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = preview
    .map(
      (s) => `<div class="champion-standings-tier">
        <div class="champion-standings-label">${escapeHtml(s.label)}</div>
        ${s.tracks
          .map(
            (t) =>
              `<div class="champion-standings-row"><span class="track">${escapeHtml(t.name)}</span><span class="artist">${escapeHtml(t.artists)}</span></div>`
          )
          .join('')}
      </div>`
    )
    .join('');
}

function showChampion(track) {
  document.getElementById('title-champ').textContent = `${track.name} — ${track.artists}`;
  ensureChampController().then((c) => c.loadUri(track.uri));
  preloadSideBg('champion-bg', track.image);
  document.getElementById('share-status').textContent = '';
  renderStandingsPreview();
  completedRealMatchesOverall = totalRealMatchesOverall;
  updateHeaderProgress();
  showScreen('champion-screen');
  launchConfetti();
  clearSavedState();
}

document.getElementById('restart-btn').addEventListener('click', () => {
  loadedTracks = [];
  masterSortedTracks = [];
  lastfmData = {};
  document.getElementById('playlist-input').value = '';
  clearSavedState();
  showScreen('setup-screen');
});

// ---------- auto-save / resume (same-device only, via localStorage) ----------
const SAVE_KEY = 'spotifyBracketSave_v1';

function saveStateToStorage() {
  try {
    const payload = {
      phase,
      round,
      matches,
      matchIndex,
      winners,
      currentRoundIdx,
      wildcardSlotsNeeded,
      pendingAutoSeeds,
      wildcardBracketRounds,
      mainBracketRounds,
      loadedTracks,
      showDetails,
      realMatchCountThisRound,
      realMatchIndexThisRound,
      totalRealMatchesOverall,
      completedRealMatchesOverall,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (e) {
    // storage unavailable/full — not critical, just skip saving this time
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function restoreFromSaved(saved) {
  phase = saved.phase;
  round = saved.round;
  matches = saved.matches;
  matchIndex = saved.matchIndex;
  winners = saved.winners;
  currentRoundIdx = saved.currentRoundIdx;
  wildcardSlotsNeeded = saved.wildcardSlotsNeeded;
  pendingAutoSeeds = saved.pendingAutoSeeds;
  wildcardBracketRounds = saved.wildcardBracketRounds;
  mainBracketRounds = saved.mainBracketRounds;
  loadedTracks = saved.loadedTracks;
  showDetails = saved.showDetails;
  realMatchCountThisRound = saved.realMatchCountThisRound;
  realMatchIndexThisRound = saved.realMatchIndexThisRound;
  totalRealMatchesOverall = saved.totalRealMatchesOverall;
  completedRealMatchesOverall = saved.completedRealMatchesOverall;
  document.getElementById('show-details-toggle').checked = showDetails;
  currentTree = phase === 'wildcard' ? wildcardBracketRounds : mainBracketRounds;
  lastFlashKey = `${phase}:${round.length}`; // don't re-announce the round we're resuming into
  renderBracketTreeUI();
  updateHeaderProgress();
  const [a, b] = matches[matchIndex];
  showMatch(a, b, true);
}

// ---------- Clerk sign-in + saved profile ----------
let clerkLoaded = null;

async function initClerk() {
  const res = await fetch('/api/clerk-config');
  const config = await res.json();
  if (!config.enabled) return; // no Clerk keys set — sign-in UI stays hidden, app works fully without it

  const clerkDomain = atob(config.publishableKey.split('_')[2]).slice(0, -1);
  await new Promise((resolve, reject) => {
    const uiScript = document.createElement('script');
    uiScript.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
    uiScript.crossOrigin = 'anonymous';
    uiScript.onload = resolve;
    uiScript.onerror = () => reject(new Error('Failed to load Clerk UI bundle'));
    document.head.appendChild(uiScript);
  });
  await new Promise((resolve, reject) => {
    const clerkScript = document.createElement('script');
    clerkScript.src = `https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`;
    clerkScript.crossOrigin = 'anonymous';
    clerkScript.setAttribute('data-clerk-publishable-key', config.publishableKey);
    clerkScript.onload = resolve;
    clerkScript.onerror = () => reject(new Error('Failed to load Clerk SDK'));
    document.head.appendChild(clerkScript);
  });

  await window.Clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    appearance: {
      variables: {
        colorBackground: '#171a15',
        colorPrimary: '#1db954',
        colorTextOnPrimaryBackground: '#05130a',
        colorText: '#f2f4ee',
        colorForeground: '#f2f4ee',
        colorTextSecondary: '#8b9186',
        colorInputBackground: '#10120e',
        colorInputText: '#f2f4ee',
        colorNeutral: '#2a2f26',
      },
    },
  });
  clerkLoaded = window.Clerk;
  let wasSignedIn = clerkLoaded.isSignedIn;
  renderClerkAuthUI();
  if (wasSignedIn) loadSavedProfile();

  clerkLoaded.addListener(() => {
    renderClerkAuthUI();
    // Someone just transitioned from signed-out to signed-in (e.g. finished the
    // modal sign-in flow) — that's exactly when their saved profile should load,
    // not just on a fresh page load where they were already signed in.
    if (clerkLoaded.isSignedIn && !wasSignedIn) {
      loadSavedProfile();
      document.getElementById('clerk-signin-modal').classList.remove('visible');
      if (signInMounted) {
        clerkLoaded.unmountSignIn(document.getElementById('clerk-signin-mount'));
        signInMounted = false;
      }
    }
    wasSignedIn = clerkLoaded.isSignedIn;
  });
}

let userButtonMounted = false;

function renderClerkAuthUI() {
  const signInBtn = document.getElementById('clerk-signin-btn');
  const userButtonEl = document.getElementById('clerk-user-button');
  if (clerkLoaded.isSignedIn) {
    signInBtn.style.display = 'none';
    if (!userButtonMounted) {
      clerkLoaded.mountUserButton(userButtonEl, {
        customMenuItems: [
          {
            label: 'Edit music profile',
            onClick: () => openProfileModal(),
            mountIcon: (el) => {
              el.innerHTML = '🎵';
            },
            unmountIcon: (el) => {
              el.innerHTML = '';
            },
          },
        ],
      });
      userButtonMounted = true;
    }
  } else {
    signInBtn.style.display = 'inline-flex';
    if (userButtonMounted) {
      clerkLoaded.unmountUserButton(userButtonEl);
      userButtonMounted = false;
    }
  }
}

let signInMounted = false;

document.getElementById('clerk-signin-btn').addEventListener('click', () => {
  document.getElementById('clerk-signin-modal').classList.add('visible');
  if (!signInMounted) {
    clerkLoaded.mountSignIn(document.getElementById('clerk-signin-mount'));
    signInMounted = true;
  }
});
document.getElementById('clerk-signin-close').addEventListener('click', () => {
  document.getElementById('clerk-signin-modal').classList.remove('visible');
  if (signInMounted) {
    clerkLoaded.unmountSignIn(document.getElementById('clerk-signin-mount'));
    signInMounted = false;
  }
});

function openProfileModal() {
  const currentSpotify = document.getElementById('spotify-username-input').value.trim();
  const currentLastfm = document.getElementById('lastfm-username-input').value.trim();
  document.getElementById('nudge-spotify-input').value = currentSpotify;
  document.getElementById('nudge-lastfm-input').value = currentLastfm;
  const heading = currentSpotify || currentLastfm ? 'Edit your music profile' : 'Want us to remember you?';
  document.querySelector('#profile-nudge-modal h3').textContent = heading;
  document.getElementById('profile-nudge-modal').classList.add('visible');
}

async function loadSavedProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn('Could not load saved profile:', body.error || res.status);
      return;
    }
    const data = await res.json();
    if (data.spotifyUsername) document.getElementById('spotify-username-input').value = data.spotifyUsername;
    if (data.lastfmUsername) {
      lastfmUsernameOverride = data.lastfmUsername;
      document.getElementById('lastfm-username-input').value = data.lastfmUsername;
      try {
        localStorage.setItem('lastfmUsernameOverride', lastfmUsernameOverride);
      } catch (e) {}
    }
    // Nobody's ever explained these fields exist if both come back empty —
    // covers brand-new sign-ups and existing accounts that never filled them in.
    if (!data.spotifyUsername && !data.lastfmUsername) {
      openProfileModal();
    }
  } catch (e) {
    console.error('Failed to load saved profile', e);
  }
}

async function saveProfile() {
  if (!clerkLoaded || !clerkLoaded.isSignedIn) return;
  const spotifyUsername = document.getElementById('spotify-username-input').value.trim();
  const lastfmUsername = document.getElementById('lastfm-username-input').value.trim();
  try {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyUsername, lastfmUsername }),
    });
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

// Save silently whenever either field changes, but only while signed in.
document.getElementById('spotify-username-input').addEventListener('change', saveProfile);
document.getElementById('lastfm-username-input').addEventListener('change', saveProfile);

document.getElementById('nudge-save-btn').addEventListener('click', async () => {
  const spotifyVal = document.getElementById('nudge-spotify-input').value.trim();
  const lastfmVal = document.getElementById('nudge-lastfm-input').value.trim();
  if (spotifyVal) document.getElementById('spotify-username-input').value = spotifyVal;
  if (lastfmVal) {
    document.getElementById('lastfm-username-input').value = lastfmVal;
    lastfmUsernameOverride = lastfmVal;
    try {
      localStorage.setItem('lastfmUsernameOverride', lastfmUsernameOverride);
    } catch (e) {}
  }
  await saveProfile();
  document.getElementById('profile-nudge-modal').classList.remove('visible');
});
document.getElementById('nudge-skip-btn').addEventListener('click', () => {
  document.getElementById('profile-nudge-modal').classList.remove('visible');
});

// ---------- init ----------
function updateHeaderHeightVar() {
  const header = document.querySelector('header');
  const rect = header.getBoundingClientRect();
  // header is sticky with a `top` offset, so the real space it occupies in flow
  // is its own height plus that top offset plus its bottom margin.
  const style = getComputedStyle(header);
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const top = parseFloat(style.top) || 0;
  document.documentElement.style.setProperty('--header-space', `${rect.height + top + marginBottom}px`);
}
window.addEventListener('resize', updateHeaderHeightVar);
updateHeaderHeightVar();

initClerk().catch((e) => console.error('Clerk init failed', e));

const savedBracket = loadSavedState();
if (savedBracket && savedBracket.matches && savedBracket.matches[savedBracket.matchIndex]) {
  document.getElementById('resume-modal').classList.add('visible');
  document.getElementById('resume-yes-btn').addEventListener('click', () => {
    document.getElementById('resume-modal').classList.remove('visible');
    restoreFromSaved(savedBracket);
  });
  document.getElementById('resume-no-btn').addEventListener('click', () => {
    document.getElementById('resume-modal').classList.remove('visible');
    clearSavedState();
  });
}
