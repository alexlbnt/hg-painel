import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Key,
  User as UserIcon,
  BookOpen,
  AlertCircle,
  Flame,
  Lock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function LoginGateScreen() {
  const { login } = useAuth();
  const { isMobile } = useResponsive();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha seu usuário e senha para cruzar o portal.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const ok = await login(username.trim(), password.trim());
      if (!ok) {
        setErrorMsg('Usuário ou senha inválidos. Verifique com seu Mestre.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro de conexão ao acessar o portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, isMobile && styles.scrollContainerMobile]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brasão Superior Decorativo */}
        <View style={styles.emblemContainer}>
          <View style={styles.emblemOuterRing}>
            <View style={styles.emblemInnerCircle}>
              <Flame color="#E6C280" size={32} />
            </View>
          </View>
        </View>

        {/* Título Principal de Fantasia */}
        <Text style={styles.gameTitle}>HONRA & EGOÍSMO</Text>
        <Text style={styles.gameSubtitle}>PORTAL DA COMITIVA & GRIMÓRIO DE CAMPANHA</Text>

        <View style={styles.dividerOrnamental}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerRune}>✦ ⚔ ✦</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Card Principal de Login */}
        <View style={[styles.loginCard, isMobile && styles.loginCardMobile]}>
          <View style={styles.cardHeader}>
            <Lock color="#C5A059" size={20} />
            <Text style={styles.cardTitle}>Identificação do Aventureiro</Text>
          </View>
          <Text style={styles.cardDesc}>
            O acesso às fichas, crônicas e segredos das mesas é restrito aos convocados.
          </Text>

          {/* Input Usuário */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USUÁRIO / PERSONAGEM</Text>
            <View style={styles.inputWrapper}>
              <UserIcon color="#8C704F" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: lobo.l, joao.c, allan..."
                placeholderTextColor="#5C4D3C"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          {/* Input Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PALAVRA-PASSE / SENHA</Text>
            <View style={styles.inputWrapper}>
              <Key color="#8C704F" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha secreta"
                placeholderTextColor="#5C4D3C"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg('');
                }}
                editable={!loading}
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Alerta de Erro */}
          {!!errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle color="#E74C3C" size={16} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Botão de Entrar */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#110F0D" size="small" />
            ) : (
              <>
                <BookOpen color="#110F0D" size={18} />
                <Text style={styles.submitButtonText}>Entrar no Grimório</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.portalFootnote}>
          Honra & Egoísmo RPG • Sistema de Gerenciamento & Sincronização em Tempo Real
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0A0806',
  },
  scrollContainer: {
    minHeight: '100%' as any,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  scrollContainerMobile: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emblemOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 20, 16, 0.6)',
  },
  emblemInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E1712',
    borderWidth: 2,
    borderColor: '#C5A059',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E6C280',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  gameTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E6C280',
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Cinzel', android: 'serif', default: 'Georgia, serif' }),
    textShadowColor: 'rgba(230, 194, 128, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gameSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C704F',
    letterSpacing: 2.2,
    marginTop: 6,
    textAlign: 'center',
  },
  dividerOrnamental: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
    width: '100%',
    maxWidth: 380,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
  },
  dividerRune: {
    color: '#C5A059',
    fontSize: 11,
    letterSpacing: 2,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(20, 15, 12, 0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  loginCardMobile: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E6C280',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  cardDesc: {
    fontSize: 12,
    color: '#BAAFA0',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C704F',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120E0B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F4ECE1',
    fontSize: 14,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.35)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#C5A059',
    borderRadius: 8,
    paddingVertical: 14,
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#110F0D',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  portalFootnote: {
    fontSize: 10,
    color: '#5C4D3C',
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: 1,
  },
});
