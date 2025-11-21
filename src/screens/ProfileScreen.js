import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { getStats } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';

const Stat = ({ label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const ProfileScreen = ({ isActive }) => {
  const { colors } = useTheme();
  const themed = useMemo(() => createStyles(colors), [colors]);
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
      style={themed.container}
      contentContainerStyle={themed.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={themed.header}>
        <View style={themed.avatarWrapper}>
          <Image source={{ uri: 'https://ui-avatars.com/api/?name=Movi+User' }} style={themed.avatar} />
        </View>
        <View>
          <Text style={themed.name}>Você</Text>
          <Text style={themed.subtitle}>Cinéfilo em evolução</Text>
        </View>
      </View>

      <Text style={themed.sectionTitle}>Estatísticas</Text>
      {loading ? (
        <View style={themed.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={themed.loaderText}>Carregando...</Text>
        </View>
      ) : (
        <View style={themed.statsGrid}>
          <Stat label="Favoritos" value={stats?.favoritesTotal ?? 0} />
          <Stat label="Assistidos" value={stats?.watchedTotal ?? 0} />
          <Stat label="Nota média" value={stats?.avgRating ? stats.avgRating.toFixed(2) : '0.00'} />
          <Stat label="Filme mais avaliado" value={topRatedTitle} />
          <Stat label="Gênero mais assistido" value={mostGenre} />
          <Stat label="Ano mais assistido" value={mostYear} />
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    avatarWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    name: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 18,
    },
    subtitle: {
      color: colors.muted,
      fontFamily: fonts.regular,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 18,
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    statCard: {
      width: '47%',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    statLabel: {
      fontFamily: fonts.medium,
      fontSize: 12,
      marginBottom: spacing.xs,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 16,
      lineHeight: 20,
      color: colors.text,
    },
  });

const styles = StyleSheet.create({});

export default ProfileScreen;
