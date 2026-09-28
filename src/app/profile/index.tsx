import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  User as UserIcon,
  Sparkles,
  Shield,
  Crown,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Camera,
  Eye,
  EyeOff,
  Scroll,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ApiService } from '@/services/api';
import { CharacterData } from '@/lib/mockData';
import { CLASS_PORTRAITS } from '@/constants/portraits';
import { AVATAR_ICON_PRESETS, getAvatarIconPreset } from '@/constants/avatarIcons';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateCurrentUser } = useAuth();
  const { isMobile, width } = useResponsive();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'icon:sword');
  const [bio, setBio] = useState(user?.bio || '');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(
    () => Boolean(user?.avatarUrl && !user.avatarUrl.startsWith('icon:'))
  );

  const selectedPreset = useMemo(() => getAvatarIconPreset(avatarUrl), [avatarUrl]);

  // Campos de Senha
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Estados de feedback e envio
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Personagens vinculados a este usuário
  const [myCharacters, setMyCharacters] = useState<CharacterData[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || 'icon:sword');
      setBio(user.bio || '');

      // Carregar personagens do usuário
      ApiService.getCharacters()
        .then((chars) => {
          const matched = chars.filter(
            (c) =>
              (c.userId && c.userId === user.id) ||
              (c.username && c.username.toLowerCase() === user.username.toLowerCase())
          );
          setMyCharacters(matched);
        })
        .catch(() => {})
        .finally(() => setLoadingCharacters(false));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setFeedback(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setFeedback({ type: 'error', message: 'O nome não pode ficar vazio.' });
      return;
    }

    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setFeedback({ type: 'error', message: 'Informe sua senha atual para definir uma nova.' });
        return;
      }
      if (newPassword.length < 4) {
        setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 4 caracteres.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ type: 'error', message: 'A confirmação de senha não coincide.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: cleanName,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      };

      if (showPasswordSection && newPassword) {
        payload.currentPassword = currentPassword;
        payload.password = newPassword;
      }

      const updated = await ApiService.updateUser(user.id, payload);

      updateCurrentUser({
        name: updated.name,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
      });

      // Limpa os campos de senha
      if (showPasswordSection && newPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }

      setFeedback({
        type: 'success',
        message: 'Perfil atualizado com sucesso! As alterações já estão visíveis na taverna.',
      });

      if (Platform.OS !== 'web') {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao atualizar o perfil.';
      setFeedback({ type: 'error', message: msg });
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isWide = width >= 960;

  return (
    <ScrollView
      style={styles.scrollWrapper}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* Botão de Retorno e Cabeçalho */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#C5A059" />
          <Text style={styles.backButtonText}>Retornar à Taverna</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.headerTopProfileRow}>
          <UserAvatar
            avatarUrl={avatarUrl}
            name={name}
            fallbackRole={user?.role}
            size={56}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.badge}>
              {user?.role === 'DM' ? (
                <Crown color="#C5A059" size={14} />
              ) : user?.role === 'MECHANIC' ? (
                <Sparkles color="#4E9C8E" size={14} />
              ) : (
                <Shield color="#C5A059" size={14} />
              )}
              <Text style={styles.badgeText}>
                {user?.role === 'DM'
                  ? 'MESTRE DA CAMPANHA'
                  : user?.role === 'MECHANIC'
                  ? 'ARTÍFICE MECÂNICO'
                  : 'AVENTUREIRO DA COMITIVA'}
              </Text>
            </View>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>
              {name.trim() || 'Identidade do Jogador'}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Personalize seu emblema colorido e sua apresentação pessoal. Estas informações são
          exibidas publicamente nos cards de seus heróis no Portal da Taverna.
        </Text>
      </View>

      {/* Banner de Feedback */}
      {feedback && (
        <View
          style={[
            styles.feedbackBanner,
            feedback.type === 'success'
              ? styles.feedbackBannerSuccess
              : styles.feedbackBannerError,
          ]}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 color="#4E9C8E" size={18} />
          ) : (
            <AlertCircle color="#C95B5B" size={18} />
          )}
          <Text
            style={[
              styles.feedbackBannerText,
              feedback.type === 'success'
                ? styles.feedbackBannerTextSuccess
                : styles.feedbackBannerTextError,
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      )}

      {/* Layout de Grid Principal */}
      <View style={[styles.mainGrid, isWide ? styles.mainGridRow : styles.mainGridCol]}>
        {/* COLUNA ESQUERDA: FORMULÁRIO DE EDIÇÃO */}
        <View style={[styles.gridColumn, isWide && styles.gridColumnLeft]}>
          <View style={styles.cardBox}>
            <View style={styles.cardHeader}>
              <UserIcon color="#C5A059" size={20} />
              <Text style={styles.cardTitle}>Dados Pessoais</Text>
            </View>

            {/* Nome de Exibição */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Nome de Exibição / Apelido <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Allan, Gabi, João..."
                placeholderTextColor="#7A6F62"
              />
              <Text style={styles.inputHint}>
                Como seu nome será apresentado aos outros jogadores na comitiva.
              </Text>
            </View>

            {/* Nome de Usuário (Fixado) */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nome de Usuário (Login)</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>@{user?.username}</Text>
                <Text style={styles.readOnlySubtext}>Identificador único na taverna</Text>
              </View>
            </View>

            {/* Emblema do Jogador (Ícones Coloridos) */}
            <View style={styles.formGroup}>
              <View style={styles.emblemHeaderRow}>
                <Text style={styles.inputLabel}>
                  Emblema do Jogador <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                {selectedPreset && (
                  <View style={[styles.activeEmblemBadge, { borderColor: selectedPreset.borderColor, backgroundColor: selectedPreset.bgColor }]}>
                    <selectedPreset.IconComponent size={13} color={selectedPreset.iconColor} />
                    <Text style={[styles.activeEmblemBadgeText, { color: selectedPreset.iconColor }]}>
                      {selectedPreset.label}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.inputHint}>
                Selecione o ícone colorido que representa sua honra e papel na taverna:
              </Text>

              {/* Grid dos Emblemas Coloridos */}
              <View style={styles.iconPresetsGrid}>
                {AVATAR_ICON_PRESETS.map((preset) => {
                  const isSelected = avatarUrl === preset.id;
                  const IconComp = preset.IconComponent;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        setAvatarUrl(preset.id);
                        setShowCustomUrlInput(false);
                      }}
                      style={[
                        styles.iconPresetCard,
                        {
                          backgroundColor: preset.bgColor,
                          borderColor: isSelected ? '#E6C280' : preset.borderColor,
                        },
                        isSelected && styles.iconPresetCardSelected,
                        ...(Platform.OS === 'web'
                          ? [
                              {
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                                boxShadow: isSelected
                                  ? `0 0 16px ${preset.glowColor}, inset 0 0 8px ${preset.glowColor}`
                                  : 'none',
                              } as any,
                            ]
                          : []),
                      ]}
                    >
                      <View style={styles.iconPresetCircle}>
                        <IconComp size={24} color={preset.iconColor} />
                      </View>
                      <Text
                        style={[
                          styles.iconPresetLabel,
                          { color: isSelected ? '#F4E7D3' : '#BAAFA0' },
                          isSelected && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {preset.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.iconSelectedBadge}>
                          <CheckCircle2 size={11} color="#110F0D" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Opção Secundária: Imagem Externa Personalizada */}
              <View style={styles.customUrlToggleRow}>
                <TouchableOpacity
                  style={styles.customUrlToggleBtn}
                  onPress={() => setShowCustomUrlInput((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customUrlToggleBtnText}>
                    {showCustomUrlInput ? '− Ocultar URL de imagem externa' : '+ Prefere usar link de imagem externa?'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCustomUrlInput && (
                <View style={styles.customUrlInputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={avatarUrl.startsWith('icon:') ? '' : avatarUrl}
                    onChangeText={(val) => {
                      if (val.trim()) {
                        setAvatarUrl(val.trim());
                      } else {
                        setAvatarUrl('icon:sword');
                      }
                    }}
                    placeholder="https://exemplo.com/sua-imagem.png"
                    placeholderTextColor="#7A6F62"
                    autoCapitalize="none"
                  />
                  <Text style={styles.inputHint}>
                    Cole a URL direta de uma imagem da internet se preferir não usar os emblemas.
                  </Text>
                </View>
              )}
            </View>

            {/* Bio / Descrição do Jogador */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithCounterRow}>
                <Text style={styles.inputLabel}>
                  Bio / Descrição do Jogador <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Text style={styles.charCounter}>{bio.length} / 160</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={bio}
                onChangeText={(text) => setBio(text.slice(0, 160))}
                placeholder="Ex: Combatente visceral e estrategista de linha de frente da Mesa Lobo."
                placeholderTextColor="#7A6F62"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.inputHint}>
                Conte brevemente sobre você, seu estilo de jogo ou papel na campanha. Esse texto
                aparecerá no rodapé dos seus cards no portal.
              </Text>
            </View>

            {/* Seção Opcional: Alterar Senha */}
            <View style={styles.passwordSectionWrapper}>
              <TouchableOpacity
                style={styles.passwordToggleBtn}
                onPress={() => setShowPasswordSection((p) => !p)}
                activeOpacity={0.7}
              >
                <Key size={16} color="#C5A059" />
                <Text style={styles.passwordToggleBtnText}>
                  {showPasswordSection ? 'Ocultar Alteração de Senha' : 'Deseja alterar sua senha?'}
                </Text>
              </TouchableOpacity>

              {showPasswordSection && (
                <View style={styles.passwordFieldsBox}>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Senha Atual</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Sua senha atual"
                      placeholderTextColor="#7A6F62"
                      secureTextEntry={!showPasswords}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Nova Senha</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Mínimo 4 caracteres"
                      placeholderTextColor="#7A6F62"
                      secureTextEntry={!showPasswords}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repita a nova senha"
                      placeholderTextColor="#7A6F62"
                      secureTextEntry={!showPasswords}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.showPassToggleRow}
                    onPress={() => setShowPasswords((p) => !p)}
                  >
                    {showPasswords ? (
                      <EyeOff size={14} color="#C5A059" />
                    ) : (
                      <Eye size={14} color="#80776C" />
                    )}
                    <Text style={styles.showPassToggleText}>
                      {showPasswords ? 'Ocultar caracteres' : 'Exibir caracteres'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Botão de Salvar Alterações */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#110F0D" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#110F0D" size={18} />
                  <Text style={styles.saveButtonText}>Salvar Informações do Perfil</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* COLUNA DIREITA: PRÉ-VISUALIZAÇÃO AO VIVO E MEUS PERSONAGENS */}
        <View style={[styles.gridColumn, isWide && styles.gridColumnRight]}>
          {/* Card de Preview ao Vivo */}
          <View style={[styles.cardBox, styles.previewCardBox]}>
            <View style={styles.cardHeader}>
              <Sparkles color="#E6C280" size={18} />
              <Text style={styles.cardTitle}>Pré-visualização ao Vivo</Text>
            </View>
            <Text style={styles.previewDescription}>
              É exatamente assim que sua foto, nome e bio aparecerão no card do seu personagem no
              Portal da Taverna:
            </Text>

            {/* Simulação do Bloco de Jogador do Card */}
            <View style={styles.livePlayerCardPreview}>
              <View style={styles.playerAvatarWrapper}>
                <UserAvatar
                  avatarUrl={avatarUrl}
                  name={name}
                  fallbackRole={user?.role}
                  size={34}
                  showBorder={false}
                />
              </View>

              <View style={styles.playerInfoCol}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.previewPlayerName} numberOfLines={1}>
                    {name.trim() || 'Seu Nome'}
                  </Text>
                  <Text style={styles.previewPlayerUsername} numberOfLines={1}>
                    @{user?.username}
                  </Text>
                </View>
                <Text style={styles.previewPlayerBio} numberOfLines={3}>
                  {bio.trim() || 'Sua bio e apresentação na campanha de Honra & Egoísmo...'}
                </Text>
              </View>
            </View>
          </View>

          {/* Meus Personagens Vinculados */}
          <View style={styles.cardBox}>
            <View style={styles.cardHeader}>
              <Shield color="#C5A059" size={18} />
              <Text style={styles.cardTitle}>Personagens Vinculados</Text>
            </View>

            {loadingCharacters ? (
              <ActivityIndicator color="#C5A059" style={{ marginVertical: 20 }} />
            ) : myCharacters.length === 0 ? (
              <View style={styles.noCharactersBox}>
                <Text style={styles.noCharactersText}>
                  Nenhum personagem registrado diretamente sob seu login (@{user?.username}).
                </Text>
                <TouchableOpacity
                  style={styles.createCharacterBtn}
                  onPress={() => router.push('/player')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createCharacterBtnText}>Acessar Grimório do Jogador →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.charactersList}>
                {myCharacters.map((char) => (
                  <TouchableOpacity
                    key={char.id}
                    style={styles.characterItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('selected_character_id', char.id);
                      }
                      router.push('/player');
                    }}
                  >
                    <View style={styles.characterAvatarWrapper}>
                      <Image
                        source={{
                          uri:
                            char.avatarUrl ||
                            CLASS_PORTRAITS[char.class.toLowerCase()]?.portraitUrl ||
                            'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
                        }}
                        style={styles.characterAvatar}
                        contentFit="cover"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.characterName}>{char.name}</Text>
                      <Text style={styles.characterDetails}>
                        Nv. {char.level} • {char.race} • {char.class}
                        {char.archetype ? ` (${char.archetype})` : ''}
                      </Text>
                    </View>

                    <ChevronRight size={16} color="#C5A059" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flex: 1,
    backgroundColor: '#110F0D',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  containerMobile: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 80,
  },
  topNavigationRow: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26, 23, 20, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E6C280',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F5EEDB',
    fontFamily: Platform.select({
      web: '"Cinzel", Georgia, serif',
      default: 'serif',
    }),
    letterSpacing: 1,
    marginBottom: 8,
  },
  titleMobile: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#BAAFA0',
    maxWidth: 720,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  feedbackBannerSuccess: {
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderColor: '#4E9C8E',
  },
  feedbackBannerError: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: '#B82828',
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  feedbackBannerTextSuccess: {
    color: '#4E9C8E',
  },
  feedbackBannerTextError: {
    color: '#E06A6A',
  },
  mainGrid: {
    gap: 24,
  },
  mainGridRow: {
    flexDirection: 'row',
  },
  mainGridCol: {
    flexDirection: 'column',
  },
  gridColumn: {
    width: '100%',
  },
  gridColumnLeft: {
    flex: 1.3,
  },
  gridColumnRight: {
    flex: 1,
    gap: 20,
  },
  cardBox: {
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 12,
    padding: 20,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        } as any)
      : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2620',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6C280',
    fontFamily: Platform.select({
      web: '"Cinzel", Georgia, serif',
      default: 'serif',
    }),
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2D8C3',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  requiredAsterisk: {
    color: '#C95B5B',
  },
  textInput: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#F5EEDB',
  },
  textArea: {
    minHeight: 80,
    lineHeight: 18,
  },
  inputHint: {
    fontSize: 11,
    color: '#80776C',
    marginTop: 5,
    lineHeight: 15,
  },
  labelWithCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 11,
    color: '#80776C',
    fontWeight: '600',
  },
  readOnlyInput: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#2D2620',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C5A059',
  },
  readOnlySubtext: {
    fontSize: 10,
    color: '#80776C',
  },
  headerTopProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  emblemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  activeEmblemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeEmblemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  iconPresetCard: {
    width: '23%',
    minWidth: 70,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    position: 'relative',
  },
  iconPresetCardSelected: {
    borderWidth: 2,
    borderColor: '#E6C280',
  },
  iconPresetCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconPresetLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  iconSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#E6C280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUrlToggleRow: {
    marginTop: 12,
  },
  customUrlToggleBtn: {
    paddingVertical: 4,
  },
  customUrlToggleBtnText: {
    fontSize: 11,
    color: '#8C704F',
    textDecorationLine: 'underline',
  },
  customUrlInputBox: {
    marginTop: 8,
  },
  passwordSectionWrapper: {
    marginTop: 8,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2620',
    paddingTop: 14,
  },
  passwordToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  passwordToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C5A059',
  },
  passwordFieldsBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  showPassToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  showPassToggleText: {
    fontSize: 11,
    color: '#BAAFA0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(197, 160, 89, 0.3)',
          transition: 'all 0.2s ease',
        } as any)
      : {}),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#110F0D',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewCardBox: {
    borderColor: '#5C4E40',
    backgroundColor: '#191613',
  },
  previewDescription: {
    fontSize: 11,
    color: '#BAAFA0',
    lineHeight: 16,
    marginBottom: 14,
  },
  livePlayerCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(17, 15, 13, 0.85)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  playerAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#C5A059',
    overflow: 'hidden',
  },
  playerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  playerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#24201C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfoCol: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  previewPlayerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2D8C3',
  },
  previewPlayerUsername: {
    fontSize: 11,
    color: '#80776C',
  },
  previewPlayerBio: {
    fontSize: 11,
    lineHeight: 15,
    color: '#BAAFA0',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noCharactersBox: {
    paddingVertical: 18,
    alignItems: 'center',
    textAlign: 'center' as any,
  },
  noCharactersText: {
    fontSize: 12,
    color: '#80776C',
    textAlign: 'center',
    marginBottom: 12,
  },
  createCharacterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#24201C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  createCharacterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C5A059',
  },
  charactersList: {
    gap: 10,
  },
  characterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#2D2620',
    padding: 10,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  characterAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  characterAvatar: {
    width: '100%',
    height: '100%',
  },
  characterName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2D8C3',
  },
  characterDetails: {
    fontSize: 11,
    color: '#80776C',
    marginTop: 1,
  },
});
