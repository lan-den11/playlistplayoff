import { Suspense } from 'react';
import BracketApp from '../../components/bracket/BracketApp';

export const metadata = {
  title: 'Playlist Playoff — Bracket',
};

export default function BracketPage() {
  return (
    <Suspense fallback={null}>
      <BracketApp />
    </Suspense>
  );
}
