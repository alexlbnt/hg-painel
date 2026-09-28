import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CarouselControlsProps {
  currentIndex: number;
  totalCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
  isMobile?: boolean;
}

export const CarouselControls: React.FC<CarouselControlsProps> = ({
  currentIndex,
  totalCount,
  canScrollPrev,
  canScrollNext,
  onPrev,
  onNext,
  onSelectIndex,
  isMobile = false,
}) => {
  if (totalCount <= 1) return null;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* Indicador Numérico Rúnico */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterCurrent}>
          {String(currentIndex + 1).padStart(2, '0')}
        </Text>
        <Text style={styles.counterDivider}>/</Text>
        <Text style={styles.counterTotal}>
          {String(totalCount).padStart(2, '0')}
        </Text>
      </View>

      {/* Indicadores de Pontos / Gemas */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalCount }).map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => onSelectIndex(index)}
              style={[
                styles.dotTouchable,
                ...(Platform.OS === 'web'
                  ? [{ cursor: 'pointer' } as any]
                  : []),
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Ir para personagem ${index + 1}`}
            >
              <View
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botões de Navegação com Entalhe Medieval */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canScrollPrev}
          onPress={onPrev}
          style={[
            styles.navButton,
            !canScrollPrev && styles.navButtonDisabled,
            ...(Platform.OS === 'web'
              ? [
                  {
                    cursor: canScrollPrev ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  } as any,
                ]
              : []),
          ]}
          accessibilityRole="button"
          accessibilityLabel="Personagem anterior"
        >
          <ChevronLeft
            size={isMobile ? 18 : 20}
            color={canScrollPrev ? '#C5A059' : '#5C4E40'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canScrollNext}
          onPress={onNext}
          style={[
            styles.navButton,
            !canScrollNext && styles.navButtonDisabled,
            ...(Platform.OS === 'web'
              ? [
                  {
                    cursor: canScrollNext ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  } as any,
                ]
              : []),
          ]}
          accessibilityRole="button"
          accessibilityLabel="Próximo personagem"
        >
          <ChevronRight
            size={isMobile ? 18 : 20}
            color={canScrollNext ? '#C5A059' : '#5C4E40'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 14,
    width: '100%',
  },
  containerMobile: {
    paddingHorizontal: 4,
    marginTop: 10,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 64,
  },
  counterCurrent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6C280',
    fontFamily: Platform.select({
      web: '"Cinzel", Georgia, serif',
      default: 'serif',
    }),
    letterSpacing: 1,
  },
  counterDivider: {
    fontSize: 14,
    color: '#80776C',
    fontWeight: '300',
  },
  counterTotal: {
    fontSize: 13,
    color: '#BAAFA0',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingHorizontal: 12,
  },
  dotTouchable: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transitionDuration: '200ms',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#C5A059',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 8px rgba(197, 160, 89, 0.6)',
        } as any)
      : {}),
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#3D342C',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#5C4E40',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
        } as any)
      : {}),
  },
  navButtonDisabled: {
    opacity: 0.35,
    borderColor: '#2D2620',
    backgroundColor: '#110F0D',
  },
});
