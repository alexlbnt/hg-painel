import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Crown, Zap, Moon, RefreshCw, Scroll, Sword, Heart } from 'lucide-react-native';
import { ApiService } from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await ApiService.resetToDefaultData();
      if (Platform.OS === 'web') {
        window.alert('Grimório restaurado com sucesso para os heróis ancestrais da campanha!');
      } else {
        Alert.alert('Sucesso', 'Fichas restauradas para o estado inicial!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Scroll color="#C5A059" size={14} />
          <Text style={styles.badgeText}>GRIMÓRIO D&D 5E • CAMPANHA MEDIEVAL</Text>
        </View>
        
        <Text style={styles.heroTitle}>HONRA & EGOÍSMO</Text>
        <Text style={styles.heroSubtitle}>
          O grimório ancestral interativo para D&D 5e. Esqueça contas manuais e tabelas complexas: 
          automatize atributos, pontos de vida e magias com intervenção divina em tempo real do Mestre.
        </Text>
      </View>

      {/* Main Modules Grid */}
      <View style={styles.modulesGrid}>
        {/* Card Jogador */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.playerCard]}
          activeOpacity={0.8}
          onPress={() => router.push('/player')}
        >
          <View style={[styles.iconBox, styles.playerIconBox]}>
            <Shield color="#C5A059" size={32} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTag}>AVENTUREIROS & HERÓIS</Text>
            <Text style={styles.cardTitle}>Grimório do Jogador</Text>
            <Text style={styles.cardDesc}>
              Criação e leitura de fichas medievais. Automação de CA, Iniciativa, Modificadores e Bônus de Proficiência.
              Controles táteis para pontos de vida, pergaminhos de magia e gatilhos de Descanso Curto e Longo.
            </Text>
          </View>
          <View style={styles.cardAction}>
            <Text style={styles.cardActionText}>Abrir Minhas Fichas →</Text>
          </View>
        </TouchableOpacity>

        {/* Card Mestre */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.dmCard]}
          activeOpacity={0.8}
          onPress={() => router.push('/dm')}
        >
          <View style={[styles.iconBox, styles.dmIconBox]}>
            <Crown color="#8C6C90" size={32} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTag, { color: '#8C6C90' }]}>MESTRE DO ORÁCULO (DM)</Text>
            <Text style={styles.cardTitle}>Tábua do Mestre</Text>
            <Text style={styles.cardDesc}>
              Visão geral da mesa em sessão. Acompanhe os sinais vitais, iniciativa e magias de todos os heróis.
              Intervenha remotamente para causar dano, conceder cura divina ou aplicar maldições instantaneamente.
            </Text>
          </View>
          <View style={[styles.cardAction, styles.dmCardAction]}>
            <Text style={[styles.cardActionText, { color: '#8C6C90' }]}>Acessar Tábua da Mesa →</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Features Overview */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Mecânicas Ancestrais & Automações</Text>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <Zap color="#C5A059" size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Sabedoria Matemática</Text>
            <Text style={styles.featureDesc}>
              Cálculo imediato de modificadores de FOR a CAR, Bônus de Proficiência por nível e Classe de Armadura de combate.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Moon color="#6B4A70" size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Gatilhos de Descanso</Text>
            <Text style={styles.featureDesc}>
              Recuperação automática de HP gastando Dados de Vida, recarga de feitiços e restauração de poderes por descanso curto ou longo.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Sword color="#B82828" size={24} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Intervenção Divina</Text>
            <Text style={styles.featureDesc}>
              O Mestre pode tocar na ficha de qualquer aventureiro para aplicar dano, cura, inspiração e estados sombrios sem interromper a narrativa.
            </Text>
          </View>
        </View>
      </View>

      {/* Demo Reset Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetDemo}
          disabled={resetting}
        >
          <RefreshCw color="#80776C" size={16} />
          <Text style={styles.resetBtnText}>
            {resetting ? 'Raurando Grimório...' : 'Restaurar Fichas de Exemplo da Campanha Medieval'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Grimório moldado em React Native (Expo), TypeScript, Prisma & Neon PostgreSQL.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    textAlign: 'center' as any,
    marginBottom: 44,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 18,
  },
  badgeText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  heroTitle: {
    color: '#E2D8C3',
    fontSize: Platform.OS === 'web' ? 52 : 36,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 14,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#BAAFA0',
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 720,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 50,
  },
  moduleCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 330 : '100%',
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 28,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  playerCard: {
    borderTopWidth: 4,
    borderTopColor: '#C5A059',
  },
  dmCard: {
    borderTopWidth: 4,
    borderTopColor: '#6B4A70',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  playerIconBox: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  dmIconBox: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#6B4A70',
  },
  cardContent: {
    marginBottom: 28,
  },
  cardTag: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  cardTitle: {
    color: '#E2D8C3',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  cardDesc: {
    color: '#BAAFA0',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  cardAction: {
    backgroundColor: '#24201C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
  },
  dmCardAction: {
    borderColor: '#6B4A70',
  },
  cardActionText: {
    color: '#E6C280',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  featuresSection: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 34,
    marginBottom: 44,
  },
  sectionTitle: {
    color: '#E2D8C3',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  featureItem: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 260 : '100%',
    backgroundColor: '#110F0D',
    padding: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  featureIcon: {
    marginBottom: 14,
  },
  featureTitle: {
    color: '#E2D8C3',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  featureDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 32,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    marginBottom: 14,
  },
  resetBtnText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  footerNote: {
    color: '#80776C',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
