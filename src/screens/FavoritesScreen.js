import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Image } from 'react-native';
import MovieCard from '../components/MovieCard';
import { getFavorites } from '../models/movieRepository';
import { useTheme, spacing, fonts, radius } from '../styles/theme';
import MovieDetailModal from './MovieDetailModal';

const FavoritesScreen = ({
  refreshKey,
  isActive,
  compact = false,
  hideHeading = false,
  layoutMode = 'list',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const list = await getFavorites();
      setFavorites(list);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar favoritos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setLoading(true);
      loadFavorites();
    }
  }, [isActive, refreshKey, loadFavorites]);

  const openDetail = (movie) => {
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setSelectedMovie(null);
    setDetailVisible(false);
  };

  const handleSelectFromModal = (movie) => {
    if (!movie) return;
    setSelectedMovie(movie);
    setDetailVisible(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!hideHeading ? <Text style={styles.heading}>Favoritos</Text> : null}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Carregando favoritos...</Text>
        </View>
      ) : (
        <FlatList
          key={layoutMode === 'grid' ? 'grid' : 'list'}
          numColumns={layoutMode === 'grid' ? 3 : 1}
          columnWrapperStyle={layoutMode === 'grid' ? styles.columnWrapper : undefined}
          data={favorites}
          keyExtractor={(item) => String(item.tmdb_id)}
          renderItem={({ item }) =>
            layoutMode === 'grid' ? (
              <View style={styles.posterCard}>
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.posterThumb} />
                ) : (
                  <View style={[styles.posterThumb, styles.posterPlaceholder]}>
                    <Text style={styles.posterPlaceholderText}>Sem imagem</Text>
                  </View>
                )}
                <Text style={styles.posterLabel} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            ) : (
              <MovieCard movie={item} onPress={() => openDetail(item)} />
            )
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum favorito ainda.</Text>}
          contentContainerStyle={[
            favorites.length === 0 ? styles.emptyContainer : styles.listContent,
            styles.listPadding,
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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

export default FavoritesScreen;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: 0,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
    },
    compactContainer: {
      paddingHorizontal: 0,
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
    },
    heading: {
      color: colors.text,
      fontSize: 20,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    listContent: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
    },
    listPadding: {
      paddingBottom: spacing.lg,
    },
    loadingText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    loader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.xs,
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
    columnWrapper: {
      justifyContent: 'flex-start',
      paddingHorizontal: spacing.sm,
    },
    posterCard: {
      width: '30%',
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    posterThumb: {
      width: '100%',
      aspectRatio: 2 / 3,
      borderRadius: radius.sm,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    posterPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    posterPlaceholderText: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
      textAlign: 'center',
    },
    posterLabel: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
  });
