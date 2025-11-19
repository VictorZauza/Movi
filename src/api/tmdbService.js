import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '../config/tmdbConfig';

const buildPosterUrl = (posterPath) =>
  posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;

export async function searchMoviesTMDB(query) {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return [];
  }

  const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(
    trimmedQuery,
  )}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar filmes na TMDB.');
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title || movie.original_title || 'Sem título',
    overview: movie.overview || 'Sinopse não disponível.',
    poster_url: buildPosterUrl(movie.poster_path),
    release_date: movie.release_date || '',
    vote_average: movie.vote_average ?? 0,
    language: movie.original_language || '',
  }));
}
