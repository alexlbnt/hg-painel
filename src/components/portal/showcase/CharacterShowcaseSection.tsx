import { CharacterData } from '@/lib/mockData';
import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterCarousel } from './CharacterCarousel';

interface CharacterShowcaseSectionProps {
  characters: CharacterData[];
  isMobile?: boolean;
  containerWidth: number;
  isLoading?: boolean;
}

export const CharacterShowcaseSection: React.FC<CharacterShowcaseSectionProps> = ({
  characters,
  isMobile = false,
  containerWidth,
  isLoading = false,
}) => {
  const router = useRouter();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  // Identifica salas únicas para as abas de filtro
  const roomsList = useMemo(() => {
    const roomMap = new Map<string, { id: string; name: string; count: number }>();

    characters.forEach((char) => {
      const rId = char.roomId || 'unassigned';
      const rName = char.room?.name || 'Comitiva Livre';
      const existing = roomMap.get(rId);
      if (existing) {
        existing.count += 1;
      } else {
        roomMap.set(rId, { id: rId, name: rName, count: 1 });
      }
    });

    return Array.from(roomMap.values());
  }, [characters]);

  // Filtra personagens pela mesa selecionada
  const filteredCharacters = useMemo(() => {
    if (selectedRoomFilter === 'all') return characters;
    return characters.filter((c) => (c.roomId || 'unassigned') === selectedRoomFilter);
  }, [characters, selectedRoomFilter]);

  const handleSelectCharacter = (character: CharacterData) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('selected_character_id', character.id);
    }
    router.push('/player');
  };

  if (isLoading && (!characters || characters.length === 0)) {
    return (
      <View style={[styles.sectionContainer, isMobile && styles.sectionContainerMobile]}>
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
            Heróis da Mesa
          </Text>
          <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>
            Conhecendo os personagens forjados pela Honra e pelo Egoísmo...
          </Text>
        </View>

        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={[
                styles.skeletonCard,
                { width: isMobile ? Math.min(Math.max(containerWidth - 64, 260), 320) : 320 },
              ]}
            >
              <View style={styles.skeletonHeaderRow}>
                <View style={styles.skeletonTag} />
                <View style={styles.skeletonTagSmall} />
              </View>
              <View style={styles.skeletonCenterCircle} />
              <View style={styles.skeletonContentBottom}>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineTitle} />
                <View style={styles.skeletonLineMeta} />
                <View style={styles.skeletonLineQuote} />
                <View style={styles.skeletonBtn} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <View style={[styles.sectionContainer, isMobile && styles.sectionContainerMobile]}>
      {/* Cabeçalho da Seção com Atmosfera Dark Fantasy */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
          Heróis da Mesa
        </Text>

        <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>
          Conheça os personagens forjados pela Honra e pelo Egoísmo que moldam o destino do mundo.
        </Text>

        {/* Abas de Filtro por Mesa */}
        {roomsList.length > 1 && (
          <View style={styles.filterTabsWrapper}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedRoomFilter('all')}
              style={[
                styles.filterTab,
                selectedRoomFilter === 'all' && styles.filterTabActive,
                ...(Platform.OS === 'web' ? [{ cursor: 'pointer' } as any] : []),
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedRoomFilter === 'all' && styles.filterTabTextActive,
                ]}
              >
                Todas ({characters.length})
              </Text>
            </TouchableOpacity>

            {roomsList.map((room) => {
              const isTabActive = selectedRoomFilter === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedRoomFilter(room.id)}
                  style={[
                    styles.filterTab,
                    isTabActive && styles.filterTabActive,
                    ...(Platform.OS === 'web' ? [{ cursor: 'pointer' } as any] : []),
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isTabActive && styles.filterTabTextActive,
                    ]}
                  >
                    {room.name} ({room.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Carrossel de Cards Interativos */}
      {filteredCharacters.length > 0 ? (
        <CharacterCarousel
          characters={filteredCharacters}
          onSelectCharacter={handleSelectCharacter}
          isMobile={isMobile}
          containerWidth={containerWidth}
        />
      ) : (
        <View style={styles.emptyState}>
          <Compass size={32} color="#80776C" />
          <Text style={styles.emptyTitle}>Nenhum herói encontrado</Text>
          <Text style={styles.emptySubtitle}>
            Nenhum personagem registrado nesta mesa até o momento.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    marginVertical: 24,
    paddingVertical: 12,
  },
  sectionContainerMobile: {
    width: '100%',
    marginVertical: 16,
    paddingVertical: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5EEDB',
    fontFamily: Platform.select({
      web: '"Cinzel", Georgia, serif',
      default: 'serif',
    }),
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6,
    ...(Platform.OS === 'web'
      ? ({
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        } as any)
      : {}),
  },
  sectionTitleMobile: {
    fontSize: 22,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#BAAFA0',
    textAlign: 'center',
    maxWidth: 620,
    marginBottom: 16,
  },
  sectionSubtitleMobile: {
    fontSize: 12,
    lineHeight: 17,
  },
  filterTabsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#3D342C',
    ...(Platform.OS === 'web'
      ? ({
          transition: 'all 0.2s ease',
        } as any)
      : {}),
  },
  filterTabActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#80776C',
  },
  filterTabTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BAAFA0',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#80776C',
    textAlign: 'center',
  },
  skeletonContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  skeletonCard: {
    height: 480,
    borderRadius: 12,
    backgroundColor: '#141210',
    borderWidth: 1,
    borderColor: '#25201B',
    padding: 14,
    justifyContent: 'space-between',
    opacity: 0.65,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonTag: {
    width: 70,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#221D18',
  },
  skeletonTagSmall: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#221D18',
  },
  skeletonCenterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1B1714',
    alignSelf: 'center',
    marginVertical: 40,
  },
  skeletonContentBottom: {
    gap: 8,
  },
  skeletonLineShort: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#221D18',
  },
  skeletonLineTitle: {
    width: '75%',
    height: 22,
    borderRadius: 4,
    backgroundColor: '#2A241E',
  },
  skeletonLineMeta: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#1F1A15',
  },
  skeletonLineQuote: {
    width: '100%',
    height: 28,
    borderRadius: 4,
    backgroundColor: '#1A1612',
    marginTop: 4,
  },
  skeletonBtn: {
    width: '100%',
    height: 38,
    borderRadius: 6,
    backgroundColor: '#1C1814',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2A241E',
  },
});
