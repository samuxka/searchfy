// src/app/artist/page.tsx
import { Suspense } from 'react';
import ArtistContent from './ArtistContent'; // Novo componente para lógica do cliente

export default function ArtistPage() {
  return (
    <Suspense fallback={<div className="center h-screen">Carregando...</div>}>
      <ArtistContent />
    </Suspense>
  );
}