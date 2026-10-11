import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCategory, TaskData, TaskStatus } from '@/lib/mockData';
import { isTaskAssignee, isTaskAuthor, isTaskManager, TASK_LIMITS, TaskAction, TaskActor } from '@/lib/taskRules';
import { useTasks } from '@/hooks/useTasks';
import { useResponsive } from '@/hooks/useResponsive';
import { confirmAction } from '@/utils/confirm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskColumn } from '@/components/tasks/TaskColumn';
import {
  NoteModalConfig,
  ResolutionViewModal,
  TaskFormModal,
  TaskFormValues,
  TaskNoteModal,
} from '@/components/tasks/TaskModals';
import { CATEGORIES, COLUMNS, ColumnConfig } from '@/components/tasks/taskTheme';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Columns,
  Grid,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/** Ações que exigem um texto antes de serem enviadas. */
const NOTE_ACTIONS: Partial<Record<TaskAction, Omit<NoteModalConfig, 'onSubmit' | 'initialValue'>>> = {
  FINISH: {
    title: 'Diário de Missão: Conclusão',
    description: 'Descreva como você cumpriu a task. Compartilhe detalhes, links de arquivos ou notas da sessão.',
    placeholder: 'Descreva o desfecho da missão, links ou observações...',
    confirmLabel: 'Concluir Task',
    maxLength: TASK_LIMITS.resolution,
    requiredMessage: 'Escreva o Diário de Missão antes de concluir.',
  },
  REJECT_SUGGESTION: {
    title: 'Recusar Sugestão',
    description: 'Explique o motivo. O autor verá a mensagem e poderá ajustar e reenviar a sugestão.',
    placeholder: 'Ex: Não combina com o tom da campanha; que tal focar no Norte?',
    confirmLabel: 'Recusar Sugestão',
    maxLength: TASK_LIMITS.note,
    requiredMessage: 'Informe o motivo da recusa.',
  },
  REQUEST_CHANGES: {
    title: 'Pedir Ajustes',
    description: 'A task volta para Em Andamento com o responsável. Diga o que falta para aprovar.',
    placeholder: 'Ex: Faltou incluir o mapa da segunda sala.',
    confirmLabel: 'Devolver para Ajustes',
    maxLength: TASK_LIMITS.note,
    requiredMessage: 'Informe o que precisa ser ajustado.',
  },
};

const sortByRecent = (a: TaskData, b: TaskData) =>
  new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();

export default function TasksScreen() {
  const { user } = useAuth();
  const { tasks, loading, error, setError, busyIds, createTask, updateTask, runAction, deleteTask, errorMessage } =
    useTasks();

  // Filtros e navegação
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | TaskCategory>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>('PARADO');
  const [mobileViewMode, setMobileViewMode] = useState<'COLUMN' | 'BOARD'>('COLUMN');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Modais
  const [formVisible, setFormVisible] = useState(false);
  const [formTask, setFormTask] = useState<TaskData | null>(null);
  const [noteConfig, setNoteConfig] = useState<NoteModalConfig | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskData | null>(null);

  const actor: TaskActor | null = user ? { id: user.id, name: user.name, role: user.role } : null;
  const isManager = isTaskManager(user?.role);
  const { width, isMobile, isTablet } = useResponsive();

  const mobileColWidth = Math.max(280, width - 40);
  const mobileColGap = 12;

  const isMineTask = (t: TaskData) => !!actor && (isTaskAssignee(t, actor) || isTaskAuthor(t, actor));

  // Busca e "Minhas" valem para tudo; a categoria é aplicada por último para os contadores dos chips
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
        description: `${noteAction.description}\nTask: "${task.title}"`,
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
    confirmAction(`Excluir "${task.title}" para sempre?`, () => {
      setError(null);
      deleteTask(task.id).catch((e) => setError(errorMessage(e)));
    });
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

  const renderColumn = (col: ColumnConfig, isFullWidth = false) => (
    <TaskColumn
      key={col.key}
      col={col}
      tasks={columnTasks(col)}
      renderCard={renderCard}
      paginated={col.key === 'APROVADO'}
      // No desktop o Arquivo começa recolhido para as colunas ativas caberem na tela
      collapsible={col.key === 'APROVADO' && !isMobile}
      layoutStyle={
        isFullWidth
          ? { width: '100%', minWidth: '100%', maxWidth: '100%' }
          : isMobile
          ? { width: mobileColWidth, minWidth: mobileColWidth, maxWidth: mobileColWidth }
          : isTablet
          ? { minWidth: 240, flex: 1 }
          : { minWidth: 250, flex: 1 }
      }
    />
  );

  const renderFocusMode = () => {
    const currentIdx = Math.max(0, COLUMNS.findIndex((c) => c.key === activeMobileTab));
    const activeCol = COLUMNS[currentIdx];
    const prevCol = currentIdx > 0 ? COLUMNS[currentIdx - 1] : null;
    const nextCol = currentIdx < COLUMNS.length - 1 ? COLUMNS[currentIdx + 1] : null;

    return (
      <View style={{ width: '100%' }}>
        {renderColumn(activeCol, true)}

        {/* Navegador inferior de fases */}
        <View style={styles.bottomPhaseNav}>
          {prevCol ? (
            <TouchableOpacity
              style={styles.bottomNavBtn}
              onPress={() => setActiveMobileTab(prevCol.key)}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${prevCol.shortLabel}`}
            >
              <ChevronLeft size={14} color="#BAAFA0" />
              <Text style={styles.bottomNavText}>{prevCol.shortLabel}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {nextCol ? (
            <TouchableOpacity
              style={[styles.bottomNavBtn, { marginLeft: 'auto' }]}
              onPress={() => setActiveMobileTab(nextCol.key)}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${nextCol.shortLabel}`}
            >
              <Text style={styles.bottomNavText}>{nextCol.shortLabel}</Text>
              <ChevronRight size={14} color="#BAAFA0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, isMobile && { padding: 12 }]}>
        {/* Topo da Página */}
        <View style={[styles.header, isMobile && { flexDirection: 'column', gap: 12 }]}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Tarefas da Mesa
            </Text>
            <Text style={styles.pageSubtitle}>Painel de tasks, missões e contribuições ativas da Taverna</Text>
          </View>

          {!!user && (
            <TouchableOpacity style={styles.createButton} onPress={openNewTask} accessibilityRole="button">
              <Plus color="#110F0D" size={18} />
              <Text style={styles.createButtonText}>{isManager ? 'Nova Task' : 'Sugerir Task'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Erros de ações rápidas (assumir, aprovar, excluir...) */}
        {!!error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <AlertCircle size={15} color="#FCA5A5" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity
              onPress={() => setError(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
            >
              <X size={15} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Ferramentas: Busca & Filtros */}
        <View style={styles.toolbarContainer}>
          <View style={styles.searchBarContainer}>
            <Search size={15} color="#80776C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título, descrição, autor ou responsável..."
              placeholderTextColor="#80776C"
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Buscar tasks"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={{ padding: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
              >
                <X size={14} color="#BAAFA0" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.filterChipsContainer}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              const count =
                cat.value === 'ALL' ? searchedTasks.length : searchedTasks.filter((t) => t.category === cat.value).length;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                  onPress={() => setSelectedCategory(cat.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filtrar ${cat.label}, ${count} tasks`}
                >
                  {cat.color && <View style={[styles.filterChipDot, { backgroundColor: cat.color }]} />}
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                    {cat.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}

            {!!user && (
              <TouchableOpacity
                style={[styles.filterChip, onlyMyTasks && styles.filterChipMyTasksSelected]}
                onPress={() => setOnlyMyTasks(!onlyMyTasks)}
                accessibilityRole="button"
                accessibilityState={{ selected: onlyMyTasks }}
                accessibilityLabel={`Mostrar só as minhas tasks, ${myTasksCount}`}
              >
                <User size={13} color={onlyMyTasks ? '#110F0D' : '#C5A059'} />
                <Text style={[styles.filterChipText, onlyMyTasks && { color: '#110F0D', fontWeight: '700' }]}>
                  Minhas Tasks ({myTasksCount})
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Navegador Mobile: Abas de Fases & Modo de Exibição */}
        {isMobile && (
          <View style={styles.mobileNavWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={styles.mobileTabBarContainer}
            >
              {COLUMNS.map((col) => {
                const count = columnTasks(col).length;
                const isActive = activeMobileTab === col.key;
                return (
                  <TouchableOpacity
                    key={col.key}
                    style={[
                      styles.mobileTabItem,
                      isActive && { backgroundColor: `${col.accentColor}25`, borderColor: col.accentColor },
                    ]}
                    onPress={() => {
                      setActiveMobileTab(col.key);
                      setMobileViewMode('COLUMN');
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${col.shortLabel}, ${count} tasks`}
                  >
                    <col.icon size={13} color={isActive ? col.accentColor : '#80776C'} />
                    <Text style={[styles.mobileTabText, isActive && { color: col.accentColor, fontWeight: '700' }]}>
                      {col.shortLabel}
                    </Text>
                    <View style={[styles.mobileTabBadge, isActive && { backgroundColor: col.accentColor }]}>
                      <Text style={[styles.mobileTabBadgeText, isActive && { color: '#111', fontWeight: '700' }]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Alternador de Modo: Foco na Fase ou Quadro Completo */}
            <TouchableOpacity
              style={styles.mobileViewModeBtn}
              onPress={() => setMobileViewMode((m) => (m === 'COLUMN' ? 'BOARD' : 'COLUMN'))}
              accessibilityRole="button"
              accessibilityLabel={mobileViewMode === 'COLUMN' ? 'Ver quadro completo' : 'Ver uma fase por vez'}
            >
              {mobileViewMode === 'COLUMN' ? (
                <>
                  <Columns size={13} color="#C5A059" />
                  <Text style={styles.mobileViewModeText}>Quadro</Text>
                </>
              ) : (
                <>
                  <Grid size={13} color="#C5A059" />
                  <Text style={styles.mobileViewModeText}>Foco</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quadro / Coluna */}
        {loading && tasks.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.fantasy.gold} style={{ marginTop: 50 }} />
        ) : isMobile && mobileViewMode === 'COLUMN' ? (
          renderFocusMode()
        ) : (
          <ScrollView
            horizontal
            style={{ flexGrow: 0, width: '100%' }}
            contentContainerStyle={[styles.board, isMobile && { gap: mobileColGap, paddingHorizontal: 2 }]}
            snapToInterval={isMobile ? mobileColWidth + mobileColGap : undefined}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={true}
          >
            {COLUMNS.map((col) => renderColumn(col, false))}
          </ScrollView>
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
    padding: 20,
    backgroundColor: '#161311',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  pageTitle: {
    color: '#E6C280',
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  pageSubtitle: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 3,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: 8,
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  createButtonText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  errorBannerText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },

  // Barra de Ferramentas: Busca e Filtros
  toolbarContainer: {
    gap: 10,
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#E2D8C3',
    fontSize: 13,
    padding: 0,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 18,
  },
  filterChipSelected: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  filterChipMyTasksSelected: {
    backgroundColor: '#C5A059',
    borderColor: '#C5A059',
  },
  filterChipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterChipText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#E6C280',
    fontWeight: '700',
  },

  // Navegador Mobile de Fases
  mobileNavWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  mobileTabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  mobileTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  mobileTabText: {
    color: '#A39887',
    fontSize: 12,
    fontWeight: '600',
  },
  mobileTabBadge: {
    backgroundColor: '#2D251E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  mobileTabBadgeText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '700',
  },
  mobileViewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  mobileViewModeText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
  },

  // Navegação Inferior entre Fases (Modo Foco)
  bottomPhaseNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  bottomNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: 8,
  },
  bottomNavText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
  },

  // Quadro Kanban
  board: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 24,
    minWidth: '100%',
  },
});
