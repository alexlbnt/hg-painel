import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Sparkles, Scroll, Shield, Flame, Compass } from 'lucide-react-native';

const LORE_TIDBITS = [
  {
    icon: 'scroll',
    title: 'As Crônicas de Honra & Egoísmo',
    text: 'Neste universo, a honra é uma moeda rara e o egoísmo, o escudo dos sobreviventes. Suas escolhas moldam as alianças do mundo.',
  },
  {
    icon: 'flame',
    title: 'Mesa do Alex • Sacrilégio & Glória',
    text: 'Sob o olhar do Mestre Alex, forças primordiais e mistérios arcanos testam a sanidade e a determinação dos campeões.',
  },
  {
    icon: 'shield',
    title: 'Mesa do Lobo • Aço & Sobrevivência',
    text: 'A comitiva guiada pelo Mestre Lobo enfrenta embates implacáveis, onde bravura tática e lealdade decidem a vida ou a morte.',
  },
  {
    icon: 'sparkles',
    title: 'Mesa do João • Véu dos Destinos',
    text: 'Conduzidos pelo Mestre João, os aventureiros desvendam intrigas políticas e pactos ancestrais ocultos sob as brumas.',
  },
  {
    icon: 'compass',
    title: 'Dica do Mestre • D&D 5e',
    text: 'Lembre-se: um descanso curto recupera o fôlego de seus dados de vida, mas apenas a vigília mútua protege o acampamento de predadores.',
  },
  {
    icon: 'scroll',
    title: 'O Mural da Taverna',
    text: 'Mesmo divididos em três mesas distintas, todos os aventureiros compartilham os grandes contratos e preparativos no mural comunitário.',
  },
];

export default function FantasyLoadingScreen() {
  const [tidbitIndex, setTidbitIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Rotação suave do anel místico
  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinAnim]);

  // Pulso suave do brasão
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Troca de lore a cada 4 segundos com fade out/in
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setTidbitIndex((prev) => (prev + 1) % LORE_TIDBITS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentTidbit = LORE_TIDBITS[tidbitIndex];

  return (
    <View style={styles.container}>
      {/* Luz ambiente central */}
      <View style={styles.ambientGlow} />

      {/* Roda Rúnica Central */}
      <View style={styles.runeCircleContainer}>
        <Animated.View
          style={[
            styles.runicRing,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.runeRays} />
        </Animated.View>

        <Animated.View
          style={[
            styles.centerEmblem,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Sparkles size={38} color="#E6C280" />
        </Animated.View>
      </View>

      {/* Título Principal */}
      <Text style={styles.title}>HONRA & EGOÍSMO</Text>
      <Text style={styles.subtitle}>CONSULTANDO OS PERGAMINHOS ASTRAIS...</Text>

      {/* Spinner estético */}
      <View style={{ marginVertical: 20 }}>
        <ActivityIndicator size="small" color="#C5A059" />
      </View>

      {/* Cartão de Lore e Dicas para Curiosos */}
      <Animated.View style={[styles.loreCard, { opacity: fadeAnim }]}>
        <View style={styles.loreHeader}>
          <View style={styles.loreIconWrap}>
            {currentTidbit.icon === 'scroll' && <Scroll size={16} color="#E6C280" />}
            {currentTidbit.icon === 'flame' && <Flame size={16} color="#D63939" />}
            {currentTidbit.icon === 'shield' && <Shield size={16} color="#2E6DD1" />}
            {currentTidbit.icon === 'sparkles' && <Sparkles size={16} color="#27AE60" />}
            {currentTidbit.icon === 'compass' && <Compass size={16} color="#4E9C8E" />}
          </View>
          <Text style={styles.loreTitle}>{currentTidbit.title}</Text>
        </View>
        <Text style={styles.loreText}>{currentTidbit.text}</Text>
      </Animated.View>

      <Text style={styles.footerNote}>
        Grimório Arcana • 3 Mesas • Honra, Estratégia e Destino
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A08',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%' as any,
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(197, 160, 89, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.08)',
  },
  runeCircleContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
    position: 'relative',
  },
  runicRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeRays: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1,
    borderColor: 'rgba(140, 112, 79, 0.25)',
  },
  centerEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1410',
    borderWidth: 2,
    borderColor: '#C5A059',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E6C280',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E6C280',
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Cinzel', android: 'serif', default: 'Georgia, serif' }),
    textShadowColor: 'rgba(230, 194, 128, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C704F',
    letterSpacing: 2.5,
    marginTop: 6,
    textAlign: 'center',
  },
  loreCard: {
    maxWidth: 440,
    width: '100%',
    backgroundColor: 'rgba(26, 20, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  loreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 160, 89, 0.15)',
  },
  loreIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loreTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C5A059',
    letterSpacing: 1,
  },
  loreText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#BAAFA0',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  footerNote: {
    fontSize: 10,
    color: '#6E5C49',
    letterSpacing: 1.5,
    marginTop: 28,
    textAlign: 'center',
  },
});
