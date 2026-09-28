import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import {
  CharacterAppearance,
  parseCharacterLore,
  serializeCharacterLore,
} from '@/types/lore';
import { IdentityHeader } from './lore/IdentityHeader';
import { PersonalityPillars } from './lore/PersonalityPillars';
import { PhysicalAppearance } from './lore/PhysicalAppearance';
import { ChronicleBiography } from './lore/ChronicleBiography';
import { CardShowcaseSection } from './lore/CardShowcaseSection';
import { Sparkles, BookOpen, User } from 'lucide-react-native';

interface LoreTabProps {
  char: CharacterData;
  onSaveLore: (newLore: string, extraUpdates?: Partial<CharacterData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

type MobileTab = 'roleplay' | 'bio' | 'appearance';

export const LoreTab: React.FC<LoreTabProps> = ({
  char,
  onSaveLore,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [mobileSubTab, setMobileSubTab] = useState<MobileTab>('roleplay');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Faz o parse do lore estruturado ou recupera texto legado com segurança
  const parsedLore = useMemo(() => {
    return parseCharacterLore(char.lore);
  }, [char.lore]);

  const triggerFeedback = (msg: string = 'Salvo com sucesso') => {
    setSaveFeedback(msg);
    setTimeout(() => {
      setSaveFeedback(null);
    }, 2500);
  };

  const handleSaveIdentity = (data: { alignment: string; background: string; deity: string }) => {
    onSaveLore(char.lore || '', {
      alignment: data.alignment,
      background: data.background,
      deity: data.deity,
    });
    triggerFeedback('Identidade atualizada');
  };

  const handleSavePillars = (pillars: {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  }) => {
    const updated = {
      ...parsedLore,
      ...pillars,
    };
    onSaveLore(serializeCharacterLore(updated));
    triggerFeedback('Pilares de roleplay salvos');
  };

  const handleSaveAppearance = (appearance: CharacterAppearance) => {
    const updated = {
      ...parsedLore,
      appearance,
    };
    onSaveLore(serializeCharacterLore(updated));
    triggerFeedback('Aparência física atualizada');
  };

  const handleSaveBackstory = (backstory: string) => {
    const updated = {
      ...parsedLore,
      backstory,
    };
    onSaveLore(serializeCharacterLore(updated));
    triggerFeedback('Lore salva');
  };

  const handleSaveCardShowcase = (data: { description: string; avatarUrl: string }) => {
    const updated = {
      ...parsedLore,
      description: data.description,
    };
    onSaveLore(serializeCharacterLore(updated), {
      description: data.description,
      avatarUrl: data.avatarUrl,
    });
    triggerFeedback('Apresentação do card atualizada');
  };

  return (
    <View style={styles.container}>
      {/* Indicador sutil de feedback de salvamento */}
      {saveFeedback && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {saveFeedback}</Text>
        </View>
      )}

      {/* Cabeçalho de Identidade & Crenças (Tendência, Antecedente, Divindade) */}
      <IdentityHeader
        alignment={char.alignment}
        background={char.background}
        deity={char.deity}
        themeColor={themeColor}
        onSaveIdentity={handleSaveIdentity}
      />

      {/* Visualização Mobile: Sub-Abas Rápidas */}
      {isMobile ? (
        <View style={styles.mobileWrap}>
          <View style={styles.mobileTabBar}>
            <TouchableOpacity
              style={[styles.mobileTabItem, mobileSubTab === 'roleplay' && styles.mobileTabItemActive]}
              onPress={() => setMobileSubTab('roleplay')}
              activeOpacity={0.7}
            >
              <Sparkles size={13} color={mobileSubTab === 'roleplay' ? themeColor : '#7A7265'} />
              <Text
                style={[
                  styles.mobileTabText,
                  mobileSubTab === 'roleplay' && { color: themeColor, fontWeight: 'bold' },
                ]}
              >
                Interpretação
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileTabItem, mobileSubTab === 'bio' && styles.mobileTabItemActive]}
              onPress={() => setMobileSubTab('bio')}
              activeOpacity={0.7}
            >
              <BookOpen size={13} color={mobileSubTab === 'bio' ? themeColor : '#7A7265'} />
              <Text
                style={[
                  styles.mobileTabText,
                  mobileSubTab === 'bio' && { color: themeColor, fontWeight: 'bold' },
                ]}
              >
                Lore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileTabItem, mobileSubTab === 'appearance' && styles.mobileTabItemActive]}
              onPress={() => setMobileSubTab('appearance')}
              activeOpacity={0.7}
            >
              <User size={13} color={mobileSubTab === 'appearance' ? themeColor : '#7A7265'} />
              <Text
                style={[
                  styles.mobileTabText,
                  mobileSubTab === 'appearance' && { color: themeColor, fontWeight: 'bold' },
                ]}
              >
                Aparência
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo Mobile */}
          <View style={styles.mobileContent}>
            {mobileSubTab === 'roleplay' && (
              <PersonalityPillars
                traits={parsedLore.personalityTraits}
                ideals={parsedLore.ideals}
                bonds={parsedLore.bonds}
                flaws={parsedLore.flaws}
                themeColor={themeColor}
                onSavePillars={handleSavePillars}
              />
            )}

            {mobileSubTab === 'bio' && (
              <>
                <CardShowcaseSection
                  description={char.description || parsedLore.description || ''}
                  avatarUrl={char.avatarUrl || ''}
                  themeColor={themeColor}
                  isMobile={true}
                  onSaveCardShowcase={handleSaveCardShowcase}
                />
                <ChronicleBiography
                  backstory={parsedLore.backstory}
                  themeColor={themeColor}
                  onSaveBackstory={handleSaveBackstory}
                />
              </>
            )}

            {mobileSubTab === 'appearance' && (
              <PhysicalAppearance
                appearance={parsedLore.appearance}
                themeColor={themeColor}
                onSaveAppearance={handleSaveAppearance}
              />
            )}
          </View>
        </View>
      ) : (
        /* Visualização Desktop: Grade em 2 Colunas */
        <View style={styles.desktopGrid}>
          {/* Coluna da Esquerda: Pilares de Interpretação e Aparência Física */}
          <View style={styles.desktopLeftCol}>
            <PersonalityPillars
              traits={parsedLore.personalityTraits}
              ideals={parsedLore.ideals}
              bonds={parsedLore.bonds}
              flaws={parsedLore.flaws}
              themeColor={themeColor}
              onSavePillars={handleSavePillars}
            />

            <PhysicalAppearance
              appearance={parsedLore.appearance}
              themeColor={themeColor}
              onSaveAppearance={handleSaveAppearance}
            />
          </View>

          {/* Coluna da Direita: Apresentação no Portal da Taverna & Crônicas/Biografia */}
          <View style={styles.desktopRightCol}>
            <CardShowcaseSection
              description={char.description || parsedLore.description || ''}
              avatarUrl={char.avatarUrl || ''}
              themeColor={themeColor}
              isMobile={false}
              onSaveCardShowcase={handleSaveCardShowcase}
            />

            <ChronicleBiography
              backstory={parsedLore.backstory}
              themeColor={themeColor}
              onSaveBackstory={handleSaveBackstory}
            />
          </View>
        </View>
      )}
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
  mobileWrap: {
    gap: 10,
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#2F2720',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  mobileTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 6,
  },
  mobileTabItemActive: {
    backgroundColor: '#262018',
  },
  mobileTabText: {
    color: '#8A8073',
    fontSize: 10.5,
  },
  mobileContent: {
    gap: 12,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  desktopLeftCol: {
    flex: 4.8,
    gap: 12,
  },
  desktopRightCol: {
    flex: 5.2,
    gap: 12,
  },
});
