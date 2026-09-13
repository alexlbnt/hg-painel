export interface CharacterAppearance {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  distinguishingMarks?: string;
}

export interface CharacterParsedLore {
  // 4 Pilares de Interpretação Canônicos de D&D 5e
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // Características Físicas & Aparência
  appearance: CharacterAppearance;

  // Biografia & Crônicas de Aventura (Markdown)
  backstory: string;
}

export const DEFAULT_LORE: CharacterParsedLore = {
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  appearance: {
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    distinguishingMarks: '',
  },
  backstory: '',
};

/**
 * Converte o campo lore salvo no banco (que pode ser string legado ou JSON)
 * em um objeto CharacterParsedLore totalmente estruturado sem perder dados.
 */
export function parseCharacterLore(rawLore?: string | null): CharacterParsedLore {
  if (!rawLore || typeof rawLore !== 'string' || !rawLore.trim()) {
    return { ...DEFAULT_LORE, appearance: { ...DEFAULT_LORE.appearance } };
  }

  const trimmed = rawLore.trim();

  // Verifica se parece um JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        ('backstory' in parsed ||
          'personalityTraits' in parsed ||
          'appearance' in parsed)
      ) {
        return {
          personalityTraits: String(parsed.personalityTraits || ''),
          ideals: String(parsed.ideals || ''),
          bonds: String(parsed.bonds || ''),
          flaws: String(parsed.flaws || ''),
          appearance: {
            age: parsed.appearance?.age || '',
            height: parsed.appearance?.height || '',
            weight: parsed.appearance?.weight || '',
            eyes: parsed.appearance?.eyes || '',
            skin: parsed.appearance?.skin || '',
            hair: parsed.appearance?.hair || '',
            distinguishingMarks: parsed.appearance?.distinguishingMarks || '',
          },
          backstory: String(parsed.backstory || ''),
        };
      }
    } catch {
      // Se falhar o parse, cai no fallback de texto legado
    }
  }

  // Se não for JSON estruturado, preserva o texto legado inteiramente na backstory
  return {
    ...DEFAULT_LORE,
    appearance: { ...DEFAULT_LORE.appearance },
    backstory: rawLore,
  };
}

/**
 * Serializa a estrutura para salvar no campo lore do personagem.
 */
export function serializeCharacterLore(lore: CharacterParsedLore): string {
  return JSON.stringify(lore);
}
