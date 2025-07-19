// src/app/api/spotify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import {
  SpotifyAlbum,
  SpotifyAlbumsResponse,
  SpotifyTracksResponse,
  SpotifyTopTracksResponse,
  SpotifyArtistResponse,
  SpotifyTrack
} from '@/types/spotify';

// Utility to handle environment variables safely
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('Spotify client ID or secret is missing');
}

// Interface for the API response
interface ArtistDataResponse {
  artist: SpotifyArtistResponse['data'];
  followers: number;
  totalTracks: number;
  topTracks: SpotifyTopTracksResponse['tracks'];
  allTracks: SpotifyTrack[];
}

// Get Spotify access token
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return res.data.access_token;
  } catch (err) {
    throw new Error('Failed to obtain Spotify access token');
  }
}

// Fetch albums with pagination
async function fetchAlbums(artistId: string, accessToken: string): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`;

  while (nextUrl) {
    try {
      const albumsRes = await axios.get<SpotifyAlbumsResponse>(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      albums.push(...albumsRes.data.items);
      nextUrl = albumsRes.data.next;
    } catch (err) {
      throw new Error(`Failed to fetch albums: ${err}`);
    }
  }

  return albums;
}

// Fetch all tracks for an artist
async function getAllTracks(artistId: string, accessToken: string): Promise<{ tracks: SpotifyTrack[]; totalTracks: number }> {
  const albums = await fetchAlbums(artistId, accessToken);
  let totalTracks = 0;
  const allTracks: SpotifyTrack[] = [];

  for (const album of albums) {
    try {
      totalTracks += album.total_tracks;
      const tracksRes = await axios.get<SpotifyTracksResponse>(
        `https://api.spotify.com/v1/albums/${album.id}/tracks`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      allTracks.push(...tracksRes.data.items);
    } catch (err) {
      console.warn(`Failed to fetch tracks for album ${album.id}: ${err}`);
      continue; // Skip failed albums
    }
  }

  return { tracks: allTracks, totalTracks };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  const market = url.searchParams.get('market') || 'BR'; // Configurable market

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    // Search for artist
    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'artist', limit: 1 },
      headers: { Authorization: `Bearer ${token}` }
    });

    const artist = searchRes.data.artists.items[0];
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Fetch artist details
    const artistRes = await axios.get<SpotifyArtistResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const followers = artistRes.data.followers.total;

    // Fetch top tracks
    const topTracksRes = await axios.get<SpotifyTopTracksResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`,
      {
        params: { market },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Fetch all tracks and total track count
    const { tracks: allTracks, totalTracks } = await getAllTracks(artist.id, token);

    return NextResponse.json<ArtistDataResponse>({
      artist: artistRes.data,
      followers,
      totalTracks,
      topTracks: topTracksRes.data.tracks,
      allTracks
    });
  } catch (err) {
    const error = err as AxiosError;
    if (error.response?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded, please try again later' }, { status: 429 });
    }
    console.error('Error in Spotify API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}