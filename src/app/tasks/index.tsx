import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { TaskData, TaskStatus, TaskCategory } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { Plus, Trash, Edit2, CheckCircle, PlayCircle, Lock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Markdown from 'react-native-markdown-display';

const POST_IT_COLORS: Record<TaskCategory, string> = {
  LORE: '#Fdfd96',
  MECANICA: '#Aec6cf',
  ARTE: '#Ffb7b2',
  DEV: '#Cfd0d3',
  ESPECIAL: '#E1c699',
};

const TAPE_COLORS = [
  'rgba(255, 100, 100, 0.4)',
  'rgba(100, 255, 100, 0.4)',
  'rgba(100, 150, 255, 0.4)',
  'rgba(255, 200, 100, 0.4)',
  'rgba(200, 100, 255, 0.4)',
];

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      loadTasks();
    }, 0);
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
        await ApiService.updateTask(editingTask.id, { title, description, category, reward, resolution });
      } else {
        await ApiService.createTask({ title, description, category, reward, resolution, status: 'PARADO' });
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
      await ApiService.updateTask(editingTask.id, { status: 'FINALIZADO', resolution });
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Deletar essa tarefa para sempre?')) {
      setLoading(true);
      await ApiService.deleteTask(id);
      await loadTasks();
    }
  };

  const handleUpdateStatus = async (task: TaskData, newStatus: TaskStatus) => {
    // Interceptar FINALIZADO para pedir resolução
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

  const renderActionButtons = (task: TaskData) => {
    if (!user) return <Text style={styles.loginRequired}>Faça login para interagir</Text>;

    const isMine = task.assignedTo === user.name;

    return (
      <View style={styles.actionButtons}>
        {task.status === 'PARADO' && (
          <TouchableOpacity style={styles.btnTake} onPress={() => handleUpdateStatus(task, 'ANDAMENTO')}>
            <PlayCircle color="#111" size={16} />
            <Text style={styles.btnText}>Assumir</Text>
          </TouchableOpacity>
        )}
        
        {task.status === 'ANDAMENTO' && isMine && (
          <>
            <TouchableOpacity style={styles.btnFinish} onPress={() => handleUpdateStatus(task, 'FINALIZADO')}>
              <CheckCircle color="#111" size={16} />
              <Text style={styles.btnText}>Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnUndo} onPress={() => handleUpdateStatus(task, 'PARADO')}>
              <Text style={styles.btnUndoText}>Desistir</Text>
            </TouchableOpacity>
          </>
        )}

        {task.status === 'FINALIZADO' && isMine && (
          <TouchableOpacity style={styles.btnUndo} onPress={() => handleUpdateStatus(task, 'ANDAMENTO')}>
            <Text style={styles.btnUndoText}>Reabrir</Text>
          </TouchableOpacity>
        )}

        {isDM && (
          <>
            {task.status === 'FINALIZADO' && (
              <TouchableOpacity style={styles.btnApprove} onPress={() => handleUpdateStatus(task, 'APROVADO')}>
                <Lock color="#fff" size={16} />
                <Text style={[styles.btnText, { color: '#fff' }]}>Aprovar (Arquivar)</Text>
              </TouchableOpacity>
            )}
            
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => openEditTaskModal(task)} style={styles.iconBtn}>
                <Edit2 color="#444" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.iconBtn}>
                <Trash color="#B82828" size={16} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderColumn = (status: TaskStatus, label: string) => {
    const colTasks = tasks.filter(t => t.status === status);
    return (
      <View style={[styles.column, isMobile && { flexGrow: 0, flexShrink: 0, width: width - 24, minWidth: width - 24 }]}>
        <View style={styles.columnHeader}>
          <Text style={styles.columnTitle}>{label}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{colTasks.length}</Text>
          </View>
        </View>
        <ScrollView style={styles.columnScroll} contentContainerStyle={styles.postitContainer}>
          {colTasks.map(task => {
            const charCode = task.id.charCodeAt(task.id.length - 1);
            const tapeColor = TAPE_COLORS[charCode % TAPE_COLORS.length];
            const rotation = (task.id.charCodeAt(0) % 5) - 2;

            return (
              <View 
                key={task.id} 
                style={[
                  styles.postIt, 
                  { backgroundColor: POST_IT_COLORS[task.category] || '#Fdfd96', transform: [{ rotate: `${rotation}deg` }] },
                  // @ts-ignore
                  Platform.OS === 'web' && { transition: 'transform 0.2s', cursor: 'pointer' }
                ]}
                // @ts-ignore
                onMouseEnter={(e: any) => { if(Platform.OS==='web') e.currentTarget.style.transform = `scale(1.03) rotate(0deg)`; }}
                onMouseLeave={(e: any) => { if(Platform.OS==='web') e.currentTarget.style.transform = `scale(1) rotate(${rotation}deg)`; }}
              >
                <View style={[styles.tape, { backgroundColor: tapeColor }]} />
                <View style={styles.postItHeader}>
                  <Text style={styles.postItCategory}>{task.category}</Text>
                  <Text style={styles.postItDate}>{new Date(task.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.postItTitle}>{task.title}</Text>
                
                <View style={styles.postItDesc}>
                  <Markdown style={markdownStyles}>
                    {task.description}
                  </Markdown>
                </View>

                {!!task.resolution && (task.status === 'FINALIZADO' || task.status === 'APROVADO') && (
                  <TouchableOpacity style={styles.viewResolutionBtn} onPress={() => openViewResolution(task)}>
                    <Text style={styles.viewResolutionText}>📖 Ler Relatório</Text>
                  </TouchableOpacity>
                )}
                
                {!!task.reward && (
                  <View style={styles.rewardBox}>
                    <Text style={styles.rewardLabel}>Recompensa:</Text>
                    <Text style={styles.rewardText}>{task.reward}</Text>
                  </View>
                )}

                {task.assignedTo && (
                  <View style={styles.assignedBox}>
                    <Text style={styles.assignedText}>Assumido por: <Text style={{ fontWeight: 'bold' }}>{task.assignedTo}</Text></Text>
                  </View>
                )}
                
                {renderActionButtons(task)}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, isMobile && { padding: 12 }]}>
      <View style={[styles.header, isMobile && { flexDirection: 'column', gap: 12 }]}>
        <View>
          <Text style={styles.pageTitle}>Tarefas da Mesa</Text>
          <Text style={styles.pageSubtitle}>Quadro de missões e contribuições da Taverna</Text>
        </View>
        {isDM && (
          <TouchableOpacity style={styles.createButton} onPress={openNewTaskModal}>
            <Plus color="#110F0D" size={20} />
            <Text style={styles.createButtonText}>Nova Tarefa</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && tasks.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.fantasy.gold} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView 
          horizontal 
          style={styles.boardScroll} 
          contentContainerStyle={styles.board}
          snapToInterval={isMobile ? (width - 24) + 16 : 0} // column width + gap
          decelerationRate="fast"
          showsHorizontalScrollIndicator={!isMobile}
        >
          {renderColumn('PARADO', 'PARADO (ABERTAS)')}
          {renderColumn('ANDAMENTO', 'EM ANDAMENTO')}
          {renderColumn('FINALIZADO', 'FINALIZADO')}
          {renderColumn('APROVADO', 'APROVADO (ARQUIVO)')}
        </ScrollView>
      )}

      {/* Modal Nova/Editar Tarefa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
            <ScrollView style={{ maxHeight: 600 }}>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#666" placeholder="Ex: Criar arte do Rei" />

              <Text style={styles.label}>Descrição detalhada (Aceita Markdown)</Text>
              <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline value={description} onChangeText={setDescription} placeholderTextColor="#666" placeholder="Detalhes do que precisa ser feito..." />

              {editingTask && editingTask.status !== 'PARADO' && (
                <>
                  <Text style={styles.label}>Resolução / Relatório (Aceita Markdown)</Text>
                  <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline value={resolution} onChangeText={setResolution} placeholderTextColor="#666" placeholder="O que foi feito..." />
                </>
              )}

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue: string) => setCategory(itemValue as TaskCategory)}
                  style={styles.picker}
                  dropdownIconColor="#E2D8C3"
                >
                  <Picker.Item label="Lore (História)" value="LORE" />
                  <Picker.Item label="Mecânica (Regras)" value="MECANICA" />
                  <Picker.Item label="Arte (Desenhos/Mapas)" value="ARTE" />
                  <Picker.Item label="Dev (Painel/Código)" value="DEV" />
                  <Picker.Item label="Especial" value="ESPECIAL" />
                </Picker>
              </View>

              <Text style={styles.label}>Recompensa (Opcional)</Text>
              <TextInput style={styles.input} value={reward} onChangeText={setReward} placeholderTextColor="#666" placeholder="Ex: 50 PO e Inspiração" />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveTask}>
                <Text style={styles.btnSaveText}>Salvar Tarefa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Conclusão / Relatório (Diário de Missão) */}
      <Modal visible={resolutionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Diário de Missão</Text>
            <Text style={styles.pageSubtitle}>Descreva como você completou "{editingTask?.title}". Você pode usar links, negrito, etc.</Text>
            
            <TextInput 
              style={[styles.input, { height: 160, textAlignVertical: 'top', marginTop: 16 }]} 
              multiline 
              value={resolution} 
              onChangeText={setResolution} 
              placeholderTextColor="#666" 
              placeholder="Descreva a solução, links do drive, PR do github, etc..." 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setResolutionModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveResolution}>
                <Text style={styles.btnSaveText}>Enviar Relatório</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Leitura de Relatório */}
      <Modal visible={viewResolutionVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Relatório: {editingTask?.title}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, marginTop: 12, maxHeight: 400 }}>
              <ScrollView>
                <Markdown style={darkMarkdownStyles}>
                  {editingTask?.resolution || 'Nenhum relatório foi escrito para esta tarefa.'}
                </Markdown>
              </ScrollView>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSave} onPress={() => setViewResolutionVisible(false)}>
                <Text style={styles.btnSaveText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const markdownStyles = {
  body: {
    color: '#333',
    fontSize: 13,
    lineHeight: 18,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  link: {
    color: '#0056b3',
    textDecorationLine: 'underline',
  }
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
  }
} as any;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#161311',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pageTitle: {
    color: '#E6C280',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  pageSubtitle: {
    color: '#BAAFA0',
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  boardScroll: {
    flex: 1,
  },
  board: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 20,
    minWidth: '100%',
  },
  column: {
    flex: 1,
    minWidth: 280,
    height: '100%',
    backgroundColor: 'rgba(36, 32, 28, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 12,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 8,
  },
  columnTitle: {
    color: '#E2D8C3',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#1A1714',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5C4E40',
  },
  badgeText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
  },
  columnScroll: {
    flex: 1,
  },
  postitContainer: {
    gap: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  postIt: {
    padding: 16,
    paddingTop: 20,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
  },
  tape: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 60,
    height: 20,
    transform: [{ rotate: '-2deg' }],
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  postItHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  postItCategory: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  postItDate: {
    fontSize: 10,
    color: '#555',
  },
  postItTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Caveat", "Comic Sans MS", cursive' : undefined,
  },
  postItDesc: {
    marginBottom: 12,
  },
  viewResolutionBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewResolutionText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 11,
  },
  rewardBox: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  rewardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
  },
  rewardText: {
    fontSize: 12,
    color: '#111',
    fontWeight: '600',
  },
  assignedBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginBottom: 8,
  },
  assignedText: {
    fontSize: 11,
    color: '#222',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  loginRequired: {
    fontSize: 11,
    color: '#B82828',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  btnTake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  btnFinish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 139, 34, 0.2)', // Verde clarinho
    borderWidth: 1,
    borderColor: '#228B22',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  btnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B82828',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    width: '100%',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111',
  },
  btnUndo: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnUndoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    textDecorationLine: 'underline',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1A1714',
    width: '100%',
    maxWidth: 600,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 24,
  },
  modalTitle: {
    color: '#C5A059',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  label: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    color: '#fff',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  btnCancelText: {
    color: '#BAAFA0',
    fontWeight: 'bold',
  },
  btnSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#C5A059',
  },
  btnSaveText: {
    color: '#110F0D',
    fontWeight: 'bold',
  }
});
