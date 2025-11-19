import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, spacing } from '../styles/theme';

const MAX_STARS = 5;

const StarRating = ({ rating = 0, editable = false, onRate, size = 28 }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const stars = Array.from({ length: MAX_STARS }, (_, index) => {
    const starValue = index + 1;
    const fillLevel = Math.max(0, Math.min(1, rating - index));
    const StarComponent = editable ? TouchableOpacity : View;

    return (
      <StarComponent
        key={starValue}
        style={styles.starTouchable}
        onPress={editable ? () => onRate?.(starValue) : undefined}
        accessibilityRole={editable ? 'button' : undefined}
        accessibilityLabel={`Avaliação ${starValue}`}
      >
        <View style={styles.starWrapper}>
          <Text style={[styles.star, styles.starEmpty, { fontSize: size, lineHeight: size + 6 }]}>
            ★
          </Text>
          <View
            style={[
              styles.starOverlay,
              {
                width: `${fillLevel * 100}%`,
              },
            ]}
            pointerEvents="none"
          >
            <Text
              style={[styles.star, styles.starFilled, { fontSize: size, lineHeight: size + 6 }]}
            >
              ★
            </Text>
          </View>
        </View>
      </StarComponent>
    );
  });

  return <View style={styles.container}>{stars}</View>;
};

export default memo(StarRating);

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
    },
    starTouchable: {
      paddingHorizontal: spacing.xs,
    },
    starWrapper: {
      position: 'relative',
    },
    star: {
      textAlignVertical: 'center',
      color: colors.muted,
    },
    starFilled: {
      color: colors.accent,
    },
    starEmpty: {
      color: colors.muted,
    },
    starOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      overflow: 'hidden',
    },
  });
