import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '../config/tmdbConfig';

const buildPosterUrl = (posterPath) =>
  posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;

const mapMovieSummary = (movie) => ({
  tmdb_id: movie.id,
  title: movie.title || movie.original_title || 'Sem titulo',
  overview: movie.overview || 'Sinopse nao disponivel.',
  poster_url: buildPosterUrl(movie.poster_path),
  release_date: movie.release_date || '',
  vote_average: movie.vote_average ?? 0,
  language: movie.original_language || '',
});

const fetchMovieList = async (path, queryString = '') => {
  const url = `${TMDB_BASE_URL}${path}?api_key=${TMDB_API_KEY}&language=pt-BR${queryString ? `&${queryString}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar filmes na TMDB.');
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.map(mapMovieSummary);
};

export async function searchMoviesTMDB(query) {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return [];
  }

  return fetchMovieList('/search/movie', `query=${encodeURIComponent(trimmedQuery)}`);
}

export async function fetchRecommendationsTMDB(movieId) {
  if (!movieId) {
    return [];
  }

  return fetchMovieList(`/movie/${movieId}/recommendations`);
}

export async function fetchCategoryTMDB(category) {
  const pathMap = {
    top_rated: '/movie/top_rated',
    popular: '/movie/popular',
    now_playing: '/movie/now_playing',
    upcoming: '/movie/upcoming',
  };

  const path = pathMap[category];

  if (!path) {
    return [];
  }

  return fetchMovieList(path);
}

export async function fetchTrendingTMDB() {
  return fetchMovieList('/trending/movie/week');
}

export async function fetchPopularRegionTMDB(region = 'BR') {
  return fetchMovieList('/movie/popular', `region=${region}`);
}

export async function fetchRandomByGenresTMDB(genreIds = []) {
  const page = Math.max(1, Math.floor(Math.random() * 5) + 1);
  const genreQuery = Array.isArray(genreIds) && genreIds.length ? `&with_genres=${genreIds.join(',')}` : '';
  return fetchMovieList('/discover/movie', `sort_by=popularity.desc&page=${page}${genreQuery}`);
}

export async function fetchWatchProvidersTMDB(movieId) {
  if (!movieId) {
    return null;
  }

  const url = `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar provedores');
  }

  const data = await response.json();
  return data?.results?.BR || data?.results?.US || null;
}

export async function fetchCollectionTMDB(collectionId) {
  if (!collectionId) {
    return null;
  }

  const url = `${TMDB_BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=pt-BR`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar colecao');
  }

  const data = await response.json();

  return {
    id: data.id,
    name: data.name || 'Colecao sem nome',
    overview: data.overview || '',
    poster_url: buildPosterUrl(data.poster_path),
    backdrop_url: data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${data.backdrop_path}` : null,
    parts: Array.isArray(data.parts)
      ? data.parts
          .map((movie) => ({
            tmdb_id: movie.id,
            title: movie.title,
            poster_url: buildPosterUrl(movie.poster_path),
            release_date: movie.release_date,
            vote_average: movie.vote_average,
          }))
          .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
      : [],
  };
}
