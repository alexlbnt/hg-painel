import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CharacterData } from '@/lib/mockData';

export const ExportService = {
  /**
   * Exporta uma ficha de personagem em formato JSON para download/backup.
   */
  async exportCharacterToJson(char: CharacterData): Promise<void> {
    const jsonString = JSON.stringify(char, null, 2);
    const fileName = `${char.name.replace(/\s+/g, '_')}_DND5E_Ficha.json`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Erro no download Web', e);
      }
    } else {
      try {
        await Clipboard.setStringAsync(jsonString);
        Alert.alert('Backup Copiado!', 'O código JSON da ficha foi copiado para a área de transferência.');
      } catch (e) {
        console.error('Erro no mobile export', e);
      }
    }
  },

  /**
   * Exporta todas as fichas para um arquivo de backup completo.
   */
  async exportAllCharactersToJson(chars: CharacterData[]): Promise<void> {
    const jsonString = JSON.stringify(chars, null, 2);
    const fileName = `Grimorio_Backup_Total_${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      await Clipboard.setStringAsync(jsonString);
      Alert.alert('Backup Copiado!', 'O código JSON com todas as fichas foi copiado para a área de transferência.');
    }
  },

  /**
   * Parse e valida string JSON para importação de fichas.
   */
  parseImportJson(jsonString: string): { success: boolean; characters: Partial<CharacterData>[]; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        return { success: false, characters: [], error: 'O arquivo JSON está vazio.' };
      }
      const validChars: Partial<CharacterData>[] = [];
      for (const item of arr) {
        if (item && typeof item === 'object' && (item.name || item.class)) {
          validChars.push({
            ...item,
            id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: item.name || 'Herói Importado',
            class: item.class || 'Aventureiro',
            level: Number(item.level) || 1,
          });
        }
      }
      if (validChars.length === 0) {
        return { success: false, characters: [], error: 'Nenhum dado válido de personagem foi encontrado no JSON.' };
      }
      return { success: true, characters: validChars };
    } catch (_e: any) {
      return { success: false, characters: [], error: 'Formato JSON inválido. Verifique o arquivo e tente novamente.' };
    }
  },
};
