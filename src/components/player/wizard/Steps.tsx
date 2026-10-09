import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RoomData } from '@/lib/mockData';
import { Colors, Radius } from '@/constants/theme';
import { formatMod, getMod, SKILLS_LIST } from '@/utils/dnd5e';
import {
  ABILITIES,
  abilityAbbr,
  ALIGNMENTS,
  BACKGROUND_PRESETS,
  canIncreasePointBuy,
  CASTER_LABEL,
  CLASS_PRESETS,
  getBackgroundPreset,
  getClassPreset,
  getRacePreset,
  POINT_BUY_BUDGET,
  pointBuyRemaining,
  RACE_PRESETS,
  STANDARD_ARRAY,
  suggestStandardArray,
} from '@/utils/classPresets';
import {
  applyClass,
  applyRace,
  backgroundSkills,
  computeSummary,
  finalScores,
  ScoreMethod,
  selectableClassSkills,
  switchMethod,
  THEME_COLORS,
  WizardState,
} from './wizardState';
import { Chip, ChipRow, Field, InfoBox, Label, Stepper, ui } from './wizardUi';

export interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  /** Substitui o estado inteiro (usado quando a mudança mexe em vários campos) */
  replace: (next: WizardState) => void;
}

const allSkillNames = SKILLS_LIST.map((s) => s.name);
const fmtList = (items: string[]) => items.join(', ');

// ---------------------------------------------------------------------------------------------
// Passo 1 — Identidade
// ---------------------------------------------------------------------------------------------
export function StepIdentity({
  state,
  update,
  replace,
  isElevated,
  rooms,
}: StepProps & { isElevated: boolean; rooms: RoomData[] }) {
  const race = getRacePreset(state.race);
  const background = getBackgroundPreset(state.background);
  const isCustomRace = !race;
  const isCustomBackground = !background;

  return (
    <View style={ui.section}>
      <Field
        label="Nome do personagem *"
        value={state.name}
        onChangeText={(name) => update({ name })}
        placeholder="Ex.: Thalor Vane"
        maxLength={80}
        autoFocus
      />

      {isElevated && (
        <View style={ui.row}>
          <Field label="Nome do jogador" hint="Quem joga este personagem" value={state.playerName} onChangeText={(playerName) => update({ playerName })} />
          <Field
            label="Usuário vinculado"
            hint="Login do dono da ficha"
            value={state.assignedUsername}
            onChangeText={(assignedUsername) => update({ assignedUsername })}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {rooms.length > 1 && (
        <View style={{ gap: 6 }}>
          <Label>Mesa</Label>
          <ChipRow>
            {rooms.map((r) => (
              <Chip key={r.id} label={r.name} selected={state.roomId === r.id} onPress={() => update({ roomId: r.id })} />
            ))}
          </ChipRow>
        </View>
      )}

      <View style={{ gap: 6 }}>
        <Label>Raça</Label>
        <ChipRow>
          {RACE_PRESETS.map((r) => (
            <Chip key={r.name} label={r.name} selected={state.race === r.name} onPress={() => replace(applyRace(state, r.name))} />
          ))}
          <Chip label="Outra…" selected={isCustomRace} onPress={() => replace(applyRace(state, ''))} />
        </ChipRow>
        {isCustomRace && (
          <Field label="Nome da raça" value={state.race} onChangeText={(v) => update({ race: v })} placeholder="Ex.: Aasimar Caído" />
        )}
        {race && (
          <Text style={ui.hint}>
            {Object.keys(race.bonuses).length > 0
              ? `Bônus: ${ABILITIES.filter((a) => race.bonuses[a.key]).map((a) => `+${race.bonuses[a.key]} ${a.abbr}`).join(', ')}`
              : 'Sem bônus fixos.'}
            {' · '}Deslocamento {race.speed}
            {race.flexibleNote ? ` · ${race.flexibleNote}` : ''}
          </Text>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Label>Antecedente</Label>
        <ChipRow>
          {BACKGROUND_PRESETS.map((b) => (
            <Chip key={b.name} label={b.name} selected={state.background === b.name} onPress={() => update({ background: b.name, skills: state.skills.filter((s) => !b.skills.includes(s)) })} />
          ))}
          <Chip label="Outro…" selected={isCustomBackground} onPress={() => update({ background: '' })} />
        </ChipRow>
        {background ? (
          <Text style={ui.hint}>Concede as perícias: {fmtList(background.skills)}.</Text>
        ) : (
          <Field label="Nome do antecedente" value={state.background} onChangeText={(v) => update({ background: v })} placeholder="Ex.: Mercenário das Cinzas" />
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Label>Tendência</Label>
        <ChipRow>
          {ALIGNMENTS.map((a) => (
            <Chip key={a} label={a} selected={state.alignment === a} onPress={() => update({ alignment: a })} />
          ))}
        </ChipRow>
      </View>

      <Field label="Divindade (opcional)" value={state.deity} onChangeText={(deity) => update({ deity })} placeholder="Nenhum" />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Passo 2 — Classe
// ---------------------------------------------------------------------------------------------
export function StepClass({ state, update, replace }: StepProps) {
  const preset = getClassPreset(state.className);

  return (
    <View style={ui.section}>
      <View style={{ gap: 6 }}>
        <Label>Classe *</Label>
        <ChipRow>
          {CLASS_PRESETS.map((c) => (
            <Chip key={c.name} label={c.name} selected={state.className === c.name} onPress={() => replace(applyClass(state, c.name))} />
          ))}
          <Chip label="Outra…" selected={!preset} onPress={() => replace({ ...state, className: '', archetype: '', skills: [] })} />
        </ChipRow>
      </View>

      {preset ? (
        <View style={ui.card}>
          <Text style={styles.cardTitle}>{preset.name}</Text>
          <Text style={ui.infoText}>{preset.summary}</Text>
          <View style={styles.facts}>
            <Fact label="Dado de vida" value={`d${preset.hitDie}`} />
            <Fact label="Atributo principal" value={preset.primary.map(abilityAbbr).join(' / ')} />
            <Fact label="Salvaguardas" value={preset.saves.map(abilityAbbr).join(' e ')} />
            <Fact label="Conjuração" value={CASTER_LABEL[preset.caster]} />
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Field label="Nome da classe" value={state.className} onChangeText={(className) => update({ className })} placeholder="Ex.: Artífice" />
          <InfoBox tone="warn">
            Classe fora da lista: o assistente não aplica dado de vida, salvaguardas nem perícias automaticamente. Você ajusta tudo na ficha depois.
          </InfoBox>
        </View>
      )}

      <View style={{ gap: 6 }}>
        <Label hint={preset ? `Costuma ser escolhida no nível ${preset.archetypeLevel}. Deixe em branco se ainda não tiver.` : undefined}>
          Subclasse (opcional)
        </Label>
        {preset && (
          <ChipRow>
            {preset.archetypes.map((a) => (
              <Chip key={a} label={a} selected={state.archetype === a} onPress={() => update({ archetype: state.archetype === a ? '' : a })} />
            ))}
          </ChipRow>
        )}
        <Field label="Outra subclasse" value={state.archetype} onChangeText={(archetype) => update({ archetype })} placeholder="Digite se não estiver na lista" />
      </View>

      <View style={styles.levelRow}>
        <View style={{ flex: 1 }}>
          <Label hint="Para um personagem que já começa avançado">Nível</Label>
        </View>
        <Stepper label="nível" value={state.level} min={1} max={20} onChange={(level) => update({ level })} />
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Passo 3 — Atributos
// ---------------------------------------------------------------------------------------------
const METHODS: { id: ScoreMethod; label: string; hint: string }[] = [
  { id: 'standard', label: 'Conjunto padrão', hint: 'Distribua 15, 14, 13, 12, 10 e 8 entre os atributos.' },
  { id: 'pointbuy', label: 'Compra de pontos', hint: `Você tem ${POINT_BUY_BUDGET} pontos; cada atributo vai de 8 a 15.` },
  { id: 'manual', label: 'Manual', hint: 'Digite os valores que a sua mesa definiu (rolagem, por exemplo).' },
];

export function StepAbilities({ state, update, replace }: StepProps) {
  const preset = getClassPreset(state.className);
  const scores = finalScores(state);
  const usedStandard = (key: string, v: number) =>
    ABILITIES.some((a) => a.key !== key && state.base[a.key] === v);
  const remaining = pointBuyRemaining(state.base);
  const methodHint = METHODS.find((m) => m.id === state.method)?.hint;

  return (
    <View style={ui.section}>
      <View style={{ gap: 6 }}>
        <Label>Como definir os atributos</Label>
        <ChipRow>
          {METHODS.map((m) => (
            <Chip key={m.id} label={m.label} selected={state.method === m.id} onPress={() => replace(switchMethod(state, m.id))} />
          ))}
        </ChipRow>
        <Text style={ui.hint}>{methodHint}</Text>
      </View>

      {state.method === 'pointbuy' && (
        <InfoBox tone={remaining < 0 ? 'error' : remaining === 0 ? 'gold' : 'warn'}>
          {`Pontos restantes: ${remaining} de ${POINT_BUY_BUDGET}`}
        </InfoBox>
      )}

      {preset && state.method !== 'manual' && (
        <Chip
          label={`Sugerir distribuição para ${preset.name}`}
          onPress={() => update({ base: suggestStandardArray(preset) })}
          accessibilityLabel={`Aplicar a distribuição sugerida para ${preset.name}`}
        />
      )}

      <View style={{ gap: 10 }}>
        {ABILITIES.map((a) => {
          const final = scores[a.key];
          const isPrimary = !!preset?.primary.includes(a.key);
          return (
            <View key={a.key} style={[ui.card, isPrimary && { borderColor: Colors.fantasy.goldDark }]}>
              <View style={styles.abilityHead}>
                <Text style={styles.abilityName}>
                  {a.name} <Text style={ui.hint}>({a.abbr}){isPrimary ? ' · principal' : ''}</Text>
                </Text>
                <View style={styles.bonusBox}>
                  <Text style={ui.hint}>Bônus</Text>
                  <Stepper
                    label={`bônus de ${a.name}`}
                    value={state.bonus[a.key]}
                    min={-2}
                    max={10}
                    format={(v) => (v > 0 ? `+${v}` : String(v))}
                    onChange={(v) => update({ bonus: { ...state.bonus, [a.key]: v } })}
                  />
                </View>
                <Text style={styles.abilityFinal} accessibilityLabel={`${a.name} final ${final}, modificador ${formatMod(getMod(final))}`}>
                  {final} <Text style={styles.abilityMod}>{formatMod(getMod(final))}</Text>
                </Text>
              </View>

              <View style={styles.abilityControls}>
                {state.method === 'standard' && (
                  <ChipRow>
                    {STANDARD_ARRAY.map((v) => (
                      <Chip
                        key={v}
                        label={String(v)}
                        selected={state.base[a.key] === v}
                        disabled={usedStandard(a.key, v)}
                        onPress={() => update({ base: { ...state.base, [a.key]: state.base[a.key] === v ? 0 : v } })}
                        accessibilityLabel={`${a.name} recebe ${v}`}
                      />
                    ))}
                  </ChipRow>
                )}
                {state.method === 'pointbuy' && (
                  <Stepper
                    label={`base de ${a.name}`}
                    value={state.base[a.key]}
                    min={8}
                    max={15}
                    canIncrease={canIncreasePointBuy(state.base, a.key)}
                    onChange={(v) => update({ base: { ...state.base, [a.key]: v } })}
                  />
                )}
                {state.method === 'manual' && (
                  <Stepper
                    label={`base de ${a.name}`}
                    value={state.base[a.key]}
                    min={3}
                    max={20}
                    onChange={(v) => update({ base: { ...state.base, [a.key]: v } })}
                  />
                )}

              </View>
            </View>
          );
        })}
      </View>
      <Text style={ui.hint}>O bônus vem da raça e pode receber aumentos de nível e itens. Ajuste como a sua mesa definir.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Passo 4 — Perícias
// ---------------------------------------------------------------------------------------------
export function StepSkills({ state, update }: StepProps) {
  const preset = getClassPreset(state.className);
  const granted = backgroundSkills(state);
  const options = selectableClassSkills(preset, granted, allSkillNames);
  const need = preset?.skillCount ?? 0;
  const left = need - state.skills.length;

  const toggle = (name: string) => {
    if (state.skills.includes(name)) update({ skills: state.skills.filter((s) => s !== name) });
    else if (state.skills.length < need) update({ skills: [...state.skills, name] });
  };

  return (
    <View style={ui.section}>
      {preset ? (
        <>
          <InfoBox tone={left === 0 ? 'gold' : 'warn'}>
            {left === 0
              ? `Perícias da classe completas (${need} de ${need}).`
              : `Escolha ${left} ${left === 1 ? 'perícia' : 'perícias'} de ${preset.name} (${state.skills.length} de ${need}).`}
          </InfoBox>
          <ChipRow>
            {options.map((s) => {
              const selected = state.skills.includes(s);
              return <Chip key={s} label={s} selected={selected} disabled={!selected && left === 0} onPress={() => toggle(s)} />;
            })}
          </ChipRow>
        </>
      ) : (
        <InfoBox tone="warn">Sem classe da lista, as perícias da classe são marcadas depois, na aba Perícias da ficha.</InfoBox>
      )}

      <View style={{ gap: 6 }}>
        <Label hint="Já vêm do antecedente; não ocupam suas escolhas.">Do antecedente</Label>
        <ChipRow>
          {granted.length > 0 ? granted.map((s) => <Chip key={s} label={s} locked selected />) : <Text style={ui.hint}>Nenhuma.</Text>}
        </ChipRow>
      </View>

      {preset && (
        <View style={{ gap: 6 }}>
          <Label hint="Definidas pela classe.">Salvaguardas proficientes</Label>
          <ChipRow>
            {preset.saves.map((k) => (
              <Chip key={k} label={ABILITIES.find((a) => a.key === k)!.name} locked selected />
            ))}
          </ChipRow>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Passo 5 — Revisão
// ---------------------------------------------------------------------------------------------
export function StepReview({ state, update }: StepProps) {
  const s = computeSummary(state);
  const skills = Array.from(new Set([...backgroundSkills(state), ...state.skills]));
  const res = s.resources;

  return (
    <View style={ui.section}>
      <View style={ui.card}>
        <Text style={styles.cardTitle}>{state.name.trim() || 'Sem nome'}</Text>
        <Text style={ui.infoText}>
          {state.race || 'Raça livre'} · {state.className || 'Classe livre'}
          {state.archetype ? ` (${state.archetype})` : ''} · nível {state.level}
        </Text>
        <Text style={ui.hint}>
          {state.background || 'Sem antecedente'} · {state.alignment}
        </Text>
      </View>

      <View style={styles.statGrid}>
        <Stat label="Pontos de vida" value={String(s.hp)} />
        <Stat label="CA (sem armadura)" value={String(s.ac)} />
        <Stat label="Iniciativa" value={formatMod(s.initiative)} />
        <Stat label="Deslocamento" value={s.speed} />
        <Stat label="Proficiência" value={`+${s.profBonus}`} />
        <Stat label="Dados de vida" value={`${state.level}d${s.hitDie}`} />
      </View>

      <View style={ui.card}>
        <Text style={ui.label}>Atributos</Text>
        <Text style={ui.infoText}>
          {ABILITIES.map((a) => `${a.abbr} ${s.scores[a.key]} (${formatMod(getMod(s.scores[a.key]))})`).join(' · ')}
        </Text>
        <Text style={ui.hint}>
          Salvaguardas: {s.preset ? fmtList(s.preset.saves.map((k) => ABILITIES.find((a) => a.key === k)!.name)) : '—'}
        </Text>
        <Text style={ui.hint}>Perícias: {skills.length ? fmtList(skills) : '—'}</Text>
      </View>

      {(s.slots.length > 0 || res.maxKiPoints > 0 || res.maxSorceryPoints > 0 || res.maxSuperiorityDice > 0) && (
        <View style={ui.card}>
          <Text style={ui.label}>Recursos iniciais</Text>
          {s.slots.length > 0 && (
            <Text style={ui.infoText}>
              Espaços de magia: {s.slots.map((sl) => `${sl.level}º × ${sl.total}`).join(' · ')}
            </Text>
          )}
          {res.maxKiPoints > 0 && <Text style={ui.infoText}>Pontos de ki: {res.maxKiPoints}</Text>}
          {res.maxSorceryPoints > 0 && <Text style={ui.infoText}>Pontos de feitiçaria: {res.maxSorceryPoints}</Text>}
          {res.maxSuperiorityDice > 0 && (
            <Text style={ui.infoText}>
              Dados de superioridade: {res.maxSuperiorityDice} ({res.superiorityDieType})
            </Text>
          )}
        </View>
      )}

      <View style={ui.card}>
        <Text style={ui.label}>Ajustes finos (opcional)</Text>
        <View style={styles.tweakRow}>
          <Text style={ui.infoText}>Pontos de vida</Text>
          <Stepper label="pontos de vida" value={s.hp} min={1} max={999} onChange={(v) => update({ hpOverride: v === s.autoHp ? null : v })} />
        </View>
        <View style={styles.tweakRow}>
          <Text style={ui.infoText}>CA sem armadura</Text>
          <Stepper label="CA" value={s.ac} min={1} max={40} onChange={(v) => update({ acOverride: v === s.autoAc ? null : v })} />
        </View>
        <Text style={ui.hint}>
          Armaduras e escudos você equipa depois na aba Mochila, e a CA total soma sozinha.
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Label>Cor da ficha</Label>
        <View style={styles.swatches}>
          {THEME_COLORS.map((c) => {
            const selected = state.themeColor === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => update({ themeColor: c })}
                accessibilityRole="button"
                accessibilityLabel={`Cor da ficha ${c}`}
                accessibilityState={{ selected }}
                hitSlop={4}
                style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchSelected]}
              >
                {selected && <Text style={styles.swatchCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: Colors.fantasy.goldBright, fontSize: 18, fontWeight: '800' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { minWidth: 130, flexGrow: 1 },
  factLabel: { color: Colors.fantasy.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  factValue: { color: Colors.fantasy.text, fontSize: 14, fontWeight: '700' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  abilityHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  abilityName: { color: Colors.fantasy.text, fontSize: 14, fontWeight: '700', flexGrow: 1, flexBasis: 110 },
  abilityFinal: { color: Colors.fantasy.goldBright, fontSize: 20, fontWeight: '800', minWidth: 62, textAlign: 'right' },
  abilityMod: { color: Colors.fantasy.textSecondary, fontSize: 14, fontWeight: '700' },
  abilityControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  bonusBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    backgroundColor: Colors.fantasy.backgroundSecondary,
  },
  statValue: { color: Colors.fantasy.goldBright, fontSize: 20, fontWeight: '800' },
  statLabel: { color: Colors.fantasy.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tweakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#FFF' },
  swatchCheck: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
