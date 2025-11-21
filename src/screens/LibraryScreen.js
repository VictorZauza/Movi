import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from './MovieDetailModal';
import { getFavorites, getWatchlist, getWatched, removeFromWatchlist } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';

const tabs = [
  { key: 'watchlist', label: 'Quero ver' },
  { key: 'watched', label: 'Assistidos' },
  { key: 'favorites', label: 'Favoritos' },
];

const LibraryScreen = ({ favoritesRefreshKey, watchlistRefreshKey, isActive = true }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('watchlist');
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [wList, watchedList, favs] = await Promise.all([getWatchlist(), getWatched(), getFavorites()]);
      setWatchlist(Array.isArray(wList) ? wList : []);
      setWatched(Array.isArray(watchedList) ? watchedList : []);
      setFavorites(Array.isArray(favs) ? favs : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    loadLists();
  }, [isActive, favoritesRefreshKey, watchlistRefreshKey, loadLists]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLists();
    setRefreshing(false);
  };

  const handleRemoveFromWatchlist = async (movie) => {
    try {
      await removeFromWatchlist(movie.tmdb_id);
      loadLists();
    } catch {
      // noop
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

  const renderList = () => {
    const dataMap = {
      watchlist,
      watched,
      favorites,
    };

    const data = dataMap[activeTab] || [];

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.tmdb_id)}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() => openDetail(item)}
            onWatchlistRemove={activeTab === 'watchlist' ? handleRemoveFromWatchlist : undefined}
          />
        )}
        contentContainerStyle={data.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Nenhum filme aqui ainda.</Text> : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderBody = () => {
    if (loading && (activeTab === 'watchlist' || activeTab === 'watched' || activeTab === 'favorites')) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      );
    }

    return renderList();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Minha lista</Text>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>{renderBody()}</View>

      <MovieDetailModal
        visible={detailVisible}
        movieId={selectedMovie?.tmdb_id}
        onClose={closeDetail}
        onSelectMovie={(movie) => {
          if (movie) {
            setSelectedMovie(movie);
            setDetailVisible(true);
          }
        }}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    tabsRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    tabButton: {
      height: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
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
    content: {
      flex: 1,
    },
    loader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    loadingText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    emptyText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    listContent: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
  });

export default LibraryScreen;
