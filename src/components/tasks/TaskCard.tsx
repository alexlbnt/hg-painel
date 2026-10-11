import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Lock,
  MessageSquareWarning,
  PlayCircle,
  RotateCcw,
  Trash,
  User,
  XCircle,
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
import { formatAge, formatTaskDate, markdownStyles, POST_IT_THEMES } from './taskTheme';

const LONG_DESCRIPTION = 150;
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

function ActionButtons({ task, actor, busy, onAction, onEdit, onDelete }: TaskCardProps) {
  if (!actor) {
    return (
      <View style={styles.actionWarningBox}>
        <AlertCircle size={13} color="#991B1B" />
        <Text style={styles.loginRequired}>Faça login para interagir</Text>
      </View>
    );
  }

  const can = (action: TaskAction) => canRunTaskAction(task, actor, action);
  const editable = canEditTask(task, actor);
  const deletable = canDeleteTask(task, actor);

  const button = (
    action: TaskAction,
    label: string,
    Icon: any,
    variant: { box: any; color: string },
    flex = false
  ) => (
    <TouchableOpacity
      key={action}
      style={[styles.btnAction, variant.box, flex && { flex: 1 }, busy && styles.btnDisabled]}
      onPress={() => onAction(task, action)}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${task.title}`}
    >
      <Icon color={variant.color} size={14} />
      <Text style={[styles.btnActionText, { color: variant.color }]}>{label}</Text>
    </TouchableOpacity>
  );

  const primary = { box: styles.btnPrimary, color: '#111' };
  const take = { box: styles.btnTake, color: '#111' };
  const finish = { box: styles.btnFinish, color: '#064E3B' };
  const danger = { box: styles.btnApprove, color: '#FFF' };
  const ghost = { box: styles.btnUndo, color: '#444' };

  const mainButtons = [
    can('APPROVE_SUGGESTION') && button('APPROVE_SUGGESTION', 'Aprovar', CheckCircle, primary, true),
    can('REJECT_SUGGESTION') && button('REJECT_SUGGESTION', 'Recusar', XCircle, ghost),
    can('TAKE') && button('TAKE', 'Assumir Missão', PlayCircle, take, true),
    can('FINISH') && button('FINISH', 'Finalizar', CheckCircle, finish, true),
    can('RELEASE') && button('RELEASE', 'Liberar', RotateCcw, ghost),
    can('ARCHIVE') && button('ARCHIVE', 'Aprovar & Arquivar', Lock, danger, true),
    can('REQUEST_CHANGES') && button('REQUEST_CHANGES', 'Pedir ajustes', MessageSquareWarning, ghost),
    can('REOPEN') && button('REOPEN', 'Reabrir', RotateCcw, ghost),
  ].filter(Boolean);

  if (mainButtons.length === 0 && !editable && !deletable) return null;

  return (
    <View style={styles.actionButtons}>
      {mainButtons.length > 0 && <View style={styles.actionRow}>{mainButtons}</View>}
      {(editable || deletable) && (
        <View style={styles.adminRow}>
          {busy && <ActivityIndicator size="small" color="#555" />}
          {editable && (
            <TouchableOpacity
              onPress={() => onEdit(task)}
              style={styles.iconBtn}
              hitSlop={HIT_SLOP}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Editar task ${task.title}`}
            >
              <Edit2 color="#444" size={15} />
            </TouchableOpacity>
          )}
          {deletable && (
            <TouchableOpacity
              onPress={() => onDelete(task)}
              style={[styles.iconBtn, styles.iconBtnDanger]}
              hitSlop={HIT_SLOP}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Excluir task ${task.title}`}
            >
              <Trash color="#B82828" size={15} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export function TaskCard(props: TaskCardProps) {
  const { task, actor, isMobile, expanded, onToggleExpand, onViewResolution } = props;
  const theme = POST_IT_THEMES[task.category] || POST_IT_THEMES.LORE;
  const charCode = task.id.charCodeAt(task.id.length - 1) || 0;
  // Rotação sutil apenas no desktop para visual orgânico
  const rotation = isMobile ? 0 : ((charCode % 3) - 1) * 0.6;
  const isLongText = task.description.length > LONG_DESCRIPTION;
  const isMine = !!actor && isTaskAssignee(task, actor);
  const isMySuggestion = !!actor && isTaskAuthor(task, actor);
  const isRejected = task.status === 'RECUSADO';
  const age = task.status === 'PARADO' || task.status === 'ANDAMENTO' ? formatAge(task.updatedAt || task.createdAt) : null;

  return (
    <View
      style={[
        styles.postIt,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          transform: [{ rotate: `${rotation}deg` }],
        },
        isRejected && styles.postItRejected,
        Platform.OS === 'web' &&
          ({
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            cursor: 'default',
          } as any),
      ]}
      // @ts-ignore
      onMouseEnter={(e: any) => {
        if (Platform.OS === 'web' && !isMobile) {
          e.currentTarget.style.transform = `translateY(-3px) scale(1.015) rotate(${rotation}deg)`;
          e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.38)';
        }
      }}
      // @ts-ignore
      onMouseLeave={(e: any) => {
        if (Platform.OS === 'web' && !isMobile) {
          e.currentTarget.style.transform = `rotate(${rotation}deg)`;
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.22)';
        }
      }}
    >
      {/* Fita Adesiva Translúcida (Washi Tape) */}
      <View style={styles.washiTape} />

      {/* Topo do Post-it: Categoria e Data */}
      <View style={styles.postItHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.categoryBadgeText, { color: theme.badgeText }]}>{theme.label}</Text>
        </View>
        <Text style={styles.postItDate} accessibilityLabel={`Criada em ${formatTaskDate(task.createdAt)}`}>
          {formatTaskDate(task.createdAt)}
        </Text>
      </View>

      {isRejected && (
        <View style={styles.rejectedTag}>
          <XCircle size={12} color="#991B1B" />
          <Text style={styles.rejectedTagText}>Sugestão recusada</Text>
        </View>
      )}

      <Text style={styles.postItTitle}>{task.title}</Text>

      {/* Descrição: textos longos ficam recolhidos sem cortar o Markdown no meio */}
      <View style={styles.postItDesc}>
        <View style={isLongText && !expanded ? styles.descCollapsed : undefined}>
          <Markdown style={markdownStyles}>{task.description}</Markdown>
        </View>
        {isLongText && (
          <TouchableOpacity
            onPress={() => onToggleExpand(task.id)}
            style={styles.expandToggleBtn}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={styles.expandToggleText}>{expanded ? 'Mostrar menos' : 'Ler descrição completa'}</Text>
            {expanded ? <ChevronUp size={12} color="#555" /> : <ChevronDown size={12} color="#555" />}
          </TouchableOpacity>
        )}
      </View>

      {/* Motivo da recusa ou ajustes pedidos pelo Mestre */}
      {!!task.reviewNote && (
        <View style={styles.reviewNoteBox}>
          <MessageSquareWarning size={13} color="#9A3412" />
          <Text style={styles.reviewNoteText}>
            <Text style={{ fontWeight: '700' }}>{isRejected ? 'Motivo da recusa: ' : 'Ajustes pedidos: '}</Text>
            {task.reviewNote}
          </Text>
        </View>
      )}

      {!!task.reward && (
        <View style={styles.rewardBox}>
          <Award size={13} color="#854D0E" />
          <Text style={styles.rewardText}>
            <Text style={{ fontWeight: '700' }}>Recompensa: </Text>
            {task.reward}
          </Text>
        </View>
      )}

      {(task.status === 'SUGERIDO' || isRejected) && !!task.createdByName && (
        <Text style={styles.authorText}>Sugerida por {isMySuggestion ? 'você' : task.createdByName}</Text>
      )}

      {task.assignedTo ? (
        <View style={[styles.assignedBox, isMine && styles.assignedBoxMine]}>
          <User size={13} color={isMine ? '#15803D' : '#444'} />
          <Text style={styles.assignedText}>
            {isMine ? 'Assumida por você' : `Assumida por ${task.assignedTo}`}
            {age && task.status === 'ANDAMENTO' ? ` · ${age}` : ''}
          </Text>
        </View>
      ) : task.status === 'PARADO' ? (
        <View style={styles.openNoticeBox}>
          <Clock size={12} color="#854D0E" />
          <Text style={styles.openNoticeText}>Livre para assumir{age ? ` · aberta ${age}` : ''}</Text>
        </View>
      ) : null}

      {!!task.resolution && (task.status === 'FINALIZADO' || task.status === 'APROVADO') && (
        <TouchableOpacity
          style={styles.viewResolutionBtn}
          onPress={() => onViewResolution(task)}
          accessibilityRole="button"
        >
          <BookOpen size={13} color="#1C1917" />
          <Text style={styles.viewResolutionText}>Ler Diário de Missão</Text>
        </TouchableOpacity>
      )}

      <ActionButtons {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  postIt: {
    width: '100%',
    padding: 14,
    paddingTop: 18,
    borderRadius: 4,
    borderWidth: 1,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 3px 10px rgba(0,0,0,0.22)' } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.22,
          shadowRadius: 5,
          elevation: 4,
        }),
  },
  postItRejected: {
    opacity: 0.85,
    borderStyle: 'dashed',
    borderColor: '#B91C1C',
  },
  washiTape: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 62,
    height: 16,
    backgroundColor: 'rgba(255, 252, 240, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    transform: [{ rotate: '-1deg' }],
    zIndex: 10,
    borderRadius: 2,
  },
  postItHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postItDate: {
    fontSize: 10,
    color: '#57534E',
    fontWeight: '600',
  },
  rejectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(185, 28, 28, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  rejectedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  postItTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 6,
    lineHeight: 20,
  },
  postItDesc: {
    marginBottom: 8,
  },
  descCollapsed: {
    maxHeight: 96,
    overflow: 'hidden',
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    textDecorationLine: 'underline',
  },
  reviewNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(154, 52, 18, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  reviewNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 16,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 6,
  },
  rewardText: {
    flex: 1,
    fontSize: 11,
    color: '#451A03',
  },
  authorText: {
    fontSize: 11,
    color: '#57534E',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  assignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 8,
  },
  assignedBoxMine: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 6,
    borderRadius: 4,
    borderTopWidth: 0,
  },
  assignedText: {
    fontSize: 11,
    color: '#292524',
    fontWeight: '600',
  },
  openNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 8,
  },
  openNoticeText: {
    fontSize: 11,
    color: '#854D0E',
    fontStyle: 'italic',
  },
  viewResolutionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewResolutionText: {
    color: '#1C1917',
    fontWeight: '700',
    fontSize: 11,
  },
  actionButtons: {
    gap: 6,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  loginRequired: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: 'bold',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    minHeight: 38,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnPrimary: {
    backgroundColor: '#C5A059',
  },
  btnTake: {
    backgroundColor: '#FDE047',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  btnFinish: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  btnApprove: {
    backgroundColor: '#8C3E3E',
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnUndo: {
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  iconBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  iconBtnDanger: {
    backgroundColor: 'rgba(184, 40, 40, 0.12)',
  },
});
