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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const POST_IT_COLORS: Record<TaskCategory, string> = {
  LORE: '#Fdfd96',
  MECANICA: '#Aec6cf',
  ARTE: '#Ffb7b2',
  DEV: '#Cfd0d3',
  ESPECIAL: '#E1c699',
};

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('LORE');
  const [reward, setReward] = useState('');

  const isDM = user?.role === 'DM';

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
    loadTasks();
  }, []);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('LORE');
    setReward('');
    setModalVisible(true);
  };

  const openEditTaskModal = (t: TaskData) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setReward(t.reward);
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    setModalVisible(false);
    try {
      if (editingTask) {
        await ApiService.updateTask(editingTask.id, { title, description, category, reward });
      } else {
        await ApiService.createTask({ title, description, category, reward, status: 'PARADO' });
      }
      await loadTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      <View style={styles.column}>
        <View style={styles.columnHeader}>
          <Text style={styles.columnTitle}>{label}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{colTasks.length}</Text>
          </View>
        </View>
        <ScrollView style={styles.columnScroll} contentContainerStyle={styles.postitContainer}>
          {colTasks.map(task => (
            <View key={task.id} style={[styles.postIt, { backgroundColor: POST_IT_COLORS[task.category] || '#Fdfd96' }]}>
              <View style={styles.pin} />
              <View style={styles.postItHeader}>
                <Text style={styles.postItCategory}>{task.category}</Text>
                <Text style={styles.postItDate}>{new Date(task.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.postItTitle}>{task.title}</Text>
              <Text style={styles.postItDesc}>{task.description}</Text>
              
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
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        <ScrollView horizontal style={styles.boardScroll} contentContainerStyle={styles.board}>
          {renderColumn('PARADO', 'PARADO (ABERTAS)')}
          {renderColumn('ANDAMENTO', 'EM ANDAMENTO')}
          {renderColumn('FINALIZADO', 'FINALIZADO')}
          {renderColumn('APROVADO', 'APROVADO (ARQUIVO)')}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
            
            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#666" placeholder="Ex: Criar arte do Rei" />

            <Text style={styles.label}>Descrição detalhada</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline value={description} onChangeText={setDescription} placeholderTextColor="#666" placeholder="Detalhes do que precisa ser feito..." />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#161311', // Fundo de madeira escura
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
  },
  column: {
    width: 320,
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
  },
  postIt: {
    padding: 16,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    transform: [{ rotate: '-1deg' }],
  },
  pin: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BAAFA0',
    borderWidth: 2,
    borderColor: '#736B60',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.5,
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
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
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
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1A1714',
    width: '100%',
    maxWidth: 500,
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
