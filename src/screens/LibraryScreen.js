import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FavoritesScreen from './FavoritesScreen';
import WatchlistScreen from './WatchlistScreen';
import WatchedScreen from './WatchedScreen';
import MovieDetailModal from './MovieDetailModal';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import { fetchPopularCollections } from '../models/movieRepository';

const tabs = [
  { key: 'watchlist', label: 'Quero ver' },
  { key: 'watched', label: 'Assistidos' },
  { key: 'favorites', label: 'Favoritos' },
  { key: 'collections', label: 'Coleções' },
];

const LibraryScreen = ({ favoritesRefreshKey, watchlistRefreshKey }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [section, setSection] = useState('watchlist');
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const list = await fetchPopularCollections();
      setCollections(list || []);
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadCollections().catch(() => {});

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Minha lista</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((tab) => {
          const active = tab.key === section;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setSection(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.content}>
        {section === 'watchlist' ? (
          <WatchlistScreen isActive refreshKey={watchlistRefreshKey} compact hideHeading />
        ) : section === 'watched' ? (
          <WatchedScreen isActive refreshKey={watchlistRefreshKey} compact hideHeading />
        ) : section === 'favorites' ? (
          <FavoritesScreen isActive refreshKey={favoritesRefreshKey} compact hideHeading />
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
            ListEmptyComponent={
              collectionsLoading ? (
                <View style={styles.loader}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando coleções...</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>Nenhuma coleção encontrada.</Text>
              )
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={collectionsLoading}
            onRefresh={loadCollections}
          />
        )}
      </View>

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
      paddingTop: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    tabRow: {
      paddingBottom: spacing.xs,
      marginBottom: 0,
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
    content: {
      flex: 1,
      marginTop: 0,
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
      fontSize: 12,
    },
    collectionInfo: {
      flex: 1,
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
    loader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    loadingText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    emptyText: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    listContent: {
      paddingBottom: spacing.md,
    },
  });

export default LibraryScreen;
