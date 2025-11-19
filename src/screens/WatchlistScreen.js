import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import MovieCard from '../components/MovieCard';
import { getWatchlist, removeFromWatchlist } from '../models/movieRepository';
import { useTheme, spacing, fonts } from '../styles/theme';

const WatchlistScreen = ({ refreshKey, isActive }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWatchlist = useCallback(async () => {
    try {
      const list = await getWatchlist();
      setWatchlist(list);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar Quero ver', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setLoading(true);
      loadWatchlist();
    }
  }, [isActive, refreshKey, loadWatchlist]);

  const handleRemove = async (movie) => {
    try {
      await removeFromWatchlist(movie.tmdb_id);
      loadWatchlist();
    } catch (error) {
      Alert.alert('Ops!', 'Não foi possível remover da lista.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quero ver</Text>
      {loading ? (
        <Text style={styles.loadingText}>Carregando sua lista...</Text>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => String(item.tmdb_id)}
          renderItem={({ item }) => (
            <MovieCard movie={item} onWatchlistRemove={handleRemove} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum filme na lista.</Text>}
          contentContainerStyle={watchlist.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default WatchlistScreen;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
      marginBottom: spacing.md,
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
  });
