import { CharacterData } from '@/lib/mockData';
import { getMod, getProfBonus } from '@/utils/dnd5e';

const str = (v: unknown, fallback = '', max = 2000): string =>
  typeof v === 'string' ? v.slice(0, max) : v == null ? fallback : String(v).slice(0, max);

const int = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

const arr = (v: unknown, limit = 300): any[] => (Array.isArray(v) ? v.slice(0, limit) : []);

/**
 * Converte um objeto arbitrário (JSON de backup) em uma ficha segura para importação:
 * apenas campos conhecidos, números limitados a faixas válidas, textos truncados e listas com teto.
 * Campos controlados pelo servidor (id, dono, mesa, honra, datas) nunca são importados.
 */
export function sanitizeImportedCharacter(item: any): Partial<CharacterData> | null {
  if (!item || typeof item !== 'object' || (!item.name && !item.class)) return null;

  const maxHp = int(item.maxHp, 10, 1, 9999);
  return {
    name: str(item.name, 'Herói Importado', 120),
    playerName: str(item.playerName, 'Jogador', 120),
    race: str(item.race, 'Humano', 80),
    class: str(item.class, 'Aventureiro', 80),
    archetype: str(item.archetype, '', 80),
    level: int(item.level, 1, 1, 20),
    alignment: str(item.alignment, 'Neutro', 60),
    background: str(item.background, 'Herói do Povo', 80),
    deity: str(item.deity, 'Nenhum', 80),
    lore: str(item.lore, '', 20000),
    companion: str(item.companion, '', 20000),
    description: str(item.description, '', 2000),
    themeColor: /^#[0-9a-fA-F]{6}$/.test(String(item.themeColor)) ? String(item.themeColor) : '#C5A059',
    maxHp,
    currentHp: int(item.currentHp, maxHp, 0, maxHp),
    tempHp: int(item.tempHp, 0, 0, 9999),
    armorClass: int(item.armorClass, 10, 0, 50),
    initiativeBonus: int(item.initiativeBonus, 0, -20, 20),
    speed: str(item.speed, '9m', 40),
    hitDiceType: str(item.hitDiceType, '1d10', 10),
    hitDiceTotal: int(item.hitDiceTotal, 1, 1, 20),
    hitDiceSpent: 0,
    str: int(item.str, 10, 1, 30),
    dex: int(item.dex, 10, 1, 30),
    con: int(item.con, 10, 1, 30),
    int: int(item.int, 10, 1, 30),
    wis: int(item.wis, 10, 1, 30),
    cha: int(item.cha, 10, 1, 30),
    strProf: !!item.strProf,
    dexProf: !!item.dexProf,
    conProf: !!item.conProf,
    intProf: !!item.intProf,
    wisProf: !!item.wisProf,
    chaProf: !!item.chaProf,
    proficientSkills: str(item.proficientSkills, '', 1000),
    gold: int(item.gold, 0, 0, 99999999),
    silver: int(item.silver, 0, 0, 99999999),
    copper: int(item.copper, 0, 0, 99999999),
    sorceryPoints: int(item.sorceryPoints, 0, 0, 99),
    maxSorceryPoints: int(item.maxSorceryPoints, 0, 0, 99),
    kiPoints: int(item.kiPoints, 0, 0, 99),
    maxKiPoints: int(item.maxKiPoints, 0, 0, 99),
    superiorityDice: int(item.superiorityDice, 0, 0, 20),
    maxSuperiorityDice: int(item.maxSuperiorityDice, 0, 0, 20),
    superiorityDieType: ['d8', 'd10', 'd12'].includes(item.superiorityDieType) ? item.superiorityDieType : 'd8',
    spellSlots: arr(item.spellSlots, 12).map((s) => ({
      id: '',
      level: int(s?.level, 1, 1, 9),
      total: int(s?.total, 0, 0, 99),
      used: int(s?.used, 0, 0, 99),
    })),
    spells: arr(item.spells).map((s) => ({
      id: '',
      name: str(s?.name, 'Magia', 120),
      level: int(s?.level, 0, 0, 9),
      castingTime: str(s?.castingTime, '', 80),
      range: str(s?.range, '', 80),
      duration: str(s?.duration, '', 80),
      components: str(s?.components, '', 200),
      isPrepared: !!s?.isPrepared,
      description: str(s?.description, '', 5000),
    })),
    abilities: arr(item.abilities).map((a) => {
      const maxUses = int(a?.maxUses, 1, 0, 99);
      return {
        id: '',
        name: str(a?.name, 'Habilidade', 120),
        description: str(a?.description, '', 5000),
        maxUses,
        currentUses: int(a?.currentUses, maxUses, 0, 99),
        resetType: ['SHORT_REST', 'LONG_REST', 'NONE'].includes(a?.resetType) ? a.resetType : 'SHORT_REST',
        actionType: str(a?.actionType, 'LIVRE', 40),
      };
    }),
    conditions: arr(item.conditions, 50).map((c) => ({
      id: '',
      name: str(c?.name, 'Condição', 80),
      description: str(c?.description, '', 1000),
    })),
    items: arr(item.items).map((i) => ({
      id: '',
      name: str(i?.name, 'Item', 120),
      description: str(i?.description, '', 2000),
      weight: Math.max(0, Math.min(9999, Number(i?.weight) || 0)),
      quantity: int(i?.quantity, 1, 1, 99999),
      isWeapon: !!i?.isWeapon,
      damage: str(i?.damage, '', 80),
      isArmor: !!i?.isArmor,
      isEquipped: !!i?.isEquipped,
      armorClassBonus: int(i?.armorClassBonus, 0, -10, 10),
    })),
  } as Partial<CharacterData>;
}

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Monta o HTML (A4, imprimível) da ficha para exportação em PDF. Todo texto é escapado. */
export function buildCharacterSheetHtml(char: CharacterData): string {
  const prof = getProfBonus(char.level);
  const mod = (n: number) => (getMod(n) >= 0 ? `+${getMod(n)}` : `${getMod(n)}`);
  const attrs: [string, number, boolean][] = [
    ['FOR', char.str, char.strProf],
    ['DES', char.dex, char.dexProf],
    ['CON', char.con, char.conProf],
    ['INT', char.int, char.intProf],
    ['SAB', char.wis, char.wisProf],
    ['CAR', char.cha, char.chaProf],
  ];
  const list = (rows: string[]) => (rows.length ? `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>` : '<p class="muted">—</p>');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(char.name)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1c1713; font-size: 12px; }
  h1 { margin: 0; font-size: 26px; letter-spacing: 1px; }
  h2 { font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 2px solid #8c704f; padding-bottom: 3px; margin: 16px 0 6px; color: #5a4328; }
  .sub { color: #5a4328; margin: 2px 0 10px; }
  .grid { display: flex; gap: 8px; flex-wrap: wrap; }
  .box { border: 1px solid #8c704f; border-radius: 6px; padding: 6px 10px; min-width: 70px; text-align: center; }
  .box b { display: block; font-size: 18px; }
  .box span { font-size: 10px; letter-spacing: 1px; color: #5a4328; }
  ul { margin: 4px 0; padding-left: 18px; }
  .muted { color: #8a7d6e; }
  .item small { color: #5a4328; }
</style></head><body>
<h1>${esc(char.name)}</h1>
<div class="sub">${esc(char.race)} · ${esc(char.class)}${char.archetype ? ` (${esc(char.archetype)})` : ''} · Nível ${esc(char.level)} · ${esc(char.alignment)} · ${esc(char.background)}<br>Jogador: ${esc(char.playerName)}</div>
<div class="grid">
  <div class="box"><b>${esc(char.currentHp)}/${esc(char.maxHp)}</b><span>PV${char.tempHp ? ` (+${esc(char.tempHp)} temp)` : ''}</span></div>
  <div class="box"><b>${esc(char.armorClass)}</b><span>CA</span></div>
  <div class="box"><b>${esc(char.initiativeBonus >= 0 ? '+' : '')}${esc(char.initiativeBonus)}</b><span>INICIATIVA</span></div>
  <div class="box"><b>${esc(char.speed)}</b><span>DESLOC.</span></div>
  <div class="box"><b>+${prof}</b><span>PROFICIÊNCIA</span></div>
</div>
<h2>Atributos</h2>
<div class="grid">${attrs
    .map(([l, v, p]) => `<div class="box"><b>${esc(v)} (${mod(v)})</b><span>${l}${p ? ' ●' : ''}</span></div>`)
    .join('')}</div>
<h2>Perícias proficientes</h2><p>${esc((char.proficientSkills || '').split(',').filter(Boolean).join(', ') || '—')}</p>
<h2>Habilidades</h2>${list((char.abilities || []).map((a) => `<b>${esc(a.name)}</b> (${esc(a.currentUses)}/${esc(a.maxUses)}) <small>${esc(a.description)}</small>`))}
<h2>Magias</h2>${list((char.spells || []).map((s) => `<b>${esc(s.name)}</b> — nível ${esc(s.level)}${s.isPrepared ? ' ✓' : ''}`))}
<h2>Inventário</h2>${list((char.items || []).map((i) => `<span class="item">${esc(i.quantity)}× <b>${esc(i.name)}</b>${i.damage ? ` (${esc(i.damage)})` : ''}${i.isEquipped ? ' [equipado]' : ''}</span>`))}
<p>Moedas: ${esc(char.gold)} PO · ${esc(char.silver)} PP · ${esc(char.copper)} PC</p>
<h2>Condições</h2>${list((char.conditions || []).map((c) => `<b>${esc(c.name)}</b> <small>${esc(c.description)}</small>`))}
</body></html>`;
}
