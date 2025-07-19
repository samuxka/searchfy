// src/app/artist/ArtistContent.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AudioLines, Heart, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { SpotifyArtistResponse, SpotifyTrack } from '@/types/spotify';

// Interface para a resposta da API /api/spotify
interface ArtistDataResponse {
  error: string;
  artist: SpotifyArtistResponse;
  followers: number;
  totalTracks: number;
  topTracks: SpotifyTrack[];
  allTracks: SpotifyTrack[];
}

export default function ArtistContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [artistData, setArtistData] = useState<ArtistDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchArtistData = async () => {
      try {
        const response = await fetch(`/api/spotify?query=${encodeURIComponent(query)}`);
        const data: ArtistDataResponse = await response.json();

        if (!response.ok) throw new Error(data.error || 'Algo deu errado');
        setArtistData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [query]);

  if (loading) return <div className="center h-screen">Carregando...</div>;
  if (error) return <div className="center h-screen text-red-500">{error}</div>;
  if (!artistData) return null;

  const { artist, topTracks, followers, totalTracks, allTracks } = artistData;

  return (
    <section className="w-full h-screen p-8">
      <div className="w-full flex justify-end">
        <Link href="/" className="hover:underline">Voltar para a página inicial</Link>
      </div>
      <div className="center flex-col mt-4">
        <div className="flex items-center justify-center flex-col gap-4 mb-8">
          <Image
            src={artist.images[0]?.url || '/placeholder.png'}
            alt={artist.name}
            width={1080}
            height={1920}
            className="size-20 sm:size-40"
          />
          <div className="text-center">
            <h1 className="text-xl sm:text-4xl font-bold mb-2">{artist.name}</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <p className="center text-sm sm:text-lg gap-2">
                <Heart size={20} /> {artist.popularity}/100
              </p>
              <p className="text-gray-500 hidden sm:block">|</p>
              <p className="center text-sm sm:text-lg gap-2">
                <User size={20} /> {followers.toLocaleString()}
              </p>
              <p className="text-gray-500 hidden sm:block">|</p>
              <p className="center text-sm sm:text-lg gap-2">
                <AudioLines size={20} /> {totalTracks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row lg:justify-between w-full gap-5 px-8">
          <div className="alltracks w-full lg:w-2/3">
            <h2 className="text-2xl font-semibold mb-4">Todas as Músicas</h2>
            <ScrollArea className="h-96 rounded-sm border">
              <ul className="space-y-2">
                {allTracks.map((track) => (
                  <li key={track.id} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {track.name}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          <div className="toptracks w-full lg:w-1/3">
            <h2 className="text-2xl font-semibold mb-4">Top 10 Mais Ouvidas</h2>
            <ul className="space-y-2">
              {topTracks.map((track) => (
                <li key={track.id} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {track.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}