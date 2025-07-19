// src/types/spotify.ts
export interface SpotifyAlbum {
  id: string;
  name: string;
  total_tracks: number;
}

export interface SpotifyAlbumsResponse {
  items: SpotifyAlbum[];
  next: string | null;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  track_number: number;
}

export interface SpotifyTracksResponse {
  items: SpotifyTrack[];
}

export interface SpotifyTopTracksResponse {
  tracks: SpotifyTrack[];
}

export interface SpotifyArtistResponse {
  id: string;
  name: string;
  genres: string[];
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  popularity: number;
}