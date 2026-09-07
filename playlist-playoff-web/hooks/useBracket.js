'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  shuffleArray,
  nextPowerOfTwo,
  pairUp,
  standardSeed,
  buildTreeStructure,
  autoPickBracketSize,
  computeWildcardSplit,
  roundLabelText,
} from '../lib/bracketEngine';
import { fetchPlaylistTracks, fetchUserPlaylists } from '../lib/api';

// Default slot used by a normal, real bracket (paste-a-playlist flow).
export const DEFAULT_SAVE_KEY = 'spotifyBracketSave_v1';

// A completely separate slot used only by the homepage teaser bracket
// (components/home/Hero.jsx). Keeping it isolated from DEFAULT_SAVE_KEY
// means playing the teaser can never silently overwrite a real in-progress
// bracket someone already saved by pasting their own playlist. When the
// teaser hands off to the full /bracket page, it does so via a
// `?from=trending` query param that tells this hook which slot to read.
export const TRENDING_HANDOFF_STORAGE_KEY = 'trendingTeaserBracketSave_v1';

const initialState = {
  screen: 'setup', // 'setup' | 'options' | 'battle' | 'champion'
  loadError: '',
  isLoadingPlaylist: false,
  loadedTracks: [],
  masterSortedTracks: [],

  bracketSize: 32,
  doShuffle: true,
  wildcardEnabled: true,

  phase: 'main', // 'main' | 'wildcard'
  round: [],
  matches: [],
  matchIndex: 0,
  winners: [],
  currentRoundIdx: 0,
  wildcardSlotsNeeded: 0,
  pendingAutoSeeds: [],
  wildcardBracketRounds: null,
  mainBracketRounds: null,
  historyStack: [],
  realMatchCountThisRound: 0,
  realMatchIndexThisRound: 0,
  totalRealMatchesOverall: 0,
  completedRealMatchesOverall: 0,
  showDetails: true,
  championTrack: null,
};

// ---------- helpers that operate on state and return new state ----------

function cloneTree(tree) {
  return tree.map((round) => round.map((m) => ({ ...m })));
}

function getCurrentTree(state) {
  return state.phase === 'wildcard' ? state.wildcardBracketRounds : state.mainBracketRounds;
}

function withCurrentTree(state, tree) {
  return state.phase === 'wildcard' ? { ...state, wildcardBracketRounds: tree } : { ...state, mainBracketRounds: tree };
}

function resolveInTree(state, track) {
  const tree = cloneTree(getCurrentTree(state));
  const roundArr = tree[state.currentRoundIdx];
  const slot = roundArr[state.matchIndex];
  slot.winner = track;
  if (tree[state.currentRoundIdx + 1]) {
    const nextSlot = tree[state.currentRoundIdx + 1][Math.floor(state.matchIndex / 2)];
    if (state.matchIndex % 2 === 0) nextSlot.a = track;
    else nextSlot.b = track;
  }
  return withCurrentTree(state, tree);
}

function startRound(state) {
  const matches = pairUp(state.round);
  return {
    ...state,
    matches,
    matchIndex: 0,
    realMatchCountThisRound: matches.filter(([a, b]) => a && b).length,
    realMatchIndexThisRound: 0,
  };
}

// Walks forward through auto-resolved byes until it finds a real match to
// show, or the round/phase/tournament is fully resolved. Direct port of the
// original nextMatch() while-loop.
function advanceToNextMatch(state) {
  let s = { ...state };
  while (s.matchIndex < s.matches.length) {
    const [a, b] = s.matches[s.matchIndex];
    if (a && !b) {
      s = resolveInTree(s, a);
      s.winners = [...s.winners, a];
      s.matchIndex += 1;
      continue;
    }
    if (b && !a) {
      s = resolveInTree(s, b);
      s.winners = [...s.winners, b];
      s.matchIndex += 1;
      continue;
    }
    if (!a && !b) {
      s.matchIndex += 1;
      continue;
    }
    s.realMatchIndexThisRound += 1;
    s.screen = 'battle';
    return s;
  }

  if (s.phase === 'wildcard') {
    if (s.winners.length <= s.wildcardSlotsNeeded) return finishWildcard(s);
  } else if (s.winners.length === 1) {
    return {
      ...s,
      screen: 'champion',
      championTrack: s.winners[0],
      completedRealMatchesOverall: s.totalRealMatchesOverall,
    };
  }

  s.currentRoundIdx += 1;
  s.round = s.winners;
  s.winners = [];
  s = startRound(s);
  return advanceToNextMatch(s);
}

function beginMainPhase(state, seeds) {
  let next = { ...state, phase: 'main' };
  const padded = seeds.slice();
  const target = nextPowerOfTwo(padded.length);
  while (padded.length < target) padded.push(null);
  next.round = standardSeed(padded);
  next.winners = [];
  next.currentRoundIdx = 0;
  next.mainBracketRounds = buildTreeStructure(next.round);
  next = startRound(next);
  return advanceToNextMatch(next);
}

function finishWildcard(state) {
  const combined = state.pendingAutoSeeds.concat(state.winners);
  return beginMainPhase(state, state.doShuffle ? shuffleArray(combined) : combined);
}

function startTournament(state) {
  const { bracketSize: size, doShuffle, wildcardEnabled, masterSortedTracks: sorted } = state;
  let next = {
    ...state,
    historyStack: [],
    wildcardBracketRounds: null,
    mainBracketRounds: null,
    completedRealMatchesOverall: 0,
  };

  if (sorted.length <= size || !wildcardEnabled) {
    const seeds = sorted.slice(0, size);
    next.totalRealMatchesOverall = seeds.length - 1;
    return beginMainPhase(next, doShuffle ? shuffleArray(seeds) : seeds);
  }

  const split = computeWildcardSplit(sorted.length, size);
  const autoSeeds = sorted.slice(0, split.autoSlots);
  const wildcardPool = sorted.slice(split.autoSlots);

  if (!split.needsWildcard) {
    next.totalRealMatchesOverall = sorted.length - 1;
    const combined = autoSeeds.concat(wildcardPool);
    return beginMainPhase(next, doShuffle ? shuffleArray(combined) : combined);
  }

  next.totalRealMatchesOverall = wildcardPool.length - split.wildcardSlots + (size - 1);
  next.wildcardSlotsNeeded = split.wildcardSlots;
  next.pendingAutoSeeds = autoSeeds;
  next.phase = 'wildcard';

  const seeds = doShuffle ? shuffleArray(wildcardPool) : wildcardPool;
  const target = nextPowerOfTwo(seeds.length);
  while (seeds.length < target) seeds.push(null);
  next.round = standardSeed(seeds);
  next.winners = [];
  next.currentRoundIdx = 0;
  next.wildcardBracketRounds = buildTreeStructure(next.round);
  next = startRound(next);
  return advanceToNextMatch(next);
}

function pushHistory(state) {
  const snapshot = {
    phase: state.phase,
    round: state.round.slice(),
    matches: state.matches.map((m) => m.slice()),
    matchIndex: state.matchIndex,
    winners: state.winners.slice(),
    currentRoundIdx: state.currentRoundIdx,
    pendingAutoSeeds: state.pendingAutoSeeds.slice(),
    wildcardSlotsNeeded: state.wildcardSlotsNeeded,
    wildcardBracketRounds: state.wildcardBracketRounds ? cloneTree(state.wildcardBracketRounds) : null,
    mainBracketRounds: state.mainBracketRounds ? cloneTree(state.mainBracketRounds) : null,
    realMatchCountThisRound: state.realMatchCountThisRound,
    realMatchIndexThisRound: state.realMatchIndexThisRound,
    completedRealMatchesOverall: state.completedRealMatchesOverall,
  };
  return { ...state, historyStack: [...state.historyStack, snapshot] };
}

function pickReducer(state, track) {
  if (!track) return state;
  let s = pushHistory(state);
  s = resolveInTree(s, track);
  s.winners = [...s.winners, track];
  s.matchIndex += 1;
  s.completedRealMatchesOverall += 1;
  return advanceToNextMatch(s);
}

function undoReducer(state) {
  if (!state.historyStack.length) return state;
  const prev = state.historyStack[state.historyStack.length - 1];
  const historyStack = state.historyStack.slice(0, -1);
  return { ...state, ...prev, historyStack, screen: 'battle', championTrack: null };
}

function findSkipTarget(state) {
  for (let i = state.matches.length - 1; i > state.matchIndex; i--) {
    const [x, y] = state.matches[i];
    if (x && y) return i;
  }
  return -1;
}

function shuffleSwapReducer(state) {
  const futureIndices = [];
  for (let i = state.matchIndex + 1; i < state.matches.length; i++) futureIndices.push(i);
  if (!futureIndices.length) return state;
  const futureIdx = futureIndices[Math.floor(Math.random() * futureIndices.length)];
  const mySide = Math.random() < 0.5 ? 0 : 1;
  const theirSide = Math.random() < 0.5 ? 0 : 1;
  if (!state.matches[futureIdx][theirSide]) return state;

  const matches = state.matches.map((m) => m.slice());
  const temp = matches[state.matchIndex][mySide];
  matches[state.matchIndex][mySide] = matches[futureIdx][theirSide];
  matches[futureIdx][theirSide] = temp;

  const tree = cloneTree(getCurrentTree(state));
  const roundArr = tree[state.currentRoundIdx];
  roundArr[state.matchIndex][mySide === 0 ? 'a' : 'b'] = matches[state.matchIndex][mySide];
  roundArr[futureIdx][theirSide === 0 ? 'a' : 'b'] = matches[futureIdx][theirSide];

  return withCurrentTree({ ...state, matches }, tree);
}

// Swaps the whole current matchup with the last resolvable matchup remaining
// in this round, so "think about it later" keeps pushing it to the back.
function skipSwapReducer(state) {
  const target = findSkipTarget(state);
  if (target === -1) return state;
  const matches = state.matches.map((m) => m.slice());
  const temp = matches[state.matchIndex];
  matches[state.matchIndex] = matches[target];
  matches[target] = temp;

  const tree = cloneTree(getCurrentTree(state));
  const roundArr = tree[state.currentRoundIdx];
  roundArr[state.matchIndex].a = matches[state.matchIndex][0];
  roundArr[state.matchIndex].b = matches[state.matchIndex][1];
  roundArr[target].a = matches[target][0];
  roundArr[target].b = matches[target][1];

  return withCurrentTree({ ...state, matches }, tree);
}

function setLoadedTracks(state, tracks) {
  const masterSortedTracks = tracks.slice().sort((x, y) => new Date(y.addedAt) - new Date(x.addedAt));
  return {
    ...state,
    loadedTracks: tracks,
    masterSortedTracks,
    bracketSize: autoPickBracketSize(tracks.length),
    screen: 'options',
    loadError: '',
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoadingPlaylist: true, loadError: '' };
    case 'LOAD_ERROR':
      return { ...state, isLoadingPlaylist: false, loadError: action.message };
    case 'LOAD_SUCCESS':
      return { ...setLoadedTracks(state, action.tracks), isLoadingPlaylist: false };
    case 'SET_BRACKET_SIZE':
      return { ...state, bracketSize: action.value };
    case 'SET_SHUFFLE':
      return { ...state, doShuffle: action.value };
    case 'SET_WILDCARD':
      return { ...state, wildcardEnabled: action.value };
    case 'BACK_TO_SETUP':
      return { ...state, screen: 'setup' };
    case 'START_TOURNAMENT':
      return startTournament(state);
    case 'PICK':
      return pickReducer(state, action.track);
    case 'UNDO':
      return undoReducer(state);
    case 'SHUFFLE_SWAP':
      return shuffleSwapReducer(state);
    case 'SKIP_SWAP':
      return skipSwapReducer(state);
    case 'SET_SHOW_DETAILS':
      return { ...state, showDetails: action.value };
    case 'RESTART':
      return { ...initialState, showDetails: state.showDetails };
    case 'RESTORE_SAVED': {
      const restored = { ...state, ...action.payload };
      restored.screen = restored.matches?.[restored.matchIndex] ? 'battle' : 'setup';
      return restored;
    }
    default:
      return state;
  }
}

// ---------- the hook ----------

// `storageKey` lets a caller isolate its autosave/resume slot from the
// default one — see TRENDING_HANDOFF_STORAGE_KEY above for why that matters.
export function useBracket({ storageKey = DEFAULT_SAVE_KEY } = {}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [userPlaylists, setUserPlaylists] = useState(null);
  const [findUserError, setFindUserError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  // Check once, on mount, for an in-progress bracket saved to this browser
  // under this instance's storage key.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.matches?.[parsed.matchIndex]) setSavedSnapshot(parsed);
    } catch {
      // corrupted/unavailable storage — just skip resume
    }
  }, [storageKey]);

  // Autosave whenever the live matchup changes.
  useEffect(() => {
    if (state.screen !== 'battle') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage full/unavailable — not critical, skip this save
    }
  }, [state, storageKey]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (state.screen === 'champion') clearSaved();
  }, [state.screen, clearSaved]);

  const loadPlaylist = useCallback(async (idOrUrl) => {
    dispatch({ type: 'LOAD_START' });
    try {
      const data = await fetchPlaylistTracks(idOrUrl);
      if (data.tracks.length < 2) throw new Error('Playlist needs at least 2 songs to make a bracket.');
      dispatch({ type: 'LOAD_SUCCESS', tracks: data.tracks });
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: e.message });
    }
  }, []);

  const findUserPlaylistsByUsername = useCallback(async (username) => {
    setFindUserError('');
    setUserPlaylists(null);
    try {
      const data = await fetchUserPlaylists(username);
      if (!data.length) throw new Error('That user has no public playlists on their profile.');
      setUserPlaylists(data);
    } catch (e) {
      setFindUserError(e.message);
    }
  }, []);

  const [a, b] = state.matches[state.matchIndex] || [null, null];
  const currentTree = state.phase === 'wildcard' ? state.wildcardBracketRounds : state.mainBracketRounds;
  const roundLabel = useMemo(() => roundLabelText(state.phase, state.round.length), [state.phase, state.round.length]);
  const progressPct = state.realMatchCountThisRound
    ? Math.round(((state.realMatchIndexThisRound - 1) / state.realMatchCountThisRound) * 100)
    : 0;
  const headerProgressPct = state.totalRealMatchesOverall
    ? Math.min(100, Math.round((state.completedRealMatchesOverall / state.totalRealMatchesOverall) * 100))
    : 0;

  return {
    state,
    pendingA: a,
    pendingB: b,
    currentTree,
    roundLabel,
    progressPct,
    headerProgressPct,
    userPlaylists,
    findUserError,
    savedSnapshot,

    loadPlaylist,
    findUserPlaylistsByUsername,
    setBracketSize: (value) => dispatch({ type: 'SET_BRACKET_SIZE', value }),
    setShuffle: (value) => dispatch({ type: 'SET_SHUFFLE', value }),
    setWildcardEnabled: (value) => dispatch({ type: 'SET_WILDCARD', value }),
    backToSetup: () => dispatch({ type: 'BACK_TO_SETUP' }),
    startTournament: () => dispatch({ type: 'START_TOURNAMENT' }),
    pick: (track) => dispatch({ type: 'PICK', track }),
    undo: () => dispatch({ type: 'UNDO' }),
    shuffleSwap: () => dispatch({ type: 'SHUFFLE_SWAP' }),
    skipSwap: () => dispatch({ type: 'SKIP_SWAP' }),
    setShowDetails: (value) => dispatch({ type: 'SET_SHOW_DETAILS', value }),
    restart: () => {
      clearSaved();
      dispatch({ type: 'RESTART' });
    },
    resumeSaved: () => {
      if (savedSnapshot) dispatch({ type: 'RESTORE_SAVED', payload: savedSnapshot });
      setSavedSnapshot(null);
    },
    discardSaved: () => {
      clearSaved();
      setSavedSnapshot(null);
    },
  };
}
