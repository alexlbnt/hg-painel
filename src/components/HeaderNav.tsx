import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { usePathname, useRouter } from 'expo-router';
import { BookOpen, ClipboardList, Crown, Home, Shield, Sparkles, Sword, X, LogOut, ChevronDown, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import GlobalRoomSwitcher from '@/components/ui/GlobalRoomSwitcher';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, width } = useResponsive();
  const { user, login, logout } = useAuth();
  
  const isCompactNav = width >= 768 && width < 1250;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Preencha os campos.');
      return;
    }
    const success = await login(username, password);
    if (!success) {
      setLoginError('Usuário ou senha inválidos.');
    } else {
      setLoginError('');
      setUsername('');
      setPassword('');
      setShowLoginModal(false);
    }
  };

  const navItems = [
    { name: 'Portal da Taverna', mobileName: 'Taverna', path: '/', icon: Home },
    { name: 'Diário da Campanha', mobileName: 'Diário', path: '/journal', icon: BookOpen },
    { name: 'Tarefas da Mesa', mobileName: 'Tarefas', path: '/tasks', icon: ClipboardList },
    { name: 'Grimório do Jogador', mobileName: 'Jogador', path: '/player', icon: Shield },
    ...(user?.role === 'DM' ? [{ name: 'Escudo do Mestre', mobileName: 'Mestre', path: '/dm', icon: Crown }] : []),
  ];

  const renderLoginModal = () => (
    <Modal visible={showLoginModal} transparent animationType="fade" onRequestClose={() => setShowLoginModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.loginContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowLoginModal(false)}>
            <X color="#8C704F" size={24} />
          </TouchableOpacity>

          <Text style={styles.loginTitle}>Acesso à Mesa</Text>
          <Text style={styles.loginSubtitle}>Identifique-se para acessar seu grimório</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu usuário"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {!!loginError && <Text style={styles.errorText}>{loginError}</Text>}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderUserMenuModal = () => {
    if (!user) return null;
    const horizontalOffset = Math.max(20, Math.floor((width - 1600) / 2) + 20);

    return (
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <TouchableOpacity
          style={[
            styles.userMenuOverlay,
            {
              paddingTop: isMobile ? 56 : 64,
              paddingRight: isMobile ? 12 : horizontalOffset,
            },
          ]}
          activeOpacity={1}
          onPress={() => setShowUserMenu(false)}
        >
          <View
            style={[styles.userMenuDropdown, isMobile && styles.userMenuDropdownMobile]}
            onStartShouldSetResponder={() => true}
          >
            {/* Cabeçalho da Conta */}
            <View style={styles.userMenuHeader}>
              <UserAvatar avatarUrl={user.avatarUrl} name={user.name} fallbackRole={user.role} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userMenuName} numberOfLines={1}>{user.name}</Text>
                <Text style={[
                  styles.userMenuRole,
                  { color: user.role === 'DM' ? '#C5A059' : user.role === 'MECHANIC' ? '#4E9C8E' : '#BAAFA0' }
                ]}>
                  {user.role === 'DM'
                    ? 'Mestre da Mesa'
                    : user.role === 'MECHANIC'
                    ? 'Mecânico Artífice'
                    : 'Aventureiro'}
                </Text>
                {user.username ? (
                  <Text style={styles.userMenuUsername}>@{user.username}</Text>
                ) : null}
              </View>
            </View>

            {/* Status da Sessão */}
            <View style={styles.userMenuStatusRow}>
              <View style={styles.statusIndicatorDot} />
              <Text style={styles.statusIndicatorText}>Conectado ao Grimório</Text>
            </View>

            {/* Atalho para Meu Perfil */}
            <TouchableOpacity
              style={styles.userMenuItemBtn}
              onPress={() => {
                setShowUserMenu(false);
                router.push('/profile' as any);
              }}
              activeOpacity={0.7}
            >
              <UserIcon size={15} color="#C5A059" />
              <Text style={styles.userMenuItemText}>Meu Perfil</Text>
            </TouchableOpacity>

            <View style={styles.userMenuDivider} />

            {/* Sair da Conta */}
            <TouchableOpacity
              style={styles.userMenuLogoutBtn}
              onPress={() => {
                setShowUserMenu(false);
                logout();
                router.push('/');
              }}
              activeOpacity={0.7}
            >
              <LogOut size={15} color="#E06A6A" />
              <Text style={styles.userMenuLogoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (isMobile) {
    return (
      <View style={[styles.container, styles.containerMobile]}>
        <View style={styles.innerMobile}>
          {/* Logo compacta */}
          <TouchableOpacity
            style={styles.brandMobile}
            onPress={() => router.push('/')}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainerMobile}>
              <Sword color={Colors.fantasy.gold} size={15} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.titleMobile} numberOfLines={1}>HONRA & EGOÍSMO</Text>
              <Text style={styles.subtitleMobile} numberOfLines={1}>GRIMÓRIO D&D 5E</Text>
            </View>
          </TouchableOpacity>

          {/* Canto Direito: Mesa Ativa + Avatar */}
          <View style={styles.headerRightActionsMobile}>
            <GlobalRoomSwitcher />

            {user ? (
              <TouchableOpacity
                style={styles.avatarTriggerMobile}
                onPress={() => setShowUserMenu(true)}
                activeOpacity={0.7}
              >
                <UserAvatar avatarUrl={user.avatarUrl} name={user.name} fallbackRole={user.role} size={24} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginBtnCompactMobile}
                onPress={() => setShowLoginModal(true)}
              >
                <Text style={styles.loginBtnCompactTextMobile}>LOGIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {renderLoginModal()}
        {renderUserMenuModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Coluna Esquerda: Marca / Logo */}
        <View style={styles.headerLeftCol}>
          <TouchableOpacity style={styles.brand} onPress={() => router.push('/')} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
              <Sword color={Colors.fantasy.gold} size={22} />
            </View>
            <View>
              <Text style={styles.title}>HONRA & EGOÍSMO</Text>
              <Text style={styles.subtitle}>GRIMÓRIO D&D 5E</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coluna Central: Links de Navegação Medieval (Perfeitamente Centralizado) */}
        <View style={styles.headerCenterCol}>
          <View style={[styles.navLinks, isCompactNav && styles.navLinksCompact]}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              const label = isCompactNav ? item.mobileName : item.name;
              return (
                <TouchableOpacity
                  key={item.path}
                  style={[
                    styles.navButton,
                    isCompactNav && styles.navButtonCompact,
                    isActive && styles.navButtonActive
                  ]}
                  onPress={() => router.push(item.path as any)}
                  activeOpacity={0.7}
                >
                  <Icon color={isActive ? Colors.fantasy.goldBright : Colors.fantasy.textSecondary} size={isCompactNav ? 14 : 16} />
                  <Text style={[
                    styles.navText,
                    isCompactNav && styles.navTextCompact,
                    isActive && styles.navTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Coluna Direita: Mesa Ativa e Perfil da Conta */}
        <View style={styles.headerRightCol}>
          <GlobalRoomSwitcher />

          {user ? (
            <TouchableOpacity
              style={styles.avatarTrigger}
              onPress={() => setShowUserMenu(true)}
              activeOpacity={0.7}
            >
              <UserAvatar avatarUrl={user.avatarUrl} name={user.name} fallbackRole={user.role} size={24} />
              <Text style={styles.avatarNameShort} numberOfLines={1}>
                {user.name.split(' ')[0]}
              </Text>
              <ChevronDown size={12} color="#8C704F" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtnCompact}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnCompactText}>LOGIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {renderLoginModal()}
      {renderUserMenuModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
      },
    }),
  },
  inner: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerCenterCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#E6C280',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  subtitle: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  navLinksCompact: {
    gap: 4,
    padding: 3,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  navButtonCompact: {
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navButtonActive: {
    backgroundColor: '#24201C',
    borderColor: '#8C704F',
    borderWidth: 1,
  },
  navText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  navTextCompact: {
    fontSize: 12,
  },
  navTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  roomBadge: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#5C4E40',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  roomLabel: {
    color: '#80776C',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  roomCode: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContainer: {
    backgroundColor: '#1A1714',
    padding: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    maxWidth: 400,
    width: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  loginTitle: {
    color: '#C5A059',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  loginSubtitle: {
    color: '#BAAFA0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#E2D8C3',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    color: '#E2D8C3',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#C5A059',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#110F0D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E8A0A0',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  avatarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'border-color 0.2s ease',
      },
    }),
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#12100E',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircleImage: {
    width: '100%',
    height: '100%',
  },
  avatarNameShort: {
    color: '#D4C3A3',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 80,
  },
  loginBtnCompact: {
    backgroundColor: '#1E1B18',
    borderWidth: 1,
    borderColor: '#5C4E40',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  loginBtnCompactText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  userMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  userMenuDropdown: {
    width: 240,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
      } as any,
    }),
  },
  userMenuDropdownMobile: {
    width: 220,
  },
  userMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userMenuAvatarLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#12100E',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userMenuAvatarImage: {
    width: '100%',
    height: '100%',
  },
  userMenuName: {
    color: '#F4E7D3',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  userMenuRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  userMenuUsername: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 1,
  },
  userMenuStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1B17',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4E9C8E',
  },
  statusIndicatorText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: '600',
  },
  userMenuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  userMenuItemText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userMenuDivider: {
    height: 1,
    backgroundColor: '#2D251E',
    marginVertical: 2,
  },
  userMenuLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(201, 91, 91, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 91, 91, 0.25)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  userMenuLogoutText: {
    color: '#E06A6A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  containerMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  innerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 6,
  },
  brandMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  iconContainerMobile: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleMobile: {
    color: '#E6C280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  subtitleMobile: {
    color: '#80776C',
    fontSize: 7.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  headerRightActionsMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  avatarTriggerMobile: {
    padding: 2,
    borderRadius: 16,
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#3D342C',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  avatarCircleMobile: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#12100E',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginBtnCompactMobile: {
    backgroundColor: '#1E1B18',
    borderWidth: 1,
    borderColor: '#5C4E40',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnCompactTextMobile: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
  },
});
