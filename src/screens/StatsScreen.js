import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStats } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';

const StatCard = ({ label, value, accent, styles, colors }) => {
  return (
    <View
      style={[
        styles.card,
        { borderColor: accent || colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.cardLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const StatsScreen = ({ isActive }) => {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao carregar estatisticas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadStats();
    }
  }, [isActive]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const mostGenre =
    stats?.mostWatchedGenre && stats.mostWatchedGenre[0]
      ? `${stats.mostWatchedGenre[0]} (${stats.mostWatchedGenre[1]})`
      : 'N/A';
  const mostYear =
    stats?.mostWatchedYear && stats.mostWatchedYear[0]
      ? `${stats.mostWatchedYear[0]} (${stats.mostWatchedYear[1]})`
      : 'N/A';
  const topRatedTitle = stats?.topRated?.title ? `${stats.topRated.title} (${stats.topRated.rating || 0}/5)` : 'N/A';

  return (
    <ScrollView
      style={themedStyles.container}
      contentContainerStyle={themedStyles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={themedStyles.heading}>Estatísticas</Text>
      {loading ? (
        <View style={themedStyles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={themedStyles.loaderText}>Carregando...</Text>
        </View>
      ) : (
        <View style={themedStyles.grid}>
          <StatCard label="Favoritos" value={stats?.favoritesTotal ?? 0} styles={themedStyles} colors={colors} />
          <StatCard label="Assistidos" value={stats?.watchedTotal ?? 0} styles={themedStyles} colors={colors} />
          <StatCard
            label="Nota média"
            value={stats?.avgRating ? stats.avgRating.toFixed(2) : '0.00'}
            accent={colors.primary}
            styles={themedStyles}
            colors={colors}
          />
          <StatCard label="Filme mais avaliado" value={topRatedTitle} styles={themedStyles} colors={colors} />
          <StatCard label="Gênero mais assistido" value={mostGenre} styles={themedStyles} colors={colors} />
          <StatCard label="Ano mais assistido" value={mostYear} styles={themedStyles} colors={colors} />
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    heading: {
      color: colors.text,
      fontSize: 22,
      fontFamily: fonts.bold,
    },
    loader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    loaderText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    card: {
      width: '47%',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    cardLabel: {
      fontFamily: fonts.medium,
      fontSize: 12,
      marginBottom: spacing.xs,
    },
    cardValue: {
      fontFamily: fonts.bold,
      fontSize: 16,
      lineHeight: 20,
    },
  });

export default StatsScreen;
