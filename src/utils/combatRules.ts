/**
 * Regras puras de combate e descanso.
 * Sem dependências de React/Prisma: usadas pelas rotas de API (servidor) e testáveis isoladamente.
 */

/** Dano consome PV temporários primeiro; PV nunca fica abaixo de 0. */
export function applyDamage(currentHp: number, tempHp: number, damage: number) {
  const dmg = Math.max(0, Math.floor(Number(damage) || 0));
  if (tempHp >= dmg) return { currentHp, tempHp: tempHp - dmg };
  return { currentHp: Math.max(0, currentHp - (dmg - tempHp)), tempHp: 0 };
}

/** Cura nunca ultrapassa o máximo de PV. */
export function applyHeal(currentHp: number, maxHp: number, heal: number) {
  const amount = Math.max(0, Math.floor(Number(heal) || 0));
  return Math.min(maxHp, currentHp + amount);
}

interface RestChar {
  class?: string | null;
  archetype?: string | null;
  level: number;
  maxHp: number;
  currentHp: number;
  hitDiceTotal: number;
  hitDiceSpent: number;
  maxKiPoints?: number | null;
  maxSorceryPoints?: number | null;
  maxSuperiorityDice?: number | null;
}

/** Máximo de dados de superioridade (valor configurado ou padrão do Mestre de Batalha por nível). */
export function getMaxSuperiorityDice(char: RestChar): number {
  const cls = (char.class || '').toLowerCase();
  const arch = (char.archetype || '').toLowerCase();
  const isBattleMaster =
    cls.includes('guerreiro') &&
    (arch.includes('mestre de batalha') || arch.includes('battle master') || cls.includes('mestre de batalha'));
  const defaultMax = char.level >= 15 ? 6 : char.level >= 7 ? 5 : 4;
  if (char.maxSuperiorityDice && char.maxSuperiorityDice > 0) return char.maxSuperiorityDice;
  return isBattleMaster ? defaultMax : 0;
}

/** Atualizações escalares de um Descanso Curto (as habilidades são tratadas à parte). */
export function shortRestUpdates(char: RestChar, healHp: number, hitDiceToSpend: number) {
  const updates: Record<string, number> = {
    currentHp: applyHeal(char.currentHp, char.maxHp, healHp),
    hitDiceSpent: Math.min(char.hitDiceTotal, char.hitDiceSpent + Math.max(0, hitDiceToSpend)),
  };
  if (char.maxKiPoints && char.maxKiPoints > 0) updates.kiPoints = char.maxKiPoints;
  const bm = getMaxSuperiorityDice(char);
  if (bm > 0) updates.superiorityDice = bm;
  return updates;
}

/** Atualizações escalares de um Descanso Longo (slots e habilidades são tratados à parte). */
export function longRestUpdates(char: RestChar) {
  const recovered = Math.max(1, Math.floor(char.hitDiceTotal / 2));
  const updates: Record<string, number> = {
    currentHp: char.maxHp,
    tempHp: 0,
    hitDiceSpent: Math.max(0, char.hitDiceSpent - recovered),
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
  };
  if (char.maxKiPoints && char.maxKiPoints > 0) updates.kiPoints = char.maxKiPoints;
  if (char.maxSorceryPoints && char.maxSorceryPoints > 0) updates.sorceryPoints = char.maxSorceryPoints;
  const bm = getMaxSuperiorityDice(char);
  if (bm > 0) updates.superiorityDice = bm;
  return updates;
}
