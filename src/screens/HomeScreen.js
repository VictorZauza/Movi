import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MovieCard from '../components/MovieCard';
import {
  addFavorite,
  addToWatchlist,
  fetchPopularBR,
  fetchRecommendationsFromFavorites,
  fetchTrendingWeek,
  fetchRandomSurpriseMovie,
  clearRecentlyViewed,
  clearSearchHistory,
  getFavorites,
  getRecentlyViewed,
  getSearchHistory,
  searchMovies,
} from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import StarRating from '../components/StarRating';
import MovieDetailModal from './MovieDetailModal';

const sourceLabelMap = {
  tmdb: { title: 'Dados carregados da internet (TMDB)', icon: '☁️', type: 'online' },
  cache: { title: 'Dados carregados do cache (offline)', icon: '☁️✖', type: 'offline' },
};

const HomeScreen = ({ onFavoriteAdded, onWatchlistUpdated, isActive }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [movieToRate, setMovieToRate] = useState(null);
  const [selectedRating, setSelectedRating] = useState(3);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [onlyPoster, setOnlyPoster] = useState(false);
  const [onlyOverview, setOnlyOverview] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const requestIdRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const skeletonPulse = useRef(new Animated.Value(0)).current;
  const skeletonItems = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionData, setSectionData] = useState({
    trending: [],
    popularBR: [],
    recommended: [],
  });
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(Array.isArray(history) ? history.map((item) => item.term) : []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar historico de busca', error);
    }
  }, []);

  const loadRecentlyViewed = useCallback(async () => {
    try {
      const list = await getRecentlyViewed();
      setRecentlyViewed(Array.isArray(list) ? list : []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar filmes vistos', error);
    }
  }, []);

  useEffect(() => {
    loadSearchHistory();
    loadRecentlyViewed();
  }, [loadSearchHistory, loadRecentlyViewed]);

  useEffect(() => {
    const loadSections = async () => {
      setSectionsLoading(true);
      try {
        const [trending, popularBR, favorites] = await Promise.all([
          fetchTrendingWeek(),
          fetchPopularBR(),
          getFavorites(),
        ]);
        const recommended = await fetchRecommendationsFromFavorites(favorites || []);
        setSectionData({
          trending: trending || [],
          popularBR: popularBR || [],
          recommended: recommended || [],
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Erro ao carregar secoes dinamicas', error);
      } finally {
        setSectionsLoading(false);
      }
    };
    loadSections();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(skeletonPulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [skeletonPulse]);

  useEffect(() => {
    if (isActive && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [isActive]);

  const handleSurprise = async () => {
    setSurpriseLoading(true);
    try {
      const movie = await fetchRandomSurpriseMovie();
      if (movie) {
        setSelectedMovie(movie);
        setDetailVisible(true);
      } else {
        Alert.alert('Ops!', 'N�o achamos uma sugest�o agora. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Ops!', 'N�o foi poss�vel buscar uma sugest�o agora.');
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleSearch = async (text = query, options = {}) => {
    const trimmed = text.trim();

    if (!trimmed) {
      if (!options?.silentEmptyAlert) {
        Alert.alert('Atenção', 'Digite o nome de um filme para buscar.');
      }
      setAllMovies([]);
      setMovies([]);
      setSource(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const response = await searchMovies(trimmed, { skipHistory: options.skipHistory });
      if (requestIdRef.current === requestId) {
        setAllMovies(response.results);
        setSource(response.source);
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 0);
      }
    } catch (error) {
      if (!options?.silentErrors) {
        Alert.alert('Ops!', error.message || 'Não foi possível buscar filmes e não há dados em cache.');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        if (options?.skipHistory !== true) {
          loadSearchHistory();
        }
      }
    }
  };

  const handleFavorite = async (movie) => {
    setMovieToRate(movie);
    setSelectedRating(3);
    setComment('');
    setRatingModalVisible(true);
  };

  const closeRatingModal = () => {
    setRatingModalVisible(false);
    setMovieToRate(null);
  };

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const confirmFavorite = async () => {
    if (!movieToRate || !selectedRating) {
      return;
    }

    try {
      await addFavorite(movieToRate, selectedRating, comment);
      setFeedback({ type: 'success', message: 'Filme adicionado aos favoritos!' });
      onFavoriteAdded?.();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Não foi possível adicionar aos favoritos.' });
    } finally {
      closeRatingModal();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const applyFilters = useCallback(
    (dataSource = allMovies) => {
      if (!dataSource || dataSource.length === 0) {
        setMovies([]);
        return;
      }

      let filtered = [...dataSource];

      if (filterYear.trim()) {
        filtered = filtered.filter((movie) =>
          movie.release_date?.startsWith(filterYear.trim()),
        );
      }

      if (filterLanguage.trim()) {
        const lang = filterLanguage.trim().toLowerCase();
        filtered = filtered.filter((movie) => movie.language?.toLowerCase() === lang);
      }

      const ratingNumber = parseFloat(filterRating);
      if (!Number.isNaN(ratingNumber)) {
        filtered = filtered.filter((movie) => (movie.vote_average ?? 0) >= ratingNumber);
      }

      if (onlyPoster) {
        filtered = filtered.filter((movie) => !!movie.poster_url);
      }

      if (onlyOverview) {
        filtered = filtered.filter(
          (movie) => typeof movie.overview === 'string' && movie.overview.trim().length > 0,
        );
      }

      filtered.sort((a, b) => {
        if (sortField === 'rating') {
          const valueA = a.vote_average ?? 0;
          const valueB = b.vote_average ?? 0;
          return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        }

        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      });

      setMovies(filtered);
    },
    [
      allMovies,
      filterYear,
      filterLanguage,
      filterRating,
      onlyPoster,
      onlyOverview,
      sortField,
      sortDirection,
    ],
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleSortField = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'rating' ? 'desc' : 'desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return '';
    }
    return sortDirection === 'desc' ? ' ↓' : ' ↑';
  };

  const handleQueryChange = (text) => {
    setQuery(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!text.trim()) {
      setAllMovies([]);
      setMovies([]);
      setSource(null);
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleSearch(text, { silentEmptyAlert: true, silentErrors: true, skipHistory: true });
    }, 300);
  };

  const openFilters = () => setFiltersVisible(true);
  const closeFilters = () => setFiltersVisible(false);

  const clearFilters = () => {
    setFilterYear('');
    setFilterLanguage('');
    setFilterRating('');
    setOnlyPoster(false);
    setOnlyOverview(false);
    setSortField('date');
    setSortDirection('desc');
  };

  const handleAddToWatchlist = async (movie) => {
    try {
      await addToWatchlist(movie);
      setFeedback({ type: 'success', message: 'Adicionado à lista Quero ver!' });
      onWatchlistUpdated?.();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Não foi possível adicionar ao Quero ver.' });
    }
  };

  const openDetail = (movie) => {
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setSelectedMovie(null);
    setDetailVisible(false);
  };

  const handleRefresh = async () => {
    if (!query.trim()) {
      return;
    }
    setRefreshing(true);
    try {
      await handleSearch(query, { silentEmptyAlert: true, silentErrors: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleHistorySelect = (term) => {
    setQuery(term);
    handleSearch(term, { silentEmptyAlert: true, silentErrors: true });
  };

  const handleClearHistory = async () => {
    try {
      await clearSearchHistory();
      setSearchHistory([]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao limpar historico de busca', error);
    }
  };

  const handleClearViewed = async () => {
    try {
      await clearRecentlyViewed();
      setRecentlyViewed([]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao limpar filmes vistos', error);
    }
  };

  const handleViewedMovie = () => {
    loadRecentlyViewed();
  };

  const handleSelectFromModal = (movie) => {
    if (!movie) {
      return;
    }
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Buscar filmes</Text>
      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Digite o título do filme..."
          placeholderTextColor={colors.muted}
          value={query}
      onChangeText={handleQueryChange}
      onSubmitEditing={handleSearch}
      returnKeyType="search"
    />

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={18} color={colors.onPrimary} />
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {searchHistory.length ? (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Buscas recentes</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.sectionAction}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsRow}>
            {searchHistory.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.chip}
                onPress={() => handleHistorySelect(term)}
              >
                <Text style={styles.chipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {source && sourceLabelMap[source] ? (
        <View
          style={[
            styles.sourceBadge,
            sourceLabelMap[source].type === 'offline' && styles.sourceBadgeOffline,
          ]}
        >
          <Text
            style={[
              styles.sourceBadgeText,
              sourceLabelMap[source].type === 'offline' && styles.sourceBadgeTextOffline,
            ]}
          >
            {`${sourceLabelMap[source].icon} ${sourceLabelMap[source].title}`}
          </Text>
        </View>
      ) : null}

      <View style={styles.filterTriggerRow}>
        <TouchableOpacity style={styles.filterToggle} onPress={openFilters}>
          <Text style={styles.filterToggleText}>Filtros e ordenação</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.surpriseButton, surpriseLoading && styles.surpriseButtonDisabled]}
          onPress={handleSurprise}
          disabled={surpriseLoading}
        >
          <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
          <Text style={styles.surpriseText}>{surpriseLoading ? 'Buscando...' : 'Me surpreenda'}</Text>
        </TouchableOpacity>
      </View>

      {!query.trim() ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dynamicContent}>
          {recentlyViewed.length ? (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vistos recentemente</Text>
                <TouchableOpacity onPress={handleClearViewed}>
                  <Text style={styles.sectionAction}>Limpar</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentlyViewed}
                keyExtractor={(item) => String(item.tmdb_id)}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.recentCard} onPress={() => openDetail(item)}>
                    {item.poster_url ? (
                      <Image source={{ uri: item.poster_url }} style={styles.recentPoster} />
                    ) : (
                      <View style={[styles.recentPoster, styles.recentPosterPlaceholder]}>
                        <Text style={styles.recentPosterText}>Sem imagem</Text>
                      </View>
                    )}
                    <Text style={styles.recentTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.release_date ? (
                      <Text style={styles.recentMeta}>{item.release_date.slice(0, 4)}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentListContent}
              />
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filmes populares essa semana</Text>
          </View>
          <FlatList
            data={sectionData.trending}
            horizontal
            keyExtractor={(item) => String(item.tmdb_id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.recentCard} onPress={() => openDetail(item)}>
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.recentPoster} />
                ) : (
                  <View style={[styles.recentPoster, styles.recentPosterPlaceholder]}>
                    <Text style={styles.recentPosterText}>Sem imagem</Text>
                  </View>
                )}
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.release_date ? (
                  <Text style={styles.recentMeta}>{item.release_date.slice(0, 4)}</Text>
                ) : null}
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentListContent}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Em alta no Brasil</Text>
          </View>
          <FlatList
            data={sectionData.popularBR}
            horizontal
            keyExtractor={(item) => String(item.tmdb_id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.recentCard} onPress={() => openDetail(item)}>
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.recentPoster} />
                ) : (
                  <View style={[styles.recentPoster, styles.recentPosterPlaceholder]}>
                    <Text style={styles.recentPosterText}>Sem imagem</Text>
                  </View>
                )}
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.release_date ? (
                  <Text style={styles.recentMeta}>{item.release_date.slice(0, 4)}</Text>
                ) : null}
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentListContent}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Baseado nos seus favoritos</Text>
          </View>
          <FlatList
            data={sectionData.recommended}
            horizontal
            keyExtractor={(item) => String(item.tmdb_id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.recentCard} onPress={() => openDetail(item)}>
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.recentPoster} />
                ) : (
                  <View style={[styles.recentPoster, styles.recentPosterPlaceholder]}>
                    <Text style={styles.recentPosterText}>Sem imagem</Text>
                  </View>
                )}
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.release_date ? (
                  <Text style={styles.recentMeta}>{item.release_date.slice(0, 4)}</Text>
                ) : null}
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentListContent}
          />
        </ScrollView>
      ) : null}

      {/* movie list */}
      {loading && movies.length === 0 ? (
        <View>
          {skeletonItems.map((index) => (
            <Animated.View
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              style={[styles.skeletonCard, { opacity: skeletonPulse }]}
            >
              <View style={styles.skeletonPoster} />
              <View style={styles.skeletonTextBlock}>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLine} />
              </View>
            </Animated.View>
          ))}
        </View>
      ) : (
        <>
          {loading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loaderText}>Atualizando...</Text>
            </View>
          ) : null}
          <FlatList
            ref={flatListRef}
            data={movies}
            keyExtractor={(item) => String(item.tmdb_id)}
            renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onFavorite={handleFavorite}
            onWatchlistAdd={handleAddToWatchlist}
            onPress={() => openDetail(item)}
          />
        )}
        ListEmptyComponent={null}
        contentContainerStyle={movies.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
        </>
      )}

      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRatingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avalie este filme</Text>
            <Text style={styles.modalMovieTitle}>{movieToRate?.title}</Text>

            <StarRating rating={selectedRating} size={36} editable onRate={setSelectedRating} />
            <Text style={styles.modalHint}>Selecione quantas estrelas esse filme merece.</Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Deixe um coment\u00e1rio (at\u00e9 140 caracteres)"
              placeholderTextColor={colors.muted}
              value={comment}
              onChangeText={(text) => setComment(text.slice(0, 140))}
              maxLength={140}
              multiline
            />
            <Text style={styles.commentCounter}>{`${comment.length}/140`}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closeRatingModal}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={confirmFavorite}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={filtersVisible} transparent animationType="slide" onRequestClose={closeFilters}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterCard}>
            <Text style={styles.modalTitle}>Filtros e ordenação</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.filterInput}
                placeholder="Ano (ex: 2020)"
                placeholderTextColor={colors.muted}
                value={filterYear}
                onChangeText={setFilterYear}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Idioma (ex: en)"
                placeholderTextColor={colors.muted}
                value={filterLanguage}
                onChangeText={setFilterLanguage}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Nota mínima"
                placeholderTextColor={colors.muted}
                value={filterRating}
                onChangeText={setFilterRating}
                keyboardType="numeric"
              />

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleButton, onlyPoster && styles.toggleButtonActive]}
                  onPress={() => setOnlyPoster((prev) => !prev)}
                >
                  <Text style={[styles.toggleText, onlyPoster && styles.toggleTextActive]}>
                    Com pôster
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, onlyOverview && styles.toggleButtonActive]}
                  onPress={() => setOnlyOverview((prev) => !prev)}
                >
                  <Text style={[styles.toggleText, onlyOverview && styles.toggleTextActive]}>
                    Com sinopse
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Ordenar por:</Text>
                <TouchableOpacity style={styles.sortButton} onPress={() => toggleSortField('date')}>
                  <Text style={styles.sortText}>
                    Ano
                    {renderSortIndicator('date')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sortButton} onPress={() => toggleSortField('rating')}>
                  <Text style={styles.sortText}>
                    Nota
                    {renderSortIndicator('rating')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterActionButton} onPress={clearFilters}>
                <Text style={styles.filterActionText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterActionPrimary} onPress={closeFilters}>
                <Text style={styles.filterActionPrimaryText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MovieDetailModal
        visible={detailVisible}
        movieId={selectedMovie?.tmdb_id}
        onClose={closeDetail}
        onViewed={handleViewedMovie}
        onSelectMovie={handleSelectFromModal}
      />
    </View>
  );
};

export default HomeScreen;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    feedback: {
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
    },
    feedbackSuccess: {
      backgroundColor: colors.success,
    },
    feedbackError: {
      backgroundColor: colors.error,
    },
    feedbackText: {
      color: colors.onPrimary,
      fontFamily: fonts.medium,
      textAlign: 'center',
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
      marginBottom: spacing.md,
    },
    searchRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontFamily: fonts.regular,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchButtonText: {
      color: colors.onPrimary,
      fontFamily: fonts.medium,
      marginLeft: spacing.xs,
    },
    historySection: {
      marginBottom: spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
    },
    sectionAction: {
      color: colors.muted,
      fontFamily: fonts.medium,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    chipText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    sourceBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    sourceBadgeOffline: {
      borderColor: colors.error,
      backgroundColor: colors.isDark ? '#2a1a1a' : '#ffecec',
    },
    sourceBadgeText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    sourceBadgeTextOffline: {
      color: colors.error,
    },
    filterTriggerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    filterToggle: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterToggleText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    surpriseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    surpriseButtonDisabled: {
      opacity: 0.7,
    },
    surpriseText: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
      marginLeft: spacing.xs,
    },
    dynamicContent: {
      paddingBottom: spacing.md,
    },
    recentSection: {
      marginBottom: spacing.md,
    },
    recentListContent: {
      paddingVertical: spacing.xs,
      paddingRight: spacing.sm,
    },
    recentCard: {
      width: 120,
      marginRight: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    recentPoster: {
      width: '100%',
      height: 150,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
      backgroundColor: colors.border,
    },
    recentPosterPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentPosterText: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
      textAlign: 'center',
    },
    recentTitle: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
    },
    recentMeta: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    inlineLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginTop: spacing.sm,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyText: {
      color: colors.muted,
      fontFamily: fonts.regular,
      textAlign: 'center',
    },
    skeletonCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skeletonPoster: {
      width: 90,
      height: 135,
      borderRadius: radius.sm,
      backgroundColor: colors.border,
    },
    skeletonTextBlock: {
      flex: 1,
      marginLeft: spacing.md,
      justifyContent: 'space-between',
    },
    skeletonLine: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      marginBottom: spacing.xs,
    },
    skeletonLineShort: {
      width: '60%',
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      marginBottom: spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    modalMovieTitle: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginBottom: spacing.md,
    },
    commentInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text,
      fontFamily: fonts.regular,
      minHeight: 60,
    },
    commentCounter: {
      alignSelf: 'flex-end',
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    modalHint: {
      color: colors.muted,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      fontSize: 12,
      fontFamily: fonts.regular,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    modalCancel: {
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
    },
    modalConfirm: {
      backgroundColor: colors.primary,
      marginLeft: spacing.sm,
    },
    modalButtonText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    modalConfirmText: {
      color: colors.onPrimary,
    },
    filterCard: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    toggleRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    toggleTextActive: {
      color: colors.onPrimary,
    },
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sortLabel: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginRight: spacing.sm,
    },
    sortButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    sortText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    filterActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.sm,
    },
    filterActionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    filterActionText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    filterActionPrimary: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
    },
    filterActionPrimaryText: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
    },
  });


