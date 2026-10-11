import { Platform } from 'react-native';
import {
  CheckCircle,
  Clock,
  Code,
  Feather,
  Hammer,
  Lock,
  Palette,
  PlayCircle,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { TaskCategory, TaskStatus } from '@/lib/taskRules';

/**
 * "Mural da Taverna": cada tarefa é um aviso de pergaminho pregado num mural de madeira,
 * marcado por um selo de cera da categoria. O selo é o único elemento de destaque; o resto é sóbrio.
 */
export const BOARD = {
  wood: '#1C1611',
  woodEdge: '#2E251D',
  parchment: '#E9DDC4',
  parchmentEdge: '#CDBB98',
  ink: '#2B2119',
  inkSoft: '#4A3B2D',
  inkFaded: '#6E5D49',
  rule: 'rgba(43, 33, 25, 0.18)',
  gold: '#C5A059',
  goldBright: '#E6C280',
  text: '#E2D8C3',
  textSecondary: '#BAAFA0',
  textMuted: '#9A8F82',
  bloodInk: '#8E1F1F',
  focus: '#E6C280',
};

/** Títulos dos avisos: tipografia de impressão antiga (carregada só na web; no app nativo cai em serif). */
export const NOTICE_FONT = Platform.OS === 'web' ? '"IM Fell English", Georgia, serif' : 'serif';
export const BODY_FONT = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : 'serif';
export const NOTICE_FONT_URL =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap';

export const CATEGORY_THEMES: Record<TaskCategory, { wax: string; label: string; icon: any }> = {
  LORE: { wax: '#9A7420', label: 'Lore e história', icon: Feather },
  MECANICA: { wax: '#2E5B7D', label: 'Mecânica e regras', icon: Hammer },
  ARTE: { wax: '#8E2F3C', label: 'Arte e mapas', icon: Palette },
  DEV: { wax: '#3D6B47', label: 'Dev e painel', icon: Code },
  ESPECIAL: { wax: '#61427A', label: 'Especial', icon: Star },
};

export interface ColumnConfig {
  /** Status exibidos na coluna (Sugestões reúne as pendentes e as recusadas). */
  statuses: TaskStatus[];
  key: TaskStatus;
  label: string;
  /** O que a etapa significa, em uma frase. */
  hint: string;
  icon: any;
  accentColor: string;
  emptyText: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'SUGERIDO',
    statuses: ['SUGERIDO', 'RECUSADO'],
    label: 'Sugestões',
    hint: 'Ideias aguardando o Mestre',
    icon: Sparkles,
    accentColor: '#B89AD9',
    emptyText: 'Nenhuma sugestão pendente. Tem uma ideia para a campanha? Sugira uma tarefa.',
  },
  {
    key: 'PARADO',
    statuses: ['PARADO'],
    label: 'Abertas',
    hint: 'Livres para quem quiser assumir',
    icon: Clock,
    accentColor: '#C5A059',
    emptyText: 'Nenhuma tarefa livre agora. Todas já têm alguém cuidando.',
  },
  {
    key: 'ANDAMENTO',
    statuses: ['ANDAMENTO'],
    label: 'Em andamento',
    hint: 'Alguém já está cuidando',
    icon: PlayCircle,
    accentColor: '#7FA3D1',
    emptyText: 'Ninguém está com tarefa em andamento. Assuma uma das abertas.',
  },
  {
    key: 'FINALIZADO',
    statuses: ['FINALIZADO'],
    label: 'Concluídas',
    hint: 'Aguardando a revisão do Mestre',
    icon: CheckCircle,
    accentColor: '#6FB3A6',
    emptyText: 'Nada esperando revisão.',
  },
  {
    key: 'APROVADO',
    statuses: ['APROVADO'],
    label: 'Arquivo',
    hint: 'Aprovadas e encerradas',
    icon: Lock,
    accentColor: '#9A8F82',
    emptyText: 'Nenhuma tarefa arquivada ainda.',
  },
];

export const CATEGORIES: { label: string; value: 'ALL' | TaskCategory }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Lore', value: 'LORE' },
  { label: 'Mecânica', value: 'MECANICA' },
  { label: 'Arte', value: 'ARTE' },
  { label: 'Dev', value: 'DEV' },
  { label: 'Especial', value: 'ESPECIAL' },
];

// Markdown com tinta escura sobre o pergaminho
export const markdownStyles = {
  body: {
    color: BOARD.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: BODY_FONT,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  link: {
    color: '#1F4E79',
    textDecorationLine: 'underline',
  },
  strong: {
    color: BOARD.ink,
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
} as any;

export const darkMarkdownStyles = {
  body: {
    color: '#E2D8C3',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  link: {
    color: '#E6C280',
    textDecorationLine: 'underline',
  },
} as any;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "12/03/26": inclui o ano para não confundir tarefas antigas. */
export function formatTaskDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** "hoje", "ontem", "há 5 dias": há quanto tempo a tarefa está na etapa. */
export function formatAge(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (Number.isNaN(days) || days < 0) return null;
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

/** Contorno de foco visível para navegação por teclado (web). */
export const focusRing = (focused: boolean) =>
  Platform.OS === 'web' && focused ? ({ outlineStyle: 'solid', outlineWidth: 2, outlineColor: BOARD.focus, outlineOffset: 2 } as any) : null;
