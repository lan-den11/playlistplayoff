'use client';

import { useState, useEffect } from 'react';
import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';
import Modal from './Modal';

export default function ProfileNudgeModal({ open, onClose, onSave, initialSpotify, initialLastfm }) {
  const [spotifyUsername, setSpotifyUsername] = useState(initialSpotify || '');
  const [lastfmUsername, setLastfmUsername] = useState(initialLastfm || '');

  useEffect(() => {
    if (open) {
      setSpotifyUsername(initialSpotify || '');
      setLastfmUsername(initialLastfm || '');
    }
  }, [open, initialSpotify, initialLastfm]);

  const heading = initialSpotify || initialLastfm ? 'Edit your music profile' : 'Want us to remember you?';

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-display text-lg font-bold tracking-tight text-zinc-50">{heading}</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Link these once and we'll fill them in automatically every time you sign in — skip either one if you don't
        use it.
      </p>
      <div className="mt-5 space-y-3">
        <input
          value={spotifyUsername}
          onChange={(e) => setSpotifyUsername(e.target.value)}
          type="text"
          placeholder="Spotify username (optional)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
        />
        <input
          value={lastfmUsername}
          onChange={(e) => setLastfmUsername(e.target.value)}
          type="text"
          placeholder="Last.fm username (optional)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
        />
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <GradientButton gradient="violet" onClick={() => onSave(spotifyUsername.trim(), lastfmUsername.trim())}>
          Save
        </GradientButton>
        <GlassButton onClick={onClose}>Maybe later</GlassButton>
      </div>
    </Modal>
  );
}
