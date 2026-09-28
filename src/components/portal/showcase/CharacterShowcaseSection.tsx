import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Users, Compass } from 'lucide-react-native';
import { CharacterData } from '@/lib/mockData';
import { CharacterCarousel } from './CharacterCarousel';

interface CharacterShowcaseSectionProps {
  characters: CharacterData[];
  isMobile?: boolean;
  containerWidth: number;
}

export const CharacterShowcaseSection: React.FC<CharacterShowcaseSectionProps> = ({
  characters,
  isMobile = false,
  containerWidth,
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

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <View style={[styles.sectionContainer, isMobile && styles.sectionContainerMobile]}>
      {/* Cabeçalho da Seção com Atmosfera Dark Fantasy */}
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <Sparkles size={14} color="#C5A059" />
          <Text style={styles.eyebrowText}>CRÔNICAS & LENDAS VIVAS</Text>
          <Sparkles size={14} color="#C5A059" />
        </View>

        <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
          Comitiva dos Heróis
        </Text>

        <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>
          Conheça os campeões forjados no aço, na fé e nos mistérios arcanos que moldam o destino do mundo.
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
});
