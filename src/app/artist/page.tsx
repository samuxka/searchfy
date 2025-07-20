import { Suspense } from 'react';
import ArtistContent from './ArtistContent';

export default function ArtistPage() {
  return (
    <Suspense fallback={<div className="center h-screen">Carregando...</div>}>
      <ArtistContent />
    </Suspense>
  );
}