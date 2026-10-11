import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { TaskData } from '@/lib/mockData';
import { TaskButton } from './TaskButton';
import { BOARD, BODY_FONT, ColumnConfig, focusRing } from './taskTheme';

/** Quantos avisos a coluna mostra antes do "Mostrar mais" (usado no Arquivo, que só cresce). */
const PAGE_SIZE = 10;
export const COLLAPSED_COLUMN_WIDTH = 72;

interface TaskColumnProps {
  col: ColumnConfig;
  tasks: TaskData[];
  layoutStyle: any;
  renderCard: (task: TaskData) => React.ReactNode;
  /** Coluna pode ser recolhida a uma faixa estreita (Arquivo no desktop). */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Pagina a lista em blocos de PAGE_SIZE. */
  paginated?: boolean;
  /** Ação sugerida quando a coluna está vazia. */
  emptyAction?: { label: string; onPress: () => void };
  /** Esconde título e contagem (no celular as abas já mostram). */
  hideTitle?: boolean;
}

export function TaskColumn({
  col,
  tasks,
  layoutStyle,
  renderCard,
  collapsible,
  collapsed,
  onToggleCollapsed,
  paginated,
  emptyAction,
  hideTitle,
}: TaskColumnProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (collapsible && collapsed) {
    return (
      <Pressable
        style={(state: any) => [
          styles.column,
          styles.collapsedColumn,
          (state.hovered || state.pressed) && { borderColor: '#4A3E33' },
          focusRing(!!state.focused),
        ]}
        onPress={onToggleCollapsed}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${col.label} (${tasks.length} tarefas)`}
      >
        <ChevronsLeft size={16} color={BOARD.textMuted} />
        <col.icon size={18} color={col.accentColor} />
        <Text style={styles.count}>{tasks.length}</Text>
        <Text style={styles.collapsedLabel}>{col.label}</Text>
      </Pressable>
    );
  }

  const shown = paginated ? tasks.slice(0, visibleCount) : tasks;
  const remaining = tasks.length - shown.length;

  return (
    <View style={[styles.column, layoutStyle]}>
      <View style={styles.header}>
        {!hideTitle && (
          <View style={styles.titleRow}>
            <col.icon size={16} color={col.accentColor} />
            <Text style={styles.title} accessibilityRole="header">
              {col.label}
            </Text>
            <Text style={styles.count} accessibilityLabel={`${tasks.length} tarefas`}>
              {tasks.length}
            </Text>
            {collapsible && (
              <Pressable
                onPress={onToggleCollapsed}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Recolher ${col.label}`}
                style={(state: any) => [styles.collapseBtn, focusRing(!!state.focused)]}
              >
                <ChevronsRight size={16} color={BOARD.textMuted} />
              </Pressable>
            )}
          </View>
        )}
        <Text style={[styles.hint, hideTitle && { marginTop: 0 }]}>{col.hint}</Text>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{col.emptyText}</Text>
          {emptyAction && (
            <TaskButton label={emptyAction.label} onPress={emptyAction.onPress} variant="dark" compact />
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {shown.map((t) => (
            <React.Fragment key={t.id}>{renderCard(t)}</React.Fragment>
          ))}
          {remaining > 0 && (
            <TaskButton
              label={`Mostrar mais ${Math.min(PAGE_SIZE, remaining)} de ${remaining}`}
              onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
              variant="dark"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    backgroundColor: BOARD.wood,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BOARD.woodEdge,
    padding: 14,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' ? ({ boxShadow: 'inset 0 1px 0 rgba(255, 240, 210, 0.04)' } as any) : null),
  },
  collapsedColumn: {
    width: COLLAPSED_COLUMN_WIDTH,
    minWidth: COLLAPSED_COLUMN_WIDTH,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 6,
  },
  collapsedLabel: {
    color: BOARD.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: BOARD.text,
    fontFamily: BODY_FONT,
    fontSize: 17,
    fontWeight: '700',
  },
  count: {
    color: BOARD.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  collapseBtn: {
    marginLeft: 'auto',
    padding: 4,
    borderRadius: 4,
  },
  hint: {
    color: BOARD.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  empty: {
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#3A2F25',
    borderStyle: 'dashed',
    borderRadius: 6,
  },
  emptyText: {
    color: BOARD.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: BODY_FONT,
  },
  list: {
    gap: 16,
  },
});
