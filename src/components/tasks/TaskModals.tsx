import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Markdown from 'react-native-markdown-display';
import { AlertCircle } from 'lucide-react-native';
import { TaskData } from '@/lib/mockData';
import { TASK_LIMITS, TaskCategory } from '@/lib/taskRules';
import { BODY_FONT, darkMarkdownStyles, NOTICE_FONT } from './taskTheme';

const errorMessage = (e: unknown) =>
  e instanceof Error && e.message ? e.message : 'Algo deu errado. Tente novamente.';

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <AlertCircle size={14} color="#FCA5A5" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <Text style={[styles.counter, over && { color: '#FCA5A5' }]}>{value.length}/{max}</Text>;
}

function ModalButtons({
  onCancel,
  onConfirm,
  confirmLabel,
  submitting,
  cancelLabel = 'Cancelar',
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  submitting?: boolean;
  cancelLabel?: string;
}) {
  return (
    <View style={styles.modalButtons}>
      <TouchableOpacity style={styles.btnCancel} onPress={onCancel} disabled={submitting} accessibilityRole="button">
        <Text style={styles.btnCancelText}>{cancelLabel}</Text>
      </TouchableOpacity>
      {onConfirm && (
        <TouchableOpacity
          style={[styles.btnSave, submitting && { opacity: 0.6 }]}
          onPress={onConfirm}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting && <ActivityIndicator size="small" color="#110F0D" />}
          <Text style={styles.btnSaveText}>{confirmLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export interface TaskFormValues {
  title: string;
  description: string;
  category: TaskCategory;
  reward: string;
  resolution: string;
}

interface TaskFormModalProps {
  visible: boolean;
  /** Task em edição; ausente para nova task/sugestão. */
  task: TaskData | null;
  isManager: boolean;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onClose: () => void;
}

/** Criação e edição. Só fecha depois que o servidor confirma; em caso de erro, mantém o texto. */
export function TaskFormModal({ visible, task, isManager, onSubmit, onClose }: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    description: '',
    category: 'LORE',
    reward: '',
    resolution: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setValues({
      title: task?.title ?? '',
      description: task?.description ?? '',
      category: task?.category ?? 'LORE',
      reward: task?.reward ?? '',
      resolution: task?.resolution ?? '',
    });
    setSubmitted(false);
    setError(null);
  }, [visible, task]);

  const set = (field: keyof TaskFormValues) => (text: string) => setValues((v) => ({ ...v, [field]: text }));

  const titleError = !values.title.trim()
    ? 'Informe o título'
    : values.title.trim().length > TASK_LIMITS.title
    ? `Máximo de ${TASK_LIMITS.title} caracteres`
    : null;
  const descriptionError = !values.description.trim()
    ? 'Descreva o objetivo da tarefa'
    : values.description.trim().length > TASK_LIMITS.description
    ? `Máximo de ${TASK_LIMITS.description} caracteres`
    : null;

  const showResolution = isManager && !!task && !['SUGERIDO', 'RECUSADO', 'PARADO'].includes(task.status);
  const isEdit = !!task;
  const isResubmit = !isManager && task?.status === 'RECUSADO';

  const handleSubmit = async () => {
    setSubmitted(true);
    if (titleError || descriptionError) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit ? (isResubmit ? 'Ajustar e reenviar sugestão' : 'Editar tarefa') : isManager ? 'Nova tarefa' : 'Sugerir tarefa';
  const confirmLabel = isEdit
    ? isResubmit
      ? 'Reenviar sugestão'
      : 'Salvar alterações'
    : isManager
    ? 'Criar tarefa'
    : 'Enviar sugestão';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          {!isManager && !isEdit && (
            <Text style={styles.modalHint}>Sua sugestão aparece na coluna Sugestões até o Mestre aprovar ou recusar.</Text>
          )}
          {isResubmit && !!task?.reviewNote && (
            <Text style={styles.modalHint}>Motivo da recusa: {task.reviewNote}</Text>
          )}
          <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
            <View style={styles.labelRow}>
              <Text style={styles.label}>Título</Text>
              <Counter value={values.title} max={TASK_LIMITS.title} />
            </View>
            <TextInput
              style={[styles.input, submitted && titleError && styles.inputError]}
              value={values.title}
              onChangeText={set('title')}
              placeholderTextColor="#666"
              placeholder="Ex: Mapear as Ruínas do Norte"
              accessibilityLabel="Título da tarefa"
            />
            {submitted && titleError && <Text style={styles.fieldError}>{titleError}</Text>}

            <Text style={styles.label}>Descrição (aceita Markdown)</Text>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: 'top' }, submitted && descriptionError && styles.inputError]}
              multiline
              value={values.description}
              onChangeText={set('description')}
              placeholderTextColor="#666"
              placeholder="Detalhe o objetivo da missão, pré-requisitos e passos..."
              accessibilityLabel="Descrição da tarefa"
            />
            {submitted && descriptionError && <Text style={styles.fieldError}>{descriptionError}</Text>}

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={values.category}
                onValueChange={(itemValue: string) => setValues((v) => ({ ...v, category: itemValue as TaskCategory }))}
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

            {isManager && (
              <>
                <Text style={styles.label}>Recompensa (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={values.reward}
                  onChangeText={set('reward')}
                  placeholderTextColor="#666"
                  placeholder="Ex: 50 PO e Ponto de Inspiração"
                  maxLength={TASK_LIMITS.reward}
                />
              </>
            )}

            {showResolution && (
              <>
                <Text style={styles.label}>Diário de missão (aceita Markdown)</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  multiline
                  value={values.resolution}
                  onChangeText={set('resolution')}
                  placeholderTextColor="#666"
                  placeholder="Registro do que foi realizado..."
                />
              </>
            )}
          </ScrollView>

          <ErrorBox message={error} />
          <ModalButtons onCancel={onClose} onConfirm={handleSubmit} confirmLabel={confirmLabel} submitting={submitting} />
        </View>
      </View>
    </Modal>
  );
}

export interface NoteModalConfig {
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  maxLength: number;
  requiredMessage: string;
  onSubmit: (text: string) => Promise<void>;
}

/** Texto obrigatório antes de uma ação: Diário de Missão, motivo da recusa ou ajustes pedidos. */
export function TaskNoteModal({ config, onClose }: { config: NoteModalConfig | null; onClose: () => void }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setText(config.initialValue ?? '');
    setError(null);
  }, [config]);

  const handleSubmit = async () => {
    if (!config) return;
    if (!text.trim()) {
      setError(config.requiredMessage);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await config.onSubmit(text.trim());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!config} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{config?.title}</Text>
          <Text style={styles.modalHint}>{config?.description}</Text>
          <View style={styles.labelRow}>
            <View />
            <Counter value={text} max={config?.maxLength ?? 0} />
          </View>
          <TextInput
            style={[styles.input, { height: 160, textAlignVertical: 'top' }]}
            multiline
            value={text}
            onChangeText={setText}
            placeholderTextColor="#666"
            placeholder={config?.placeholder}
            autoFocus
          />
          <ErrorBox message={error} />
          <ModalButtons
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel={config?.confirmLabel}
            submitting={submitting}
          />
        </View>
      </View>
    </Modal>
  );
}

export function ResolutionViewModal({ task, onClose }: { task: TaskData | null; onClose: () => void }) {
  return (
    <Modal visible={!!task} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{task?.title}</Text>
          {!!task?.assignedTo && <Text style={styles.modalHint}>Diário de missão de {task.assignedTo}</Text>}
          <View style={styles.reportContentBox}>
            <ScrollView style={{ maxHeight: 380 }}>
              <Markdown style={darkMarkdownStyles}>
                {task?.resolution || 'Nenhum diário foi escrito para esta tarefa.'}
              </Markdown>
            </ScrollView>
          </View>
          <ModalButtons onCancel={onClose} cancelLabel="Fechar" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    color: '#E6C280',
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 8,
    fontFamily: NOTICE_FONT,
  },
  modalHint: {
    color: '#BAAFA0',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 21,
    fontFamily: BODY_FONT,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 12,
  },
  counter: {
    color: '#80776C',
    fontSize: 11,
    marginBottom: 5,
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
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    minHeight: 40,
    justifyContent: 'center',
  },
  btnCancelText: {
    color: '#BAAFA0',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#C5A059',
    minHeight: 40,
  },
  btnSaveText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
