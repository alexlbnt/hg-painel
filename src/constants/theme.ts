/**
 * Paleta Medieval & Dark Fantasy para Honra e Egoísmo (D&D 5e)
 * Inspirada em pergaminho antigo, obsidiana, ouro envelhecido, bronze, latão e sangue carmesim.
 * Sem cores saturadas ou futuristas!
 */

import { Platform } from 'react-native';

const DarkFantasyPalette = {
  text: '#E2D8C3',               // Pergaminho Claro (Aged Parchment)
  textSecondary: '#BAAFA0',      // Papiro Envelhecido
  textMuted: '#80776C',          // Cinza Pedra Medieval
  background: '#110F0D',         // Pedra Obsidiana / Abismo
  backgroundSecondary: '#1A1714',// Couro Negro / Madeira de Taverna
  backgroundElement: '#24201C',  // Bloco de Pedra / Aço Antigo
  backgroundSelected: '#362F27', // Couro Trabalhado
  backgroundOverlay: 'rgba(17, 15, 13, 0.92)',
  accent: '#6B4A70',             // Magia Arcana (Púrpura Místico Antigo)
  accentGlow: '#8C6C90',         // Brilho de Feitiço Antigo
  gold: '#C5A059',               // Ouro Antigo / Latão Polido
  goldDark: '#8C704F',           // Bronze Envelhecido
  goldBright: '#E6C280',         // Ouro Imperial / Relíquia
  red: '#B82828',                // Sangue Carmesim (Crimson)
  redDark: '#701414',            // Sangue Seco / Dano Grave
  green: '#38783C',              // Herbalismo / Poção de Cura
  greenDark: '#1E4722',          // Musgo Antigo
  border: '#3D342C',             // Borda de Bronze / Latão Escuro
  borderGlow: '#5C4E40',         // Destaque em Ouro Velho
};

export const Colors = {
  light: DarkFantasyPalette,
  dark: DarkFantasyPalette,
  fantasy: DarkFantasyPalette,
} as const;

export type ThemeColor = keyof typeof DarkFantasyPalette;

export const Fonts = Platform.select({
  ios: {
    sans: 'Georgia',
    serif: 'Georgia',
    rounded: 'system-ui',
    mono: 'Courier New',
  },
  default: {
    sans: 'serif',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: '"Cinzel", "Georgia", "Garamond", "Palatino Linotype", "Times New Roman", serif',
    serif: '"Cinzel", "Georgia", "Garamond", "Palatino Linotype", "Times New Roman", serif',
    rounded: 'var(--font-rounded)',
    mono: '"Courier New", Courier, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;
