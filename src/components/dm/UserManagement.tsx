import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Sparkles,
  Key,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Lock,
} from 'lucide-react-native';
import { ApiService, UserData } from '@/services/api';
import { Role, useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { confirmAction } from '@/utils/confirm';

const ROLE_CONFIG: Record<
  Role,
  { label: string; tag: string; description: string; color: string; bg: string; borderColor: string }
> = {
  DM: {
    label: 'Mestre',
    tag: 'MESTRE DA MESA',
    description: 'Acesso total: Escudo do Mestre, Rituais em Massa, Sussurros e Controle de Usuários.',
    color: '#C5A059',
    bg: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  MECHANIC: {
    label: 'Player Mecânico',
    tag: 'SUPORTE MECÂNICO',
    description: 'Acesso especial: pode visualizar, editar e gerenciar as fichas de todos os jogadores da mesa.',
    color: '#4E9C8E',
    bg: 'rgba(78, 156, 142, 0.15)',
    borderColor: '#4E9C8E',
  },
  PLAYER: {
    label: 'Player Comum',
    tag: 'AVENTUREIRO',
    description: 'Acesso individual: visualiza e interage exclusivamente com a sua própria ficha de personagem.',
    color: '#A8B8C8',
    bg: 'rgba(168, 184, 200, 0.12)',
    borderColor: '#3D342C',
  },
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { isMobile } = useResponsive();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Novo Usuário
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('PLAYER');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal Alterar Permissão (Role)
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserData | null>(null);
  const [targetRole, setTargetRole] = useState<Role>('PLAYER');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Modal Redefinir Senha
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [selectedUserForPwd, setSelectedUserForPwd] = useState<UserData | null>(null);
  const [newPwdValue, setNewPwdValue] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await ApiService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const data = await ApiService.getUsers();
        if (isMounted) setUsers(data);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setCreateError('Preencha todos os campos obrigatórios.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      await ApiService.createUser({
        name: newName.trim(),
        username: newUsername.toLowerCase().trim(),
        password: newPassword.trim(),
        role: newRole,
      });

      setCreateModalVisible(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('PLAYER');
      await loadUsers();

      if (Platform.OS === 'web') {
        window.alert('Novo aventureiro registrado com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Novo aventureiro registrado com sucesso!');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao registrar aventureiro.');
    } finally {
      setCreating(false);
    }
  };

  const openRoleModal = (u: UserData) => {
    setSelectedUserForRole(u);
    setTargetRole(u.role);
    setRoleModalVisible(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUserForRole) return;
    setUpdatingRole(true);
    try {
      await ApiService.updateUser(selectedUserForRole.id, { role: targetRole });
      setUsers((prev) =>
        prev.map((item) => (item.id === selectedUserForRole.id ? { ...item, role: targetRole } : item))
      );
      setRoleModalVisible(false);
      await loadUsers();
      if (Platform.OS === 'web') {
        window.alert(`Permissão de '${selectedUserForRole.name}' alterada para ${ROLE_CONFIG[targetRole].label}.`);
      } else {
        Alert.alert('Sucesso', `Permissão alterada para ${ROLE_CONFIG[targetRole].label}.`);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message || 'Falha ao alterar permissão.'}`);
      } else {
        Alert.alert('Erro', err.message || 'Falha ao alterar permissão.');
      }
    } finally {
      setUpdatingRole(false);
    }
  };

  const openPwdModal = (u: UserData) => {
    setSelectedUserForPwd(u);
    setNewPwdValue('');
    setPwdError('');
    setPwdModalVisible(true);
  };

  const handleSavePwd = async () => {
    if (!selectedUserForPwd) return;
    if (!newPwdValue.trim()) {
      setPwdError('Informe a nova senha.');
      return;
    }

    setUpdatingPwd(true);
    setPwdError('');
    try {
      await ApiService.updateUser(selectedUserForPwd.id, { password: newPwdValue.trim() });
      setPwdModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert(`Senha de '${selectedUserForPwd.name}' redefinida com sucesso!`);
      } else {
        Alert.alert('Sucesso', `Senha de '${selectedUserForPwd.name}' redefinida!`);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message || 'Falha ao redefinir senha.'}`);
      } else {
        Alert.alert('Erro', err.message || 'Falha ao redefinir senha.');
      }
    } finally {
      setUpdatingPwd(false);
    }
  };

  const handleDeleteUser = (u: UserData) => {
    if (currentUser?.id === u.id || currentUser?.username === u.username) {
      if (Platform.OS === 'web') {
        window.alert('Você não pode excluir o seu próprio usuário do Mestre.');
      } else {
        Alert.alert('Aviso', 'Você não pode excluir o seu próprio usuário.');
      }
      return;
    }

    const confirmDelete = async () => {
      try {
        await ApiService.deleteUser(u.id);
        setUsers((prev) => prev.filter((item) => item.id !== u.id));
        await loadUsers();
        if (Platform.OS === 'web') {
          window.alert(`Usuário '${u.name}' removido da mesa.`);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(`Erro: ${err.message || 'Falha ao excluir usuário.'}`);
        } else {
          Alert.alert('Erro', err.message || 'Falha ao excluir usuário.');
        }
      }
    };

    confirmAction(
      `Tem certeza que deseja banir/remover o usuário '${u.name}' (@${u.username}) da campanha?`,
      () => confirmDelete(),
      'Confirmar Exclusão'
    );
  };

  // Contagens
  const dmCount = users.filter((u) => u.role === 'DM').length;
  const mechanicCount = users.filter((u) => u.role === 'MECHANIC').length;
  const playerCount = users.filter((u) => u.role === 'PLAYER').length;

  return (
    <View style={styles.container}>
      {/* Banner de Estatísticas e Ações */}
      <View style={[styles.statsHeader, isMobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>TOTAL DE USUÁRIOS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#C5A059' }]}>
            <View style={styles.statIconRow}>
              <Crown color="#C5A059" size={14} />
              <Text style={[styles.statNumber, { color: '#C5A059' }]}>{dmCount}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#C5A059' }]}>MESTRES</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#4E9C8E' }]}>
            <View style={styles.statIconRow}>
              <Sparkles color="#4E9C8E" size={14} />
              <Text style={[styles.statNumber, { color: '#4E9C8E' }]}>{mechanicCount}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#4E9C8E' }]}>MECÂNICOS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#80776C' }]}>
            <View style={styles.statIconRow}>
              <Shield color="#80776C" size={14} />
              <Text style={[styles.statNumber, { color: '#A8B8C8' }]}>{playerCount}</Text>
            </View>
            <Text style={styles.statLabel}>PLAYERS</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
            <RefreshCw color="#C5A059" size={16} />
            <Text style={styles.refreshBtnText}>{refreshing ? 'Atualizando...' : 'Recarregar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newUserBtn}
            activeOpacity={0.8}
            onPress={() => {
              setCreateError('');
              setCreateModalVisible(true);
            }}
          >
            <UserPlus color="#110F0D" size={18} />
            <Text style={styles.newUserBtnText}>Novo Usuário</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Regras e Legenda dos Papéis */}
      <View style={styles.roleGuideBox}>
        <Text style={styles.roleGuideTitle}>NÍVEIS DE PERMISSÃO NA MESA</Text>
        <View style={styles.roleGuideGrid}>
          <View style={[styles.roleGuideItem, { borderColor: '#A8B8C8' }]}>
            <View style={styles.roleGuideHeader}>
              <Shield color="#A8B8C8" size={16} />
              <Text style={[styles.roleGuideName, { color: '#A8B8C8' }]}>Player Comum</Text>
            </View>
            <Text style={styles.roleGuideDesc}>
              Acesso individual. Pode visualizar e modificar unicamente a sua própria ficha.
            </Text>
          </View>

          <View style={[styles.roleGuideItem, { borderColor: '#4E9C8E', backgroundColor: 'rgba(78, 156, 142, 0.08)' }]}>
            <View style={styles.roleGuideHeader}>
              <Sparkles color="#4E9C8E" size={16} />
              <Text style={[styles.roleGuideName, { color: '#4E9C8E' }]}>Player Mecânico</Text>
            </View>
            <Text style={styles.roleGuideDesc}>
              Suporte da mesa. Tem acesso à visualização e edição de <Text style={{ fontWeight: 'bold' }}>todas as fichas de personagens</Text>.
            </Text>
          </View>

          <View style={[styles.roleGuideItem, { borderColor: '#C5A059', backgroundColor: 'rgba(197, 160, 89, 0.08)' }]}>
            <View style={styles.roleGuideHeader}>
              <Crown color="#C5A059" size={16} />
              <Text style={[styles.roleGuideName, { color: '#C5A059' }]}>Mestre (DM)</Text>
            </View>
            <Text style={styles.roleGuideDesc}>
              Autoridade máxima. Acesso irrestrito a todas as fichas, combates, sussurros e gestão de contas.
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Usuários */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C5A059" />
          <Text style={styles.loadingText}>Carregando pergaminhos de usuários...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users color="#80776C" size={48} />
          <Text style={styles.emptyTitle}>Nenhum usuário cadastrado</Text>
        </View>
      ) : (
        <View style={styles.usersList}>
          {users.map((u) => {
            const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.PLAYER;
            const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;

            return (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userCardLeft}>
                  <View style={[styles.userAvatar, { backgroundColor: roleCfg.bg, borderColor: roleCfg.borderColor }]}>
                    {u.role === 'DM' ? (
                      <Crown color={roleCfg.color} size={22} />
                    ) : u.role === 'MECHANIC' ? (
                      <Sparkles color={roleCfg.color} size={22} />
                    ) : (
                      <Shield color={roleCfg.color} size={22} />
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{u.name}</Text>
                      {isSelf && <Text style={styles.selfBadge}>VOCÊ</Text>}
                    </View>
                    <Text style={styles.userUsername}>@{u.username}</Text>
                    <Text style={styles.userCreated}>
                      Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>

                <View style={[styles.userCardRight, isMobile && { flexDirection: 'column', alignItems: 'flex-start', width: '100%' }]}>
                  {/* Badge de Permissão Clicável */}
                  <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: roleCfg.bg, borderColor: roleCfg.borderColor }]}
                    activeOpacity={0.7}
                    onPress={() => openRoleModal(u)}
                  >
                    <Text style={[styles.roleBadgeText, { color: roleCfg.color }]}>{roleCfg.label}</Text>
                    <Edit2 color={roleCfg.color} size={12} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>

                  {/* Ações de Usuário */}
                  <View style={styles.userActionsRow}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      activeOpacity={0.7}
                      onPress={() => openPwdModal(u)}
                    >
                      <Key color="#C5A059" size={16} />
                      <Text style={styles.actionBtnLabel}>Senha</Text>
                    </TouchableOpacity>

                    {!isSelf && (
                      <TouchableOpacity
                        style={[styles.actionIconBtn, styles.deleteIconBtn]}
                        activeOpacity={0.7}
                        onPress={() => handleDeleteUser(u)}
                      >
                        <Trash2 color="#C95B5B" size={16} />
                        <Text style={[styles.actionBtnLabel, { color: '#C95B5B' }]}>Banir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL: NOVO USUÁRIO */}
      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <UserPlus color="#C5A059" size={24} />
                <Text style={styles.modalTitle}>Novo Aventureiro</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X color="#80776C" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do Jogador / Personagem</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Leonardo"
                  placeholderTextColor="#666"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Login de Acesso (Username)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: leo.a"
                  placeholderTextColor="#666"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha Inicial</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 1457"
                  placeholderTextColor="#666"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nível de Permissão</Text>
                <View style={styles.rolePickerList}>
                  {(['PLAYER', 'MECHANIC', 'DM'] as Role[]).map((r) => {
                    const cfg = ROLE_CONFIG[r];
                    const selected = newRole === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleOptionCard,
                          selected && { borderColor: cfg.color, backgroundColor: cfg.bg },
                        ]}
                        onPress={() => setNewRole(r)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleOptionTop}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {r === 'DM' ? <Crown color={cfg.color} size={16} /> : r === 'MECHANIC' ? <Sparkles color={cfg.color} size={16} /> : <Shield color={cfg.color} size={16} />}
                            <Text style={[styles.roleOptionName, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                          {selected && <Check color={cfg.color} size={16} />}
                        </View>
                        <Text style={styles.roleOptionDesc}>{cfg.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {!!createError && <Text style={styles.errorText}>{createError}</Text>}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateUser}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#110F0D" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Criar Usuário</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ALTERAR PERMISSÃO */}
      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Crown color="#C5A059" size={24} />
                <Text style={styles.modalTitle}>Alterar Permissão</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <X color="#80776C" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Alterando permissão de <Text style={{ color: '#E6C280', fontWeight: 'bold' }}>{selectedUserForRole?.name}</Text> (@{selectedUserForRole?.username}):
            </Text>

            <View style={styles.rolePickerList}>
              {(['PLAYER', 'MECHANIC', 'DM'] as Role[]).map((r) => {
                const cfg = ROLE_CONFIG[r];
                const selected = targetRole === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOptionCard,
                      selected && { borderColor: cfg.color, backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setTargetRole(r)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleOptionTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {r === 'DM' ? <Crown color={cfg.color} size={16} /> : r === 'MECHANIC' ? <Sparkles color={cfg.color} size={16} /> : <Shield color={cfg.color} size={16} />}
                        <Text style={[styles.roleOptionName, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      {selected && <Check color={cfg.color} size={16} />}
                    </View>
                    <Text style={styles.roleOptionDesc}>{cfg.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRoleModalVisible(false)}
                disabled={updatingRole}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveRole}
                disabled={updatingRole}
              >
                {updatingRole ? (
                  <ActivityIndicator color="#110F0D" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Salvar Permissão</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: REDEFINIR SENHA */}
      <Modal visible={pwdModalVisible} transparent animationType="fade" onRequestClose={() => setPwdModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Lock color="#C5A059" size={24} />
                <Text style={styles.modalTitle}>Redefinir Senha</Text>
              </View>
              <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
                <X color="#80776C" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Defina a nova senha para <Text style={{ color: '#E6C280', fontWeight: 'bold' }}>{selectedUserForPwd?.name}</Text> (@{selectedUserForPwd?.username}):
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Informe a nova senha"
                placeholderTextColor="#666"
                value={newPwdValue}
                onChangeText={setNewPwdValue}
                secureTextEntry
              />
            </View>

            {!!pwdError && <Text style={styles.errorText}>{pwdError}</Text>}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPwdModalVisible(false)}
                disabled={updatingPwd}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSavePwd}
                disabled={updatingPwd}
              >
                {updatingPwd ? (
                  <ActivityIndicator color="#110F0D" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Atualizar Senha</Text>
                )}
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
    width: '100%',
    gap: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    color: '#E6C280',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '600',
  },
  newUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  newUserBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  roleGuideBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  roleGuideTitle: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  roleGuideGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  roleGuideItem: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  roleGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleGuideName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  roleGuideDesc: {
    color: '#A89E90',
    fontSize: 12,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: '#A89E90',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: '#80776C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 220,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    gap: 3,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: '#E6C280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selfBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userUsername: {
    color: '#A89E90',
    fontSize: 13,
  },
  userCreated: {
    color: '#666',
    fontSize: 11,
  },
  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26221E',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteIconBtn: {
    borderColor: 'rgba(201, 91, 91, 0.3)',
    backgroundColor: 'rgba(201, 91, 91, 0.1)',
  },
  actionBtnLabel: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#C5A059',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#E6C280',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#A89E90',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E6C280',
    fontSize: 14,
  },
  rolePickerList: {
    gap: 10,
    marginTop: 4,
  },
  roleOptionCard: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  roleOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleOptionName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  roleOptionDesc: {
    color: '#80776C',
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    color: '#C95B5B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  cancelBtnText: {
    color: '#80776C',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
