import {
  fetchCategoryTMDB,
  fetchRecommendationsTMDB,
  fetchWatchProvidersTMDB,
  fetchPopularRegionTMDB,
  fetchTrendingTMDB,
  fetchCollectionTMDB,
  fetchRandomByGenresTMDB,
  searchMoviesTMDB,
} from '../api/tmdbService';
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '../config/tmdbConfig';
import { getDb } from '../db/database';

const SEARCH_HISTORY_LIMIT = 10;
const RECENTLY_VIEWED_LIMIT = 15;

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

const saveSearchHistoryTerm = async (term) => {
  const trimmedTerm = term?.trim();

  if (!trimmedTerm) {
    return;
  }

  const db = getDb();
  await db.runAsync(
    `INSERT INTO search_history (term, last_used_at)
     VALUES (?, datetime('now','localtime'))
     ON CONFLICT(term) DO UPDATE SET last_used_at=excluded.last_used_at`,
    [trimmedTerm],
  );

  await db.runAsync(
    `DELETE FROM search_history
     WHERE term NOT IN (
       SELECT term FROM search_history
       ORDER BY datetime(last_used_at) DESC
       LIMIT ?
     )`,
    [SEARCH_HISTORY_LIMIT],
  );
};

export const getSearchHistory = async () => {
  const db = getDb();
  return db.getAllAsync(
    `SELECT term
     FROM search_history
     ORDER BY datetime(last_used_at) DESC
     LIMIT ?`,
    [SEARCH_HISTORY_LIMIT],
  );
};

export const clearSearchHistory = async () => {
  const db = getDb();
  await db.runAsync(`DELETE FROM search_history`);
};

export async function searchMovies(query, options = {}) {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return { source: 'tmdb', results: [] };
  }

  if (options.skipHistory !== true) {
    try {
      await saveSearchHistoryTerm(trimmedQuery);
    } catch {
      // ignore
    }
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
    `SELECT tmdb_id, title, poster_url, overview, release_date, rating, comment, created_at
     FROM favorites
     ORDER BY datetime(created_at) DESC`,
  );
};

export const getFavoriteById = async (tmdbId) => {
  if (!tmdbId) {
    return null;
  }
  const db = getDb();
  return db.getFirstAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, rating, comment, created_at
     FROM favorites
     WHERE tmdb_id = ?`,
    [tmdbId],
  );
};

export const addFavorite = async (movie, rating = 0, comment = '') => {
  if (!movie?.tmdb_id) {
    throw new Error('Filme invalido.');
  }

  const db = getDb();
  await db.runAsync(
    `INSERT INTO favorites (
        tmdb_id, title, poster_url, overview, release_date, rating, comment, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
        title=excluded.title,
        poster_url=excluded.poster_url,
        overview=excluded.overview,
        release_date=excluded.release_date,
        rating=excluded.rating,
        comment=excluded.comment`,
    [
      movie.tmdb_id,
      movie.title,
      movie.poster_url,
      movie.overview || '',
      movie.release_date || '',
      rating,
      comment?.slice(0, 140) || '',
    ],
  );
};

const buildPosterUrl = (posterPath, size = 'w500') =>
  posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null;

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
    throw new Error('Filme invalido.');
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

export const saveRecentlyViewed = async (movie) => {
  if (!movie?.tmdb_id) {
    return;
  }

  const db = getDb();
  await db.runAsync(
    `INSERT INTO recently_viewed (
        tmdb_id, title, poster_url, overview, release_date, viewed_at
     ) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(tmdb_id) DO UPDATE SET
        title=excluded.title,
        poster_url=excluded.poster_url,
        overview=excluded.overview,
        release_date=excluded.release_date,
        viewed_at=excluded.viewed_at`,
    [
      movie.tmdb_id,
      movie.title,
      movie.poster_url || '',
      movie.overview || '',
      movie.release_date || '',
    ],
  );

  await db.runAsync(
    `DELETE FROM recently_viewed
     WHERE tmdb_id NOT IN (
       SELECT tmdb_id FROM recently_viewed
       ORDER BY datetime(viewed_at) DESC
       LIMIT ?
     )`,
    [RECENTLY_VIEWED_LIMIT],
  );
};

export const getRecentlyViewed = async () => {
  const db = getDb();
  return db.getAllAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, viewed_at
     FROM recently_viewed
     ORDER BY datetime(viewed_at) DESC
     LIMIT ?`,
    [RECENTLY_VIEWED_LIMIT],
  );
};

export const clearRecentlyViewed = async () => {
  const db = getDb();
  await db.runAsync(`DELETE FROM recently_viewed`);
};

export const fetchRecommendations = async (movieId) => {
  if (!movieId) {
    return [];
  }

  try {
    const list = await fetchRecommendationsTMDB(movieId);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Erro ao carregar recomendacoes', error);
    return [];
  }
};

export const fetchMovieCategory = async (category) => {
  try {
    const list = await fetchCategoryTMDB(category);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Erro ao carregar categoria', category, error);
    return [];
  }
};

export const fetchTrendingWeek = async () => {
  try {
    const list = await fetchTrendingTMDB();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Erro ao carregar trending', error);
    return [];
  }
};

export const fetchPopularBR = async () => {
  try {
    const list = await fetchPopularRegionTMDB('BR');
    return Array.isArray(list) ? list : [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Erro ao carregar populares BR', error);
    return [];
  }
};

export const fetchRecommendationsFromFavorites = async (favorites = []) => {
  const all = [];
  for (const fav of favorites.slice(0, 3)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const recs = await fetchRecommendationsTMDB(fav.tmdb_id);
      if (Array.isArray(recs)) {
        all.push(...recs);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar recomendacao para favorito', fav.tmdb_id, error);
    }
  }
  // remove duplicados por tmdb_id
  const unique = [];
  const seen = new Set();
  all.forEach((movie) => {
    if (!seen.has(movie.tmdb_id)) {
      seen.add(movie.tmdb_id);
      unique.push(movie);
    }
  });
  return unique;
};

const GENRE_ID_MAP = {
  acao: 28,
  action: 28,
  aventura: 12,
  adventure: 12,
  animacao: 16,
  animation: 16,
  comedia: 35,
  comedy: 35,
  crime: 80,
  documentario: 99,
  documentary: 99,
  drama: 18,
  familia: 10751,
  family: 10751,
  fantasia: 14,
  fantasy: 14,
  historia: 36,
  history: 36,
  terror: 27,
  horror: 27,
  musica: 10402,
  music: 10402,
  misterio: 9648,
  mystery: 9648,
  romance: 10749,
  ficcaocientifica: 878,
  cienciaficcao: 878,
  scifi: 878,
  suspense: 53,
  thriller: 53,
  guerra: 10752,
  war: 10752,
  faroeste: 37,
  western: 37,
  filmetv: 10770,
  tvmovie: 10770,
};

const normalizeGenreName = (name) =>
  (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();

const getTopGenreIdsFromWatched = async () => {
  const db = getDb();
  const rows = await db.getAllAsync(`SELECT genres FROM watched WHERE genres IS NOT NULL AND genres != ''`);
  const counter = {};

  rows.forEach((row) => {
    const items = row.genres?.split(',') || [];
    items.forEach((raw) => {
      const key = normalizeGenreName(raw);
      const id = GENRE_ID_MAP[key];
      if (id) {
        counter[id] = (counter[id] || 0) + 1;
      }
    });
  });

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => Number(id));
};

export const fetchRandomSurpriseMovie = async () => {
  let genreIds = [];
  try {
    genreIds = await getTopGenreIdsFromWatched();
  } catch {
    genreIds = [];
  }

  const filterHighRated = (movies = []) =>
    (movies || []).filter((m) => (m.vote_average ?? 0) >= 7);

  const tryFetch = async (ids) => {
    try {
      return await fetchRandomByGenresTMDB(ids);
    } catch {
      return [];
    }
  };

  let list = filterHighRated(await tryFetch(genreIds));

  if ((!list || list.length === 0) && genreIds.length) {
    list = filterHighRated(await tryFetch([]));
  }

  if (!list || list.length === 0) {
    try {
      list = filterHighRated(await fetchTrendingTMDB());
    } catch {
      list = [];
    }
  }

  if (!list || list.length === 0) {
    return null;
  }

  const chosen = list[Math.floor(Math.random() * list.length)];
  return chosen || null;
};

export const addWatched = async (movie, watchedAt = new Date(), mood = '', journalComment = '') => {
  if (!movie?.tmdb_id) {
    return;
  }
  const watchedDate = typeof watchedAt === 'string' ? watchedAt : watchedAt.toISOString();
  const genresText = Array.isArray(movie.genres) ? movie.genres.join(',') : movie.genres || '';
  const db = getDb();
  await db.runAsync(
    `INSERT INTO watched (
        tmdb_id, title, poster_url, overview, release_date, genres, mood, journal_comment, watched_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tmdb_id) DO UPDATE SET
        title=excluded.title,
        poster_url=excluded.poster_url,
        overview=excluded.overview,
        release_date=excluded.release_date,
        genres=excluded.genres,
        mood=excluded.mood,
        journal_comment=excluded.journal_comment,
        watched_at=excluded.watched_at`,
    [
      movie.tmdb_id,
      movie.title,
      movie.poster_url || '',
      movie.overview || '',
      movie.release_date || '',
      genresText,
      mood || '',
      journalComment?.slice(0, 140) || '',
      watchedDate,
    ],
  );
};

export const getWatched = async () => {
  const db = getDb();
  return db.getAllAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, genres, mood, journal_comment, watched_at
     FROM watched
     ORDER BY datetime(watched_at) DESC`,
  );
};

export const getWatchedById = async (tmdbId) => {
  if (!tmdbId) {
    return null;
  }
  const db = getDb();
  return db.getFirstAsync(
    `SELECT tmdb_id, title, poster_url, overview, release_date, genres, mood, journal_comment, watched_at
     FROM watched
     WHERE tmdb_id = ?`,
    [tmdbId],
  );
};

export const getStats = async () => {
  const db = getDb();
  const [favoritesCountRow] = await db.getAllAsync(
    `SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM favorites`,
  );
  const [watchedCountRow] = await db.getAllAsync(`SELECT COUNT(*) as total FROM watched`);
  const [topRatedRow] = await db.getAllAsync(
    `SELECT title, rating FROM favorites WHERE rating IS NOT NULL ORDER BY rating DESC LIMIT 1`,
  );

  const watchedList = await getWatched();
  const genreCount = {};
  const yearCount = {};

  watchedList.forEach((item) => {
    if (item.genres) {
      item.genres.split(',').forEach((genre) => {
        const key = genre.trim();
        if (key) {
          genreCount[key] = (genreCount[key] || 0) + 1;
        }
      });
    }
    if (item.release_date) {
      const year = item.release_date.slice(0, 4);
      if (year) {
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    }
  });

  const mostWatchedGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0] || null;
  const mostWatchedYear = Object.entries(yearCount).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    favoritesTotal: favoritesCountRow?.total || 0,
    avgRating: favoritesCountRow?.avg_rating || 0,
    watchedTotal: watchedCountRow?.total || 0,
    topRated: topRatedRow || null,
    mostWatchedGenre,
    mostWatchedYear,
  };
};

export const fetchWatchProviders = async (movieId) => {
  try {
    return await fetchWatchProvidersTMDB(movieId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Erro ao buscar provedores', error);
    return null;
  }
};

// Coleções populares; ids conferidos para evitar erros de fetch
const POPULAR_COLLECTION_IDS = [
  86311, // Avengers
  263, // Batman
  1241, // Harry Potter
  9485, // Fast & Furious
  10, // Star Wars
  556, // Spider-Man
  119, // The Lord of the Rings
  84, // Indiana Jones
  2344, // The Matrix
  404609, // John Wick
  8091, // Alien
  645, // James Bond
  328, // Jurassic Park
  295, // Pirates of the Caribbean
];

export const fetchPopularCollections = async () => {
  const results = [];
  for (const id of POPULAR_COLLECTION_IDS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const collection = await fetchCollectionTMDB(id);
      if (collection) {
        results.push(collection);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar coleção', id, error);
    }
  }
  return results;
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

  const extraVideos = Array.isArray(details.videos?.results)
    ? details.videos.results
        .filter(
          (video) =>
            video.site === 'YouTube' &&
            ['Teaser', 'Behind the Scenes', 'Interview', 'Featurette', 'Clip', 'Bloopers'].includes(video.type),
        )
        .map((video) => ({
          id: video.id,
          name: video.name,
          type: video.type,
          url: `https://www.youtube.com/watch?v=${video.key}`,
        }))
    : [];

  const cast = Array.isArray(details.credits?.cast)
    ? details.credits.cast.slice(0, 5).map((actor) => actor.name)
    : [];

  return {
    tmdb_id: details.id,
    title: details.title || details.original_title || 'Sem titulo',
    overview: details.overview || 'Sinopse nao disponivel.',
    release_date: details.release_date || '',
    poster_url: buildPosterUrl(details.poster_path),
    poster_path: details.poster_path || null,
    vote_average: details.vote_average ?? 0,
    runtime: details.runtime || null,
    genres: Array.isArray(details.genres) ? details.genres.map((genre) => genre.name) : [],
    extra_videos: extraVideos,
    cast,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    collection: details.belongs_to_collection
      ? {
          id: details.belongs_to_collection.id,
          name: details.belongs_to_collection.name,
        }
      : null,
  };
};
