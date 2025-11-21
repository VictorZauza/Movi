import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MovieCard from '../components/MovieCard';
import { fetchMovieCategory, fetchPopularCollections } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import MovieDetailModal from './MovieDetailModal';

const categories = [
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'popular', label: 'Populares' },
  { key: 'now_playing', label: 'Em cartaz' },
  { key: 'upcoming', label: 'Em breve' },
  { key: 'collections', label: 'Coleções' },
];

const TopMoviesScreen = ({ isActive }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeCategory, setActiveCategory] = useState('top_rated');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchMovieCategory(activeCategory)
      .then((list) => {
        if (mounted) {
          setMovies(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('N�o foi poss�vel carregar a lista.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [activeCategory]);

  useEffect(() => {
    let mounted = true;
    setCollectionsLoading(true);
    fetchPopularCollections()
      .then((list) => {
        if (mounted) {
          setCollections(list || []);
        }
      })
      .finally(() => {
        if (mounted) {
          setCollectionsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openDetail = (movie) => {
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setSelectedMovie(null);
    setDetailVisible(false);
  };

  const handleSelectFromModal = (movie) => {
    if (!movie) {
      return;
    }
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeCategory === 'collections') {
        const col = await fetchPopularCollections();
        setCollections(col || []);
      } else {
        const list = await fetchMovieCategory(activeCategory);
        setMovies(list || []);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Em alta</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {categories.map((category) => {
          const active = activeCategory === category.key;
          return (
            <TouchableOpacity
              key={category.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveCategory(category.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{category.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeCategory === 'collections' ? (
        <View style={styles.collectionsWrapper}>
          {collectionsLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loaderText}>Carregando coleções...</Text>
            </View>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.collectionCard}
                  onPress={() => {
                    if (item.parts?.[0]) {
                      openDetail(item.parts[0]);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  {item.backdrop_url ? (
                    <Image source={{ uri: item.backdrop_url }} style={styles.collectionImage} />
                  ) : (
                    <View style={[styles.collectionImage, styles.collectionPlaceholder]}>
                      <Text style={styles.collectionPlaceholderText}>Sem imagem</Text>
                    </View>
                  )}
                  <View style={styles.collectionInfo}>
                    <Text style={styles.collectionName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.collectionCount}>
                      {item.parts?.length ? `${item.parts.length} filmes` : 'Sem contagem'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma coleção encontrada.</Text>}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshing={collectionsLoading || refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </View>
      ) : loading && movies.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loaderText}>Carregando...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {loading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loaderText}>Atualizando lista...</Text>
            </View>
          ) : null}
          <FlatList
            data={movies}
            keyExtractor={(item) => String(item.tmdb_id)}
            renderItem={({ item }) => (
              <MovieCard movie={item} onPress={() => openDetail(item)} />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum filme encontrado.</Text>}
            contentContainerStyle={movies.length === 0 ? styles.emptyContainer : styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </>
      )}

      <MovieDetailModal
        visible={detailVisible}
        movieId={selectedMovie?.tmdb_id}
        onClose={closeDetail}
        onSelectMovie={handleSelectFromModal}
      />
    </View>
  );
};

export default TopMoviesScreen;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    tabsRow: {
      paddingBottom: spacing.sm,
      marginBottom: spacing.xs,
    },
    tabButton: {
      height: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    tabTextActive: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
    },
    loader: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    inlineLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    loaderText: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginLeft: spacing.xs,
      marginTop: spacing.xs,
    },
    errorText: {
      color: colors.error,
      fontFamily: fonts.medium,
    },
    listContent: {
      paddingBottom: spacing.md,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    collectionCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      alignItems: 'center',
    },
    collectionImage: {
      width: 110,
      height: 70,
      borderRadius: radius.sm,
      backgroundColor: colors.border,
      marginRight: spacing.sm,
    },
    collectionPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionPlaceholderText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    collectionName: {
      color: colors.text,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    collectionCount: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    collectionInfo: {
      flex: 1,
    },
  });
