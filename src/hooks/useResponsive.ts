import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 660;
  const isTablet = width >= 660 && width < 1020;
  const isDesktop = width >= 1020;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
  };
}
