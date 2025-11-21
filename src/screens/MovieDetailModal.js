import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  fetchMovieDetails,
  fetchRecommendations,
  fetchWatchProviders,
  addFavorite,
  getFavoriteById,
  getWatchedById,
  saveRecentlyViewed,
  addWatched,
} from '../models/movieRepository';
import { TMDB_IMAGE_BASE_URL } from '../config/tmdbConfig';
import { useTheme, spacing, radius, fonts } from '../styles/theme';
import StarRating from '../components/StarRating';
import { convertVoteAverageToStars } from '../utils/ratings';

const MovieDetailModal = ({ visible, movieId, onClose, onViewed, onSelectMovie }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [providers, setProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [watchedInfo, setWatchedInfo] = useState(null);
  const [watchRating, setWatchRating] = useState(3);
  const [watchComment, setWatchComment] = useState('');
  const [watchMood, setWatchMood] = useState('Normal');
  const [journalComment, setJournalComment] = useState('');
  const [watchModalVisible, setWatchModalVisible] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [extrasOffset, setExtrasOffset] = useState(null);
  const lastLoggedIdRef = useRef(null);
  const shareCardRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    setDetails(null);
    setUserReview(null);
    setProviders(null);
    lastLoggedIdRef.current = null;
    fetchMovieDetails(movieId)
      .then((data) => {
        if (mounted) {
          setDetails(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Nao foi possivel carregar os detalhes.');
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

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    setProviders(null);
    setProvidersLoading(true);

    fetchWatchProviders(movieId)
      .then((data) => {
        if (mounted) {
          setProviders(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setProviders(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setProvidersLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [movieId, visible]);

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    setRecommendations([]);
    setRecommendationsLoading(true);

    fetchRecommendations(movieId)
      .then((list) => {
        if (mounted) {
          setRecommendations(list || []);
        }
      })
      .catch(() => {
        if (mounted) {
          setRecommendations([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setRecommendationsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [movieId, visible]);

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    getFavoriteById(movieId)
      .then((fav) => {
        if (mounted) {
          setUserReview(fav || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setUserReview(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [movieId, visible]);

  useEffect(() => {
    if (!movieId || !visible) {
      return;
    }

    let mounted = true;
    setWatchedInfo(null);
    getWatchedById(movieId)
      .then((watched) => {
        if (mounted) {
          setWatchedInfo(watched || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setWatchedInfo(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [movieId, visible]);

  useEffect(() => {
    if (!visible || !details?.tmdb_id) {
      return;
    }

    if (lastLoggedIdRef.current === details.tmdb_id) {
      return;
    }

    saveRecentlyViewed(details).catch(() => {
      // eslint-disable-next-line no-console
      console.warn('Erro ao salvar filme visto recentemente');
    });
    lastLoggedIdRef.current = details.tmdb_id;
    onViewed?.(details);
  }, [details, visible, onViewed]);

  useEffect(() => {
    if (!visible) {
      setShowActionsMenu(false);
    }
  }, [visible]);

  const openTrailer = () => {
    if (details?.trailerUrl) {
      Linking.openURL(details.trailerUrl);
    }
  };

  const shareMovie = async () => {
    if (!details) {
      return;
    }
    const tmdbLink = `https://www.themoviedb.org/movie/${details.tmdb_id}`;
    const message = `${details.title}\n\n${details.overview?.slice(0, 140) || ''}\n\n${tmdbLink}`;
    try {
      await Share.share({ message });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao compartilhar', err);
    }
  };

  const posterSizeUrl = (size) => {
    if (!details?.poster_path) {
      return null;
    }
    return `https://image.tmdb.org/t/p/${size}${details.poster_path}`;
  };

  const downloadPoster = async (size) => {
    const url = posterSizeUrl(size);
    if (!url) {
      return;
    }
    setDownloadingPoster(true);
    try {
      const fileUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${details.tmdb_id}-${size}.jpg`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao baixar poster', error);
    } finally {
      setDownloadingPoster(false);
    }
  };

  const shareCard = async () => {
    if (!shareCardRef.current) {
      return;
    }
    try {
      const uri = await shareCardRef.current.capture?.({
        format: 'png',
        quality: 0.9,
      });
      if (uri) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao gerar card', error);
    }
  };

  const markWatched = async () => {
    if (!details) {
      return;
    }
    setWatchRating(userReview?.rating || 3);
    setWatchComment(userReview?.comment || '');
    setJournalComment(userReview?.comment || watchedInfo?.journal_comment || '');
    setWatchMood(watchedInfo?.mood || 'Normal');
    setWatchModalVisible(true);
  };

  const renderProviderGroup = (label, key) => {
    const list = providers?.[key];
    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

    return (
      <View style={styles.providerGroup}>
        <Text style={styles.providerLabel}>{label}</Text>
        <View style={styles.providersRow}>
          {list.map((item) => (
            <View key={`${key}-${item.provider_id}`} style={styles.providerChip}>
              {item.logo_path ? (
                <Image
                  source={{ uri: `${TMDB_IMAGE_BASE_URL}${item.logo_path}` }}
                  style={styles.providerLogo}
                />
              ) : null}
              <Text style={styles.providerName} numberOfLines={1}>
                {item.provider_name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const saveWatchedWithFeedback = async () => {
    if (!details) return;
    try {
      await addFavorite(details, watchRating, watchComment);
      await addWatched(details, new Date(), watchMood, journalComment || watchComment);
      setUserReview({
        tmdb_id: details.tmdb_id,
        rating: watchRating,
        comment: watchComment,
      });
      setWatchedInfo({
        tmdb_id: details.tmdb_id,
        watched_at: new Date().toISOString(),
        mood: watchMood,
        journal_comment: journalComment || watchComment,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erro ao salvar assistidos', error);
    } finally {
      setWatchModalVisible(false);
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
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
            {details.poster_url ? (
              <Image source={{ uri: details.poster_url }} style={styles.poster} />
            ) : null}
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.meta}>
              {details.release_date ? `${details.release_date} • ` : ''}
              {details.runtime ? `${details.runtime} min` : ''}
            </Text>
            <View style={styles.actionsRow}>
              {details.trailerUrl ? (
                <TouchableOpacity style={styles.trailerButton} onPress={openTrailer}>
                  <Text style={styles.trailerText}>Assistir Trailer</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowActionsMenu((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.moreText}>...</Text>
              </TouchableOpacity>
              {showActionsMenu ? (
                <View style={styles.actionsMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowActionsMenu(false);
                      shareMovie();
                    }}
                  >
                    <Text style={styles.menuText}>Compartilhar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowActionsMenu(false);
                      shareCard();
                    }}
                  >
                    <Text style={styles.menuText}>Gerar card social</Text>
                  </TouchableOpacity>
                  <View style={styles.menuGroup}>
                    <Text style={styles.menuLabel}>Baixar pôster</Text>
                    <View style={styles.menuSizes}>
                      {['w500', 'w780', 'original'].map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[styles.menuSizeButton, downloadingPoster && styles.downloadButtonDisabled]}
                          onPress={() => {
                            setShowActionsMenu(false);
                            downloadPoster(size);
                          }}
                          disabled={downloadingPoster}
                        >
                          <Text style={styles.menuSizeText}>{size.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {details.extra_videos?.length ? (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setShowActionsMenu(false);
                        if (extrasOffset != null && scrollRef.current?.scrollTo) {
                          scrollRef.current.scrollTo({ y: extrasOffset - spacing.sm, animated: true });
                        }
                      }}
                    >
                      <Text style={styles.menuText}>Ver extras de vídeo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              <StarRating rating={convertVoteAverageToStars(details.vote_average)} size={26} />
              <Text style={styles.meta}>{`${(details.vote_average || 0).toFixed(1)}/10`}</Text>
            </View>
            <TouchableOpacity style={styles.watchedButton} onPress={markWatched}>
              <Text style={styles.watchedText}>
                {watchedInfo?.watched_at
                  ? `Assistido em ${new Date(watchedInfo.watched_at).toLocaleDateString('pt-BR')}`
                  : 'Marcar como assistido'}
              </Text>
              {watchedInfo?.mood ? (
                <Text style={styles.watchedMood}>{`Humor: ${watchedInfo.mood}`}</Text>
              ) : null}
              {watchedInfo?.journal_comment ? (
                <Text style={styles.watchedMood}>{`Diário: ${watchedInfo.journal_comment}`}</Text>
              ) : null}
            </TouchableOpacity>
            {userReview ? (
              <View style={styles.userReview}>
                <Text style={styles.sectionTitle}>Minha avaliacao</Text>
                <View style={styles.userReviewRow}>
                  <StarRating rating={userReview.rating || 0} size={22} />
                  {typeof userReview.rating === 'number' ? (
                    <Text style={styles.meta}>{`${userReview.rating}/5`}</Text>
                  ) : null}
                </View>
                {userReview.comment ? (
                  <Text style={styles.reviewComment}>{userReview.comment}</Text>
                ) : null}
              </View>
            ) : null}
            {details.genres?.length ? (
              <Text style={styles.meta}>{`Generos: ${details.genres.join(', ')}`}</Text>
            ) : null}
            {details.extra_videos?.length ? (
              <View
                style={styles.extraSection}
                onLayout={({ nativeEvent }) => setExtrasOffset(nativeEvent.layout.y)}
              >
                <Text style={styles.sectionTitle}>Extras de video</Text>
                {details.extra_videos.map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.extraCard}
                    onPress={() => Linking.openURL(video.url)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.extraTitle} numberOfLines={1}>
                        {video.name || video.type}
                      </Text>
                      <Text style={styles.extraMeta}>{video.type}</Text>
                    </View>
                    <Text style={styles.extraAction}>Assistir</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <Text style={styles.sectionTitle}>Sinopse</Text>
            <Text style={styles.overview}>{details.overview || 'Sem sinopse disponivel.'}</Text>
            <View style={styles.providersSection}>
              <Text style={styles.sectionTitle}>Onde assistir</Text>
              {providersLoading ? (
                <View style={styles.recommendationsLoader}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.meta}>Buscando provedores...</Text>
                </View>
              ) : providers ? (
                <>
                  {renderProviderGroup('Streaming', 'flatrate')}
                  {renderProviderGroup('Aluguel', 'rent')}
                  {renderProviderGroup('Compra', 'buy')}
                  {renderProviderGroup('Gratuito', 'free')}
                  {!renderProviderGroup('Streaming', 'flatrate') &&
                  !renderProviderGroup('Aluguel', 'rent') &&
                  !renderProviderGroup('Compra', 'buy') &&
                  !renderProviderGroup('Gratuito', 'free') ? (
                    <Text style={styles.meta}>Nenhuma informacao disponivel.</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.meta}>Nenhuma informacao disponivel.</Text>
              )}
            </View>
            {details.cast?.length ? (
              <>
                <Text style={styles.sectionTitle}>Elenco principal</Text>
                <Text style={styles.meta}>{details.cast.join(', ')}</Text>
              </>
            ) : null}
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Voce tambem pode gostar de...</Text>
              {recommendationsLoading ? (
                <View style={styles.recommendationsLoader}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.meta}>Buscando recomendacoes...</Text>
                </View>
              ) : recommendations.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendationsRow}
                >
                  {recommendations.map((movie) => (
                    <TouchableOpacity
                      key={movie.tmdb_id}
                      style={styles.recommendationCard}
                      onPress={() => onSelectMovie?.(movie)}
                    >
                      {movie.poster_url ? (
                        <Image source={{ uri: movie.poster_url }} style={styles.recommendationPoster} />
                      ) : (
                        <View style={[styles.recommendationPoster, styles.recommendationPlaceholder]}>
                          <Text style={styles.recommendationPlaceholderText}>Sem imagem</Text>
                        </View>
                      )}
                      <Text style={styles.recommendationTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      {movie.release_date ? (
                        <Text style={styles.recommendationMeta}>{movie.release_date.slice(0, 4)}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.meta}>Nenhuma recomendacao no momento.</Text>
              )}
            </View>
          </ScrollView>
        ) : null}

        <Modal visible={watchModalVisible} transparent animationType="fade" onRequestClose={() => setWatchModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Avalie e comente</Text>
              <StarRating rating={watchRating} size={36} editable onRate={setWatchRating} />
              <Text style={styles.modalHint}>Selecione sua nota e deixe um comentário rápido.</Text>
              <View style={styles.moodRow}>
                {['Feliz', 'Triste', 'Empolgado', 'Calmo', 'Normal'].map((mood) => {
                  const active = watchMood === mood;
                  return (
                    <TouchableOpacity
                      key={mood}
                      style={[styles.moodChip, active && styles.moodChipActive]}
                      onPress={() => setWatchMood(mood)}
                    >
                      <Text style={[styles.moodText, active && styles.moodTextActive]}>{mood}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Comentário (até 140 caracteres)"
                placeholderTextColor={colors.muted}
                value={journalComment}
                onChangeText={(text) => {
                  setJournalComment(text.slice(0, 140));
                  setWatchComment(text.slice(0, 140));
                }}
                maxLength={140}
                multiline
              />
              <Text style={styles.commentCounter}>{`${journalComment.length}/140`}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={() => setWatchModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirm]}
                  onPress={saveWatchedWithFeedback}
                >
                  <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <ViewShot
          ref={shareCardRef}
          style={styles.shareCard}
          options={{ format: 'png', quality: 0.9 }}
          collapsable={false}
        >
          <View style={styles.shareCardHeader}>
            {details?.poster_url ? (
              <Image source={{ uri: details.poster_url }} style={styles.shareCardPoster} />
            ) : (
              <View style={[styles.shareCardPoster, styles.collectionPlaceholder]}>
                <Text style={styles.collectionPlaceholderText}>Sem imagem</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.shareCardTitle}>{details?.title || 'Movi'}</Text>
              <Text style={styles.shareCardRating}>
                {userReview?.rating ? `Minha nota: ${userReview.rating}/5` : 'Sem nota'}
              </Text>
            </View>
          </View>
          <Text style={styles.shareCardComment} numberOfLines={3}>
            {userReview?.comment || watchedInfo?.journal_comment || details?.overview || ''}
          </Text>
        </ViewShot>
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
      backgroundColor: colors.border,
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
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.sm,
      position: 'relative',
    },
    moreButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginLeft: spacing.sm,
    },
    moreText: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 18,
    },
    actionsMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      width: 220,
      gap: spacing.xs,
      shadowColor: colors.isDark ? '#000' : '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      zIndex: 10,
    },
    menuItem: {
      paddingVertical: spacing.xs,
    },
    menuText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    menuGroup: {
      paddingVertical: spacing.xs,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.xs,
    },
    menuLabel: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
      fontSize: 12,
    },
    menuSizes: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    menuSizeButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    menuSizeText: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    trailerButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: 'center',
      marginRight: spacing.sm,
      marginBottom: spacing.xs,
    },
    trailerText: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
    },
    shareButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
      marginBottom: spacing.xs,
    },
    shareText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    watchedButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    watchedText: {
      color: colors.text,
      fontFamily: fonts.medium,
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
    providersSection: {
      marginTop: spacing.md,
    },
    providerGroup: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    providerLabel: {
      color: colors.muted,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
    },
    providersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    providerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    providerLogo: {
      width: 20,
      height: 20,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    providerName: {
      color: colors.text,
      fontFamily: fonts.medium,
      maxWidth: 120,
    },
    userReview: {
      paddingVertical: spacing.sm,
    },
    userReviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    reviewComment: {
      color: colors.text,
      fontFamily: fonts.regular,
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: fonts.bold,
      marginBottom: spacing.xs,
    },
    modalHint: {
      color: colors.muted,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      fontSize: 12,
      fontFamily: fonts.regular,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    modalCancel: {
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
    },
    modalConfirm: {
      backgroundColor: colors.primary,
      marginLeft: spacing.sm,
    },
    modalButtonText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    modalConfirmText: {
      color: colors.onPrimary,
    },
    ratingCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: -spacing.sm,
    },
    commentBox: {
      marginTop: spacing.sm,
    },
    commentInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text,
      fontFamily: fonts.regular,
      minHeight: 60,
    },
    commentCounter: {
      alignSelf: 'flex-end',
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    moodRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    moodChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    moodChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    moodText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    moodTextActive: {
      color: colors.onPrimary,
    },
    recommendationsSection: {
      marginTop: spacing.lg,
    },
    recommendationsLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    recommendationsRow: {
      paddingVertical: spacing.xs,
      paddingTop: spacing.sm,
      paddingRight: spacing.sm,
    },
    recommendationCard: {
      width: 140,
      marginRight: spacing.sm,
    },
    recommendationPoster: {
      width: '100%',
      height: 200,
      borderRadius: radius.sm,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    recommendationPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendationPlaceholderText: {
      color: colors.muted,
      fontSize: 12,
      textAlign: 'center',
    },
    recommendationTitle: {
      color: colors.text,
      fontFamily: fonts.medium,
      marginBottom: spacing.xs,
    },
    recommendationMeta: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    shareCard: {
      position: 'absolute',
      top: -9999,
      left: -9999,
      width: 320,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    shareCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    shareCardPoster: {
      width: 90,
      height: 140,
      borderRadius: radius.sm,
      marginRight: spacing.sm,
      backgroundColor: colors.border,
    },
    shareCardTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 18,
      marginBottom: spacing.xs,
    },
    shareCardRating: {
      color: colors.muted,
      fontFamily: fonts.medium,
    },
    shareCardComment: {
      color: colors.text,
      fontFamily: fonts.regular,
      marginTop: spacing.xs,
    },
    downloadRow: {
      marginBottom: spacing.sm,
    },
    downloadButtons: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    downloadButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    downloadButtonDisabled: {
      opacity: 0.6,
    },
    downloadText: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    extraSection: {
      marginTop: spacing.md,
    },
    extraCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    extraTitle: {
      color: colors.text,
      fontFamily: fonts.medium,
    },
    extraMeta: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    extraAction: {
      color: colors.primary,
      fontFamily: fonts.bold,
    },
  });
