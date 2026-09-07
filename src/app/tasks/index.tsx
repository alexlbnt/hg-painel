import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCategory, TaskData, TaskStatus } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useResponsive } from '@/hooks/useResponsive';
import { confirmAction } from '@/utils/confirm';
import { Picker } from '@react-native-picker/picker';
import {
  AlertCircle,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Columns,
  Edit2,
  Grid,
  Lock,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash,
  User,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

// Paleta de Post-Its de Alta Legibilidade e Estética Tátil
const POST_IT_THEMES: Record<
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

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  shortLabel: string;
  icon: any;
  accentColor: string;
  emptyText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'SUGERIDO',
    label: 'SUGESTÕES',
    shortLabel: 'Sugestões',
    icon: Sparkles,
    accentColor: '#B280E6',
    emptyText: 'Nenhuma sugestão aguardando aprovação.',
  },
  {
    status: 'PARADO',
    label: 'ABERTAS (BACKLOG)',
    shortLabel: 'Abertas',
    icon: Clock,
    accentColor: '#C5A059',
    emptyText: 'Todas as tasks abertas foram assumidas!',
  },
  {
    status: 'ANDAMENTO',
    label: 'EM ANDAMENTO',
    shortLabel: 'Andamento',
    icon: PlayCircle,
    accentColor: '#5B8AC9',
    emptyText: 'Nenhuma task em andamento no momento.',
  },
  {
    status: 'FINALIZADO',
    label: 'CONCLUÍDAS',
    shortLabel: 'Concluídas',
    icon: CheckCircle,
    accentColor: '#4E9C8E',
    emptyText: 'Nenhuma task aguardando revisão ou arquivo.',
  },
  {
    status: 'APROVADO',
    label: 'ARQUIVO DA MESA',
    shortLabel: 'Arquivo',
    icon: Lock,
    accentColor: '#80776C',
    emptyText: 'Nenhuma task arquivada até o momento.',
  },
];

const CATEGORIES: { label: string; value: 'ALL' | TaskCategory; color?: string }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Lore', value: 'LORE', color: '#EAB308' },
  { label: 'Mecânica', value: 'MECANICA', color: '#0284C7' },
  { label: 'Arte', value: 'ARTE', color: '#E11D48' },
  { label: 'Dev', value: 'DEV', color: '#16A34A' },
  { label: 'Especial', value: 'ESPECIAL', color: '#D97706' },
];

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | TaskCategory>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<TaskStatus>('PARADO');
  const [mobileViewMode, setMobileViewMode] = useState<'COLUMN' | 'BOARD'>('COLUMN');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [viewResolutionVisible, setViewResolutionVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('LORE');
  const [reward, setReward] = useState('');
  const [resolution, setResolution] = useState('');

  const isDM = user?.role === 'DM';
  const { width, isMobile, isTablet } = useResponsive();

  const boardScrollRef = useRef<ScrollView>(null);
  const mobileColWidth = Math.max(280, width - 40);
  const mobileColGap = 12;

  const loadTasks = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ApiService.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useRealtimeSync((event) => {
    if (
      event.type === 'TASK_CREATED' ||
      event.type === 'TASK_UPDATED' ||
      event.type === 'TASK_DELETED'
    ) {
      loadTasks(true);
    }
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('LORE');
    setReward('');
    setResolution('');
    setModalVisible(true);
  };

  const openEditTaskModal = (t: TaskData) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setReward(t.reward);
    setResolution(t.resolution || '');
    setModalVisible(true);
  };

  const openViewResolution = (t: TaskData) => {
    setEditingTask(t);
    setViewResolutionVisible(true);
  };

  const handleSaveTask = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    setModalVisible(false);
    try {
      if (editingTask) {
        await ApiService.updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          reward: reward.trim(),
          resolution: resolution.trim(),
        });
      } else {
        await ApiService.createTask({
          title: title.trim(),
          description: description.trim(),
          category,
          reward: reward.trim(),
          resolution: resolution.trim(),
          status: isDM ? 'PARADO' : 'SUGERIDO',
        });
      }
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResolution = async () => {
    if (!editingTask) return;
    setResolutionModalVisible(false);
    setLoading(true);
    try {
      await ApiService.updateTask(editingTask.id, {
        status: 'FINALIZADO',
        resolution: resolution.trim(),
      });
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (id: string) => {
    confirmAction('Deletar essa tarefa para sempre?', async () => {
      setLoading(true);
      await ApiService.deleteTask(id);
      await loadTasks();
    });
  };

  const handleUpdateStatus = async (task: TaskData, newStatus: TaskStatus) => {
    // Interceptar FINALIZADO para pedir diário / relatório de missão
    if (newStatus === 'FINALIZADO' && task.status === 'ANDAMENTO') {
      setEditingTask(task);
      setResolution(task.resolution || '');
      setResolutionModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<TaskData> = { status: newStatus };
      if (newStatus === 'ANDAMENTO' && task.status === 'PARADO') {
        updates.assignedTo = user?.name || 'Aventureiro Anônimo';
      }
      if (newStatus === 'PARADO') {
        updates.assignedTo = null;
      }
      await ApiService.updateTask(task.id, updates);
      await loadTasks();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Contagem de tarefas do usuário conectado
  const myTasksCount = user ? tasks.filter((t) => t.assignedTo === user.name).length : 0;

  // Filtragem de Tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filtro de Categoria
      if (selectedCategory !== 'ALL' && task.category !== selectedCategory) {
        return false;
      }
      // Filtro "Minhas Tasks"
      if (onlyMyTasks && user && task.assignedTo !== user.name) {
        return false;
      }
      // Filtro de Busca
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchReward = task.reward?.toLowerCase().includes(q);
        const matchAssignee = task.assignedTo?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchReward && !matchAssignee) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedCategory, onlyMyTasks, searchQuery, user]);

  // Renderização dos Botões de Ação do Post-It
  const renderActionButtons = (task: TaskData) => {
    if (!user) {
      return (
        <View style={styles.actionWarningBox}>
          <AlertCircle size={13} color="#991B1B" />
          <Text style={styles.loginRequired}>Faça login para interagir</Text>
        </View>
      );
    }

    const isMine = task.assignedTo === user.name;

    return (
      <View style={styles.actionButtons}>
        {/* Sugestão aguardando aprovação do Mestre */}
        {task.status === 'SUGERIDO' && isDM && (
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: '#C5A059' }]}
            onPress={() => handleUpdateStatus(task, 'PARADO')}
          >
            <CheckCircle color="#111" size={14} />
            <Text style={[styles.btnActionText, { color: '#111' }]}>Aprovar Sugestão</Text>
          </TouchableOpacity>
        )}

        {/* Tarefa aberta no backlog */}
        {task.status === 'PARADO' && (
          <TouchableOpacity
            style={[styles.btnAction, styles.btnTake]}
            onPress={() => handleUpdateStatus(task, 'ANDAMENTO')}
          >
            <PlayCircle color="#111" size={14} />
            <Text style={[styles.btnActionText, { color: '#111' }]}>Assumir Missão</Text>
          </TouchableOpacity>
        )}

        {/* Tarefa em andamento pertencente ao usuário */}
        {task.status === 'ANDAMENTO' && isMine && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <TouchableOpacity
              style={[styles.btnAction, styles.btnFinish, { flex: 1 }]}
              onPress={() => handleUpdateStatus(task, 'FINALIZADO')}
            >
              <CheckCircle color="#064E3B" size={14} />
              <Text style={[styles.btnActionText, { color: '#064E3B' }]}>Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAction, styles.btnUndo]}
              onPress={() => handleUpdateStatus(task, 'PARADO')}
            >
              <RotateCcw color="#555" size={13} />
              <Text style={styles.btnUndoText}>Liberar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tarefa finalizada que o usuário pode reabrir */}
        {task.status === 'FINALIZADO' && isMine && (
          <TouchableOpacity
            style={[styles.btnAction, styles.btnUndo]}
            onPress={() => handleUpdateStatus(task, 'ANDAMENTO')}
          >
            <RotateCcw color="#555" size={13} />
            <Text style={styles.btnUndoText}>Reabrir Task</Text>
          </TouchableOpacity>
        )}

        {/* Ações Administrativas do Mestre (DM) */}
        {isDM && (
          <View style={styles.dmControlsRow}>
            {task.status === 'FINALIZADO' && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnApprove]}
                onPress={() => handleUpdateStatus(task, 'APROVADO')}
              >
                <Lock color="#FFF" size={14} />
                <Text style={[styles.btnActionText, { color: '#FFF' }]}>Aprovar & Arquivar</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
              <TouchableOpacity
                onPress={() => openEditTaskModal(task)}
                style={styles.iconBtn}
                accessibilityLabel="Editar Tarefa"
              >
                <Edit2 color="#444" size={14} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTask(task.id)}
                style={[styles.iconBtn, { backgroundColor: 'rgba(184, 40, 40, 0.12)' }]}
                accessibilityLabel="Excluir Tarefa"
              >
                <Trash color="#B82828" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Renderização de cada Post-It
  const renderPostIt = (task: TaskData) => {
    const theme = POST_IT_THEMES[task.category] || POST_IT_THEMES.LORE;
    const charCode = task.id.charCodeAt(task.id.length - 1) || 0;
    // Rotação sutil apenas no desktop para visual orgânico
    const rotation = isMobile ? 0 : ((charCode % 3) - 1) * 0.6;
    const isExpanded = !!expandedTaskIds[task.id];
    const isLongText = task.description.length > 150;
    const isMine = user && task.assignedTo === user.name;

    return (
      <View
        key={task.id}
        style={[
          styles.postIt,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            transform: [{ rotate: `${rotation}deg` }],
          },
          Platform.OS === 'web' &&
            ({
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              cursor: 'default',
            } as any),
        ]}
        // @ts-ignore
        onMouseEnter={(e: any) => {
          if (Platform.OS === 'web' && !isMobile) {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.015)';
            e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.38)';
          }
        }}
        // @ts-ignore
        onMouseLeave={(e: any) => {
          if (Platform.OS === 'web' && !isMobile) {
            e.currentTarget.style.transform = `scale(1) rotate(${rotation}deg)`;
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.22)';
          }
        }}
      >
        {/* Fita Adesiva Translúcida (Washi Tape) */}
        <View style={styles.washiTape} />

        {/* Topo do Post-it: Categoria e Data */}
        <View style={styles.postItHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.badgeText }]}>
              {theme.label}
            </Text>
          </View>
          <Text style={styles.postItDate}>
            {new Date(task.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </View>

        {/* Título da Task */}
        <Text style={styles.postItTitle}>{task.title}</Text>

        {/* Descrição com suporte a colapso para textos longos */}
        <View style={styles.postItDesc}>
          <Markdown style={markdownStyles}>
            {isLongText && !isExpanded
              ? `${task.description.slice(0, 140)}...`
              : task.description}
          </Markdown>
          {isLongText && (
            <TouchableOpacity
              onPress={() => toggleExpand(task.id)}
              style={styles.expandToggleBtn}
            >
              <Text style={styles.expandToggleText}>
                {isExpanded ? 'Mostrar menos' : 'Ler mais completo'}
              </Text>
              {isExpanded ? (
                <ChevronUp size={12} color="#555" />
              ) : (
                <ChevronDown size={12} color="#555" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Recompensa */}
        {!!task.reward && (
          <View style={styles.rewardBox}>
            <Award size={13} color="#854D0E" />
            <Text style={styles.rewardText}>
              <Text style={{ fontWeight: '700' }}>Recompensa: </Text>
              {task.reward}
            </Text>
          </View>
        )}

        {/* Responsável / Atribuído */}
        {task.assignedTo ? (
          <View style={[styles.assignedBox, isMine && styles.assignedBoxMine]}>
            <User size={13} color={isMine ? '#15803D' : '#444'} />
            <Text style={styles.assignedText}>
              {isMine ? 'Assumido por você' : `Assumido por ${task.assignedTo}`}
            </Text>
          </View>
        ) : task.status === 'PARADO' ? (
          <View style={styles.openNoticeBox}>
            <Clock size={12} color="#854D0E" />
            <Text style={styles.openNoticeText}>Task livre para assumir</Text>
          </View>
        ) : null}

        {/* Botão de Leitura de Relatório */}
        {!!task.resolution && (task.status === 'FINALIZADO' || task.status === 'APROVADO') && (
          <TouchableOpacity
            style={styles.viewResolutionBtn}
            onPress={() => openViewResolution(task)}
          >
            <Text style={styles.viewResolutionText}>📖 Ler Diário de Missão</Text>
          </TouchableOpacity>
        )}

        {/* Botões de Ação */}
        {renderActionButtons(task)}
      </View>
    );
  };

  // Renderização de cada Coluna do Kanban
  const renderColumn = (col: ColumnConfig, isFullWidth = false) => {
    const colTasks = filteredTasks.filter((t) => t.status === col.status);

    return (
      <View
        key={col.status}
        style={[
          styles.column,
          isFullWidth
            ? { width: '100%', minWidth: '100%', maxWidth: '100%' }
            : isMobile
            ? { width: mobileColWidth, minWidth: mobileColWidth, maxWidth: mobileColWidth }
            : isTablet
            ? { minWidth: 260, flex: 1 }
            : { minWidth: 280, flex: 1 },
        ]}
      >
        {/* Cabeçalho da Coluna */}
        <View style={styles.columnHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <col.icon size={15} color={col.accentColor} />
            <Text style={[styles.columnTitle, { color: '#E2D8C3' }]}>{col.label}</Text>
          </View>
          <View style={[styles.badge, { borderColor: `${col.accentColor}44` }]}>
            <Text style={[styles.badgeText, { color: col.accentColor }]}>{colTasks.length}</Text>
          </View>
        </View>

        {/* Lista de Post-Its ou Estado Vazio */}
        {colTasks.length === 0 ? (
          <View style={styles.emptyColumnBox}>
            <col.icon size={26} color="#524B43" />
            <Text style={styles.emptyColumnText}>{col.emptyText}</Text>
          </View>
        ) : (
          <View style={styles.postitContainer}>{colTasks.map((t) => renderPostIt(t))}</View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, isMobile && { padding: 12 }]}>
      {/* 🧭 Topo da Página */}
      <View style={[styles.header, isMobile && { flexDirection: 'column', gap: 12 }]}>
        <View>
          <Text style={styles.pageTitle}>Tarefas da Mesa</Text>
          <Text style={styles.pageSubtitle}>
            Painel de tasks, missões e contribuições ativas da Taverna
          </Text>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={openNewTaskModal}>
          <Plus color="#110F0D" size={18} />
          <Text style={styles.createButtonText}>
            {editingTask || isDM ? 'Nova Task' : 'Sugerir Task'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* 🔍 Barra de Ferramentas: Busca & Filtros por Categoria */}
      <View style={styles.toolbarContainer}>
        {/* Campo de Busca */}
        <View style={styles.searchBarContainer}>
          <Search size={15} color="#80776C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tasks por título, descrição ou responsável..."
            placeholderTextColor="#6B6257"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={14} color="#BAAFA0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Chips de Categoria e Filtro "Minhas Tasks" */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const count =
              cat.value === 'ALL'
                ? tasks.length
                : tasks.filter((t) => t.category === cat.value).length;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                {cat.color && (
                  <View style={[styles.filterChipDot, { backgroundColor: cat.color }]} />
                )}
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}
                >
                  {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}

          {user && (
            <TouchableOpacity
              style={[styles.filterChip, onlyMyTasks && styles.filterChipMyTasksSelected]}
              onPress={() => setOnlyMyTasks(!onlyMyTasks)}
            >
              <User size={13} color={onlyMyTasks ? '#110F0D' : '#C5A059'} />
              <Text
                style={[
                  styles.filterChipText,
                  onlyMyTasks && { color: '#110F0D', fontWeight: '700' },
                ]}
              >
                Minhas Tasks ({myTasksCount})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 📱 Navegador Mobile: Abas de Fases & Modo de Exibição */}
      {isMobile && (
        <View style={styles.mobileNavWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.mobileTabBarContainer}
          >
            {COLUMNS.map((col) => {
              const count = filteredTasks.filter((t) => t.status === col.status).length;
              const isActive = activeMobileTab === col.status;
              return (
                <TouchableOpacity
                  key={col.status}
                  style={[
                    styles.mobileTabItem,
                    isActive && {
                      backgroundColor: `${col.accentColor}25`,
                      borderColor: col.accentColor,
                    },
                  ]}
                  onPress={() => setActiveMobileTab(col.status)}
                >
                  <col.icon size={13} color={isActive ? col.accentColor : '#80776C'} />
                  <Text
                    style={[
                      styles.mobileTabText,
                      isActive && { color: col.accentColor, fontWeight: '700' },
                    ]}
                  >
                    {col.shortLabel}
                  </Text>
                  <View
                    style={[
                      styles.mobileTabBadge,
                      isActive && { backgroundColor: col.accentColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileTabBadgeText,
                        isActive && { color: '#111', fontWeight: '700' },
                      ]}
                    >
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

      {/* 📋 Renderização do Quadro / Coluna */}
      {loading && tasks.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.fantasy.gold} style={{ marginTop: 50 }} />
      ) : isMobile && mobileViewMode === 'COLUMN' ? (
        // Modo Foco no Mobile: Exibe a Fase Selecionada em 100% de largura vertical, robusto e ultra-responsivo
        (() => {
          const activeCol =
            COLUMNS.find((c) => c.status === activeMobileTab) || COLUMNS[1];
          const currentIdx = COLUMNS.findIndex((c) => c.status === activeMobileTab);
          const prevCol = currentIdx > 0 ? COLUMNS[currentIdx - 1] : null;
          const nextCol = currentIdx < COLUMNS.length - 1 ? COLUMNS[currentIdx + 1] : null;

          return (
            <View style={{ width: '100%' }}>
              {renderColumn(activeCol, true)}

              {/* Navegador Inferior de Fases */}
              <View style={styles.bottomPhaseNav}>
                {prevCol ? (
                  <TouchableOpacity
                    style={styles.bottomNavBtn}
                    onPress={() => setActiveMobileTab(prevCol.status)}
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
                    onPress={() => setActiveMobileTab(nextCol.status)}
                  >
                    <Text style={styles.bottomNavText}>{nextCol.shortLabel}</Text>
                    <ChevronRight size={14} color="#BAAFA0" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })()
      ) : (
        // Modo Quadro (Kanban Horizontal) para Desktop ou modo Quadro no Mobile
        <ScrollView
          ref={boardScrollRef}
          horizontal
          style={{ flexGrow: 0, width: '100%' }}
          contentContainerStyle={[
            styles.board,
            isMobile && { gap: mobileColGap, paddingHorizontal: 2 },
          ]}
          snapToInterval={isMobile ? mobileColWidth + mobileColGap : undefined}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={true}
        >
          {COLUMNS.map((col) => renderColumn(col, false))}
        </ScrollView>
      )}

      {/* Modal Nova / Editar Task */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Editar Task' : isDM ? 'Nova Task da Mesa' : 'Sugerir Task'}
            </Text>
            <ScrollView style={{ maxHeight: 520 }}>
              <Text style={styles.label}>Título da Task</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#666"
                placeholder="Ex: Mapear as Ruínas do Norte"
              />

              <Text style={styles.label}>Descrição Detalhada (Suporta Markdown)</Text>
              <TextInput
                style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
                multiline
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#666"
                placeholder="Detalhe o objetivo da missão, pré-requisitos e passos..."
              />

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue: string) => setCategory(itemValue as TaskCategory)}
                  style={styles.picker}
                  dropdownIconColor="#E2D8C3"
                >
                  <Picker.Item label="Lore (História & Mundo)" value="LORE" />
                  <Picker.Item label="Mecânica (Regras & Fichas)" value="MECANICA" />
                  <Picker.Item label="Arte (Desenhos & Mapas)" value="ARTE" />
                  <Picker.Item label="Dev (Painel & Código)" value="DEV" />
                  <Picker.Item label="Especial (Quests Únicas)" value="ESPECIAL" />
                </Picker>
              </View>

              {isDM && (
                <>
                  <Text style={styles.label}>Recompensa (Opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={reward}
                    onChangeText={setReward}
                    placeholderTextColor="#666"
                    placeholder="Ex: 50 PO e Ponto de Inspiração"
                  />
                </>
              )}

              {editingTask && editingTask.status !== 'PARADO' && (
                <>
                  <Text style={styles.label}>Diário de Missão / Resolução (Markdown)</Text>
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                    multiline
                    value={resolution}
                    onChangeText={setResolution}
                    placeholderTextColor="#666"
                    placeholder="Registro do que foi realizado..."
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveTask}>
                <Text style={styles.btnSaveText}>
                  {editingTask || isDM ? 'Salvar Task' : 'Enviar Sugestão'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Diário de Missão (Conclusão) */}
      <Modal visible={resolutionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Diário de Missão: Conclusão</Text>
            <Text style={styles.pageSubtitle}>
              Descreva como você cumpriu &quot;{editingTask?.title}&quot;. Compartilhe detalhes,
              links de arquivos ou notas da sessão.
            </Text>

            <TextInput
              style={[styles.input, { height: 160, textAlignVertical: 'top', marginTop: 16 }]}
              multiline
              value={resolution}
              onChangeText={setResolution}
              placeholderTextColor="#666"
              placeholder="Descreva o desfecho da missão, links ou observações..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setResolutionModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveResolution}>
                <Text style={styles.btnSaveText}>Concluir Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Leitura do Diário de Missão */}
      <Modal visible={viewResolutionVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Diário de Missão: {editingTask?.title}</Text>
            <View style={styles.reportContentBox}>
              <ScrollView style={{ maxHeight: 380 }}>
                <Markdown style={darkMarkdownStyles}>
                  {editingTask?.resolution || 'Nenhum registro foi redigido para esta task.'}
                </Markdown>
              </ScrollView>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={() => setViewResolutionVisible(false)}
              >
                <Text style={styles.btnSaveText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScrollView>
  );
}

// Estilização Markdown de Alto Contraste dentro do Post-it
const markdownStyles = {
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

const darkMarkdownStyles = {
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 13,
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
    height: 40,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
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
    height: 38,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  mobileTabText: {
    color: '#80776C',
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
    height: 38,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  column: {
    backgroundColor: 'rgba(30, 26, 23, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 12,
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
  columnTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
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
    color: '#6B6257',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  postitContainer: {
    gap: 14,
    paddingBottom: 8,
  },

  // Post-It Card
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
    color: '#6B6257',
    fontWeight: '600',
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
    color: '#555',
    textDecorationLine: 'underline',
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
    fontSize: 11,
    color: '#451A03',
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 6,
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

  // Botões de Ação dentro do Post-It
  actionButtons: {
    gap: 6,
    marginTop: 4,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 5,
    minHeight: 34,
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
    flex: 1,
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
  btnUndoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
  },
  dmControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  iconBtn: {
    padding: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1A1714',
    width: '100%',
    maxWidth: 580,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 22,
  },
  modalTitle: {
    color: '#C5A059',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  label: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    color: '#FFF',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
  },
  pickerContainer: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    color: '#FFF',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 8,
  },
  reportContentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  btnCancel: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  btnCancelText: {
    color: '#BAAFA0',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnSave: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#C5A059',
  },
  btnSaveText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
