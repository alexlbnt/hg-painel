import { CheckCircle, Clock, Lock, PlayCircle, Sparkles } from 'lucide-react-native';
import { TaskCategory, TaskStatus } from '@/lib/taskRules';

// Paleta de Post-Its de Alta Legibilidade e Estética Tátil
export const POST_IT_THEMES: Record<
  TaskCategory,
  { bg: string; border: string; badgeBg: string; badgeText: string; label: string }
> = {
  LORE: {
    bg: '#FEF9C3',
    border: '#FDE047',
    badgeBg: 'rgba(161, 98, 7, 0.16)',
    badgeText: '#854D0E',
    label: 'Lore & História',
  },
  MECANICA: {
    bg: '#E0F2FE',
    border: '#BAE6FD',
    badgeBg: 'rgba(3, 105, 161, 0.16)',
    badgeText: '#0369A1',
    label: 'Mecânica & Regras',
  },
  ARTE: {
    bg: '#FFE4E6',
    border: '#FECDD3',
    badgeBg: 'rgba(190, 24, 93, 0.16)',
    badgeText: '#BE185D',
    label: 'Arte & Mapas',
  },
  DEV: {
    bg: '#DCFCE7',
    border: '#BBF7D0',
    badgeBg: 'rgba(21, 128, 61, 0.16)',
    badgeText: '#15803D',
    label: 'Dev & Painel',
  },
  ESPECIAL: {
    bg: '#FEF3C7',
    border: '#FDE68A',
    badgeBg: 'rgba(180, 83, 9, 0.16)',
    badgeText: '#B45309',
    label: 'Especial & Quests',
  },
};

export interface ColumnConfig {
  /** Status exibidos na coluna (Sugestões reúne as pendentes e as recusadas). */
  statuses: TaskStatus[];
  key: TaskStatus;
  label: string;
  shortLabel: string;
  icon: any;
  accentColor: string;
  emptyText: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'SUGERIDO',
    statuses: ['SUGERIDO', 'RECUSADO'],
    label: 'SUGESTÕES',
    shortLabel: 'Sugestões',
    icon: Sparkles,
    accentColor: '#B280E6',
    emptyText: 'Nenhuma sugestão aguardando aprovação.',
  },
  {
    key: 'PARADO',
    statuses: ['PARADO'],
    label: 'ABERTAS (BACKLOG)',
    shortLabel: 'Abertas',
    icon: Clock,
    accentColor: '#C5A059',
    emptyText: 'Todas as tasks abertas foram assumidas!',
  },
  {
    key: 'ANDAMENTO',
    statuses: ['ANDAMENTO'],
    label: 'EM ANDAMENTO',
    shortLabel: 'Andamento',
    icon: PlayCircle,
    accentColor: '#5B8AC9',
    emptyText: 'Nenhuma task em andamento no momento.',
  },
  {
    key: 'FINALIZADO',
    statuses: ['FINALIZADO'],
    label: 'CONCLUÍDAS',
    shortLabel: 'Concluídas',
    icon: CheckCircle,
    accentColor: '#4E9C8E',
    emptyText: 'Nenhuma task aguardando revisão do Mestre.',
  },
  {
    key: 'APROVADO',
    statuses: ['APROVADO'],
    label: 'ARQUIVO DA MESA',
    shortLabel: 'Arquivo',
    icon: Lock,
    accentColor: '#80776C',
    emptyText: 'Nenhuma task arquivada até o momento.',
  },
];

export const CATEGORIES: { label: string; value: 'ALL' | TaskCategory; color?: string }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Lore', value: 'LORE', color: '#EAB308' },
  { label: 'Mecânica', value: 'MECANICA', color: '#0284C7' },
  { label: 'Arte', value: 'ARTE', color: '#E11D48' },
  { label: 'Dev', value: 'DEV', color: '#16A34A' },
  { label: 'Especial', value: 'ESPECIAL', color: '#D97706' },
];

// Estilização Markdown de Alto Contraste dentro do Post-it
export const markdownStyles = {
  body: {
    color: '#292524',
    fontSize: 13,
    lineHeight: 19,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  link: {
    color: '#0369A1',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  strong: {
    color: '#1C1917',
    fontWeight: '700',
  },
  em: {
    color: '#44403C',
    fontStyle: 'italic',
  },
} as any;

export const darkMarkdownStyles = {
  body: {
    color: '#E2D8C3',
    fontSize: 14,
    lineHeight: 22,
  },
  link: {
    color: '#E6C280',
    textDecorationLine: 'underline',
  },
} as any;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "12/03/26" — inclui o ano para não confundir tasks antigas. */
export function formatTaskDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** "hoje", "ontem", "há 5 dias" — para mostrar há quanto tempo a task está parada. */
export function formatAge(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (Number.isNaN(days) || days < 0) return null;
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}
