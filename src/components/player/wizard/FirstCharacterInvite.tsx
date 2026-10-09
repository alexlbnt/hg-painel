import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';
import { STEP_TITLES } from './wizardState';

interface InviteProps {
  /** Nome de quem está logado (para o cumprimento) */
  name?: string;
  /** Mesa ativa, se houver */
  roomName?: string;
  username?: string;
  onStart: () => void;
}

/** Convite de tela cheia para quem ainda não tem personagem (aba Jogador). */
export function FirstCharacterInvite({ name, roomName, username, onStart }: InviteProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Sparkles color={Colors.fantasy.goldBright} size={30} />
      </View>
      <Text style={styles.title}>Sua aventura começa aqui{name ? `, ${name.split(' ')[0]}` : ''}</Text>
      <Text style={styles.body}>
        Você ainda não tem um personagem{roomName ? ` na ${roomName}` : ''}. Monte o seu em {STEP_TITLES.length} passos rápidos:
        o assistente já preenche dado de vida, salvaguardas, espaços de magia e perícias da classe.
      </Text>

      <View style={styles.steps}>
        {STEP_TITLES.map((t, i) => (
          <View key={t} style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{t}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onStart} accessibilityRole="button" accessibilityLabel="Criar meu personagem" activeOpacity={0.85} style={styles.cta}>
        <Text style={styles.ctaText}>Criar meu personagem</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Já tem uma ficha? Peça ao Mestre para vinculá-la ao seu usuário{username ? ` (@${username})` : ''}.
      </Text>
    </View>
  );
}

/** Faixa compacta do mesmo convite, para a Taverna. */
export function CreateCharacterBanner({ onStart }: { onStart: () => void }) {
  return (
    <TouchableOpacity
      onPress={onStart}
      accessibilityRole="button"
      accessibilityLabel="Criar meu personagem"
      activeOpacity={0.85}
      style={styles.banner}
    >
      <Sparkles color={Colors.fantasy.goldBright} size={20} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>Você ainda não tem um personagem</Text>
        <Text style={styles.bannerBody}>Crie o seu em 5 passos rápidos, com tudo da classe já preenchido.</Text>
      </View>
      <Text style={styles.bannerCta}>Criar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
    marginTop: 8,
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197,160,89,0.12)',
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
  },
  title: { color: Colors.fantasy.goldBright, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  body: { color: Colors.fantasy.text, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 480 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginVertical: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.fantasy.goldDark,
  },
  stepNumText: { color: '#110F0D', fontSize: 12, fontWeight: '800' },
  stepText: { color: Colors.fantasy.textSecondary, fontSize: 13, fontWeight: '600' },
  cta: {
    minHeight: 50,
    paddingHorizontal: 28,
    borderRadius: Radius.md,
    backgroundColor: Colors.fantasy.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#110F0D', fontSize: 16, fontWeight: '800' },
  note: { color: Colors.fantasy.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 420 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
    backgroundColor: 'rgba(197,160,89,0.10)',
  },
  bannerTitle: { color: Colors.fantasy.goldBright, fontSize: 14, fontWeight: '800' },
  bannerBody: { color: Colors.fantasy.text, fontSize: 12, lineHeight: 17 },
  bannerCta: { color: '#110F0D', backgroundColor: Colors.fantasy.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm, fontWeight: '800', overflow: 'hidden' },
});
