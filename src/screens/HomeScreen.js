import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MovieCard from '../components/MovieCard';
import { addFavorite, addToWatchlist, searchMovies } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import StarRating from '../components/StarRating';
import MovieDetailModal from './MovieDetailModal';

const sourceLabelMap = {
  tmdb: 'Fonte: TMDB (online)',
  cache: 'Fonte: SQLite (offline/cache)',
};

const HomeScreen = ({ onFavoriteAdded, onWatchlistUpdated }) => {
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
      const response = await searchMovies(trimmed);
      if (requestIdRef.current === requestId) {
        setAllMovies(response.results);
        setSource(response.source);
      }
    } catch (error) {
      if (!options?.silentErrors) {
        Alert.alert('Ops!', error.message || 'Não foi possível buscar filmes e não há dados em cache.');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const handleFavorite = async (movie) => {
    setMovieToRate(movie);
    setSelectedRating(3);
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
      await addFavorite(movieToRate, selectedRating);
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
      handleSearch(text, { silentEmptyAlert: true, silentErrors: true });
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
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {source ? <Text style={styles.sourceText}>{sourceLabelMap[source]}</Text> : null}

      <View style={styles.filterTriggerRow}>
        <TouchableOpacity style={styles.filterToggle} onPress={openFilters}>
          <Text style={styles.filterToggleText}>Filtros e ordenação</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loaderText}>Carregando...</Text>
        </View>
      ) : (
        <FlatList
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Digite o título de um filme e toque em buscar para ver os resultados.
            </Text>
          }
          contentContainerStyle={movies.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
        />
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
    },
    searchButtonText: {
      color: colors.onPrimary,
      fontFamily: fonts.medium,
    },
    sourceText: {
      color: colors.muted,
      fontFamily: fonts.regular,
      marginBottom: spacing.sm,
    },
    filterTriggerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: spacing.sm,
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
