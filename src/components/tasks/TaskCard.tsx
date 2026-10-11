import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Lock,
  PlayCircle,
  RotateCcw,
  Trash,
} from 'lucide-react-native';
import { TaskData } from '@/lib/mockData';
import {
  canDeleteTask,
  canEditTask,
  canRunTaskAction,
  isTaskAssignee,
  isTaskAuthor,
  TaskAction,
  TaskActor,
} from '@/lib/taskRules';
import { TaskButton } from './TaskButton';
import {
  BOARD,
  BODY_FONT,
  CATEGORY_THEMES,
  focusRing,
  formatAge,
  formatTaskDate,
  markdownStyles,
  NOTICE_FONT,
} from './taskTheme';

const LONG_DESCRIPTION = 180;
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface TaskCardProps {
  task: TaskData;
  actor: TaskActor | null;
  isMobile: boolean;
  busy: boolean;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onAction: (task: TaskData, action: TaskAction) => void;
  onEdit: (task: TaskData) => void;
  onDelete: (task: TaskData) => void;
  onViewResolution: (task: TaskData) => void;
}

/** Ação principal (tinta cheia) e secundárias (contorno) de acordo com o que o usuário pode fazer. */
const PRIMARY: { action: TaskAction; label: string; icon: any }[] = [
  { action: 'APPROVE_SUGGESTION', label: 'Aprovar', icon: CheckCircle },
  { action: 'TAKE', label: 'Assumir tarefa', icon: PlayCircle },
  { action: 'FINISH', label: 'Concluir', icon: CheckCircle },
  { action: 'ARCHIVE', label: 'Aprovar e arquivar', icon: Lock },
];
const SECONDARY: { action: TaskAction; label: string }[] = [
  { action: 'REJECT_SUGGESTION', label: 'Recusar' },
  { action: 'RELEASE', label: 'Liberar' },
  { action: 'REQUEST_CHANGES', label: 'Pedir ajustes' },
  { action: 'REOPEN', label: 'Reabrir' },
];

function IconAction({ icon: Icon, label, onPress, danger, disabled }: any) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={(state: any) => [
        styles.iconAction,
        (state.hovered || state.pressed) && { backgroundColor: danger ? 'rgba(142, 31, 31, 0.12)' : BOARD.rule },
        focusRing(!!state.focused),
      ]}
    >
      <Icon size={15} color={danger ? BOARD.bloodInk : BOARD.inkFaded} />
    </Pressable>
  );
}

export function TaskCard({
  task,
  actor,
  isMobile,
  busy,
  expanded,
  onToggleExpand,
  onAction,
  onEdit,
  onDelete,
  onViewResolution,
}: TaskCardProps) {
  const theme = CATEGORY_THEMES[task.category] || CATEGORY_THEMES.LORE;
  const Seal = theme.icon;
  const charCode = task.id.charCodeAt(task.id.length - 1) || 0;
  // Avisos pregados à mão nunca ficam perfeitamente retos (só no desktop, para não atrapalhar a leitura)
  const rotation = isMobile ? 0 : ((charCode % 3) - 1) * 0.5;
  const isLongText = task.description.length > LONG_DESCRIPTION;
  const isMine = !!actor && isTaskAssignee(task, actor);
  const isMySuggestion = !!actor && isTaskAuthor(task, actor);
  const isRejected = task.status === 'RECUSADO';
  const isSuggestion = task.status === 'SUGERIDO' || isRejected;
  const age = formatAge(task.updatedAt || task.createdAt);

  const can = (action: TaskAction) => !!actor && canRunTaskAction(task, actor, action);
  const primary = PRIMARY.filter((p) => can(p.action));
  const secondary = SECONDARY.filter((s) => can(s.action));
  const editable = !!actor && canEditTask(task, actor);
  const deletable = !!actor && canDeleteTask(task, actor);

  let people: string | null = null;
  if (isSuggestion && task.createdByName) {
    people = `Sugerida por ${isMySuggestion ? 'você' : task.createdByName}`;
  } else if (task.assignedTo) {
    const who = isMine ? 'você' : task.assignedTo;
    people =
      task.status === 'ANDAMENTO' ? `Com ${who}${age ? `, ${age}` : ''}` : `Feita por ${who}`;
  } else if (task.status === 'PARADO') {
    people = `Livre${age ? `, aberta ${age}` : ''}`;
  }

  return (
    <View
      style={[styles.notice, { transform: [{ rotate: `${rotation}deg` }] }, isMine && styles.noticeMine]}
      accessibilityLabel={`${theme.label}: ${task.title}`}
    >
      <View style={styles.header}>
        <View style={[styles.seal, { backgroundColor: theme.wax }]} accessibilityElementsHidden>
          <View style={styles.sealRing}>
            <Seal size={14} color="rgba(255, 244, 220, 0.92)" />
          </View>
        </View>
        <Text style={styles.category}>{theme.label}</Text>
        {(editable || deletable) && (
          <View style={styles.iconActions}>
            {editable && (
              <IconAction icon={Edit2} label={`Editar ${task.title}`} onPress={() => onEdit(task)} disabled={busy} />
            )}
            {deletable && (
              <IconAction icon={Trash} label={`Excluir ${task.title}`} onPress={() => onDelete(task)} disabled={busy} danger />
            )}
          </View>
        )}
      </View>

      {isRejected && (
        <View style={styles.stamp}>
          <Text style={styles.stampText}>Recusada</Text>
        </View>
      )}

      <Text style={styles.title}>{task.title}</Text>

      {/* Descrição: textos longos ficam recolhidos sem cortar o Markdown no meio */}
      <View style={isLongText && !expanded ? styles.descCollapsed : undefined}>
        <Markdown style={markdownStyles}>{task.description}</Markdown>
      </View>
      {isLongText && (
        <Pressable
          onPress={() => onToggleExpand(task.id)}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={(state: any) => [styles.expand, focusRing(!!state.focused)]}
        >
          <Text style={styles.expandText}>{expanded ? 'Mostrar menos' : 'Ler tudo'}</Text>
          {expanded ? <ChevronUp size={13} color={BOARD.inkSoft} /> : <ChevronDown size={13} color={BOARD.inkSoft} />}
        </Pressable>
      )}

      {!!task.reviewNote && (
        <View style={styles.reviewNote}>
          <Text style={styles.reviewNoteLabel}>{isRejected ? 'Motivo da recusa' : 'Ajustes pedidos pelo Mestre'}</Text>
          <Text style={styles.reviewNoteText}>{task.reviewNote}</Text>
        </View>
      )}

      <View style={styles.meta}>
        {!!task.reward && (
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>Recompensa </Text>
            <Text style={styles.metaValue}>{task.reward}</Text>
          </Text>
        )}
        {!!people && <Text style={[styles.metaLine, isMine && styles.metaMine]}>{people}</Text>}
        <Text style={styles.metaDate}>Criada em {formatTaskDate(task.createdAt)}</Text>
      </View>

      {!!task.resolution && (task.status === 'FINALIZADO' || task.status === 'APROVADO') && (
        <Pressable
          onPress={() => onViewResolution(task)}
          accessibilityRole="button"
          style={(state: any) => [styles.diaryLink, focusRing(!!state.focused)]}
        >
          <BookOpen size={14} color={BOARD.inkSoft} />
          <Text style={styles.diaryText}>Ler diário de missão</Text>
        </Pressable>
      )}

      {(primary.length > 0 || secondary.length > 0) && (
        <View style={styles.actions}>
          {primary.map((p) => (
            <TaskButton
              key={p.action}
              label={p.label}
              icon={p.icon}
              variant="ink"
              grow
              loading={busy}
              onPress={() => onAction(task, p.action)}
              accessibilityLabel={`${p.label}: ${task.title}`}
            />
          ))}
          {secondary.map((s) => (
            <TaskButton
              key={s.action}
              label={s.label}
              icon={s.action === 'REOPEN' || s.action === 'RELEASE' ? RotateCcw : undefined}
              variant="inkOutline"
              grow={primary.length === 0}
              disabled={busy}
              onPress={() => onAction(task, s.action)}
              accessibilityLabel={`${s.label}: ${task.title}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    width: '100%',
    backgroundColor: BOARD.parchment,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: BOARD.parchmentEdge,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 1px 0 rgba(0,0,0,0.45), 0 8px 18px rgba(0,0,0,0.35)' } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  noticeMine: {
    borderLeftWidth: 4,
    borderLeftColor: BOARD.gold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  seal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)' } as any)
      : { elevation: 2 }),
  },
  sealRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 220, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    color: BOARD.inkFaded,
    fontSize: 13,
    fontFamily: BODY_FONT,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  iconActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 2,
    marginRight: -6,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: BOARD.bloodInk,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginBottom: 8,
    transform: [{ rotate: '-4deg' }],
    opacity: 0.85,
  },
  stampText: {
    color: BOARD.bloodInk,
    fontFamily: NOTICE_FONT,
    fontSize: 15,
    letterSpacing: 1,
  },
  title: {
    color: BOARD.ink,
    fontFamily: NOTICE_FONT,
    fontSize: 20,
    lineHeight: 25,
    marginBottom: 6,
  },
  descCollapsed: {
    maxHeight: 106,
    overflow: 'hidden',
  },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 4,
  },
  expandText: {
    color: BOARD.inkSoft,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  reviewNote: {
    marginTop: 10,
    paddingLeft: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: BOARD.bloodInk,
    backgroundColor: 'rgba(142, 31, 31, 0.07)',
  },
  reviewNoteLabel: {
    color: BOARD.bloodInk,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewNoteText: {
    color: BOARD.ink,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: BODY_FONT,
  },
  meta: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BOARD.rule,
    borderStyle: 'dashed',
    gap: 4,
  },
  metaLine: {
    color: BOARD.inkFaded,
    fontSize: 13,
    lineHeight: 18,
  },
  metaLabel: {
    color: BOARD.inkFaded,
  },
  metaValue: {
    color: BOARD.ink,
    fontWeight: '700',
  },
  metaDate: {
    color: BOARD.inkFaded,
    fontSize: 12,
  },
  metaMine: {
    color: BOARD.ink,
    fontWeight: '700',
  },
  diaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  diaryText: {
    color: BOARD.inkSoft,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
});
