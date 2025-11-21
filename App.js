import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HomeScreen from './src/screens/HomeScreen';
import TopMoviesScreen from './src/screens/TopMoviesScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import WatchedScreen from './src/screens/WatchedScreen';
import StatsScreen from './src/screens/StatsScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { initDb } from './src/db/database';
import { ThemeContext, colorSchemes, useTheme, fonts } from './src/styles/theme';

const tabs = [
  { key: 'home', label: 'Buscar' },
  { key: 'top', label: 'Em alta' },
  { key: 'library', label: 'Minha lista' },
  { key: 'profile', label: 'Perfil' },
];

const AppContent = ({
  activeTab,
  setActiveTab,
  favoritesRefreshKey,
  watchlistRefreshKey,
  onFavoriteAdded,
  onWatchlistUpdated,
  fontsLoaded,
  onToggleTheme,
  themeName,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusBarStyle = colors.isDark ? 'light' : 'dark';
  const tabKeys = useMemo(() => tabs.map((tab) => tab.key), []);

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
          <Text style={styles.brand}>Movi</Text>
          <TouchableOpacity onPress={onToggleTheme}>
            <Text style={styles.themeToggleText}>{themeName === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
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
        </View>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default function App() {
  const systemScheme = useColorScheme() ?? 'light';
  const [themeName, setThemeName] = useState(systemScheme);
  const [hasManualOverride, setHasManualOverride] = useState(false);
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

  useEffect(() => {
    if (!hasManualOverride) {
      setThemeName(systemScheme);
    }
  }, [systemScheme, hasManualOverride]);

  const handleFavoriteAdded = () => {
    setFavoritesRefreshKey(Date.now());
  };

  const handleWatchlistUpdated = () => {
    setWatchlistRefreshKey(Date.now());
  };

  const toggleTheme = () => {
    setHasManualOverride(true);
    setThemeName((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const themeValue = useMemo(
    () => ({ colors: colorSchemes[themeName] || colorSchemes.light }),
    [themeName],
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
        onToggleTheme={toggleTheme}
        themeName={themeName}
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
      paddingVertical: 8,
    },
    brand: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.text,
    },
    themeToggleText: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 22,
    },
    content: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.secondary,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      color: colors.muted,
      fontFamily: fonts.medium,
    },
    tabTextActive: {
      color: colors.onPrimary,
      fontFamily: fonts.bold,
    },
  });
