import { searchMoviesTMDB } from '../api/tmdbService';
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '../config/tmdbConfig';
import { getDb } from '../db/database';

const saveSearchCache = async (query, results) => {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO search_cache (query, results_json, created_at)
     VALUES (?, ?, datetime('now','localtime'))`,
    [query, JSON.stringify(results)],
  );
};

const loadCacheByQuery = async (query) => {
  const db = getDb();
  const row = await db.getFirstAsync(
    `SELECT results_json
     FROM search_cache
     WHERE query = ?
     ORDER BY datetime(created_at) DESC
     LIMIT 1`,
    [query],
  );

  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.results_json);
  } catch {
    return null;
  }
};

export async function searchMovies(query) {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return { source: 'tmdb', results: [] };
  }

  try {
    const results = await searchMoviesTMDB(trimmedQuery);
    await saveSearchCache(trimmedQuery, results);
    return { source: 'tmdb', results };
  } catch (error) {
    const cachedResults = await loadCacheByQuery(trimmedQuery);

    if (cachedResults) {
      return { source: 'cache', results: cachedResults };
    }

    throw new Error('Sem resultados online nem em cache.');
  }
}

export const getFavorites = async () => {
  const db = getDb();
  return db.getAllAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, rating, created_at
     FROM favorites
     ORDER BY datetime(created_at) DESC`,
  );
};

export const addFavorite = async (movie, rating = 0) => {
  if (!movie?.tmdb_id) {
    throw new Error('Filme inválido.');
  }

  const db = getDb();
  await db.runAsync(
    `INSERT INTO favorites (
        tmdb_id, title, poster_url, overview, release_date, rating, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
        title=excluded.title,
        poster_url=excluded.poster_url,
        overview=excluded.overview,
        release_date=excluded.release_date,
        rating=excluded.rating`,
    [
      movie.tmdb_id,
      movie.title,
      movie.poster_url,
      movie.overview || '',
      movie.release_date || '',
      rating,
    ],
  );
};

const buildPosterUrl = (posterPath) =>
  posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;

export const getWatchlist = async () => {
  const db = getDb();
  return db.getAllAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, created_at
     FROM watchlist
     ORDER BY datetime(created_at) DESC`,
  );
};

export const addToWatchlist = async (movie) => {
  if (!movie?.tmdb_id) {
    throw new Error('Filme inválido.');
  }

  const db = getDb();
  await db.runAsync(
    `INSERT INTO watchlist (
        tmdb_id, title, poster_url, overview, release_date, created_at
     ) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
        title=excluded.title,
        poster_url=excluded.poster_url,
        overview=excluded.overview,
        release_date=excluded.release_date`,
    [
      movie.tmdb_id,
      movie.title,
      movie.poster_url,
      movie.overview || '',
      movie.release_date || '',
    ],
  );
};

export const removeFromWatchlist = async (tmdbId) => {
  const db = getDb();
  await db.runAsync(`DELETE FROM watchlist WHERE tmdb_id = ?`, [tmdbId]);
};

export const fetchMovieDetails = async (movieId) => {
  const detailsResponse = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,credits`,
  );

  if (!detailsResponse.ok) {
    throw new Error('Erro ao carregar detalhes do filme.');
  }

  const details = await detailsResponse.json();

  const trailer =
    details.videos?.results?.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer',
    ) || null;

  const cast = Array.isArray(details.credits?.cast)
    ? details.credits.cast.slice(0, 5).map((actor) => actor.name)
    : [];

  return {
    tmdb_id: details.id,
    title: details.title || details.original_title || 'Sem título',
    overview: details.overview || 'Sinopse não disponível.',
    release_date: details.release_date || '',
    poster_url: buildPosterUrl(details.poster_path),
    vote_average: details.vote_average ?? 0,
    runtime: details.runtime || null,
    genres: Array.isArray(details.genres) ? details.genres.map((genre) => genre.name) : [],
    cast,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
  };
};
