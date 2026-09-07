'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Headphones, X, Music2 } from 'lucide-react';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';

export default function BracketHeader({ screen, headerProgressPct, onExit, onEditProfile }) {
  const showProgress = screen === 'battle' || screen === 'champion';

  return (
    <header
      className={`z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md ${
        screen === 'battle' ? '' : 'sticky top-0'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <Headphones className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-zinc-50 sm:inline">
            Playlist Playoff
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {screen === 'battle' && (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
              Exit bracket
            </button>
          )}

          <Show when="signed-in">
            {/* afterSignOutUrl now lives on <ClerkProvider> in app/layout.jsx, not here */}
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Edit music profile"
                  labelIcon={<Music2 className="h-4 w-4" />}
                  onClick={onEditProfile}
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
        </div>
      </div>

      {showProgress && (
        <div className="h-1 w-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
            animate={{ width: `${headerProgressPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      )}
    </header>
  );
}
