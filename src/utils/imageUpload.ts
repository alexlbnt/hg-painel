import { Platform } from 'react-native';

interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 a 1
}

/**
 * Abre o seletor de arquivos do sistema operacional no navegador,
 * lê a imagem selecionada e a otimiza via Canvas para um Data URL leve.
 */
export async function pickAndOptimizeImage(options: OptimizeImageOptions = {}): Promise<string | null> {
  const { maxWidth = 600, maxHeight = 800, quality = 0.82 } = options;

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    console.warn('O seletor nativo direto via Canvas é suportado em ambientes web.');
    return null;
  }

  return new Promise((resolve, reject) => {
    // 1. Criar input do tipo file invisível
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.style.display = 'none';

    let hasSelected = false;

    // Detectar cancelamento
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!hasSelected) {
            resolve(null);
          }
        }, 500);
      },
      { once: true }
    );

    input.onchange = async (event: any) => {
      hasSelected = true;
      const file = event?.target?.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).'));
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) {
            resolve(null);
            return;
          }

          // Carregar a imagem para redimensionamento via Canvas
          const img = new (window as any).Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calcular proporção mantendo aspecto
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              // Se não conseguir contexto canvas, retorna a imagem original do FileReader
              resolve(rawDataUrl);
              return;
            }

            // Suavização de alta qualidade
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Exportar como JPEG leve e universalmente compatível
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(optimizedDataUrl);
          };

          img.onerror = () => {
            reject(new Error('Não foi possível processar o arquivo de imagem selecionado.'));
          };

          img.src = rawDataUrl;
        };

        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo selecionado.'));
        };

        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      } finally {
        input.remove();
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}
