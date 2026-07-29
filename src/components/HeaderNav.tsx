import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, TextInput } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Shield, Crown, Home, Sword, X } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { user, login, logout } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Preencha os campos.');
      return;
    }
    const success = login(username, password);
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
    { name: 'Grimório do Jogador', mobileName: 'Jogador', path: '/player', icon: Shield },
    { name: 'Escudo do Mestre', mobileName: 'Mestre', path: '/dm', icon: Crown },
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
              placeholder="Ex: joao.c"
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

  if (isMobile) {
    return (
      <View style={[styles.container, { paddingVertical: 10, paddingHorizontal: 12 }]}>
        <View style={{ width: '100%', gap: 10 }}>
          {/* Top Row: Logo compacta à esquerda e Botão Mundo de HG à direita */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }} onPress={() => router.push('/')}>
              <View style={[styles.iconContainer, { width: 34, height: 34, borderRadius: 6 }]}>
                <Sword color={Colors.fantasy.gold} size={18} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.title, { fontSize: 14, letterSpacing: 1 }]} numberOfLines={1}>HONRA & EGOÍSMO</Text>
                <Text style={[styles.subtitle, { fontSize: 8, letterSpacing: 0.5 }]} numberOfLines={1}>GRIMÓRIO D&D 5E</Text>
              </View>
            </TouchableOpacity>

            {user ? (
              <TouchableOpacity
                style={[styles.roomBadge, { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, flexShrink: 0 }]}
                onPress={() => {
                  logout();
                  router.push('/');
                }}
              >
                <Text style={[styles.roomCode, { marginTop: 0, fontSize: 11 }]}>SAIR ↗</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.roomBadge, { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, flexShrink: 0 }]}
                onPress={() => setShowLoginModal(true)}
              >
                <Text style={[styles.roomCode, { marginTop: 0, fontSize: 11 }]}>LOGIN ↗</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Row: Tabs de Navegação em Barra Segmentada horizontal compacta */}
          <View style={[styles.navLinks, { width: '100%', padding: 4, gap: 4, justifyContent: 'space-between' }]}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <TouchableOpacity
                  key={item.path}
                  style={[
                    styles.navButton,
                    { flex: 1, justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 4, gap: 4, borderRadius: 4 },
                    isActive && styles.navButtonActive
                  ]}
                  onPress={() => router.push(item.path as any)}
                >
                  <Icon color={isActive ? Colors.fantasy.goldBright : Colors.fantasy.textSecondary} size={14} />
                  <Text style={[styles.navText, { fontSize: 11 }, isActive && styles.navTextActive]} numberOfLines={1}>
                    {item.mobileName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {renderLoginModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Logo & Emblema Medieval */}
        <TouchableOpacity style={styles.brand} onPress={() => router.push('/')}>
          <View style={styles.iconContainer}>
            <Sword color={Colors.fantasy.gold} size={22} />
          </View>
          <View>
            <Text style={styles.title}>HONRA & EGOÍSMO</Text>
            <Text style={styles.subtitle}>GRIMÓRIO D&D 5E</Text>
          </View>
        </TouchableOpacity>

        {/* Links de Navegação Medieval */}
        <View style={styles.navLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <TouchableOpacity
                key={item.path}
                style={[
                  styles.navButton,
                  isActive && styles.navButtonActive
                ]}
                onPress={() => router.push(item.path as any)}
              >
                <Icon color={isActive ? Colors.fantasy.goldBright : Colors.fantasy.textSecondary} size={16} />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emblema de Campanha / Login */}
        {user ? (
          <TouchableOpacity
            style={styles.roomBadge}
            onPress={() => {
              logout();
              router.push('/');
            }}
          >
            <Text style={[styles.roomCode, { marginTop: 0 }]}>SAIR</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.roomBadge}
            onPress={() => setShowLoginModal(true)}
          >
            <Text style={[styles.roomCode, { marginTop: 0 }]}>LOGIN</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderLoginModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingVertical: 14,
    paddingHorizontal: 20,
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
    maxWidth: 1200,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 16,
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
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
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
  }
});
