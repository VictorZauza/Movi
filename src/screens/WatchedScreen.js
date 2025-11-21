import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import MovieCard from '../components/MovieCard';
import { getWatched } from '../models/movieRepository';
import { useTheme, spacing, fonts } from '../styles/theme';
import MovieDetailModal from './MovieDetailModal';

const WatchedScreen = ({ isActive, refreshKey, compact = false, hideHeading = false }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadWatched = useCallback(async () => {
    try {
      const list = await getWatched();
      setWatched(list);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar assistidos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setLoading(true);
      loadWatched();
    }
  }, [isActive, refreshKey, loadWatched]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWatched();
    setRefreshing(false);
  };

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

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!hideHeading ? <Text style={styles.heading}>Assistidos</Text> : null}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Carregando assistidos...</Text>
        </View>
      ) : (
        <FlatList
          data={watched}
          keyExtractor={(item) => String(item.tmdb_id)}
          renderItem={({ item }) => <MovieCard movie={item} onPress={() => openDetail(item)} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum filme marcado como assistido.</Text>}
          contentContainerStyle={[
            watched.length === 0 ? styles.emptyContainer : styles.listContent,
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

export default WatchedScreen;

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
    loader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    loadingText: {
      color: colors.muted,
      fontFamily: fonts.regular,
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
    listContent: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
    },
    listPadding: {
      paddingBottom: spacing.lg,
    },
  });
