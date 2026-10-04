import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Sparkles,
  User,
  Trash2,
  Edit2,
  Check,
  X,
  Link,
  Quote,
  Upload,
} from 'lucide-react-native';
import { pickAndOptimizeImage } from '@/utils/imageUpload';

interface CardShowcaseSectionProps {
  description: string;
  avatarUrl: string;
  themeColor?: string;
  onSaveCardShowcase: (data: { description: string; avatarUrl: string }) => void;
  isMobile?: boolean;
}

export const CardShowcaseSection: React.FC<CardShowcaseSectionProps> = ({
  description: initialDescription,
  avatarUrl: initialAvatarUrl,
  themeColor = '#C5A059',
  onSaveCardShowcase,
  isMobile = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDesc, setTempDesc] = useState(initialDescription || '');
  const [tempAvatar, setTempAvatar] = useState(initialAvatarUrl || '');
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sincroniza quando as props mudarem
  useEffect(() => {
    setTempDesc(initialDescription || '');
  }, [initialDescription]);

  useEffect(() => {
    setTempAvatar(initialAvatarUrl || '');
  }, [initialAvatarUrl]);

  const handleStartEdit = () => {
    setTempDesc(initialDescription || '');
    setTempAvatar(initialAvatarUrl || '');
    setTempUrlInput(initialAvatarUrl || '');
    setIsUrlInputOpen(false);
    setUploadError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempDesc(initialDescription || '');
    setTempAvatar(initialAvatarUrl || '');
    setIsUrlInputOpen(false);
    setUploadError(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    const cleanDesc = tempDesc.trim();
    const cleanAvatar = tempAvatar.trim();
    onSaveCardShowcase({
      description: cleanDesc,
      avatarUrl: cleanAvatar,
    });
    setIsEditing(false);
    setIsUrlInputOpen(false);
    setUploadError(null);
  };

  const handlePickFile = async () => {
    try {
      setUploadError(null);
      setIsProcessingUpload(true);
      const optimizedDataUrl = await pickAndOptimizeImage({
        maxWidth: 600,
        maxHeight: 800,
        quality: 0.82,
      });

      if (optimizedDataUrl) {
        setTempAvatar(optimizedDataUrl);
        setIsUrlInputOpen(false);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Falha ao processar arquivo.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleApplyUrl = () => {
    setTempAvatar(tempUrlInput.trim());
    setIsUrlInputOpen(false);
  };

  const handleRemoveImage = () => {
    setTempAvatar('');
    setTempUrlInput('');
    setIsUrlInputOpen(false);
    setUploadError(null);
  };

  const hasImage = Boolean(tempAvatar && tempAvatar.trim().length > 0);
  const hasSavedImage = Boolean(initialAvatarUrl && initialAvatarUrl.trim().length > 0);
  const savedDescription = (initialDescription || '').trim();

  return (
    <View style={[styles.card, { borderColor: themeColor + '35' }]}>
      {/* Cabeçalho da Seção */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Sparkles size={14} color={themeColor} />
          <Text style={[styles.headerTitle, { color: themeColor }]}>
            APRESENTAÇÃO NO PORTAL DA TAVERNA
          </Text>
        </View>

        {!isEditing ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleStartEdit}
            activeOpacity={0.7}
          >
            <Edit2 size={11} color="#BAAFA0" />
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <X size={12} color="#D97777" />
              <Text style={[styles.actionBtnText, { color: '#D97777' }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: themeColor, borderColor: themeColor }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Check size={12} color="#110F0D" />
              <Text style={[styles.actionBtnText, { color: '#110F0D' }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CONTEÚDO: MODO DE VISUALIZAÇÃO (COMPACTO) */}
      {!isEditing ? (
        <View style={styles.previewContainer}>
          {/* Miniatura do Retrato */}
          <View style={styles.thumbWrapper}>
            {hasSavedImage ? (
              <Image
                source={{ uri: initialAvatarUrl }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              /* Ícone Acinzentado */
              <View style={styles.grayedOutThumb}>
                <User size={28} color="#554E46" strokeWidth={1.5} />
                <Text style={styles.grayedOutThumbText}>Ícone cinza</Text>
              </View>
            )}
          </View>

          {/* Citação & Status do Card */}
          <View style={styles.previewContent}>
            <View style={styles.quoteHeaderRow}>
              <View style={styles.quoteTagRow}>
                <Quote size={11} color={themeColor} />
                <Text style={[styles.quoteTag, { color: themeColor }]}>CITAÇÃO DO CARD</Text>
              </View>
              <Text style={styles.statusPill}>
                {hasSavedImage ? '✓ Retrato ativo' : '✦ Ícone acinzentado'}
              </Text>
            </View>

            <Text
              style={[
                styles.quoteText,
                !savedDescription && styles.quoteTextEmpty,
              ]}
              numberOfLines={3}
            >
              {savedDescription
                ? `“${savedDescription}”`
                : 'Nenhuma descrição cadastrada. Clique em "Editar" para adicionar a frase que será exibida no card do seu herói na Taverna.'}
            </Text>
          </View>
        </View>
      ) : (
        /* CONTEÚDO: MODO DE EDIÇÃO (ORGANIZADO & COM UPLOAD DIRETO) */
        <View style={styles.editContainer}>
          {/* Linha de Configuração do Retrato */}
          <View style={styles.imageConfigRow}>
            {/* Thumbnail interativo para upload rápido */}
            <TouchableOpacity
              style={styles.thumbWrapperEdit}
              onPress={handlePickFile}
              disabled={isProcessingUpload}
              activeOpacity={0.8}
            >
              {isProcessingUpload ? (
                <View style={styles.loadingThumb}>
                  <ActivityIndicator size="small" color={themeColor} />
                </View>
              ) : hasImage ? (
                <Image
                  source={{ uri: tempAvatar }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.grayedOutThumb}>
                  <User size={26} color="#554E46" strokeWidth={1.5} />
                  <Text style={styles.grayedOutThumbText}>Sem foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.imageButtonsCol}>
              <Text style={styles.fieldLabel}>Retrato do Herói</Text>
              <View style={styles.imageBtnGroup}>
                {/* 1. Botão de Upload Direto do Dispositivo */}
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: themeColor + '18', borderColor: themeColor + '80' }]}
                  onPress={handlePickFile}
                  disabled={isProcessingUpload}
                  activeOpacity={0.7}
                >
                  <Upload size={11} color={themeColor} />
                  <Text style={[styles.smallBtnText, { color: themeColor, fontWeight: '700' }]}>
                    {isProcessingUpload ? 'Otimizando...' : hasImage ? 'Trocar Arquivo' : 'Escolher Imagem'}
                  </Text>
                </TouchableOpacity>

                {/* 2. Botão Secundário para URL Externa */}
                <TouchableOpacity
                  style={[styles.smallBtn, isUrlInputOpen && { borderColor: themeColor }]}
                  onPress={() => setIsUrlInputOpen(!isUrlInputOpen)}
                  activeOpacity={0.7}
                >
                  <Link size={11} color="#A89E91" />
                  <Text style={[styles.smallBtnText, { color: '#BAAFA0' }]}>URL</Text>
                </TouchableOpacity>

                {/* 3. Botão de Remoção */}
                {hasImage && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.removeBtn]}
                    onPress={handleRemoveImage}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={11} color="#E06A6A" />
                    <Text style={[styles.smallBtnText, { color: '#E06A6A' }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Feedback de Erro de Upload */}
          {uploadError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {uploadError}</Text>
            </View>
          )}

          {/* Gaveta Retrátil de URL da Imagem */}
          {isUrlInputOpen && (
            <View style={styles.urlInputBox}>
              <View style={styles.urlInputRow}>
                <Link size={12} color="#C5A059" />
                <TextInput
                  style={styles.urlInput}
                  value={tempUrlInput}
                  onChangeText={setTempUrlInput}
                  placeholder="https://exemplo.com/retrato.png"
                  placeholderTextColor="#665E54"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.applyUrlBtn, { backgroundColor: themeColor }]}
                  onPress={handleApplyUrl}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyUrlBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Campo de Descrição do Personagem */}
          <View style={styles.descFieldWrap}>
            <View style={styles.descLabelRow}>
              <Text style={styles.fieldLabel}>Descrição do Card (Portal da Taverna)</Text>
              <Text style={styles.charCount}>{tempDesc.length} / 220</Text>
            </View>

            <TextInput
              style={styles.descInput}
              value={tempDesc}
              onChangeText={(text) => setTempDesc(text.slice(0, 220))}
              placeholder="Ex: Guerreiro veterano de cicatrizes profundas, cuja lealdade aos companheiros supera o medo da morte..."
              placeholderTextColor="#665E54"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161310',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#25201A',
    paddingBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", Georgia, serif' : undefined,
    flexShrink: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#1A1714',
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 10.5,
    color: '#BAAFA0',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  cancelBtn: {
    backgroundColor: '#241717',
    borderColor: '#4A2A2A',
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#383028',
    backgroundColor: '#100E0C',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbWrapperEdit: {
    width: 58,
    height: 58,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#383028',
    backgroundColor: '#100E0C',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  loadingThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  grayedOutThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  grayedOutThumbText: {
    fontSize: 8.5,
    color: '#554E46',
    fontWeight: '600',
  },
  previewContent: {
    flex: 1,
    gap: 4,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  quoteTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteTag: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusPill: {
    fontSize: 9.5,
    color: '#8A8073',
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#E2D8C3',
    fontStyle: 'italic',
  },
  quoteTextEmpty: {
    color: '#6E645A',
    fontSize: 11,
  },
  editContainer: {
    gap: 10,
  },
  imageConfigRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imageButtonsCol: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 0.4,
  },
  imageBtnGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#1A1714',
  },
  removeBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#201515',
  },
  smallBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#291717',
    borderWidth: 1,
    borderColor: '#542626',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#E06A6A',
    fontSize: 10.5,
  },
  urlInputBox: {
    backgroundColor: '#191512',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 6,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urlInput: {
    flex: 1,
    fontSize: 11,
    color: '#F5EEDB',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  applyUrlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  applyUrlBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#110F0D',
  },
  descFieldWrap: {
    gap: 4,
  },
  descLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 10,
    color: '#7A7265',
    fontWeight: '600',
  },
  descInput: {
    backgroundColor: '#100E0C',
    borderWidth: 1,
    borderColor: '#383028',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#F5EEDB',
    minHeight: 65,
    lineHeight: 16,
  },
});
