import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchMovieDetails } from '../models/movieRepository';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import StarRating from '../components/StarRating';
import { convertVoteAverageToStars } from '../utils/ratings';

const MovieDetailModal = ({ visible, movieId, onClose }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    fetchMovieDetails(movieId)
      .then((data) => {
        if (mounted) {
          setDetails(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Não foi possível carregar os detalhes.');
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
  }, [movieId, visible]);

  const openTrailer = () => {
    if (details?.trailerUrl) {
      Linking.openURL(details.trailerUrl);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Fechar</Text>
        </TouchableOpacity>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loaderText}>Carregando detalhes...</Text>
          </View>
        ) : error ? (
          <View style={styles.loader}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : details ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {details.poster_url ? (
              <Image source={{ uri: details.poster_url }} style={styles.poster} />
            ) : null}
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.meta}>
              {details.release_date ? `${details.release_date} • ` : ''}
              {details.runtime ? `${details.runtime} min` : ''}
            </Text>
            <View style={styles.ratingRow}>
              <StarRating rating={convertVoteAverageToStars(details.vote_average)} size={26} />
              <Text style={styles.meta}>{`${(details.vote_average || 0).toFixed(1)}/10`}</Text>
            </View>
            {details.genres?.length ? (
              <Text style={styles.meta}>{`Gêneros: ${details.genres.join(', ')}`}</Text>
            ) : null}
            <Text style={styles.sectionTitle}>Sinopse</Text>
            <Text style={styles.overview}>{details.overview || 'Sem sinopse disponível.'}</Text>
            {details.cast?.length ? (
              <>
                <Text style={styles.sectionTitle}>Elenco principal</Text>
                <Text style={styles.meta}>{details.cast.join(', ')}</Text>
              </>
            ) : null}
            {details.trailerUrl ? (
              <TouchableOpacity style={styles.trailerButton} onPress={openTrailer}>
                <Text style={styles.trailerText}>Assistir Trailer</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
};

export default MovieDetailModal;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    closeButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    closeText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginTop: spacing.sm,
    },
    errorText: {
      color: colors.error,
      fontFamily: fonts.medium,
    },
    poster: {
      width: '100%',
      height: 400,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    meta: {
      color: colors.muted,
      fontFamily: fonts.regular,
      marginBottom: spacing.xs,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    overview: {
      color: colors.text,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    trailerButton: {
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    trailerText: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
    },
  });
