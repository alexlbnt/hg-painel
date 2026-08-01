import { useResponsive } from '@/hooks/useResponsive';
import { useRouter } from 'expo-router';
import { BookOpen, Crown, ExternalLink, Folder, Globe, Moon, Scroll, Shield, Sparkles, Sword, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [driveUrl] = useState<string>(() => {
    const defaultUrl = 'https://drive.google.com/drive/folders/1_Jz1km6fxK8pgtERQqPrMvi1y5wfQlOJ?usp=sharing';
    if (Platform.OS === 'web') {
      return localStorage.getItem('hg_drive_url') || defaultUrl;
    }
    return defaultUrl;
  });

  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Scroll color="#C5A059" size={14} />
          <Text style={styles.badgeText}>D&D 5E • CAMPANHA</Text>
        </View>
        
        <Text style={[styles.heroTitle, isMobile && { fontSize: 30, letterSpacing: 1 }]}>HONRA & EGOÍSMO</Text>
        <Text style={[styles.heroSubtitle, isMobile && { fontSize: 14, lineHeight: 22 }]}>
          O painel interativo para D&D 5e. Esqueça contas manuais e tabelas complexas: 
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
            <Text style={styles.cardTag}>PLAYERS</Text>
            <Text style={styles.cardTitle}>Grimório {user ? `de ${user.name}` : 'do Jogador'}</Text>
            <Text style={styles.cardDesc}>
              Acesse suas fichas, magias e inventário.
            </Text>
          </View>
          <View style={styles.cardAction}>
            <Text style={styles.cardActionText}>Abrir Minhas Fichas →</Text>
          </View>
        </TouchableOpacity>

        {/* Card Mestre (Apenas Mestre) */}
        {(!user || user.role === 'DM') && (
          <TouchableOpacity
            style={[styles.moduleCard, styles.dmCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/dm')}
          >
            <View style={[styles.iconBox, styles.dmIconBox]}>
              <Crown color="#8C6C90" size={32} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTag, { color: '#8C6C90' }]}>CONTROLE DO MESTRE</Text>
              <Text style={styles.cardTitle}>Escudo do Mestre</Text>
              <Text style={styles.cardDesc}>
                Visão geral da mesa em sessão.
              </Text>
            </View>
            <View style={[styles.cardAction, styles.dmCardAction]}>
              <Text style={[styles.cardActionText, { color: '#8C6C90' }]}>Acessar Escudo →</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* SEÇÃO LORE & ARQUIVOS: O MUNDO DE HONRA & EGOÍSMO */}
      <View style={styles.worldSection}>
        <View style={styles.worldBannerHeader}>
          <View style={styles.worldTitleRow}>
            <Globe color="#E6C280" size={26} />
            <Text style={styles.worldMainTitle}>O UNIVERSO DE HONRA & EGOÍSMO</Text>
          </View>
          <Text style={styles.worldMainSub}>
            Explore a cronologia das eras, conheça as leis mágicas e acesse todos os suplementos, PDFs e compêndios oficiais do nosso RPG.
          </Text>
        </View>

        <View style={styles.worldCardsGrid}>
          {/* Card Wiki Oficial */}
          <TouchableOpacity
            style={[styles.worldCard, styles.wikiCardBorder]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://hg.a11y.host')}
          >
            <View style={styles.worldCardHeader}>
              <View style={[styles.worldIconBox, { backgroundColor: 'rgba(78, 156, 142, 0.15)', borderColor: '#4E9C8E' }]}>
                <BookOpen color="#4E9C8E" size={26} />
              </View>
              <View style={styles.badgePillWiki}>
                <Sparkles color="#4E9C8E" size={12} />
                <Text style={styles.badgePillWikiText}>WIKI OFICIAL</Text>
              </View>
            </View>
            
            <Text style={styles.worldCardTitle}>Compêndio & Lore do Mundo</Text>
            <Text style={styles.worldCardDesc}>
              Portal interativo com a história dos reinos, panteão de divindades, facções, bestiário e regras de magia exclusivas do cenário de Honra & Egoísmo.
            </Text>

            <View style={[styles.worldBtn, { backgroundColor: '#4E9C8E' }]}>
              <Text style={styles.worldBtnText}>Acessar Portal da Wiki 🌐</Text>
              <ExternalLink color="#110F0D" size={16} />
            </View>
          </TouchableOpacity>

          {/* Card Drive de Arquivos */}
          <View style={[styles.worldCard, styles.driveCardBorder]}>
            <View style={styles.worldCardHeader}>
              <View style={[styles.worldIconBox, { backgroundColor: 'rgba(197, 160, 89, 0.15)', borderColor: '#C5A059' }]}>
                <Folder color="#E6C280" size={26} />
              </View>
              <View style={styles.badgePillDrive}>
                <Text style={styles.badgePillDriveText}>SUPLEMENTOS & REGRAS</Text>
              </View>
            </View>
            
            <Text style={styles.worldCardTitle}>Arquivos de Mecânicas (Drive)</Text>
            <Text style={styles.worldCardDesc}>
              Repositório na nuvem com os livros de regras, PDFs de classes homebrew, tabelas de itens mágicos, fichas em branco e guias da nossa mesa.
            </Text>

            <TouchableOpacity
              style={[styles.worldBtn, { backgroundColor: '#C5A059' }]}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(driveUrl)}
            >
              <Text style={[styles.worldBtnText, { color: '#110F0D' }]}>Abrir Google Drive </Text>
              <ExternalLink color="#110F0D" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Features Overview */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Mecânicas & Automações</Text>
        
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
        <Text style={styles.footerNote}>
          HG Painel moldado em React Native (Expo), TypeScript, Prisma & Neon PostgreSQL.
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
    minWidth: 280,
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
  worldSection: {
    backgroundColor: '#161311',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#42372D',
    padding: 32,
    marginBottom: 50,
  },
  worldBannerHeader: {
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  worldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  worldMainTitle: {
    color: '#E2D8C3',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
    textAlign: 'center',
  },
  worldMainSub: {
    color: '#BAAFA0',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 680,
  },
  worldCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  worldCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#1A1714',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 24,
    justifyContent: 'space-between',
    gap: 16,
  },
  wikiCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#4E9C8E',
  },
  driveCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#C5A059',
  },
  worldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  worldIconBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillWiki: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 156, 142, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgePillWikiText: {
    color: '#4E9C8E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgePillDrive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgePillDriveText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  worldCardTitle: {
    color: '#E2D8C3',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  worldCardDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 22,
  },
  worldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  worldBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: '700',
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
    minWidth: 250,
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

