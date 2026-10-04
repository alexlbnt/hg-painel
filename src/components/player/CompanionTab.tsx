import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CompanionData,
  createEmptyCompanion,
  parseCompanionList,
  serializeCompanionList,
} from '@/types/companion';
import { CompanionHeader } from './companion/CompanionHeader';
import { CompanionVitalsPanel } from './companion/CompanionVitalsPanel';
import { CompanionAttributesGrid } from './companion/CompanionAttributesGrid';
import { CompanionSkillsSenses } from './companion/CompanionSkillsSenses';
import { CompanionActionsSection } from './companion/CompanionActionsSection';
import { CompanionInventorySection } from './companion/CompanionInventorySection';
import { CompanionNotesSection } from './companion/CompanionNotesSection';
import { PawPrint, Plus } from 'lucide-react-native';

interface CompanionTabProps {
  companionRaw?: string | null;
  onSaveCompanion: (serialized: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionTab: React.FC<CompanionTabProps> = ({
  companionRaw,
  onSaveCompanion,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<CompanionData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Parse do companion salvo no banco de dados
  const companionList = useMemo(() => {
    return parseCompanionList(companionRaw);
  }, [companionRaw]);

  // Garante que o selectedIndex esteja dentro dos limites
  const safeIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, companionList.length - 1)
  );
  const currentCompanion: CompanionData | undefined = companionList[safeIndex];

  // Companheiro ativo na tela: se em edição, usa o rascunho em memória; senão, o salvo
  const activeCompanion: CompanionData =
    editingCompanion ||
    currentCompanion ||
    createEmptyCompanion();

  const triggerFeedback = (msg: string = 'Companheiro salvo') => {
    setSaveFeedback(msg);
    setTimeout(() => {
      setSaveFeedback(null);
    }, 2500);
  };

  // Salva a lista inteira serializada no backend
  const persistList = (newList: CompanionData[], feedbackMsg?: string) => {
    onSaveCompanion(serializeCompanionList(newList));
    if (feedbackMsg) {
      triggerFeedback(feedbackMsg);
    }
  };

  // Inicia o cadastro do primeiro companheiro (totalmente em branco)
  const handleCreateFirst = () => {
    const fresh = createEmptyCompanion();
    setEditingCompanion(fresh);
    setIsNew(true);
    setIsEditing(true);
  };

  // Adiciona mais um companheiro à lista (totalmente em branco)
  const handleAddNew = () => {
    const fresh = createEmptyCompanion();
    setEditingCompanion(fresh);
    setIsNew(true);
    setIsEditing(true);
  };

  // Inicia edição do companheiro selecionado
  const handleStartEdit = () => {
    if (!currentCompanion) return;
    setEditingCompanion({ ...currentCompanion });
    setIsNew(false);
    setIsEditing(true);
  };

  // Cancela a edição e descarta alterações não salvas
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsNew(false);
    setEditingCompanion(null);
  };

  // Atualiza o rascunho em memória enquanto o usuário digita (SEM enviar requisição ao backend)
  const handleDraftUpdate = (partial: Partial<CompanionData>) => {
    if (isEditing) {
      setEditingCompanion((prev) => {
        const base = prev || currentCompanion || createEmptyCompanion();
        return { ...base, ...partial };
      });
    } else {
      updateCurrentCompanion(partial, true);
    }
  };

  // Salva definitivamente todas as alterações no banco de dados
  const handleSaveHeader = (updatedFromHeader: Partial<CompanionData>) => {
    const base = editingCompanion || currentCompanion || createEmptyCompanion();
    const finalCompanion: CompanionData = {
      ...base,
      ...updatedFromHeader,
      name: (updatedFromHeader.name !== undefined ? updatedFromHeader.name : base.name || '').trim() || 'Companheiro',
      species: (updatedFromHeader.species !== undefined ? updatedFromHeader.species : base.species || '').trim(),
      bondType: updatedFromHeader.bondType || base.bondType || 'Companheiro Animal',
      size: updatedFromHeader.size || base.size || 'Médio',
    };

    let updatedList: CompanionData[];
    if (isNew) {
      updatedList = [...companionList, finalCompanion];
      setSelectedIndex(updatedList.length - 1);
    } else {
      updatedList = [...companionList];
      if (updatedList.length === 0) {
        updatedList = [finalCompanion];
        setSelectedIndex(0);
      } else {
        updatedList[safeIndex] = finalCompanion;
      }
    }

    persistList(updatedList, 'Companheiro salvo com sucesso');
    setIsEditing(false);
    setIsNew(false);
    setEditingCompanion(null);
  };

  // Exclui uma criatura
  const handleDeleteCompanion = (id: string) => {
    const updatedList = companionList.filter((c) => c.id !== id);
    setSelectedIndex(0);
    setIsEditing(false);
    setIsNew(false);
    setEditingCompanion(null);
    persistList(updatedList, 'Criatura desvinculada');
  };

  // Atualiza a criatura atualmente selecionada (usado para ações imediatas como dano/cura)
  const updateCurrentCompanion = (partial: Partial<CompanionData>, autoSave: boolean = true) => {
    if (!currentCompanion) return;
    const updatedCompanion = { ...currentCompanion, ...partial };
    const updatedList = [...companionList];
    updatedList[safeIndex] = updatedCompanion;

    if (autoSave) {
      persistList(updatedList);
    }
  };

  // Atualiza pontos de vida (ações rápidas de combate)
  const handleUpdateHp = (currentHp: number, tempHp?: number) => {
    if (isEditing) {
      handleDraftUpdate({
        currentHp,
        ...(tempHp !== undefined ? { tempHp } : {}),
      });
    } else {
      updateCurrentCompanion({
        currentHp,
        ...(tempHp !== undefined ? { tempHp } : {}),
      }, true);
    }
  };

  // Se não houver nenhum companheiro cadastrado e NÃO estiver criando um novo: Empty State
  if (companionList.length === 0 && !isEditing) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCard, { borderColor: themeColor + '40' }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: themeColor + '15' }]}>
            <PawPrint size={36} color={themeColor} />
          </View>

          <Text style={[styles.emptyTitle, { color: themeColor }]}>
            NENHUM COMPANHEIRO OU FAMILIAR VINCULADO
          </Text>

          <Text style={styles.emptyDesc}>
            Vincule criaturas aliadas ao seu personagem para gerenciar em combate e roleplay:
            animais do patrulheiro, familiares arcanos, montarias de batalha ou mascotes da taverna.
          </Text>

          <TouchableOpacity
            style={[styles.createFirstBtn, { backgroundColor: themeColor }]}
            onPress={handleCreateFirst}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#110F0D" />
            <Text style={styles.createFirstBtnText}>Vincular Companheiro / Familiar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Lista de companheiros para exibir nas abas do cabeçalho
  const allCompanionsForHeader = isNew && editingCompanion
    ? [...companionList, editingCompanion]
    : companionList.length > 0
    ? companionList
    : [activeCompanion];

  const selectedIndexForHeader = isNew
    ? allCompanionsForHeader.length - 1
    : safeIndex;

  return (
    <View style={styles.container}>
      {/* Indicador de feedback rápido */}
      {saveFeedback && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {saveFeedback}</Text>
        </View>
      )}

      {/* 1. CABEÇALHO DE IDENTIFICAÇÃO E FOTO */}
      <CompanionHeader
        companion={activeCompanion}
        allCompanions={allCompanionsForHeader}
        selectedIndex={selectedIndexForHeader}
        onSelectIndex={(idx) => {
          setSelectedIndex(idx);
          setIsEditing(false);
          setIsNew(false);
          setEditingCompanion(null);
        }}
        onAddNewCompanion={handleAddNew}
        onDeleteCompanion={handleDeleteCompanion}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveHeader}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 2. STATUS DE COMBATE (CA, PV, DANO/CURA, DESL., INIC., PB) */}
      <CompanionVitalsPanel
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdateHp={handleUpdateHp}
        onUpdateVitals={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 3. ATRIBUTOS BASE (FOR, DES, CON, INT, SAB, CAR COM MODIFICADORES) */}
      <CompanionAttributesGrid
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdateAttributes={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 4. PERÍCIAS & SENTIDOS */}
      <CompanionSkillsSenses
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdate={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 5. AÇÕES & HABILIDADES ESPECIAIS (ATAQUES E TRAÇOS DINÂMICOS) */}
      <CompanionActionsSection
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdate={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 6. EQUIPAMENTOS, SELAS, BARDING & CAPACIDADE DE CARGA */}
      <CompanionInventorySection
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdate={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 7. NOTAS, COMPORTAMENTO & HISTÓRICO */}
      <CompanionNotesSection
        companion={activeCompanion}
        isEditing={isEditing}
        onUpdate={handleDraftUpdate}
        themeColor={themeColor}
        isMobile={isMobile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  feedbackBanner: {
    backgroundColor: '#1E2B1E',
    borderWidth: 1,
    borderColor: '#3E6641',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  feedbackText: {
    color: '#81C784',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3025',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#9E9283',
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  createFirstBtnText: {
    color: '#110F0D',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
});
