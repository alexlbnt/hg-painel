import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { CharacterCard } from './CharacterCard';
import { CarouselControls } from './CarouselControls';

interface CharacterCarouselProps {
  characters: CharacterData[];
  onSelectCharacter: (character: CharacterData) => void;
  isMobile?: boolean;
  containerWidth: number;
}

const CARD_GAP = 16;

export const CharacterCarousel: React.FC<CharacterCarouselProps> = ({
  characters,
  onSelectCharacter,
  isMobile = false,
  containerWidth,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Calcula largura responsiva do card
  const cardWidth = useMemo(() => {
    if (isMobile) {
      // Deixa uma pequena margem para ver o início do próximo card estimulando o scroll
      return Math.min(Math.max(containerWidth - 64, 260), 320);
    }
    return 320;
  }, [isMobile, containerWidth]);

  const cardInterval = cardWidth + CARD_GAP;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / cardInterval);
      if (index >= 0 && index < characters.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [cardInterval, characters.length, activeIndex]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, characters.length - 1));
      scrollViewRef.current?.scrollTo({
        x: clamped * cardInterval,
        animated: true,
      });
      setActiveIndex(clamped);
    },
    [cardInterval, characters.length]
  );

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Lista Horizontal de Cards de Colecionador */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={cardInterval}
        decelerationRate="fast"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isMobile ? 16 : 8,
          },
        ]}
      >
        {characters.map((char, index) => (
          <View
            key={char.id || `char-${index}`}
            style={{
              marginRight: index === characters.length - 1 ? 0 : CARD_GAP,
            }}
          >
            <CharacterCard
              character={char}
              cardWidth={cardWidth}
              isActive={index === activeIndex}
              onPressCard={onSelectCharacter}
            />
          </View>
        ))}
      </ScrollView>

      {/* Controles de Navegação do Carrossel */}
      <CarouselControls
        currentIndex={activeIndex}
        totalCount={characters.length}
        canScrollPrev={activeIndex > 0}
        canScrollNext={activeIndex < characters.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelectIndex={scrollToIndex}
        isMobile={isMobile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
