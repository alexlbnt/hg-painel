import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CharacterData } from '@/lib/mockData';
import {
  calculateActionCombo,
  ComboConfig,
  getAvailableAttackChoices,
  getAvailableBonusActions,
  getDefaultExtraAttacks,
  getRecommendedPresets,
} from '@/utils/actionCalculator';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Sword,
  Zap,
} from 'lucide-react-native';

interface ActionCalculatorProps {
  char: CharacterData;
  themeColor?: string;
  isMobile?: boolean;
}

export const ActionCalculator: React.FC<ActionCalculatorProps> = ({
  char,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const defaultAttacks = useMemo(() => getDefaultExtraAttacks(char), [char]);
  const attackChoices = useMemo(() => getAvailableAttackChoices(char), [char]);
  const bonusChoices = useMemo(() => getAvailableBonusActions(char), [char]);
  const presets = useMemo(() => getRecommendedPresets(char), [char]);

  // Escolha padrão da arma principal
  const initialMainWeaponId = useMemo(() => {
    const equipped = (char.items || []).find((i) => i.isWeapon && i.isEquipped);
    if (equipped) return equipped.id;
    const firstWp = (char.items || []).find((i) => i.isWeapon);
    if (firstWp) return firstWp.id;
    return 'unarmed';
  }, [char]);

  // Estado da configuração do combo
  const [config, setConfig] = useState<ComboConfig>({
    numMainAttacks: defaultAttacks,
    mainAttackWeaponId: initialMainWeaponId,
    bonusActionType: 'none',
    offhandWeaponId: attackChoices.find((c) => c.id !== initialMainWeaponId)?.id,
    modifiers: {
      hasDivineSmite: false,
      smiteSlotLevel: 1,
      smiteUndeadOrFiend: false,
      hasHandsOfHarm: false,
      hasStunningStrike: false,
      isRaging: false,
      hasSneakAttack: false,
      sneakAttackDice: Math.max(1, Math.ceil((char.level || 1) / 2)),
      hasHuntersMarkOrHex: false,
      hasAdvantage: false,
      hasDisadvantage: false,
      isCriticalHit: false,
    },
  });

  // Controle de expansão do painel (inicia aberto)
  const [isExpanded, setIsExpanded] = useState(true);

  // Mostra/oculta roteiro narrativo detalhado
  const [showNarrative, setShowNarrative] = useState(true);

  // Resultado do cálculo
  const result = useMemo(() => {
    return calculateActionCombo(char, config);
  }, [char, config]);

  // Classes e habilidades do personagem
  const cls = (char.class || '').toLowerCase();
  const isPaladin = cls.includes('paladino') || cls.includes('paladin');
  const isMonk = cls.includes('monge') || cls.includes('monk');
  const isBarbarian = cls.includes('bárbaro') || cls.includes('barbaro');
  const isRogue = cls.includes('ladino') || cls.includes('rogue');

  // Resetar combo
  const handleReset = () => {
    setConfig({
      numMainAttacks: defaultAttacks,
      mainAttackWeaponId: initialMainWeaponId,
      bonusActionType: 'none',
      offhandWeaponId: attackChoices.find((c) => c.id !== initialMainWeaponId)?.id,
      modifiers: {
        hasDivineSmite: false,
        smiteSlotLevel: 1,
        smiteUndeadOrFiend: false,
        hasHandsOfHarm: false,
        hasStunningStrike: false,
        isRaging: false,
        hasSneakAttack: false,
        sneakAttackDice: Math.max(1, Math.ceil((char.level || 1) / 2)),
        hasHuntersMarkOrHex: false,
        hasAdvantage: false,
        hasDisadvantage: false,
        isCriticalHit: false,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 🗡️ TOPO: TÍTULO UNIFICADO COM BOTÃO EXPANDIR/RECOLHER */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
          onPress={() => setIsExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Sparkles size={14} color={themeColor} />
          <Text style={[styles.headerTitle, { color: themeColor }]}>
            CALCULADORA DE AÇÃO & COMBOS
          </Text>
          <View style={[styles.liveBadge, { backgroundColor: `${themeColor}18` }]}>
            <Text style={[styles.liveBadgeText, { color: themeColor }]}>D&D 5e</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isExpanded && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <RotateCcw size={11} color="#A89F91" />
              <Text style={styles.resetBtnText}>Padrão</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.collapseArrowBtn}
            onPress={() => setIsExpanded((prev) => !prev)}
            activeOpacity={0.7}
          >
            {isExpanded ? (
              <ChevronUp size={14} color="#EDE3D0" />
            ) : (
              <ChevronDown size={14} color="#EDE3D0" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Se recolhido, exibe pílula resumo compacta clicável */}
      {!isExpanded && (
        <TouchableOpacity
          style={styles.collapsedPreviewRow}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.collapsedPreviewText}>
            🎯 <Text style={{ color: '#FFB74D', fontWeight: 'bold' }}>{result.hitDice.totalD20}× d20</Text> para acerto •{' '}
            💥 <Text style={{ color: '#EDE3D0', fontWeight: 'bold' }}>{result.totalDamageDiceCount} dados de dano</Text>
            {result.totalFixedDamageBonus !== 0 ? ` (+${result.totalFixedDamageBonus})` : ''}
          </Text>
          <Text style={[styles.collapsedOpenHint, { color: themeColor }]}>
            Toque para abrir ▾
          </Text>
        </TouchableOpacity>
      )}

      {isExpanded && (
        <>
          {/* 🚀 PRESETS RÁPIDOS (PÍLULAS COMPACTAS) */}
          {presets.length > 0 && (
            <View style={styles.presetsRow}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetChip, { borderColor: `${themeColor}33` }]}
                  onPress={() => setConfig((prev) => preset.apply(prev, char))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>{preset.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 🎲 HERO RESULT: QUANTIDADE EXATA DE DADOS A PEGAR NA MESA */}
          <View style={[styles.heroTray, { borderColor: `${themeColor}55` }]}>
            <View style={styles.trayLabelRow}>
              <Text style={[styles.traySectionTitle, { color: themeColor }]}>
                DADOS PARA PEGAR NA MESA E ROLAR
              </Text>
              <Text style={styles.trayHitCountText}>
                {result.hitDice.totalD20 / (result.hitDice.advantage || result.hitDice.disadvantage ? 2 : 1)} ataque(s)
              </Text>
            </View>

            {/* Pílulas Gigantes dos Dados Físicos */}
        <View style={styles.diceTrayRow}>
          {/* Dados d20 para Acerto */}
          <View style={styles.dieCardAcerto}>
            <Text style={styles.dieCardTypeLabel}>ACERTO</Text>
            <Text style={styles.dieCardCountD20}>
              {result.hitDice.totalD20}× <Text style={styles.dieCardDieName}>d20</Text>
            </Text>
            <Text style={styles.dieCardHint}>
              {result.hitDice.advantage
                ? 'Vantagem (2d20/atq)'
                : result.hitDice.disadvantage
                ? 'Desvantagem'
                : result.hitDice.bonuses[0]?.bonus
                ? `Bônus: ${result.hitDice.bonuses[0].bonus}`
                : '1d20 por golpe'}
            </Text>
          </View>

          {/* Dados de Dano Agrupados */}
          {result.damageDicePool.map((d) => (
            <View
              key={d.die}
              style={[styles.dieCardDano, { borderColor: `${d.color}66` }]}
            >
              <Text style={[styles.dieCardTypeLabel, { color: d.color }]}>
                DANO ({d.die.toUpperCase()})
              </Text>
              <Text style={[styles.dieCardCountDmg, { color: d.color }]}>
                {d.count}× <Text style={styles.dieCardDieName}>{d.die}</Text>
              </Text>
              <Text style={styles.dieCardHint} numberOfLines={1}>
                {d.purpose}
              </Text>
            </View>
          ))}

          {/* Bônus Fixo Somado */}
          {result.totalFixedDamageBonus !== 0 && (
            <View style={styles.dieCardBonus}>
              <Text style={styles.dieCardTypeLabelBonus}>BÔNUS FIXO</Text>
              <Text style={styles.dieCardCountBonus}>
                +{result.totalFixedDamageBonus}
              </Text>
              <Text style={styles.dieCardHint}>Soma ao dano</Text>
            </View>
          )}
        </View>

        {/* Frase Falada Direta para a Mesa */}
        <View style={styles.speechLine}>
          <Text style={styles.speechText}>
            🗣️ <Text style={{ color: '#FFB74D', fontWeight: 'bold' }}>{result.physicalTableSummary.hitDiceSentence}.</Text>{' '}
            <Text style={{ color: '#EDE3D0' }}>{result.physicalTableSummary.damageDiceSentence}</Text>
          </Text>
        </View>
      </View>

      {/* ⚙️ CONTROLES TÁTICOS SIMPLIFICADOS (SEM QUADRADOS ANINHADOS) */}
      <View style={styles.controlsSection}>
        {/* LINHA 1: AÇÃO PRINCIPAL */}
        <View style={styles.controlRow}>
          <View style={styles.controlLabelCol}>
            <Text style={styles.actionBadgeLabel}>⚡ AÇÃO:</Text>
            {/* Contador de Ataques */}
            <View style={styles.counterInline}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    numMainAttacks: Math.max(1, prev.numMainAttacks - 1),
                  }))
                }
              >
                <Minus size={11} color="#EDE3D0" />
              </TouchableOpacity>
              <Text style={styles.counterVal}>{config.numMainAttacks}×</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    numMainAttacks: Math.min(6, prev.numMainAttacks + 1),
                  }))
                }
              >
                <Plus size={11} color="#EDE3D0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seletor de Armas em Pílulas Compactas */}
          <View style={styles.pillsWrap}>
            {attackChoices.map((atk) => {
              const isSelected = config.mainAttackWeaponId === atk.id;
              return (
                <TouchableOpacity
                  key={atk.id}
                  style={[
                    styles.choicePill,
                    isSelected && {
                      backgroundColor: `${themeColor}22`,
                      borderColor: themeColor,
                    },
                  ]}
                  onPress={() =>
                    setConfig((prev) => ({ ...prev, mainAttackWeaponId: atk.id }))
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      isSelected && { color: themeColor, fontWeight: 'bold' },
                    ]}
                  >
                    {atk.name.split(' (')[0]} ({atk.attackBonusStr})
                  </Text>
                  {isSelected && <Check size={11} color={themeColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* LINHA 2: AÇÃO BÔNUS */}
        <View style={styles.controlRow}>
          <Text style={styles.actionBadgeLabel}>✨ BÔNUS:</Text>
          <View style={styles.pillsWrap}>
            {bonusChoices.map((b) => {
              const isSelected = config.bonusActionType === b.id;
              // Rótulo amigável curto
              let shortName = b.name;
              if (b.id === 'none') shortName = 'Nenhuma';
              else if (b.id === 'offhand') shortName = '2ª Arma';
              else if (b.id === 'flurry_of_blows') shortName = 'Rajada Ki (2 atq)';
              else if (b.id === 'martial_arts') shortName = 'Golpe Bônus';
              else if (b.id === 'rage') shortName = 'Fúria (+2)';
              else if (b.id === 'bonus_spell') shortName = 'Magia Bônus';

              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.choicePill,
                    isSelected && {
                      backgroundColor: 'rgba(78, 156, 142, 0.22)',
                      borderColor: '#4E9C8E',
                    },
                  ]}
                  onPress={() =>
                    setConfig((prev) => ({ ...prev, bonusActionType: b.id }))
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      isSelected && { color: '#78C288', fontWeight: 'bold' },
                    ]}
                  >
                    {shortName}
                  </Text>
                  {isSelected && <Check size={11} color="#78C288" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* LINHA 3: GATILHOS, BUFFS & ROLAGEM */}
        <View style={styles.controlRow}>
          <Text style={styles.actionBadgeLabel}>🎯 BUFFS:</Text>
          <View style={styles.pillsWrap}>
            {/* Vantagem no Acerto */}
            <TouchableOpacity
              style={[
                styles.togglePill,
                config.modifiers.hasAdvantage && styles.togglePillActiveGold,
              ]}
              onPress={() =>
                setConfig((prev) => ({
                  ...prev,
                  modifiers: {
                    ...prev.modifiers,
                    hasAdvantage: !prev.modifiers.hasAdvantage,
                    hasDisadvantage: false,
                  },
                }))
              }
              activeOpacity={0.7}
            >
              <Crosshair size={11} color={config.modifiers.hasAdvantage ? '#C5A059' : '#8A8275'} />
              <Text
                style={[
                  styles.togglePillText,
                  config.modifiers.hasAdvantage && { color: '#EDE3D0', fontWeight: 'bold' },
                ]}
              >
                Vantagem
              </Text>
            </TouchableOpacity>

            {/* Acerto Crítico (Dobrar dados) */}
            <TouchableOpacity
              style={[
                styles.togglePill,
                config.modifiers.isCriticalHit && styles.togglePillActiveRed,
              ]}
              onPress={() =>
                setConfig((prev) => ({
                  ...prev,
                  modifiers: {
                    ...prev.modifiers,
                    isCriticalHit: !prev.modifiers.isCriticalHit,
                  },
                }))
              }
              activeOpacity={0.7}
            >
              <Flame size={11} color={config.modifiers.isCriticalHit ? '#E57373' : '#8A8275'} />
              <Text
                style={[
                  styles.togglePillText,
                  config.modifiers.isCriticalHit && { color: '#FFB4B4', fontWeight: 'bold' },
                ]}
              >
                Crítico! (Dados ×2)
              </Text>
            </TouchableOpacity>

            {/* Fúria do Bárbaro */}
            {(isBarbarian || config.bonusActionType === 'rage') && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  config.modifiers.isRaging && styles.togglePillActiveOrange,
                ]}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modifiers: {
                      ...prev.modifiers,
                      isRaging: !prev.modifiers.isRaging,
                    },
                  }))
                }
                activeOpacity={0.7}
              >
                <Flame size={11} color={config.modifiers.isRaging ? '#D4883A' : '#8A8275'} />
                <Text
                  style={[
                    styles.togglePillText,
                    config.modifiers.isRaging && { color: '#FFB74D', fontWeight: 'bold' },
                  ]}
                >
                  Fúria (+2 Dano)
                </Text>
              </TouchableOpacity>
            )}

            {/* Destruição Divina (Paladino) */}
            {isPaladin && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  config.modifiers.hasDivineSmite && styles.togglePillActiveGold,
                ]}
                onPress={() =>
                  setConfig((prev) => {
                    // Alterna entre Nível 1, 2 e desligado
                    if (!prev.modifiers.hasDivineSmite) {
                      return {
                        ...prev,
                        modifiers: { ...prev.modifiers, hasDivineSmite: true, smiteSlotLevel: 1 },
                      };
                    } else if (prev.modifiers.smiteSlotLevel === 1) {
                      return {
                        ...prev,
                        modifiers: { ...prev.modifiers, smiteSlotLevel: 2 },
                      };
                    } else {
                      return {
                        ...prev,
                        modifiers: { ...prev.modifiers, hasDivineSmite: false, smiteSlotLevel: 1 },
                      };
                    }
                  })
                }
                activeOpacity={0.7}
              >
                <Sword size={11} color={config.modifiers.hasDivineSmite ? themeColor : '#8A8275'} />
                <Text
                  style={[
                    styles.togglePillText,
                    config.modifiers.hasDivineSmite && { color: themeColor, fontWeight: 'bold' },
                  ]}
                >
                  {config.modifiers.hasDivineSmite
                    ? `Smite Nvl ${config.modifiers.smiteSlotLevel} (+${config.modifiers.smiteSlotLevel + 1}d8)`
                    : 'Divine Smite'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Mãos do Mal (Monge) */}
            {isMonk && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  config.modifiers.hasHandsOfHarm && {
                    backgroundColor: 'rgba(186, 104, 200, 0.18)',
                    borderColor: '#BA68C8',
                  },
                ]}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modifiers: {
                      ...prev.modifiers,
                      hasHandsOfHarm: !prev.modifiers.hasHandsOfHarm,
                    },
                  }))
                }
                activeOpacity={0.7}
              >
                <Zap size={11} color={config.modifiers.hasHandsOfHarm ? '#CE93D8' : '#8A8275'} />
                <Text
                  style={[
                    styles.togglePillText,
                    config.modifiers.hasHandsOfHarm && { color: '#CE93D8', fontWeight: 'bold' },
                  ]}
                >
                  Mãos do Mal (+1d6)
                </Text>
              </TouchableOpacity>
            )}

            {/* Golpe Atordoante (Monge) */}
            {isMonk && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  config.modifiers.hasStunningStrike && {
                    backgroundColor: 'rgba(100, 181, 246, 0.18)',
                    borderColor: '#64B5F6',
                  },
                ]}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modifiers: {
                      ...prev.modifiers,
                      hasStunningStrike: !prev.modifiers.hasStunningStrike,
                    },
                  }))
                }
                activeOpacity={0.7}
              >
                <Zap size={11} color={config.modifiers.hasStunningStrike ? '#90CAF9' : '#8A8275'} />
                <Text
                  style={[
                    styles.togglePillText,
                    config.modifiers.hasStunningStrike && { color: '#90CAF9', fontWeight: 'bold' },
                  ]}
                >
                  Atordoar (1 Ki)
                </Text>
              </TouchableOpacity>
            )}

            {/* Ataque Furtivo (Ladino) */}
            {isRogue && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  config.modifiers.hasSneakAttack && {
                    backgroundColor: 'rgba(120, 194, 136, 0.18)',
                    borderColor: '#78C288',
                  },
                ]}
                onPress={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modifiers: {
                      ...prev.modifiers,
                      hasSneakAttack: !prev.modifiers.hasSneakAttack,
                    },
                  }))
                }
                activeOpacity={0.7}
              >
                <Sword size={11} color={config.modifiers.hasSneakAttack ? '#A5D6A7' : '#8A8275'} />
                <Text
                  style={[
                    styles.togglePillText,
                    config.modifiers.hasSneakAttack && { color: '#A5D6A7', fontWeight: 'bold' },
                  ]}
                >
                  Ataque Furtivo (+{config.modifiers.sneakAttackDice}d6)
                </Text>
              </TouchableOpacity>
            )}

            {/* Marca do Caçador / Hex */}
            <TouchableOpacity
              style={[
                styles.togglePill,
                config.modifiers.hasHuntersMarkOrHex && {
                  backgroundColor: 'rgba(129, 199, 132, 0.18)',
                  borderColor: '#81C784',
                },
              ]}
              onPress={() =>
                setConfig((prev) => ({
                  ...prev,
                  modifiers: {
                    ...prev.modifiers,
                    hasHuntersMarkOrHex: !prev.modifiers.hasHuntersMarkOrHex,
                  },
                }))
              }
              activeOpacity={0.7}
            >
              <Crosshair size={11} color={config.modifiers.hasHuntersMarkOrHex ? '#C8E6C9' : '#8A8275'} />
              <Text
                style={[
                  styles.togglePillText,
                  config.modifiers.hasHuntersMarkOrHex && { color: '#C8E6C9', fontWeight: 'bold' },
                ]}
              >
                Marca/Hex (+1d6)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 📜 ROTEIRO DO TURNO: VISÃO LIMPA E DIRETA */}
      <View style={styles.narrativeCleanSection}>
        <TouchableOpacity
          style={styles.narrativeHeaderRow}
          onPress={() => setShowNarrative((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.narrativeSectionTitle}>
            ROTEIRO DO TURNO ({result.stepsNarrative.length} PASSOS)
          </Text>
          {showNarrative ? (
            <ChevronUp size={14} color="#8A8275" />
          ) : (
            <ChevronDown size={14} color="#8A8275" />
          )}
        </TouchableOpacity>

        {showNarrative && (
          <View style={styles.narrativeStepsList}>
            {result.stepsNarrative.map((step) => (
              <View key={step.stepNumber} style={styles.stepItemRow}>
                <Text style={[styles.stepDot, { color: themeColor }]}>
                  {step.stepNumber}.
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepItemText}>
                    <Text style={styles.stepItemTitle}>{step.title}:</Text>{' '}
                    {step.hitFormula ? (
                      <Text style={{ color: '#FFB74D', fontWeight: '600' }}>
                        Acerto {step.hitFormula} ➔{' '}
                      </Text>
                    ) : null}
                    {step.damageFormula ? (
                      <Text style={{ color: '#FFB4B4', fontWeight: '600' }}>
                        Dano {step.damageFormula}
                      </Text>
                    ) : (
                      <Text style={{ color: '#A89F91' }}>{step.detail}</Text>
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#2F261F',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  liveBadge: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  collapseArrowBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#201A15',
    borderWidth: 1,
    borderColor: '#382E25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#120F0D',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262019',
    flexWrap: 'wrap',
    gap: 4,
  },
  collapsedPreviewText: {
    color: '#A89F91',
    fontSize: 11,
  },
  collapsedOpenHint: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: '#201A15',
    borderWidth: 1,
    borderColor: '#382E25',
  },
  resetBtnText: {
    color: '#A89F91',
    fontSize: 10,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  presetChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#1E1813',
    borderWidth: 1,
  },
  presetChipText: {
    color: '#D4C8B5',
    fontSize: 10.5,
    fontWeight: '600',
  },
  heroTray: {
    backgroundColor: '#120F0D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  trayLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  traySectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  trayHitCountText: {
    color: '#8A8275',
    fontSize: 10,
  },
  diceTrayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dieCardAcerto: {
    flex: 1,
    minWidth: 95,
    backgroundColor: 'rgba(255, 183, 77, 0.08)',
    borderWidth: 1,
    borderColor: '#FFB74D',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 1,
  },
  dieCardDano: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#181410',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 1,
  },
  dieCardBonus: {
    flex: 1,
    minWidth: 80,
    backgroundColor: 'rgba(78, 156, 142, 0.08)',
    borderWidth: 1,
    borderColor: '#4E9C8E',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 1,
  },
  dieCardTypeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#FFB74D',
  },
  dieCardTypeLabelBonus: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#4E9C8E',
  },
  dieCardCountD20: {
    color: '#FFB74D',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dieCardCountDmg: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dieCardCountBonus: {
    color: '#78C288',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dieCardDieName: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  dieCardHint: {
    color: '#8A8275',
    fontSize: 9.5,
  },
  speechLine: {
    backgroundColor: '#1A1511',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  speechText: {
    fontSize: 11,
    lineHeight: 16,
  },
  controlsSection: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#251F19',
    paddingTop: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBadgeLabel: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    minWidth: 55,
  },
  counterInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1E1813',
    borderRadius: 5,
    padding: 2,
    borderWidth: 1,
    borderColor: '#332920',
  },
  counterBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#262019',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterVal: {
    color: '#EDE3D0',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#1E1813',
    borderWidth: 1,
    borderColor: '#2F261F',
  },
  choicePillText: {
    color: '#A89F91',
    fontSize: 10.5,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: '#1E1813',
    borderWidth: 1,
    borderColor: '#2F261F',
  },
  togglePillActiveGold: {
    backgroundColor: 'rgba(197, 160, 89, 0.18)',
    borderColor: '#C5A059',
  },
  togglePillActiveRed: {
    backgroundColor: 'rgba(229, 115, 115, 0.18)',
    borderColor: '#E57373',
  },
  togglePillActiveOrange: {
    backgroundColor: 'rgba(212, 136, 58, 0.18)',
    borderColor: '#D4883A',
  },
  togglePillText: {
    color: '#8A8275',
    fontSize: 10.5,
  },
  narrativeCleanSection: {
    borderTopWidth: 1,
    borderTopColor: '#251F19',
    paddingTop: 6,
    gap: 6,
  },
  narrativeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  narrativeSectionTitle: {
    color: '#8A8275',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  narrativeStepsList: {
    gap: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stepDot: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepItemText: {
    color: '#BAAFA0',
    fontSize: 11,
    lineHeight: 16,
  },
  stepItemTitle: {
    color: '#EDE3D0',
    fontWeight: '600',
  },
});
