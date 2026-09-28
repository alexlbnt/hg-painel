import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Shield, Heart, User, ChevronRight } from 'lucide-react-native';
import { CharacterData } from '@/lib/mockData';
import { getCharacterPortrait, getCharacterLoreSnippet } from '@/constants/portraits';
import { UserAvatar } from '@/components/common/UserAvatar';

interface CharacterCardProps {
  character: CharacterData;
  cardWidth: number;
  isActive?: boolean;
  onPressCard?: (character: CharacterData) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  cardWidth,
  isActive = false,
  onPressCard,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const portraitInfo = getCharacterPortrait(character);
  const loreSnippet = getCharacterLoreSnippet(character);
  const cardDescription = character.description?.trim() || loreSnippet;

  // Informações do jogador responsável
  const playerName = character.user?.name || character.playerName || 'Aventureiro';
  const playerUsername = character.user?.username || character.username || '';
  const playerAvatar = character.user?.avatarUrl;

  const roomName = character.room?.name || 'Comitiva Principal';
  const cleanArchetype = character.archetype ? ` • ${character.archetype}` : '';

  return (
    <Pressable
      onPress={() => onPressCard && onPressCard(character)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.cardContainer,
        { width: cardWidth },
        isActive && styles.cardContainerActive,
        isHovered && styles.cardContainerHovered,
        ...(Platform.OS === 'web'
          ? [
              {
                cursor: 'pointer',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                boxShadow: isHovered
                  ? `0 18px 36px rgba(0, 0, 0, 0.8), 0 0 24px ${portraitInfo.accentColor}30`
                  : '0 8px 24px rgba(0, 0, 0, 0.6)',
              } as any,
            ]
          : []),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ficha de ${character.name}`}
    >
      {/* 1. RETRATO DE FUNDO (OU SILHUETA ACINZENTADA) */}
      <View style={styles.imageWrapper}>
        {portraitInfo.hasCustomAvatar ? (
          <Image
            source={{ uri: portraitInfo.portraitUrl }}
            style={styles.portraitImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.grayedOutPlaceholder}>
            <View style={styles.grayedOutIconCircle}>
              <User size={52} color="#453E36" strokeWidth={1.3} />
            </View>
            <Text style={styles.grayedOutText}>SEM RETRATO ANEXADO</Text>
          </View>
        )}

        {/* Gradiente Suave Dark Fantasy */}
        <View
          style={[
            styles.vignetteOverlay,
            ...(Platform.OS === 'web'
              ? [
                  {
                    backgroundImage:
                      'linear-gradient(180deg, rgba(16, 14, 12, 0.3) 0%, rgba(16, 14, 12, 0.45) 35%, rgba(16, 14, 12, 0.92) 72%, rgba(12, 10, 9, 0.99) 100%)',
                  } as any,
                ]
              : []),
          ]}
        />
      </View>

      {/* 2. CABEÇALHO DO CARD (TAG DA MESA & NÍVEL) */}
      <View style={styles.cardHeader}>
        <View style={styles.roomTag}>
          <Text style={styles.roomTagText} numberOfLines={1}>
            {roomName}
          </Text>
        </View>

        <View style={[styles.levelTag, { borderColor: portraitInfo.accentColor + '55' }]}>
          <Text style={[styles.levelTagText, { color: portraitInfo.accentColor }]}>
            Nv. {character.level}
          </Text>
        </View>
      </View>

      {/* 3. CONTEÚDO PRINCIPAL DO HERÓI (SEM CAIXAS ANINHADAS) */}
      <View style={styles.cardContent}>
        {/* Runa & Classe */}
        <View style={styles.classRow}>
          <Text style={[styles.classRune, { color: portraitInfo.accentColor }]}>
            {portraitInfo.runicSymbol}
          </Text>
          <Text style={[styles.classText, { color: portraitInfo.accentColor }]} numberOfLines={1}>
            {character.class}
            {cleanArchetype}
          </Text>
        </View>

        {/* Nome do Personagem */}
        <Text style={styles.characterName} numberOfLines={1}>
          {character.name}
        </Text>

        {/* Raça e Atributos em Linha Fluida (sem pílulas pesadas) */}
        <View style={styles.metaRow}>
          <Text style={styles.raceText}>{character.race}</Text>

          <View style={styles.statsInline}>
            <View style={styles.statItem}>
              <Heart size={11} color="#C95B5B" />
              <Text style={styles.statValue}>{character.currentHp}/{character.maxHp}</Text>
            </View>

            <Text style={styles.statDot}>•</Text>

            <View style={styles.statItem}>
              <Shield size={11} color="#C5A059" />
              <Text style={styles.statValue}>CA {character.armorClass}</Text>
            </View>
          </View>
        </View>

        {/* Citação Fluida do Card (sem caixa cinza pesada) */}
        <View style={styles.quoteWrap}>
          <Text style={[styles.quoteMark, { color: portraitInfo.accentColor + '55' }]}>“</Text>
          <Text style={styles.quoteText} numberOfLines={2}>
            {cardDescription}
          </Text>
        </View>

        {/* Linha Divisória Fina */}
        <View style={styles.fineDivider} />

        {/* Rodapé: Assinatura do Jogador de 1 Linha */}
        <View style={styles.playerSignatureRow}>
          <View style={styles.playerAvatarWrapper}>
            <UserAvatar avatarUrl={playerAvatar} name={playerName} size={22} showBorder={false} />
          </View>
          <Text style={styles.playerSignatureText} numberOfLines={1}>
            Conduzido por <Text style={styles.playerSignatureName}>{playerName}</Text>
            {playerUsername ? (
              <Text style={styles.playerSignatureUser}> (@{playerUsername})</Text>
            ) : null}
          </Text>
        </View>

        {/* Botão de Ação Minimalista */}
        <View
          style={[
            styles.ctaRow,
            isHovered && { borderColor: portraitInfo.accentColor, backgroundColor: '#221D17' },
          ]}
        >
          <Text style={[styles.ctaText, isHovered && { color: portraitInfo.accentColor }]}>
            Consultar Grimório
          </Text>
          <ChevronRight size={13} color={isHovered ? portraitInfo.accentColor : '#8E8273'} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: 480,
    borderRadius: 12,
    backgroundColor: '#141210',
    borderWidth: 1,
    borderColor: '#2F2720',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardContainerActive: {
    borderColor: '#C5A059',
  },
  cardContainerHovered: {
    borderColor: '#D4B06A',
  },
  imageWrapper: {
    ...StyleSheet.absoluteFill,
    borderRadius: 12,
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  grayedOutPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#12100E',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  grayedOutIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2A241E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayedOutText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#4A423A',
    textTransform: 'uppercase',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 12, 10, 0.7)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  roomTag: {
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2A241E',
  },
  roomTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A89E91',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  levelTag: {
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardContent: {
    zIndex: 2,
    gap: 4,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classRune: {
    fontSize: 10,
  },
  classText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  characterName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EEDB',
    fontFamily: Platform.select({
      web: '"Cinzel", Georgia, serif',
      default: 'serif',
    }),
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  raceText: {
    fontSize: 11.5,
    color: '#8E8273',
    fontWeight: '500',
  },
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 11,
    color: '#D4C8B8',
    fontWeight: '600',
  },
  statDot: {
    color: '#3F362C',
    fontSize: 10,
  },
  quoteWrap: {
    position: 'relative',
    paddingLeft: 10,
    marginVertical: 4,
  },
  quoteMark: {
    position: 'absolute',
    left: 0,
    top: -4,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  quoteText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#BAAFA0',
    fontStyle: 'italic',
  },
  fineDivider: {
    height: 1,
    backgroundColor: '#241E18',
    marginVertical: 4,
  },
  playerSignatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 2,
  },
  playerAvatarWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
  },
  playerSignatureText: {
    fontSize: 10.5,
    color: '#7A6F62',
    flex: 1,
  },
  playerSignatureName: {
    color: '#C4B9A9',
    fontWeight: '600',
  },
  playerSignatureUser: {
    color: '#655B50',
    fontSize: 9.5,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#191512',
    borderWidth: 1,
    borderColor: '#332A22',
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 6,
    ...(Platform.OS === 'web'
      ? ({
          transition: 'all 0.2s ease',
        } as any)
      : {}),
  },
  ctaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#BAAFA0',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
