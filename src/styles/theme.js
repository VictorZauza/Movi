import { createContext, useContext } from 'react';

const lightColors = {
  background: '#FFFFFF',
  surface: '#FAFAFA',
  primary: '#E11D48',
  secondary: '#F4F4F4',
  text: '#111111',
  muted: '#4F4F4F',
  border: '#E0E0E0',
  accent: '#E11D48',
  success: '#059669',
  error: '#DC2626',
  onPrimary: '#FFFFFF',
  isDark: false,
};

const darkColors = {
  background: '#111111',
  surface: '#1A1A1A',
  primary: '#E11D48',
  secondary: '#1E1E1E',
  text: '#FFFFFF',
  muted: '#B3B3B3',
  border: '#333333',
  accent: '#E11D48',
  success: '#10B981',
  error: '#EF4444',
  onPrimary: '#FFFFFF',
  isDark: true,
};

export const colorSchemes = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

export const radius = {
  sm: 8,
  md: 12,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
};

export const ThemeContext = createContext({ colors: lightColors });

export const useTheme = () => useContext(ThemeContext);
