/**
 * Paleta Medieval & Dark Fantasy para Honra e Egoísmo (D&D 5e)
 * Inspirada em pergaminho antigo, obsidiana, ouro envelhecido, bronze, latão e sangue carmesim.
 * Sem cores saturadas ou futuristas!
 */

import { Platform } from 'react-native';

const DarkFantasyPalette = {
  text: '#E2D8C3',               // Pergaminho Claro (Aged Parchment)
  textSecondary: '#BAAFA0',      // Papiro Envelhecido
  textMuted: '#9A8F82',          // Cinza Pedra Medieval (contraste AA sobre o fundo escuro)
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
  // Cores de estado (texto legível sobre o fundo escuro)
  successText: '#8FC79A',        // Confirmado / curado
  warningText: '#E6C280',        // Atenção / em dúvida
  dangerText: '#F2B8B5',         // Erro / ferido gravemente
  infoText: '#9DBBE0',           // Informação neutra
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

/**
 * Famílias tipográficas (carregadas no +html.tsx na web; no app nativo caem na serif do sistema).
 *  - display: Cinzel, só para o logo, títulos de página e nomes de personagem (é uma fonte de inscrição);
 *  - notice: IM Fell English, para avisos e textos "de época" (tarefas, diário);
 *  - serif: textos corridos e títulos de seção;
 *  - sans: interface e dados numéricos.
 */
export const FontFamily = {
  display: Platform.OS === 'web' ? '"Cinzel", Georgia, serif' : 'serif',
  notice: Platform.OS === 'web' ? '"IM Fell English", Georgia, serif' : 'serif',
  serif: Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : 'serif',
  sans: undefined as string | undefined,
};

/** Escala tipográfica única. Nada abaixo de 12px (legibilidade no celular). */
export const Type = {
  caption: 12,
  small: 13,
  body: 14,
  bodyLg: 16,
  title: 18,
  heading: 22,
  display: 28,
} as const;

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

/** Raios de borda padronizados */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Cores semânticas (estado) reaproveitadas por barras, badges e alertas */
export const Semantic = {
  success: '#38783C',
  warning: '#C5A059',
  danger: '#B82828',
  info: '#6B4A70',
} as const;

/** Cor da barra de vida conforme a fração de PV restante */
export function hpColorFor(ratio: number): string {
  if (ratio > 0.5) return Semantic.success;
  if (ratio > 0.25) return Semantic.warning;
  return Semantic.danger;
}
