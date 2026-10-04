import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import {
  BOND_TYPES,
  CompanionBondType,
  CompanionData,
  CompanionSize,
  SIZES,
} from '@/types/companion';
import { pickAndOptimizeImage } from '@/utils/imageUpload';
import {
  Check,
  Edit2,
  HeartHandshake,
  Link,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react-native';

interface CompanionHeaderProps {
  companion: CompanionData;
  allCompanions: CompanionData[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onAddNewCompanion: () => void;
  onDeleteCompanion: (id: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionHeader: React.FC<CompanionHeaderProps> = ({
  companion,
  allCompanions,
  selectedIndex,
  onSelectIndex,
  onAddNewCompanion,
  onDeleteCompanion,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [formName, setFormName] = useState(companion.name);
  const [formSpecies, setFormSpecies] = useState(companion.species);
  const [formBond, setFormBond] = useState<CompanionBondType>(companion.bondType);
  const [formSize, setFormSize] = useState<CompanionSize>(companion.size);
  const [formAvatar, setFormAvatar] = useState(companion.avatarUrl || '');
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sincroniza form quando o companheiro ativo mudar
  React.useEffect(() => {
    setFormName(companion.name);
    setFormSpecies(companion.species);
    setFormBond(companion.bondType);
    setFormSize(companion.size);
    setFormAvatar(companion.avatarUrl || '');
  }, [companion]);

  const handlePickAvatar = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);
      const optimized = await pickAndOptimizeImage({ maxWidth: 512, maxHeight: 512, quality: 0.85 });
      if (optimized) {
        setFormAvatar(optimized);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrlInput.trim()) {
      setFormAvatar(tempUrlInput.trim());
      setTempUrlInput('');
      setIsUrlInputOpen(false);
    }
  };

  const handleSave = () => {
    onSaveEdit({
      name: formName.trim() || 'Companheiro',
      species: formSpecies.trim() || 'Criatura',
      bondType: formBond,
      size: formSize,
      avatarUrl: formAvatar.trim(),
    });
  };

  const hasAvatar = Boolean(formAvatar && formAvatar.trim().length > 0);

  return (
    <View style={[styles.card, { borderColor: themeColor + '35' }]}>
      {/* SELETOR DE CRIATURAS CASO EXISTA MAIS DE UMA OU PARA ADICIONAR */}
      <View style={styles.selectorBar}>
        <View style={styles.tabsRow}>
          {allCompanions.map((comp, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.tabPill,
                  isSelected && [
                    styles.tabPillActive,
                    { borderColor: themeColor, backgroundColor: themeColor + '20' },
                  ],
                ]}
                onPress={() => onSelectIndex(idx)}
                activeOpacity={0.7}
              >
                <HeartHandshake size={11} color={isSelected ? themeColor : '#7A7265'} />
                <Text
                  style={[
                    styles.tabPillText,
                    isSelected && { color: themeColor, fontWeight: 'bold' },
                  ]}
                  numberOfLines={1}
                >
                  {comp.name || `Companheiro ${idx + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}

          {!isEditing && (
            <TouchableOpacity
              style={styles.addTabBtn}
              onPress={onAddNewCompanion}
              activeOpacity={0.7}
            >
              <Plus size={12} color="#A89E91" />
              <Text style={styles.addTabText}>Vincular Outro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AÇÕES DE CABEÇALHO */}
        <View style={styles.headerActions}>
          {!isEditing ? (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onStartEdit}
                activeOpacity={0.7}
              >
                <Edit2 size={11} color="#BAAFA0" />
                <Text style={styles.actionBtnText}>Editar</Text>
              </TouchableOpacity>

              {allCompanions.length > 1 && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => onDeleteCompanion(companion.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={11} color="#E06A6A" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.editBtnGroup}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={onCancelEdit}
                activeOpacity={0.7}
              >
                <X size={12} color="#D97777" />
                <Text style={[styles.actionBtnText, { color: '#D97777' }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: themeColor, borderColor: themeColor },
                ]}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Check size={12} color="#110F0D" />
                <Text style={[styles.actionBtnText, { color: '#110F0D' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* CONTEÚDO PRINCIPAL DO CABEÇALHO: MODO VISUALIZAÇÃO */}
      {!isEditing ? (
        <View style={[styles.heroRow, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
          {/* Avatar da Criatura */}
          <View style={styles.avatarWrap}>
            {hasAvatar ? (
              <Image
                source={{ uri: companion.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.emptyAvatar}>
                <User size={34} color="#60574D" strokeWidth={1.5} />
                <Text style={styles.emptyAvatarText}>Sem Imagem</Text>
              </View>
            )}
          </View>

          {/* Dados de Identificação */}
          <View style={[styles.infoCol, isMobile && { alignItems: 'center' }]}>
            <View style={styles.badgeRow}>
              <View style={[styles.bondBadge, { borderColor: themeColor + '60', backgroundColor: themeColor + '18' }]}>
                <HeartHandshake size={11} color={themeColor} />
                <Text style={[styles.bondBadgeText, { color: themeColor }]}>
                  {companion.bondType.toUpperCase()}
                </Text>
              </View>

              <View style={styles.sizeBadge}>
                <Text style={styles.sizeBadgeText}>PORTE {companion.size.toUpperCase()}</Text>
              </View>
            </View>

            <Text
              style={[
                styles.companionName,
                isMobile && { fontSize: 22, textAlign: 'center' },
                { color: themeColor },
              ]}
              numberOfLines={2}
            >
              {companion.name}
            </Text>

            <Text style={styles.companionSpecies}>
              Espécie / Raça: <Text style={{ color: '#E2D8C3', fontWeight: 'bold' }}>{companion.species}</Text>
            </Text>
          </View>
        </View>
      ) : (
        /* CONTEÚDO: MODO EDIÇÃO */
        <View style={styles.editContainer}>
          <View style={[styles.editHeroRow, isMobile && { flexDirection: 'column' }]}>
            {/* Foto e Upload */}
            <View style={styles.editAvatarCol}>
              <TouchableOpacity
                style={styles.editAvatarWrap}
                onPress={handlePickAvatar}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={themeColor} />
                ) : hasAvatar ? (
                  <Image source={{ uri: formAvatar }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.emptyAvatar}>
                    <Upload size={22} color={themeColor} />
                    <Text style={styles.emptyAvatarText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.avatarBtnRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, { borderColor: themeColor + '70' }]}
                  onPress={handlePickAvatar}
                  disabled={isUploading}
                >
                  <Upload size={10} color={themeColor} />
                  <Text style={[styles.smallBtnText, { color: themeColor }]}>Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => setIsUrlInputOpen(!isUrlInputOpen)}
                >
                  <Link size={10} color="#BAAFA0" />
                  <Text style={styles.smallBtnText}>URL</Text>
                </TouchableOpacity>

                {hasAvatar && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.deleteBtn]}
                    onPress={() => setFormAvatar('')}
                  >
                    <Trash2 size={10} color="#E06A6A" />
                  </TouchableOpacity>
                )}
              </View>

              {isUrlInputOpen && (
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={styles.urlInput}
                    value={tempUrlInput}
                    onChangeText={setTempUrlInput}
                    placeholder="https://..."
                    placeholderTextColor="#6B6257"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.urlOkBtn} onPress={handleApplyUrl}>
                    <Check size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {uploadError && <Text style={styles.errorText}>⚠ {uploadError}</Text>}
            </View>

            {/* Inputs de Identificação */}
            <View style={styles.editFieldsCol}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>NOME DO COMPANHEIRO</Text>
                <TextInput
                  style={styles.input}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Ex: Fantasma, Ártemis"
                  placeholderTextColor="#60574D"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ESPÉCIE / RAÇA</Text>
                <TextInput
                  style={styles.input}
                  value={formSpecies}
                  onChangeText={setFormSpecies}
                  placeholder="Ex: Lobo Gigante, Coruja, Grifo"
                  placeholderTextColor="#60574D"
                />
              </View>

              {/* Seletor de Tipo de Vínculo */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>TIPO DE VÍNCULO</Text>
                <View style={styles.pillOptionsRow}>
                  {BOND_TYPES.map((b) => {
                    const isSelected = formBond === b;
                    return (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.optionPill,
                          isSelected && [
                            styles.optionPillActive,
                            { borderColor: themeColor, backgroundColor: themeColor + '20' },
                          ],
                        ]}
                        onPress={() => setFormBond(b)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            isSelected && { color: themeColor, fontWeight: 'bold' },
                          ]}
                        >
                          {b}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Seletor de Tamanho */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>TAMANHO (PORTE D&D 5e)</Text>
                <View style={styles.pillOptionsRow}>
                  {SIZES.map((s) => {
                    const isSelected = formSize === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.optionPill,
                          isSelected && [
                            styles.optionPillActive,
                            { borderColor: themeColor, backgroundColor: themeColor + '20' },
                          ],
                        ]}
                        onPress={() => setFormSize(s)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            isSelected && { color: themeColor, fontWeight: 'bold' },
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  selectorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#25201A',
    paddingBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 0,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#302821',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    maxWidth: 150,
  },
  tabPillActive: {},
  tabPillText: {
    color: '#8A8073',
    fontSize: 11,
    fontWeight: '500',
  },
  addTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#383028',
    backgroundColor: '#161310',
  },
  addTabText: {
    color: '#A89E91',
    fontSize: 10.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    flexShrink: 0,
  },
  actionBtnText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  cancelBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#2A1818',
  },
  deleteBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#221414',
    paddingHorizontal: 7,
  },
  editBtnGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#12100E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  emptyAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  emptyAvatarText: {
    color: '#60574D',
    fontSize: 9,
    fontWeight: '600',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  bondBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sizeBadge: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  sizeBadgeText: {
    color: '#8A8073',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  companionName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", Georgia, serif' : undefined,
  },
  companionSpecies: {
    color: '#8A8073',
    fontSize: 12,
  },
  editContainer: {
    gap: 12,
  },
  editHeroRow: {
    flexDirection: 'row',
    gap: 14,
  },
  editAvatarCol: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  editAvatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#12100E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtnRow: {
    flexDirection: 'row',
    gap: 4,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#383028',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  smallBtnText: {
    color: '#BAAFA0',
    fontSize: 9.5,
    fontWeight: '600',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    width: 160,
    maxWidth: '100%',
  },
  urlInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#E2D8C3',
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 10,
  },
  urlOkBtn: {
    backgroundColor: '#2F6A35',
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderRadius: 4,
  },
  errorText: {
    color: '#E57373',
    fontSize: 10,
  },
  editFieldsCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  fieldGroup: {
    gap: 3,
  },
  fieldLabel: {
    color: '#756C60',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    minWidth: 0,
  },
  pillOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  optionPill: {
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: '#2F2720',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 4,
  },
  optionPillActive: {},
  optionPillText: {
    color: '#8A8073',
    fontSize: 10,
  },
});
