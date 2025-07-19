// src/app/api/spotify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {
  SpotifyAlbum,
  SpotifyAlbumsResponse,
  SpotifyTracksResponse,
  SpotifyTopTracksResponse,
  SpotifyArtistResponse
} from '@/types/spotify';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
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
}

async function getAllTracks(artistId: string, accessToken: string) {
  let allTracks: any[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`;

  while (nextUrl) {
    const albumsRes = await axios.get<SpotifyAlbumsResponse>(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const albums = albumsRes.data.items;

    for (const album of albums) {
      const tracksRes = await axios.get<SpotifyTracksResponse>(
        `https://api.spotify.com/v1/albums/${album.id}/tracks`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      allTracks = [...allTracks, ...tracksRes.data.items];
    }

    nextUrl = albumsRes.data.next;
  }

  return allTracks;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'artist', limit: 1 },
      headers: { Authorization: `Bearer ${token}` }
    });

    const artist = searchRes.data.artists.items[0];
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const artistRes = await axios.get<SpotifyArtistResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const followers = artistRes.data.followers.total;

    let totalTracks = 0;
    let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artist.id}/albums?limit=50&include_groups=album,single`;

    while (nextUrl) {
      const albumsRes = await axios.get<SpotifyAlbumsResponse>(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = albumsRes.data;

      for (const alb of data.items) {
        totalTracks += alb.total_tracks;
      }

      nextUrl = data.next;
    }

    const topTracksRes = await axios.get<SpotifyTopTracksResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`,
      {
        params: { market: 'BR' },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const allTracks = await getAllTracks(artist.id, token);

    return NextResponse.json({
      artist: artistRes.data,
      followers,
      totalTracks,
      topTracks: topTracksRes.data.tracks,
      allTracks
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
