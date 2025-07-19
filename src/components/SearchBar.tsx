"use client";

import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string, name: string, image: string | null }[]>([]);
  const router = useRouter();

  const handleSearch = (artistName: string) => {
    if (!artistName) return;
    router.push(`/artist?query=${encodeURIComponent(artistName)}`);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        fetch(`/api/suggest?query=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => setSuggestions(data.artists || []));
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex gap-3">
        <Input
          placeholder="Digite o nome do artista"
          className="border-blue-500 h-12 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        <Button
          className="h-12 bg-[#057CB7] hover:bg-[#057CB7]/80 text-white hidden sm:block"
          onClick={() => handleSearch(query)}
        >
          Pesquisar
        </Button>
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full dark:bg-zinc-800/10 bg-white/10 backdrop-blur-sm border mt-2 rounded shadow-md max-h-60 overflow-y-auto">
          {suggestions.map((artist) => (
            <li
              key={artist.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100/10 cursor-pointer"
              onClick={() => handleSearch(artist.name)}
            >
              {artist.image && (
                <Image src={artist.image} alt={artist.name} width={1080} height={1080} className="w-8 h-8 rounded-full" />
              )}
              <span>{artist.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
