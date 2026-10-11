import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCategory, TaskData, TaskStatus } from '@/lib/mockData';
import { isTaskAssignee, isTaskAuthor, isTaskManager, TASK_LIMITS, TaskAction, TaskActor } from '@/lib/taskRules';
import { useTasks } from '@/hooks/useTasks';
import { useResponsive } from '@/hooks/useResponsive';
import { confirmAction } from '@/utils/confirm';
import { TaskButton } from '@/components/tasks/TaskButton';
import { TaskCard } from '@/components/tasks/TaskCard';
import { COLLAPSED_COLUMN_WIDTH, TaskColumn } from '@/components/tasks/TaskColumn';
import {
  NoteModalConfig,
  ResolutionViewModal,
  TaskFormModal,
  TaskFormValues,
  TaskNoteModal,
} from '@/components/tasks/TaskModals';
import {
  BOARD,
  BODY_FONT,
  CATEGORIES,
  CATEGORY_THEMES,
  COLUMNS,
  ColumnConfig,
  focusRing,
  NOTICE_FONT_URL,
} from '@/components/tasks/taskTheme';
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Search, User, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/** Ações que exigem um texto antes de serem enviadas. */
const NOTE_ACTIONS: Partial<Record<TaskAction, Omit<NoteModalConfig, 'onSubmit' | 'initialValue'>>> = {
  FINISH: {
    title: 'Concluir tarefa',
    description: 'Registre no diário de missão o que foi feito: detalhes, links de arquivos ou notas da sessão.',
    placeholder: 'O que foi entregue e onde encontrar...',
    confirmLabel: 'Concluir tarefa',
    maxLength: TASK_LIMITS.resolution,
    requiredMessage: 'Escreva o diário de missão antes de concluir.',
  },
  REJECT_SUGGESTION: {
    title: 'Recusar sugestão',
    description: 'O autor verá o motivo no aviso e poderá ajustar e reenviar a sugestão.',
    placeholder: 'Ex: a Legião ainda não foi revelada aos jogadores.',
    confirmLabel: 'Recusar sugestão',
    maxLength: TASK_LIMITS.note,
    requiredMessage: 'Escreva o motivo da recusa.',
  },
  REQUEST_CHANGES: {
    title: 'Pedir ajustes',
    description: 'A tarefa volta para Em andamento com o responsável. Diga o que falta para aprovar.',
    placeholder: 'Ex: faltou o brasão no escudo.',
    confirmLabel: 'Pedir ajustes',
    maxLength: TASK_LIMITS.note,
    requiredMessage: 'Escreva o que precisa ser ajustado.',
  },
};

const BOARD_GAP = 16;
const MIN_COLUMN_WIDTH = 270;

const sortByRecent = (a: TaskData, b: TaskData) =>
  new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Carrega a fonte dos avisos uma única vez (web). */
function useNoticeFont() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.querySelector('link[data-font="im-fell"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = NOTICE_FONT_URL;
    link.setAttribute('data-font', 'im-fell');
    document.head.appendChild(link);
  }, []);
}

export default function TasksScreen() {
  useNoticeFont();
  const { user } = useAuth();
  const { tasks, loading, error, setError, busyIds, createTask, updateTask, runAction, deleteTask, errorMessage } =
    useTasks();

  // Filtros e navegação
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | TaskCategory>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>('PARADO');
  const [archiveCollapsed, setArchiveCollapsed] = useState(true);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [boardWidth, setBoardWidth] = useState<number | null>(null);

  // Modais
  const [formVisible, setFormVisible] = useState(false);
  const [formTask, setFormTask] = useState<TaskData | null>(null);
  const [noteConfig, setNoteConfig] = useState<NoteModalConfig | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskData | null>(null);

  const actor: TaskActor | null = user ? { id: user.id, name: user.name, role: user.role } : null;
  const isManager = isTaskManager(user?.role);
  const { width, isMobile } = useResponsive();

  const isMineTask = (t: TaskData) => !!actor && (isTaskAssignee(t, actor) || isTaskAuthor(t, actor));

  // Busca e "Minhas" valem para tudo; a categoria é aplicada por último para os contadores dos filtros
  const searchedTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => {
      if (onlyMyTasks && !isMineTask(task)) return false;
      if (!q) return true;
      return [task.title, task.description, task.reward, task.assignedTo, task.createdByName].some((v) =>
        v?.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, onlyMyTasks, searchQuery, user?.id]);

  const filteredTasks = useMemo(
    () => (selectedCategory === 'ALL' ? searchedTasks : searchedTasks.filter((t) => t.category === selectedCategory)),
    [searchedTasks, selectedCategory]
  );

  const columnTasks = (col: ColumnConfig) => {
    const list = filteredTasks.filter((t) => col.statuses.includes(t.status));
    return col.key === 'APROVADO' ? [...list].sort(sortByRecent) : list;
  };

  const myTasksCount = tasks.filter(isMineTask).length;
  const hasFilters = !!searchQuery.trim() || selectedCategory !== 'ALL' || onlyMyTasks;

  // O que pede atenção de quem está olhando o quadro
  const pendingSuggestions = tasks.filter((t) => t.status === 'SUGERIDO').length;
  const awaitingReview = tasks.filter((t) => t.status === 'FINALIZADO').length;
  const myInProgress = actor ? tasks.filter((t) => t.status === 'ANDAMENTO' && isTaskAssignee(t, actor)).length : 0;
  const myRejected = actor ? tasks.filter((t) => t.status === 'RECUSADO' && isTaskAuthor(t, actor)).length : 0;
  const openCount = tasks.filter((t) => t.status === 'PARADO').length;

  const summary = (() => {
    const parts: string[] = [];
    if (isManager) {
      if (pendingSuggestions) parts.push(`${plural(pendingSuggestions, 'sugestão aguarda', 'sugestões aguardam')} sua análise`);
      if (awaitingReview) parts.push(`${plural(awaitingReview, 'tarefa concluída espera', 'tarefas concluídas esperam')} aprovação`);
    } else {
      if (myRejected) parts.push(`${plural(myRejected, 'sugestão sua foi recusada', 'sugestões suas foram recusadas')} e pode ser ajustada`);
      if (myInProgress) parts.push(`você está com ${plural(myInProgress, 'tarefa', 'tarefas')} em andamento`);
    }
    if (!parts.length) {
      return openCount
        ? `${plural(openCount, 'tarefa está livre', 'tarefas estão livres')} para assumir.`
        : 'Tudo em dia por aqui.';
    }
    const text = parts.join(' e ');
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  })();

  // No celular, abre na etapa que pede ação de quem está olhando
  const initialTabSet = useRef(false);
  useEffect(() => {
    if (initialTabSet.current || loading || tasks.length === 0) return;
    initialTabSet.current = true;
    if (isManager && pendingSuggestions) setActiveMobileTab('SUGERIDO');
    else if (isManager && awaitingReview) setActiveMobileTab('FINALIZADO');
    else if (!isManager && myRejected) setActiveMobileTab('SUGERIDO');
    else if (!isManager && myInProgress) setActiveMobileTab('ANDAMENTO');
  }, [loading, tasks.length, isManager, pendingSuggestions, awaitingReview, myRejected, myInProgress]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setOnlyMyTasks(false);
  };

  const openNewTask = () => {
    setFormTask(null);
    setFormVisible(true);
  };

  const openEditTask = (task: TaskData) => {
    setFormTask(task);
    setFormVisible(true);
  };

  const handleSubmitForm = async (values: TaskFormValues) => {
    if (formTask) {
      const showResolution = isManager && !['SUGERIDO', 'RECUSADO', 'PARADO'].includes(formTask.status);
      await updateTask(formTask.id, {
        title: values.title,
        description: values.description,
        category: values.category,
        ...(isManager ? { reward: values.reward } : {}),
        ...(showResolution ? { resolution: values.resolution } : {}),
      });
    } else {
      await createTask({
        title: values.title,
        description: values.description,
        category: values.category,
        reward: isManager ? values.reward : undefined,
      });
    }
    setFormVisible(false);
  };

  const handleAction = (task: TaskData, action: TaskAction) => {
    const noteAction = NOTE_ACTIONS[action];
    if (noteAction) {
      setNoteConfig({
        ...noteAction,
        description: `${noteAction.description}\n\nTarefa: ${task.title}`,
        initialValue: action === 'FINISH' ? task.resolution || '' : '',
        onSubmit: async (text) => {
          await runAction(task.id, action, action === 'FINISH' ? { resolution: text } : { note: text });
          setNoteConfig(null);
        },
      });
      return;
    }
    setError(null);
    runAction(task.id, action).catch((e) => setError(errorMessage(e)));
  };

  const handleDelete = (task: TaskData) => {
    confirmAction(`Excluir "${task.title}"? Essa ação não pode ser desfeita.`, () => {
      setError(null);
      deleteTask(task.id).catch((e) => setError(errorMessage(e)));
    }, 'Excluir tarefa');
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const renderCard = (task: TaskData) => (
    <TaskCard
      task={task}
      actor={actor}
      isMobile={isMobile}
      busy={!!busyIds[task.id]}
      expanded={!!expandedTaskIds[task.id]}
      onToggleExpand={toggleExpand}
      onAction={handleAction}
      onEdit={openEditTask}
      onDelete={handleDelete}
      onViewResolution={setViewingTask}
    />
  );

  // Largura das colunas: dividem o espaço disponível, com mínimo legível (acima disso o quadro rola)
  const available = boardWidth ?? Math.max(0, width - 40);
  const desktopColumnCount = archiveCollapsed ? COLUMNS.length - 1 : COLUMNS.length;
  const reserved = archiveCollapsed ? COLLAPSED_COLUMN_WIDTH + BOARD_GAP : 0;
  const columnWidth = Math.max(
    MIN_COLUMN_WIDTH,
    Math.floor((available - reserved - BOARD_GAP * (desktopColumnCount - 1)) / desktopColumnCount)
  );

  const emptyActionFor = (col: ColumnConfig) =>
    col.key === 'SUGERIDO' && !isManager
      ? { label: 'Sugerir tarefa', onPress: openNewTask }
      : col.key === 'PARADO' && isManager
      ? { label: 'Criar tarefa', onPress: openNewTask }
      : undefined;

  const renderColumn = (col: ColumnConfig, fullWidth: boolean) => (
    <TaskColumn
      key={col.key}
      col={col}
      tasks={columnTasks(col)}
      renderCard={renderCard}
      paginated={col.key === 'APROVADO'}
      collapsible={col.key === 'APROVADO' && !fullWidth}
      collapsed={archiveCollapsed}
      onToggleCollapsed={() => setArchiveCollapsed((c) => !c)}
      emptyAction={hasFilters ? undefined : emptyActionFor(col)}
      layoutStyle={fullWidth ? { width: '100%' } : { width: columnWidth }}
      hideTitle={fullWidth}
    />
  );

  const renderNoResults = () => (
    <View style={styles.noResults}>
      <Text style={styles.noResultsTitle}>Nenhuma tarefa encontrada</Text>
      <Text style={styles.noResultsText}>
        {searchQuery.trim()
          ? `Nada corresponde a "${searchQuery.trim()}" com os filtros atuais.`
          : 'Nenhuma tarefa corresponde aos filtros atuais.'}
      </Text>
      <TaskButton label="Limpar filtros" onPress={clearFilters} variant="dark" compact />
    </View>
  );

  const renderMobile = () => {
    const currentIdx = Math.max(0, COLUMNS.findIndex((c) => c.key === activeMobileTab));
    const activeCol = COLUMNS[currentIdx];
    const prevCol = currentIdx > 0 ? COLUMNS[currentIdx - 1] : null;
    const nextCol = currentIdx < COLUMNS.length - 1 ? COLUMNS[currentIdx + 1] : null;

    return (
      <View style={{ width: '100%' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.tabs}
          accessibilityRole="tablist"
        >
          {COLUMNS.map((col) => {
            const count = columnTasks(col).length;
            const isActive = activeMobileTab === col.key;
            return (
              <Pressable
                key={col.key}
                onPress={() => setActiveMobileTab(col.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${col.label}, ${count} tarefas`}
                style={(state: any) => [styles.tab, isActive && styles.tabActive, focusRing(!!state.focused)]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{col.label}</Text>
                <Text style={[styles.tabCount, isActive && styles.tabTextActive]}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {renderColumn(activeCol, true)}

        <View style={styles.phaseNav}>
          {prevCol ? (
            <TaskButton
              label={prevCol.label}
              icon={ChevronLeft}
              variant="dark"
              compact
              onPress={() => setActiveMobileTab(prevCol.key)}
              accessibilityLabel={`Ir para ${prevCol.label}`}
            />
          ) : (
            <View />
          )}
          {nextCol && (
            <Pressable
              onPress={() => setActiveMobileTab(nextCol.key)}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${nextCol.label}`}
              style={(state: any) => [styles.nextBtn, focusRing(!!state.focused)]}
            >
              <Text style={styles.nextBtnText}>{nextCol.label}</Text>
              <ChevronRight size={15} color={BOARD.text} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderDesktop = () => (
    <View style={{ width: '100%' }} onLayout={(e) => setBoardWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        style={{ flexGrow: 0, width: '100%' }}
        contentContainerStyle={styles.board}
        showsHorizontalScrollIndicator
      >
        {COLUMNS.map((col) => renderColumn(col, false))}
      </ScrollView>
    </View>
  );

  const filterChip = (key: string, label: string, count: number, selected: boolean, onPress: () => void, extra?: React.ReactNode) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count} tarefas`}
      style={(state: any) => [
        styles.chip,
        selected && styles.chipSelected,
        !selected && (state.hovered || state.pressed) && styles.chipHover,
        focusRing(!!state.focused),
      ]}
    >
      {extra}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{count}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        {/* Topo: título, o que pede atenção e a ação principal */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Tarefas da Mesa
            </Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>
          {!!user && (
            <TaskButton
              label={isManager ? 'Nova tarefa' : 'Sugerir tarefa'}
              icon={Plus}
              variant="gold"
              onPress={openNewTask}
            />
          )}
        </View>

        {!!error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <AlertCircle size={16} color="#F2B8B5" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <Pressable
              onPress={() => setError(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              style={(state: any) => focusRing(!!state.focused)}
            >
              <X size={16} color="#F2B8B5" />
            </Pressable>
          </View>
        )}

        {/* Busca e filtros */}
        <View style={[styles.toolbar, !isMobile && styles.toolbarWide]}>
          <View style={[styles.search, !isMobile && styles.searchWide]}>
            <Search size={16} color={BOARD.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título, autor ou responsável"
              placeholderTextColor={BOARD.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Buscar tarefas"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={(state: any) => focusRing(!!state.focused)}
              >
                <X size={15} color={BOARD.textSecondary} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={styles.chips}
          >
            {CATEGORIES.map((cat) =>
              filterChip(
                cat.value,
                cat.label,
                cat.value === 'ALL' ? searchedTasks.length : searchedTasks.filter((t) => t.category === cat.value).length,
                selectedCategory === cat.value,
                () => setSelectedCategory(cat.value),
                cat.value !== 'ALL' ? (
                  <View style={[styles.chipSeal, { backgroundColor: CATEGORY_THEMES[cat.value].wax }]} />
                ) : undefined
              )
            )}
            {!!user && <View style={styles.chipDivider} />}
            {!!user &&
              filterChip('mine', 'Minhas tarefas', myTasksCount, onlyMyTasks, () => setOnlyMyTasks(!onlyMyTasks), (
                <User size={14} color={onlyMyTasks ? '#1A140F' : BOARD.gold} />
              ))}
          </ScrollView>
        </View>

        {loading && tasks.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.fantasy.gold} style={{ marginTop: 50 }} />
        ) : hasFilters && filteredTasks.length === 0 ? (
          renderNoResults()
        ) : isMobile ? (
          renderMobile()
        ) : (
          renderDesktop()
        )}

        <TaskFormModal
          visible={formVisible}
          task={formTask}
          isManager={isManager}
          onSubmit={handleSubmitForm}
          onClose={() => setFormVisible(false)}
        />
        <TaskNoteModal config={noteConfig} onClose={() => setNoteConfig(null)} />
        <ResolutionViewModal task={viewingTask} onClose={() => setViewingTask(null)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#110F0D',
  },
  containerMobile: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 20,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
  },
  headerText: {
    flexShrink: 1,
    gap: 6,
  },
  pageTitle: {
    color: BOARD.goldBright,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  summary: {
    color: BOARD.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BODY_FONT,
    maxWidth: 640,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(184, 40, 40, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(184, 40, 40, 0.45)',
  },
  errorBannerText: {
    flex: 1,
    color: '#F2B8B5',
    fontSize: 14,
    lineHeight: 20,
  },

  // Busca e filtros
  toolbar: {
    gap: 12,
    marginBottom: 20,
  },
  toolbarWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#1A1714',
  },
  searchWide: {
    width: 340,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: BOARD.text,
    fontSize: 14,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  chipHover: {
    backgroundColor: 'rgba(226, 216, 195, 0.05)',
  },
  chipSelected: {
    backgroundColor: BOARD.gold,
    borderColor: BOARD.gold,
  },
  chipSeal: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    color: BOARD.text,
    fontSize: 14,
  },
  chipCount: {
    color: BOARD.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#1A140F',
    fontWeight: '700',
  },
  chipDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#3D342C',
    marginHorizontal: 4,
  },

  // Celular: abas por etapa
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2E251D',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: BOARD.gold,
  },
  tabText: {
    color: BOARD.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabCount: {
    color: BOARD.textMuted,
    fontSize: 13,
  },
  tabTextActive: {
    color: BOARD.goldBright,
    fontWeight: '700',
  },
  phaseNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A3E33',
  },
  nextBtnText: {
    color: BOARD.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // Desktop: quadro
  board: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: BOARD_GAP,
    paddingBottom: 24,
  },

  noResults: {
    alignItems: 'flex-start',
    gap: 10,
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A2F25',
    maxWidth: 560,
  },
  noResultsTitle: {
    color: BOARD.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  noResultsText: {
    color: BOARD.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
