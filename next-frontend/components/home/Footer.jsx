import { Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" />
          <span>Playlist Playoff</span>
        </div>
        <p>© {new Date().getFullYear()} Playlist Playoff. Not affiliated with Spotify.</p>
      </div>
    </footer>
  );
}
