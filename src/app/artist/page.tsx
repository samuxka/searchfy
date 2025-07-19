"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AudioLines, Heart, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';
import Link from 'next/link';

export default function ArtistPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchArtistData = async () => {
      try {
        const response = await fetch(`/api/spotify?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Something went wrong');
        setArtistData(data);
      } catch (err: any) {
        setError(err.message);
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
        <Link href="/" className='hover:underline'>Back to home</Link>
      </div>
      <div className="center flex-col">
        <div className="flex items-center gap-4 mb-8">
          <Image
            src={artist.images[0]?.url || '/placeholder.png'}
            alt={artist.name}
            width={1080}
            height={1920}
            className="w-40 h-40"
          />
          <div>
            <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
            <div className='flex gap-2'>
              <p className="center gap-2"><Heart size={20} /> {artist.popularity}/100</p>
              <p className='text-gray-500'>|</p>
              <p className="center gap-2"><User size={20} /> {followers.toLocaleString()}</p>
              <p className='text-gray-500'>|</p>
              <p className="center gap-2"><AudioLines size={20} /> {totalTracks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className='flex justify-between w-full gap-5 px-8'>
          <div className="alltracks w-2/3">
            <h2 className="text-2xl font-semibold mb-4">Todas as Músicas</h2>
            <ScrollArea className="h-96 rounded-sm border">
              <ul className="space-y-2">
                {allTracks.map((track: any) => (
                  <li key={track.id} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {track.name}
                  </li>
                ))}
              </ul>
            </ScrollArea>

          </div>

          <div className="toptracks w-1/3">
            <h2 className="text-2xl font-semibold mb-4">Top 10 Mais Ouvidas</h2>
            <ul className="space-y-2">
              {topTracks.map((track: any) => (
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
