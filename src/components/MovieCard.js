import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import { convertVoteAverageToStars } from '../utils/ratings';
import StarRating from './StarRating';

const MovieCard = ({ movie, onFavorite, onWatchlistAdd, onWatchlistRemove, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imageLoaded, setImageLoaded] = useState(!movie?.poster_url);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePress = () => {
    if (onPress) {
      onPress(movie);
    }
  };

  const handleFavoritePress = () => {
    if (onFavorite) {
      onFavorite(movie);
    }
  };

  const handleWatchlistAdd = () => {
    onWatchlistAdd?.(movie);
  };

  const handleWatchlistRemove = () => {
    onWatchlistRemove?.(movie);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 0],
    }) }] }}>
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
        {movie.poster_url ? (
          <Image
            source={{ uri: movie.poster_url }}
            style={styles.poster}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterPlaceholderText}>Sem imagem</Text>
          </View>
        )}

        <View style={styles.details}>
          <Text style={styles.title}>{movie.title}</Text>
          {movie.release_date ? (
            <Text style={styles.release}>{`Lancamento: ${movie.release_date}`}</Text>
          ) : null}

          {typeof movie.vote_average === 'number' ? (
            <View style={styles.ratingRow}>
              <StarRating rating={convertVoteAverageToStars(movie.vote_average)} size={22} />
              <Text style={styles.ratingText}>{`${(movie.vote_average ?? 0).toFixed(1)}/10`}</Text>
            </View>
          ) : null}
          {movie.rating ? (
            <View style={styles.userRatingRow}>
              <StarRating rating={movie.rating} size={20} />
              <Text style={styles.userRatingText}>{`Minha nota: ${movie.rating}/5`}</Text>
            </View>
          ) : null}
          {movie.watched_at ? (
            <Text style={styles.watchedText}>
              {`Assistido em ${new Date(movie.watched_at).toLocaleDateString('pt-BR')}`}
            </Text>
          ) : null}
          {movie.mood ? (
            <Text style={styles.watchedText}>{`Humor: ${movie.mood}`}</Text>
          ) : null}
          {movie.comment ? (
            <Text numberOfLines={2} style={styles.commentPreview}>
              {`Meu comentario: ${movie.comment}`}
            </Text>
          ) : movie.journal_comment ? (
            <Text numberOfLines={2} style={styles.commentPreview}>
              {`Diário: ${movie.journal_comment}`}
            </Text>
          ) : null}

          <Text numberOfLines={4} style={styles.overview}>
            {movie.overview || 'Sinopse nao disponivel.'}
          </Text>

          {(onFavorite || onWatchlistAdd || onWatchlistRemove) && (
            <View style={styles.actionsRow}>
              {onFavorite ? (
                <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
                  <Text style={styles.favoriteText}>Favoritar</Text>
                </TouchableOpacity>
              ) : null}
              {onWatchlistAdd ? (
                <TouchableOpacity style={styles.watchlistButton} onPress={handleWatchlistAdd}>
                  <Text style={styles.watchlistText}>Quero ver</Text>
                </TouchableOpacity>
              ) : null}
              {onWatchlistRemove ? (
                <TouchableOpacity style={styles.watchlistRemove} onPress={handleWatchlistRemove}>
                  <Text style={styles.watchlistRemoveText}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(MovieCard);

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.isDark ? '#000' : '#d0d0d0',
      shadowOpacity: colors.isDark ? 0.25 : 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    ratingText: {
      color: colors.muted,
      marginLeft: spacing.xs,
      fontFamily: fonts.medium,
    },
    userRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    userRatingText: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginLeft: spacing.xs,
    },
    watchedText: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
    },
    commentPreview: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
    },
    poster: {
      width: 96,
      height: 144,
      borderRadius: radius.sm,
      backgroundColor: colors.border,
    },
    posterPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    posterPlaceholderText: {
      color: colors.muted,
      fontSize: 12,
      textAlign: 'center',
    },
    details: {
      flex: 1,
      marginLeft: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    release: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginBottom: spacing.sm,
      fontSize: 12,
    },
    overview: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.regular,
      marginBottom: spacing.md,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
    },
    favoriteButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    favoriteText: {
      color: colors.onPrimary,
      fontFamily: fonts.medium,
    },
    watchlistButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    watchlistText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    watchlistRemove: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.error,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    watchlistRemoveText: {
      color: colors.error,
      fontFamily: fonts.medium,
    },
  });
