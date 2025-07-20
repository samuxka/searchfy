import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { SpotifyArtistResponse } from '@/types/spotify';

interface SpotifySearchResponse {
  artists: {
    items: SpotifyArtistResponse[];
  };
}

interface SuggestResponse {
  artists: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
  error?: string;
}

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não estão definidos');
}

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

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json<SuggestResponse>({ artists: [], error: 'Parâmetro query é obrigatório' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const res = await axios.get<SpotifySearchResponse>('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'artist',
        limit: 5,
      },
    });

    const artists = res.data.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || null,
    }));

    return NextResponse.json<SuggestResponse>({ artists });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      return NextResponse.json<SuggestResponse>(
        { artists: [], error: 'Limite de requisições excedido, tente novamente mais tarde' },
        { status: 429 }
      );
    }
    console.error('Erro na rota de sugestões:', error);
    return NextResponse.json<SuggestResponse>(
      { artists: [], error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}