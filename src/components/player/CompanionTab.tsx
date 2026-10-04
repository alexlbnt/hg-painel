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
import { HeartHandshake, PawPrint, Plus } from 'lucide-react-native';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Parse do companion salvo
  const companionList = useMemo(() => {
    return parseCompanionList(companionRaw);
  }, [companionRaw]);

  // Garante que o selectedIndex esteja dentro dos limites
  const safeIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, companionList.length - 1)
  );
  const currentCompanion: CompanionData | undefined = companionList[safeIndex];

  const triggerFeedback = (msg: string = 'Companheiro atualizado') => {
    setSaveFeedback(msg);
    setTimeout(() => {
      setSaveFeedback(null);
    }, 2500);
  };

  // Salva a lista inteira serializada
  const persistList = (newList: CompanionData[], feedbackMsg?: string) => {
    onSaveCompanion(serializeCompanionList(newList));
    triggerFeedback(feedbackMsg);
  };

  // Cria um primeiro companheiro
  const handleCreateFirst = () => {
    const fresh = createEmptyCompanion();
    const updatedList = [fresh];
    setSelectedIndex(0);
    setIsEditing(true);
    persistList(updatedList, 'Novo companheiro vinculado');
  };

  // Adiciona mais um companheiro à lista
  const handleAddNew = () => {
    const fresh = createEmptyCompanion();
    fresh.name = `Companheiro ${companionList.length + 1}`;
    fresh.species = 'Montaria';
    fresh.bondType = 'Montaria';
    const updatedList = [...companionList, fresh];
    setSelectedIndex(updatedList.length - 1);
    setIsEditing(true);
    persistList(updatedList, 'Nova criatura adicionada');
  };

  // Exclui uma criatura
  const handleDeleteCompanion = (id: string) => {
    const updatedList = companionList.filter((c) => c.id !== id);
    setSelectedIndex(0);
    persistList(updatedList, 'Criatura desvinculada');
  };

  // Atualiza a criatura atualmente selecionada
  const updateCurrentCompanion = (partial: Partial<CompanionData>, autoSave: boolean = true) => {
    if (!currentCompanion) return;
    const updatedCompanion = { ...currentCompanion, ...partial };
    const updatedList = [...companionList];
    updatedList[safeIndex] = updatedCompanion;

    if (autoSave) {
      persistList(updatedList);
    }
  };

  // Atualiza pontos de vida
  const handleUpdateHp = (currentHp: number, tempHp?: number) => {
    updateCurrentCompanion({
      currentHp,
      ...(tempHp !== undefined ? { tempHp } : {}),
    });
  };

  // Salva no fechamento do modo de edição
  const handleSaveHeader = (updated: Partial<CompanionData>) => {
    updateCurrentCompanion(updated);
    setIsEditing(false);
  };

  // Se não houver nenhum companheiro cadastrado: Empty State
  if (companionList.length === 0) {
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
        companion={currentCompanion}
        allCompanions={companionList}
        selectedIndex={safeIndex}
        onSelectIndex={(idx) => {
          setSelectedIndex(idx);
          setIsEditing(false);
        }}
        onAddNewCompanion={handleAddNew}
        onDeleteCompanion={handleDeleteCompanion}
        isEditing={isEditing}
        onStartEdit={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
        onSaveEdit={handleSaveHeader}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 2. STATUS DE COMBATE (CA, PV, DANO/CURA, DESL., INIC., PB) */}
      <CompanionVitalsPanel
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdateHp={handleUpdateHp}
        onUpdateVitals={(updated) => updateCurrentCompanion(updated)}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 3. ATRIBUTOS BASE (FOR, DES, CON, INT, SAB, CAR COM MODIFICADORES) */}
      <CompanionAttributesGrid
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdateAttributes={(attrs) => updateCurrentCompanion(attrs)}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 4. PERÍCIAS, SENTIDOS E CONDIÇÕES */}
      <CompanionSkillsSenses
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdate={(updated) => updateCurrentCompanion(updated)}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 5. AÇÕES & HABILIDADES ESPECIAIS (ATAQUES E TRAÇOS DINÂMICOS) */}
      <CompanionActionsSection
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdate={(updated) => updateCurrentCompanion(updated)}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 6. EQUIPAMENTOS, SELAS, BARDING & CAPACIDADE DE CARGA */}
      <CompanionInventorySection
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdate={(updated) => updateCurrentCompanion(updated)}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* 7. NOTAS, COMPORTAMENTO & HISTÓRICO */}
      <CompanionNotesSection
        companion={currentCompanion}
        isEditing={isEditing}
        onUpdate={(updated) => updateCurrentCompanion(updated)}
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
