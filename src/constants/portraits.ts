/**
 * Catálogo de Retratos Oficiais de Dark Fantasy para as Classes de D&D 5e
 * Imagens de alta definição otimizadas para exibição em cards e telas de destaque.
 */

export interface ClassPortraitInfo {
  className: string;
  portraitUrl: string;
  bannerUrl: string;
  accentColor: string;
  runicSymbol: string;
  archetypeSuggestion: string;
}

export const CLASS_PORTRAITS: Record<string, ClassPortraitInfo> = {
  paladino: {
    className: 'Paladino',
    portraitUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#C5A059',
    runicSymbol: '✦ ⚔ ✦',
    archetypeSuggestion: 'Juramento da Devoção / Vingança',
  },
  mago: {
    className: 'Mago',
    portraitUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#7B68EE',
    runicSymbol: '✧ 📜 ✧',
    archetypeSuggestion: 'Escola de Evocação / Abjuração',
  },
  monge: {
    className: 'Monge',
    portraitUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#E67E22',
    runicSymbol: '☯ ⚡ ☯',
    archetypeSuggestion: 'Caminho da Misericórdia / Palma Aberta',
  },
  barbaro: {
    className: 'Bárbaro',
    portraitUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#C95B5B',
    runicSymbol: '🪓 🩸 🪓',
    archetypeSuggestion: 'Caminho do Berserker / Totêmico',
  },
  bardo: {
    className: 'Bardo',
    portraitUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#E84393',
    runicSymbol: '♫ 🎭 ♫',
    archetypeSuggestion: 'Colégio da Bravura / Conhecimento',
  },
  druida: {
    className: 'Druida',
    portraitUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#4E9C8E',
    runicSymbol: '🌿 🌙 🌿',
    archetypeSuggestion: 'Círculo da Lua / da Terra',
  },
  clerigo: {
    className: 'Clérigo',
    portraitUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#F1C40F',
    runicSymbol: '⚖ ☀️ ⚖',
    archetypeSuggestion: 'Domínio da Vida / Luz / Sepultura',
  },
  bruxo: {
    className: 'Bruxo',
    portraitUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#9B59B6',
    runicSymbol: '👁 🔮 👁',
    archetypeSuggestion: 'O Corruptor / Grande Antigo',
  },
  ladino: {
    className: 'Ladino',
    portraitUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#7F8C8D',
    runicSymbol: '🗡 🌑 🗡',
    archetypeSuggestion: 'Assassino / Ladrão / Trapaceiro Arcano',
  },
  guerreiro: {
    className: 'Guerreiro',
    portraitUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#95A5A6',
    runicSymbol: '🛡 ⚔ 🛡',
    archetypeSuggestion: 'Mestre de Batalha / Campeão',
  },
};

const DEFAULT_PORTRAIT: ClassPortraitInfo = {
  className: 'Aventureiro',
  portraitUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  accentColor: '#C5A059',
  runicSymbol: '✦ ⚔ ✦',
  archetypeSuggestion: 'Lenda da Comitiva',
};

/**
 * Normaliza o nome da classe para busca sem acentos e em minúsculas
 */
function normalizeClassKey(rawClass: string = ''): string {
  return rawClass
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retorna as informações visuais e arte do personagem com fallback inteligente
 */
export function getCharacterPortrait(char: {
  class?: string;
  avatarUrl?: string;
  themeColor?: string;
}): ClassPortraitInfo & { hasCustomAvatar: boolean } {
  const customAvatar = (char?.avatarUrl || '').trim();
  const rawClass = char?.class || '';
  const key = normalizeClassKey(rawClass);

  // Busca por correspondência exata ou parcial
  let found = CLASS_PORTRAITS[key];
  if (!found) {
    for (const [k, val] of Object.entries(CLASS_PORTRAITS)) {
      if (key.includes(k)) {
        found = val;
        break;
      }
    }
  }

  const base = found || DEFAULT_PORTRAIT;

  return {
    ...base,
    portraitUrl: customAvatar,
    accentColor: char?.themeColor || base.accentColor,
    hasCustomAvatar: Boolean(customAvatar && customAvatar.length > 0),
  };
}

/**
 * Lores resumidas padrão por classe caso a ficha não possua lore cadastrada
 */
export const DEFAULT_CLASS_LORES: Record<string, string> = {
  paladino: 'Jurou lealdade aos preceitos sagrados, erguendo sua lâmina contra as trevas que assolam estas terras esquecidas.',
  mago: 'Guardião de tomos proibidos e segredos arcanos capazes de rasgar o tecido da própria realidade.',
  monge: 'Canaliza a energia primordial de seu espírito através de golpes cirúrgicos e disciplina inabalável.',
  barbaro: 'Um turbilhão de fúria e determinação pura, forjado nos ermos mais hostis e brutais do continente.',
  bardo: 'Tecedor de melodias encantadas e palavras cortantes que inspiram reinos ou derrubam impérios.',
  druida: 'Voz viva dos bosques ancestrais, comandando tempestades, feras e o ciclo imutável da terra.',
  clerigo: 'Canal divino através do qual milagres e julgamentos celestiais são proclamados aos mortais.',
  bruxo: 'Pactuou com entidades além do véu da compreensão, empunhando poder a troco de um destino sombrio.',
  ladino: 'Mestre das sombras, do silêncio e da precisão letal onde outros apenas encontram perigo.',
  guerreiro: 'Mestre absoluto de aço e tática, sobrevivente de incontáveis campos de batalha sangrentos.',
};

export function getCharacterLoreSnippet(char: { lore?: string; description?: string; class?: string }): string {
  // 1. Prioridade máxima: campo Descrição preenchido pelo jogador
  if (char?.description && char.description.trim().length > 0) {
    const desc = char.description.trim();
    return desc.length > 180 ? `${desc.slice(0, 177)}...` : desc;
  }

  const key = normalizeClassKey(char?.class || '');
  const classDefault =
    DEFAULT_CLASS_LORES[key] ||
    'Um herói lendário convocado para desbravar os perigos da campanha e forjar seu nome na história.';

  if (char?.lore && char.lore.trim().length > 0) {
    const raw = char.lore.trim();
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.description && typeof parsed.description === 'string' && parsed.description.trim().length > 0) {
          const desc = parsed.description.trim();
          return desc.length > 180 ? `${desc.slice(0, 177)}...` : desc;
        }
        const narrative =
          parsed.personalityTraits ||
          parsed.ideals ||
          parsed.backstory ||
          parsed.lore ||
          parsed.bonds ||
          '';
        if (narrative && typeof narrative === 'string' && narrative.trim().length > 0) {
          const clean = narrative.trim();
          return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
        }
        const stringValues = Object.values(parsed).filter(
          (v) => typeof v === 'string' && v.trim().length > 0
        ) as string[];
        if (stringValues.length > 0) {
          const clean = stringValues[0].trim();
          return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
        }
        // Se todas as propriedades forem vazias, usa o fallback temático da classe
        return classDefault;
      } catch {
        return classDefault;
      }
    }
    return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
  }

  return classDefault;
}
