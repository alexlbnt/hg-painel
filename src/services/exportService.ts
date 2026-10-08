import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CharacterData } from '@/lib/mockData';
import { buildCharacterSheetHtml, sanitizeImportedCharacter } from '@/utils/characterImport';

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
   * Exporta a ficha em PDF. Web: abre a ficha numa janela e aciona a impressão (salvar como PDF).
   * Nativo: gera o arquivo com expo-print e abre o compartilhamento.
   */
  async exportCharacterToPdf(char: CharacterData): Promise<void> {
    const html = buildCharacterSheetHtml(char);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open('', '_blank');
      if (!win) {
        Alert.alert('Pop-up bloqueado', 'Permita pop-ups para este site para gerar o PDF da ficha.');
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.onload = () => win.print();
      setTimeout(() => {
        try {
          win.print();
        } catch {}
      }, 400);
      return;
    }

    try {
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Ficha de ${char.name}`,
        });
      } else {
        Alert.alert('PDF gerado', uri);
      }
    } catch (e) {
      console.error('Erro ao gerar PDF', e);
      Alert.alert('Erro', 'Não foi possível gerar o PDF da ficha.');
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
      if (arr.length > 50) {
        return { success: false, characters: [], error: 'O arquivo tem fichas demais (máximo de 50 por importação).' };
      }
      const validChars: Partial<CharacterData>[] = [];
      for (const item of arr) {
        const clean = sanitizeImportedCharacter(item);
        if (clean) {
          validChars.push({
            ...clean,
            id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          });
        }
      }
      if (validChars.length === 0) {
        return { success: false, characters: [], error: 'Nenhum dado válido de personagem foi encontrado no JSON.' };
      }
      return { success: true, characters: validChars };
    } catch {
      return { success: false, characters: [], error: 'Formato JSON inválido. Verifique o arquivo e tente novamente.' };
    }
  },
};
