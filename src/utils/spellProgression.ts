export interface SpellSlotsCalculated {
  standard: Record<number, number>; // { level: count }
  warlock: { level: number, count: number } | null;
}

const casterTable: Record<number, number[]> = {
  // Lvl: [lvl1, lvl2, lvl3, lvl4, lvl5, lvl6, lvl7, lvl8, lvl9]
  0: [0,0,0,0,0,0,0,0,0],
  1: [2,0,0,0,0,0,0,0,0],
  2: [3,0,0,0,0,0,0,0,0],
  3: [4,2,0,0,0,0,0,0,0],
  4: [4,3,0,0,0,0,0,0,0],
  5: [4,3,2,0,0,0,0,0,0],
  6: [4,3,3,0,0,0,0,0,0],
  7: [4,3,3,1,0,0,0,0,0],
  8: [4,3,3,2,0,0,0,0,0],
  9: [4,3,3,3,1,0,0,0,0],
  10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0],
  12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0],
  14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0],
  16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1],
  18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1],
  20: [4,3,3,3,3,2,2,1,1],
};

const warlockTable: Record<number, [number, number]> = {
  // Level -> [Slot Level, Count]
  1: [1,1], 2: [1,2], 3: [2,2], 4: [2,2], 5: [3,2], 6: [3,2], 7: [4,2], 8: [4,2], 9: [5,2], 10: [5,2],
  11: [5,3], 12: [5,3], 13: [5,3], 14: [5,3], 15: [5,3], 16: [5,3],
  17: [5,4], 18: [5,4], 19: [5,4], 20: [5,4],
};

export function parseClassesAndCalculateSlots(classString: string, totalLevel: number): SpellSlotsCalculated {
  let casterLevel = 0;
  let warlockLevel = 0;
  let hasStandardCaster = false;
  
  // Regex match para todas as classes mágicas
  const regex = /(Bardo|Cl[eé]rigo|Druida|Feiticeiro|Mago|Paladino|Patrulheiro|Art[ií]fice|Bruxo|Cavaleiro Arcano|Trapaceiro Arcano)(?:\s+(\d+))?/gi;
  let match;
  let classesFound = [];
  
  while ((match = regex.exec(classString)) !== null) {
    const className = match[1].toLowerCase();
    const classLevel = match[2] ? parseInt(match[2], 10) : null;
    classesFound.push({ className, classLevel });
  }
  
  // Se encontrou classes, mas nenhuma tem número (ex: "Mago" ou "Mago / Clérigo"),
  // aplicamos o level total apenas na primeira classe
  if (classesFound.length > 0 && classesFound.every(c => c.classLevel === null)) {
    classesFound[0].classLevel = totalLevel;
  } else if (classesFound.length > 0) {
     // Para os que ficaram null mas há outros declarados, assumimos nv 1
     classesFound = classesFound.map(c => ({...c, classLevel: c.classLevel ?? 1}));
  }

  for (const c of classesFound) {
    const name = c.className.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    const lvl = c.classLevel || 0;
    
    if (["bardo", "clerigo", "druida", "feiticeiro", "mago"].includes(name)) {
      casterLevel += lvl;
      hasStandardCaster = true;
    } else if (["paladino", "patrulheiro"].includes(name)) {
      casterLevel += Math.floor(lvl / 2);
      hasStandardCaster = true;
    } else if (["artifice"].includes(name)) {
      casterLevel += Math.ceil(lvl / 2);
      hasStandardCaster = true;
    } else if (["cavaleiro arcano", "trapaceiro arcano"].includes(name)) {
      casterLevel += Math.floor(lvl / 3);
      hasStandardCaster = true;
    } else if (name === "bruxo") {
      warlockLevel += lvl;
    }
  }
  
  let standard: Record<number, number> = {};
  if (hasStandardCaster) {
     casterLevel = Math.max(1, Math.min(20, casterLevel));
     const slots = casterTable[casterLevel] || [0,0,0,0,0,0,0,0,0];
     slots.forEach((count, idx) => {
       if (count > 0) {
         standard[idx + 1] = count;
       }
     });
  }
  
  let warlock = null;
  if (warlockLevel > 0) {
     warlockLevel = Math.max(1, Math.min(20, warlockLevel));
     const [lvl, count] = warlockTable[warlockLevel] || [1,1];
     warlock = { level: lvl, count };
  }
  
  return { standard, warlock };
}
