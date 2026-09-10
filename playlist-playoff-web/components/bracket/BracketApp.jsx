'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useLastfmData } from '../../hooks/useLastfmData';
import { useProfileSync } from '../../hooks/useProfileSync';
import { buildFetchOrder } from '../../lib/bracketEngine';

import BracketHeader from './BracketHeader';
import SetupScreen from './SetupScreen';
import OptionsScreen from './OptionsScreen';
import BattleScreen from './BattleScreen';
import BracketTree from './BracketTree';
import ChampionScreen from './ChampionScreen';
import ResumeModal from './ResumeModal';
import ProfileNudgeModal from './ProfileNudgeModal';

export default function BracketApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cameFromTrending = searchParams.get('from') === 'trending';

  const bracket = useBracket(cameFromTrending ? { storageKey: TRENDING_HANDOFF_STORAGE_KEY } : undefined);
  const { lastfmData, lastfmEnabled, enqueueTracks, usernameOverride, setUsernameOverride } = useLastfmData();

  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [linkedSpotifyUsername, setLinkedSpotifyUsername] = useState('');

  const profileSync = useProfileSync({
    onLoaded: (data) => {
      if (data.spotifyUsername) setLinkedSpotifyUsername(data.spotifyUsername);
      if (data.lastfmUsername) setUsernameOverride(data.lastfmUsername);
    },
    onEmptyProfile: () => setNudgeOpen(true),
  });

  useEffect(() => {
    if (bracket.state.masterSortedTracks.length) enqueueTracks(bracket.state.masterSortedTracks);
  }, [bracket.state.masterSortedTracks, enqueueTracks]);

  useEffect(() => {
    if (bracket.state.matches.length) enqueueTracks(buildFetchOrder(bracket.state.matches));
  }, [bracket.state.matches, enqueueTracks]);

  function clearTrendingParam() {
    if (cameFromTrending) router.replace('/bracket');
  }

  const { screen } = bracket.state;

  return (
    <div className="min-h-screen bg-zinc-950">
      <BracketHeader
        screen={screen}
        headerProgressPct={bracket.headerProgressPct}
        onExit={bracket.backToSetup}
        onEditProfile={() => setNudgeOpen(true)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {screen === 'setup' && (
            <SetupScreen
              onLoadPlaylist={bracket.loadPlaylist}
              isLoadingPlaylist={bracket.state.isLoadingPlaylist}
              loadError={bracket.state.loadError}
              onFindUserPlaylists={bracket.findUserPlaylistsByUsername}
              userPlaylists={bracket.userPlaylists}
              findUserError={bracket.findUserError}
            />
          )}

          {screen === 'options' && (
            <OptionsScreen
              loadedTracksCount={bracket.state.loadedTracks.length}
              bracketSize={bracket.state.bracketSize}
              doShuffle={bracket.state.doShuffle}
              wildcardEnabled={bracket.state.wildcardEnabled}
              onSetBracketSize={bracket.setBracketSize}
              onSetShuffle={bracket.setShuffle}
              onSetWildcardEnabled={bracket.setWildcardEnabled}
              onStart={bracket.startTournament}
              onBack={bracket.backToSetup}
            />
          )}

          {screen === 'battle' && (
            <>
              <BattleScreen
                pendingA={bracket.pendingA}
                pendingB={bracket.pendingB}
                roundLabel={bracket.roundLabel}
                realMatchIndexThisRound={bracket.state.realMatchIndexThisRound}
                realMatchCountThisRound={bracket.state.realMatchCountThisRound}
                progressPct={bracket.progressPct}
                canUndo={bracket.state.historyStack.length > 0}
                onPick={bracket.pick}
                onUndo={bracket.undo}
                onShuffleSwap={bracket.shuffleSwap}
                onSkipSwap={bracket.skipSwap}
                showDetails={bracket.state.showDetails}
                onSetShowDetails={bracket.setShowDetails}
                lastfmData={lastfmData}
                lastfmEnabled={lastfmEnabled}
                usernameOverride={usernameOverride}
                onSetUsernameOverride={setUsernameOverride}
              />
              <BracketTree
                wildcardBracketRounds={bracket.state.wildcardBracketRounds}
                mainBracketRounds={bracket.state.mainBracketRounds}
                phase={bracket.state.phase}
                currentRoundIdx={bracket.state.currentRoundIdx}
                matchIndex={bracket.state.matchIndex}
              />
            </>
          )}

          {screen === 'champion' && (
            <ChampionScreen
              championTrack={bracket.state.championTrack}
              mainBracketRounds={bracket.state.mainBracketRounds}
              onRestart={bracket.restart}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ResumeModal
        open={Boolean(bracket.savedSnapshot)}
        onResume={() => {
          bracket.resumeSaved();
          clearTrendingParam();
        }}
        onDiscard={() => {
          bracket.discardSaved();
          clearTrendingParam();
        }}
      />

      <ProfileNudgeModal
        open={nudgeOpen}
        onClose={() => setNudgeOpen(false)}
        initialSpotify={linkedSpotifyUsername}
        initialLastfm={usernameOverride}
        onSave={async (spotifyUsername, lastfmUsername) => {
          setLinkedSpotifyUsername(spotifyUsername);
          setUsernameOverride(lastfmUsername);
          await profileSync.save(spotifyUsername, lastfmUsername);
          setNudgeOpen(false);
        }}
      />
    </div>
  );
}
