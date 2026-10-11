import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { TaskData } from '@/lib/mockData';
import { ColumnConfig } from './taskTheme';

/** Quantos cards a coluna mostra antes do "Mostrar mais" (usado no Arquivo, que só cresce). */
const PAGE_SIZE = 10;

interface TaskColumnProps {
  col: ColumnConfig;
  tasks: TaskData[];
  layoutStyle: any;
  renderCard: (task: TaskData) => React.ReactNode;
  /** Coluna pode ser recolhida a uma faixa estreita (Arquivo no desktop). */
  collapsible?: boolean;
  /** Pagina a lista em blocos de PAGE_SIZE. */
  paginated?: boolean;
}

export function TaskColumn({ col, tasks, layoutStyle, renderCard, collapsible, paginated }: TaskColumnProps) {
  const [collapsed, setCollapsed] = useState(!!collapsible);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (collapsible && collapsed) {
    return (
      <TouchableOpacity
        style={[styles.column, styles.collapsedColumn]}
        onPress={() => setCollapsed(false)}
        accessibilityRole="button"
        accessibilityLabel={`Abrir coluna ${col.shortLabel} (${tasks.length} tasks)`}
      >
        <ChevronsLeft size={16} color={col.accentColor} />
        <col.icon size={16} color={col.accentColor} />
        <View style={[styles.badge, { borderColor: `${col.accentColor}44` }]}>
          <Text style={[styles.badgeText, { color: col.accentColor }]}>{tasks.length}</Text>
        </View>
        <Text style={styles.collapsedLabel}>{col.shortLabel}</Text>
      </TouchableOpacity>
    );
  }

  const shown = paginated ? tasks.slice(0, visibleCount) : tasks;
  const remaining = tasks.length - shown.length;

  return (
    <View style={[styles.column, layoutStyle]}>
      <View style={styles.columnHeader}>
        <View style={styles.columnHeaderTitle}>
          <col.icon size={15} color={col.accentColor} />
          <Text style={styles.columnTitle} accessibilityRole="header">
            {col.label}
          </Text>
        </View>
        <View style={styles.columnHeaderTitle}>
          <View style={[styles.badge, { borderColor: `${col.accentColor}44` }]}>
            <Text style={[styles.badgeText, { color: col.accentColor }]}>{tasks.length}</Text>
          </View>
          {collapsible && (
            <TouchableOpacity
              onPress={() => setCollapsed(true)}
              style={styles.collapseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Recolher coluna ${col.shortLabel}`}
            >
              <ChevronsRight size={16} color="#80776C" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyColumnBox}>
          <col.icon size={26} color="#524B43" />
          <Text style={styles.emptyColumnText}>{col.emptyText}</Text>
        </View>
      ) : (
        <View style={styles.postitContainer}>
          {shown.map((t) => (
            <React.Fragment key={t.id}>{renderCard(t)}</React.Fragment>
          ))}
          {remaining > 0 && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
              accessibilityRole="button"
            >
              <Text style={styles.moreBtnText}>Mostrar mais ({remaining} restantes)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    backgroundColor: 'rgba(30, 26, 23, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 12,
  },
  collapsedColumn: {
    width: 64,
    minWidth: 64,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    alignSelf: 'flex-start',
  },
  collapsedLabel: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 10,
  },
  columnHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnTitle: {
    color: '#E2D8C3',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  collapseBtn: {
    padding: 4,
  },
  badge: {
    backgroundColor: '#161311',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyColumnBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2D251E',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 6,
  },
  emptyColumnText: {
    color: '#80776C',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  postitContainer: {
    gap: 14,
    paddingBottom: 8,
  },
  moreBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  moreBtnText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
  },
});
