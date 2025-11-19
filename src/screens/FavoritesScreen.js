import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MovieCard from '../components/MovieCard';
import { getFavorites } from '../models/movieRepository';
import { useTheme, spacing, fonts } from '../styles/theme';

const FavoritesScreen = ({ refreshKey, isActive }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Favoritos</Text>
      {loading ? (
        <Text style={styles.loadingText}>Carregando favoritos...</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.tmdb_id)}
          renderItem={({ item }) => <MovieCard movie={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum favorito ainda.</Text>}
          contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default FavoritesScreen;

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
