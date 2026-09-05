export interface SpellSlotsCalculated {
  standard: Record<number, number>; // { level: count }
  warlock: { level: number; count: number } | null;
}

// Tabela oficial do Conjurador Pleno (Full Caster) de D&D 5e
// Bardo, Clérigo, Druida, Feiticeiro, Mago
const fullCasterTable: Record<number, number[]> = {
  // Lvl: [lvl1, lvl2, lvl3, lvl4, lvl5, lvl6, lvl7, lvl8, lvl9]
  0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Tabela oficial do Meio-Conjurador (Half Caster) de D&D 5e
// Paladino, Patrulheiro (Ranger)
const halfCasterTable: Record<number, number[]> = {
  0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  1: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  6: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  8: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  9: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  10: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  11: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  12: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  13: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  14: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  15: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  16: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  17: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  18: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  19: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  20: [4, 3, 3, 3, 2, 0, 0, 0, 0],
};

// Tabela oficial do Artífice (Artificer) de D&D 5e
const artificerTable: Record<number, number[]> = {
  0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  6: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  8: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  9: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  10: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  11: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  12: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  13: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  14: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  15: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  16: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  17: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  18: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  19: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  20: [4, 3, 3, 3, 2, 0, 0, 0, 0],
};

// Tabela oficial do Conjurador de 1/3 (Cavaleiro Arcano, Trapaceiro Arcano)
const thirdCasterTable: Record<number, number[]> = {
  0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  1: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  5: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  6: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  7: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  8: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  9: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  10: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  11: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  12: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  13: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  14: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  15: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  16: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  17: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  18: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  19: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  20: [4, 3, 3, 1, 0, 0, 0, 0, 0],
};

const warlockTable: Record<number, [number, number]> = {
  // Level -> [Slot Level, Count]
  1: [1, 1], 2: [1, 2], 3: [2, 2], 4: [2, 2], 5: [3, 2], 6: [3, 2], 7: [4, 2], 8: [4, 2], 9: [5, 2], 10: [5, 2],
  11: [5, 3], 12: [5, 3], 13: [5, 3], 14: [5, 3], 15: [5, 3], 16: [5, 3],
  17: [5, 4], 18: [5, 4], 19: [5, 4], 20: [5, 4],
};

export function parseClassesAndCalculateSlots(classString: string, totalLevel: number): SpellSlotsCalculated {
  // Regex match para todas as classes mágicas
  const regex = /(Bardo|Cl[eé]rigo|Druida|Feiticeiro|Mago|Paladino|Patrulheiro|Ranger|Art[ií]fice|Bruxo|Warlock|Cavaleiro Arcano|Trapaceiro Arcano)(?:\s+(\d+))?/gi;
  let match;
  const classesFound: { className: string; classLevel: number | null }[] = [];

  while ((match = regex.exec(classString)) !== null) {
    const className = match[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const classLevel = match[2] ? parseInt(match[2], 10) : null;
    classesFound.push({ className, classLevel });
  }

  // Se encontrou classes, mas nenhuma tem número explícito, a primeira recebe o nível total
  if (classesFound.length > 0 && classesFound.every((c) => c.classLevel === null)) {
    classesFound[0].classLevel = totalLevel;
  } else if (classesFound.length > 0) {
    for (const c of classesFound) {
      if (c.classLevel === null) c.classLevel = 1;
    }
  }

  // Caso 1: Classe Única (sem multiclasse) - usa a tabela direta e oficial da classe
  if (classesFound.length === 1) {
    const single = classesFound[0];
    const lvl = Math.max(1, Math.min(20, single.classLevel || totalLevel));
    const name = single.className;

    if (["bardo", "clerigo", "druida", "feiticeiro", "mago"].includes(name)) {
      const slots = fullCasterTable[lvl] || [];
      const standard: Record<number, number> = {};
      slots.forEach((count, idx) => {
        if (count > 0) standard[idx + 1] = count;
      });
      return { standard, warlock: null };
    }

    if (["paladino", "patrulheiro", "ranger"].includes(name)) {
      const slots = halfCasterTable[lvl] || [];
      const standard: Record<number, number> = {};
      slots.forEach((count, idx) => {
        if (count > 0) standard[idx + 1] = count;
      });
      return { standard, warlock: null };
    }

    if (name === "artifice") {
      const slots = artificerTable[lvl] || [];
      const standard: Record<number, number> = {};
      slots.forEach((count, idx) => {
        if (count > 0) standard[idx + 1] = count;
      });
      return { standard, warlock: null };
    }

    if (["cavaleiro arcano", "trapaceiro arcano"].includes(name)) {
      const slots = thirdCasterTable[lvl] || [];
      const standard: Record<number, number> = {};
      slots.forEach((count, idx) => {
        if (count > 0) standard[idx + 1] = count;
      });
      return { standard, warlock: null };
    }

    if (["bruxo", "warlock"].includes(name)) {
      const [slotLevel, count] = warlockTable[lvl] || [1, 1];
      return { standard: {}, warlock: { level: slotLevel, count } };
    }
  }

  // Caso 2: Multiclasse (regras oficiais de Conjurador Combinado D&D 5e)
  let casterLevel = 0;
  let warlockLevel = 0;
  let hasStandardCaster = false;

  for (const c of classesFound) {
    const name = c.className;
    const lvl = c.classLevel || 0;

    if (["bardo", "clerigo", "druida", "feiticeiro", "mago"].includes(name)) {
      casterLevel += lvl;
      hasStandardCaster = true;
    } else if (["paladino", "patrulheiro", "ranger"].includes(name)) {
      // Regra de multiclasse: metade do nível (arredondado para baixo)
      casterLevel += Math.floor(lvl / 2);
      hasStandardCaster = true;
    } else if (name === "artifice") {
      // Regra de multiclasse do Artífice: metade do nível (arredondado para cima)
      casterLevel += Math.ceil(lvl / 2);
      hasStandardCaster = true;
    } else if (["cavaleiro arcano", "trapaceiro arcano"].includes(name)) {
      // Regra de multiclasse: um terço do nível (arredondado para baixo)
      casterLevel += Math.floor(lvl / 3);
      hasStandardCaster = true;
    } else if (["bruxo", "warlock"].includes(name)) {
      warlockLevel += lvl;
    }
  }

  const standard: Record<number, number> = {};
  if (hasStandardCaster && casterLevel > 0) {
    casterLevel = Math.max(1, Math.min(20, casterLevel));
    const slots = fullCasterTable[casterLevel] || [];
    slots.forEach((count, idx) => {
      if (count > 0) {
        standard[idx + 1] = count;
      }
    });
  }

  let warlock = null;
  if (warlockLevel > 0) {
    warlockLevel = Math.max(1, Math.min(20, warlockLevel));
    const [lvl, count] = warlockTable[warlockLevel] || [1, 1];
    warlock = { level: lvl, count };
  }

  return { standard, warlock };
}
