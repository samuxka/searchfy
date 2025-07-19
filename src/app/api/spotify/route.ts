// src/app/api/spotify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import {
  SpotifyAlbum,
  SpotifyAlbumsResponse,
  SpotifyTrack,
  SpotifyTracksResponse,
  SpotifyTopTracksResponse,
  SpotifyArtistResponse,
} from '@/types/spotify';

// Validação de variáveis de ambiente
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não estão definidos');
}

// Interface para a resposta da API
interface ArtistDataResponse {
  artist: SpotifyArtistResponse;
  followers: number;
  totalTracks: number;
  topTracks: SpotifyTrack[];
  allTracks: SpotifyTrack[];
}

// Obtém o token de acesso do Spotify
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return res.data.access_token;
  } catch {
    throw new Error('Falha ao obter o token de acesso do Spotify');
  }
}

// Busca álbuns com paginação
async function fetchAlbums(artistId: string, accessToken: string): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`;

  while (nextUrl) {
    try {
      const albumsRes: SpotifyAlbumsResponse = await axios.get<SpotifyAlbumsResponse>(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(res => res.data);
      albums.push(...albumsRes.items);
      nextUrl = albumsRes.next;
    } catch {
      throw new Error('Falha ao buscar álbuns');
    }
  }

  return albums;
}

// Busca todas as faixas de um artista
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
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      allTracks.push(...tracksRes.data.items);
    } catch {
      console.warn(`Falha ao buscar faixas do álbum ${album.id}`);
      continue; // Continua para o próximo álbum em caso de erro
    }
  }

  return { tracks: allTracks, totalTracks };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  const market = url.searchParams.get('market') || 'BR'; // Mercado configurável

  if (!query) {
    return NextResponse.json({ error: 'Parâmetro query é obrigatório' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    // Busca o artista
    const searchRes = await axios.get<{ artists: { items: SpotifyArtistResponse[] } }>(
      'https://api.spotify.com/v1/search',
      {
        params: { q: query, type: 'artist', limit: 1 },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const artist = searchRes.data.artists.items[0];
    if (!artist) {
      return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 });
    }

    // Busca detalhes do artista
    const artistRes = await axios.get<SpotifyArtistResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const followers = artistRes.data.followers.total;

    // Busca as principais faixas
    const topTracksRes = await axios.get<SpotifyTopTracksResponse>(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`,
      {
        params: { market },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Busca todas as faixas e contagem total
    const { tracks: allTracks, totalTracks } = await getAllTracks(artist.id, token);

    return NextResponse.json<ArtistDataResponse>({
      artist: artistRes.data,
      followers,
      totalTracks,
      topTracks: topTracksRes.data.tracks,
      allTracks,
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      return NextResponse.json({ error: 'Limite de requisições excedido, tente novamente mais tarde' }, { status: 429 });
    }
    console.error('Erro na rota da API do Spotify:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}