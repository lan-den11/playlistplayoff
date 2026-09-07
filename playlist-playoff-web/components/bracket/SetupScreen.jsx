'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Search } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';

export default function SetupScreen({
  onLoadPlaylist,
  isLoadingPlaylist,
  loadError,
  onFindUserPlaylists,
  userPlaylists,
  findUserError,
}) {
  const [playlistValue, setPlaylistValue] = useState('');
  const [usernameValue, setUsernameValue] = useState('');
  const [localError, setLocalError] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  function handleLoad() {
    const val = playlistValue.trim();
    if (!val) {
      setLocalError('Paste a playlist link or ID first.');
      return;
    }
    setLocalError('');
    onLoadPlaylist(val);
  }

  async function handleFind() {
    const username = usernameValue.trim();
    if (!username) {
      setLocalError('Type a Spotify username first.');
      return;
    }
    setLocalError('');
    setIsFinding(true);
    await onFindUserPlaylists(username);
    setIsFinding(false);
  }

  const errorText = localError || loadError || findUserError;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-6 py-16 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
      >
        <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-50">Load a playlist</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Paste any public Spotify playlist link, or find playlists by username below.
        </p>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={playlistValue}
              onChange={(e) => setPlaylistValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              type="text"
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
            />
          </div>
          <GradientButton gradient="violet" onClick={handleLoad} className="flex-none">
            {isLoadingPlaylist ? 'Loading…' : 'Load'}
          </GradientButton>
        </div>

        <p className="mt-7 text-sm text-zinc-400">Or find someone's public playlists by their Spotify username:</p>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={usernameValue}
              onChange={(e) => setUsernameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              type="text"
              placeholder="Spotify username"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
            />
          </div>
          <GlassButton onClick={handleFind} className="flex-none">
            {isFinding ? 'Finding…' : 'Find'}
          </GlassButton>
        </div>

        {userPlaylists && userPlaylists.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => e.target.value && onLoadPlaylist(e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 focus:border-violet-400/50 focus:outline-none"
          >
            <option value="">Select a playlist…</option>
            {userPlaylists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tracks} tracks)
              </option>
            ))}
          </select>
        )}

        {errorText && <p className="mt-4 text-sm text-rose-400">{errorText}</p>}
      </motion.div>
    </div>
  );
}
