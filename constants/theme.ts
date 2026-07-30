/**
 * VOKAL Design Tokens
 * Source of truth: .claude/skills/vokal-app-design/SKILL.md §4
 *
 * NOTE: Styling uses React Native StyleSheet (not NativeWind className props) because
 * NativeWind is not yet installed in this project. Once NativeWind + tailwind.config.js
 * are set up, these tokens should be registered under theme.extend.colors and all
 * StyleSheet references replaced with className strings. — CLAUDE.md §4 exception.
 */

export const Colors = {
  // Core palette — pixel-sampled from reference screenshot
  espresso:     '#1A1512', // Anchor dark — headers, primary buttons, nav icons
  mustard:      '#F5BE4E', // Hero accent — FAB, CTAs, selected day chips
  mustardSoft:  '#F6CC6A', // Lighter hero card fills
  terracotta:   '#C1592E', // Secondary accent — tags, secondary buttons
  rose:         '#EFD4CF', // Pastel card fill — quick action cards
  lavender:     '#DFD9FC', // Pastel card fill — quick action cards
  taupe:        '#CFC5BA', // Muted secondary panel / collapsed tab
  olive:        '#74822F', // Tertiary accent + "verified / safe" semantic
  cream:        '#DEDADA', // Default app / screen background
  surface:      '#FFFFFF', // Card surface on cream
  textMuted:    '#6E5751', // Secondary text — warm grey-brown
  warning:      '#7A2E28', // High-risk / suspicious-call state only

  // Aliases for convenience
  light: {
    background: '#DEDADA',
    card:       '#FFFFFF',
    text:       '#1A1512',
    tint:       '#F5BE4E',
    tabIconDefault: '#6E5751',
    tabIconSelected: '#F5BE4E',
  },
  dark: {
    background: '#1A1512',
    card:       '#2A2218',
    text:       '#DEDADA',
    tint:       '#F5BE4E',
    tabIconDefault: '#CFC5BA',
    tabIconSelected: '#F5BE4E',
  },
};

export const Typography = {
  // Font families — register in expo-font + tailwind.config.js fontFamily when NativeWind is set up
  heading: 'System', // Replace with Nunito or Plus Jakarta Sans
  body:    'System', // Replace with Inter

  // Scale
  xs:   11,
  sm:   13,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

export const Spacing = {
  // 8pt base unit
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const Shadow = {
  md: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
