import { Alert, Platform } from 'react-native';

/**
 * Exibe um diálogo de confirmação universal seguro para Web e React Native.
 */
export function confirmAction(
  message: string,
  onConfirm: () => void,
  title: string = 'Confirmação'
) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
    ]);
  }
}
