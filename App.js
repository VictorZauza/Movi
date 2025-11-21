import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HomeScreen from './src/screens/HomeScreen';
import TopMoviesScreen from './src/screens/TopMoviesScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import WatchedScreen from './src/screens/WatchedScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { initDb } from './src/db/database';
import { ThemeContext, colorSchemes, useTheme, fonts } from './src/styles/theme';

const tabs = [
  { key: 'home', icon: 'search-outline', activeIcon: 'search' },
  { key: 'top', icon: 'flame-outline', activeIcon: 'flame' },
  { key: 'library', icon: 'bookmark-outline', activeIcon: 'bookmark' },
  { key: 'profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

const logoXml = `
<svg width="64" height="64" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#E11D48" offset="0%"/>
      <stop stop-color="#FF5F6D" offset="100%"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#g)"/>
  <path d="M150 368V160H196L256 274L316 160H362V368H318V245L266 340H246L194 245V368H150Z" fill="white"/>
</svg>`;

const AppContent = ({
  activeTab,
  setActiveTab,
  favoritesRefreshKey,
  watchlistRefreshKey,
  onFavoriteAdded,
  onWatchlistUpdated,
  fontsLoaded,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusBarStyle = 'light';
  const tabKeys = useMemo(() => tabs.map((tab) => tab.key), []);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevTabIndex = useRef(0);

  useEffect(() => {
    if (fontsLoaded) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = {
        ...(Text.defaultProps.style || {}),
        fontFamily: fonts.regular,
        color: colors.text,
      };
    }
  }, [fontsLoaded, colors.text]);

  useEffect(() => {
    const currentIndex = tabKeys.indexOf(activeTab);
    const previousIndex = prevTabIndex.current;
    const direction = currentIndex > previousIndex ? 1 : -1;
    slideAnim.setValue(40 * direction);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    prevTabIndex.current = currentIndex;
  }, [activeTab, slideAnim, tabKeys]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 20,
        onPanResponderRelease: (_, { dx }) => {
          const currentIndex = tabKeys.indexOf(activeTab);
          if (dx > 50 && currentIndex > 0) {
            setActiveTab(tabKeys[currentIndex - 1]);
          } else if (dx < -50 && currentIndex < tabKeys.length - 1) {
            setActiveTab(tabKeys[currentIndex + 1]);
          }
        },
      }),
    [activeTab, setActiveTab, tabKeys],
  );

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingArea}>
          <ActivityIndicator color={colors.primary} size="large" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right', 'bottom']}
        {...panResponder.panHandlers}
      >
        <StatusBar style={statusBarStyle} />

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <SvgXml xml={logoXml} width={28} height={28} />
            <Text style={styles.brand}>Movi</Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
          {activeTab === 'home' ? (
            <HomeScreen
              onFavoriteAdded={onFavoriteAdded}
              onWatchlistUpdated={onWatchlistUpdated}
              isActive={activeTab === 'home'}
            />
          ) : activeTab === 'top' ? (
            <TopMoviesScreen isActive={activeTab === 'top'} />
          ) : activeTab === 'library' ? (
            <LibraryScreen
              favoritesRefreshKey={favoritesRefreshKey}
              watchlistRefreshKey={watchlistRefreshKey}
            />
          ) : activeTab === 'profile' ? (
            <ProfileScreen isActive={activeTab === 'profile'} />
          ) : (
            <HomeScreen
              onFavoriteAdded={onFavoriteAdded}
              onWatchlistUpdated={onWatchlistUpdated}
              isActive={false}
            />
          )}
        </Animated.View>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={20}
                  color={isActive ? colors.onPrimary : colors.muted}
                  style={styles.tabIcon}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [favoritesRefreshKey, setFavoritesRefreshKey] = useState(Date.now());
  const [watchlistRefreshKey, setWatchlistRefreshKey] = useState(Date.now());
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    initDb().catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('Erro ao inicializar a base local', error);
    });
  }, []);

  const handleFavoriteAdded = () => {
    setFavoritesRefreshKey(Date.now());
  };

  const handleWatchlistUpdated = () => {
    setWatchlistRefreshKey(Date.now());
  };

  const themeValue = useMemo(
    () => ({ colors: colorSchemes.dark }),
    [],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <AppContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesRefreshKey={favoritesRefreshKey}
        watchlistRefreshKey={watchlistRefreshKey}
        onFavoriteAdded={handleFavoriteAdded}
        onWatchlistUpdated={handleWatchlistUpdated}
        fontsLoaded={fontsLoaded}
      />
    </ThemeContext.Provider>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brand: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.secondary,
      height: 40,
    },
    tabButton: {
      flex: 1,
      height: '100%',
      paddingVertical: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 2,
      borderTopColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
      borderTopColor: colors.onPrimary,
    },
    tabIcon: {
      marginTop: 0,
    },
  });
