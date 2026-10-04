import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompanionData } from '@/types/companion';
import {
  Award,
  Compass,
  Heart,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react-native';

interface CompanionVitalsPanelProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdateHp: (current: number, temp?: number) => void;
  onUpdateVitals: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionVitalsPanel: React.FC<CompanionVitalsPanelProps> = ({
  companion,
  isEditing,
  onUpdateHp,
  onUpdateVitals,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [customHp, setCustomHp] = useState('');

  // Estados locais para edição
  const [ac, setAc] = useState(String(companion.armorClass || 10));
  const [maxHp, setMaxHp] = useState(String(companion.maxHp || 10));
  const [tempHp, setTempHp] = useState(String(companion.tempHp || 0));
  const [speed, setSpeed] = useState(companion.speed || 'Terrestre 12m');
  const [init, setInit] = useState(String(companion.initiativeBonus || 0));
  const [pb, setPb] = useState(String(companion.proficiencyBonus || 2));

  React.useEffect(() => {
    setAc(String(companion.armorClass || 10));
    setMaxHp(String(companion.maxHp || 10));
    setTempHp(String(companion.tempHp || 0));
    setSpeed(companion.speed || 'Terrestre 12m');
    setInit(String(companion.initiativeBonus || 0));
    setPb(String(companion.proficiencyBonus || 2));
  }, [companion]);

  // Aplica dano ou cura rápida
  const handleApplyHpDelta = (isDamage: boolean) => {
    const val = parseInt(customHp, 10);
    if (isNaN(val) || val <= 0) return;

    let current = companion.currentHp;
    let temp = companion.tempHp;

    if (isDamage) {
      if (temp > 0) {
        if (val <= temp) {
          temp -= val;
        } else {
          const remainingDmg = val - temp;
          temp = 0;
          current = Math.max(0, current - remainingDmg);
        }
      } else {
        current = Math.max(0, current - val);
      }
    } else {
      current = Math.min(companion.maxHp, current + val);
    }

    onUpdateHp(current, temp);
    setCustomHp('');
  };

  const handleFullHeal = () => {
    onUpdateHp(companion.maxHp, companion.tempHp);
  };

  const hpPercent = Math.min(
    100,
    Math.max(0, (companion.currentHp / (companion.maxHp || 1)) * 100)
  );

  const hpColor =
    companion.currentHp / (companion.maxHp || 1) > 0.5
      ? '#38783C'
      : companion.currentHp / (companion.maxHp || 1) > 0.25
      ? '#C5A059'
      : '#B82828';

  const handleSaveForm = (field: keyof CompanionData, value: any) => {
    onUpdateVitals({ [field]: value });
  };

  return (
    <View style={styles.container}>
      {/* 1. RIBBON DE ESTATÍSTICAS DE COMBATE (CA, DESL., INIC., PB) */}
      <View style={styles.statsGrid}>
        {/* CLASSE DE ARMADURA */}
        <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
          <View style={styles.statIconRow}>
            <Shield size={13} color="#7895C2" />
            <Text style={styles.statLabel}>CLASSE ARM.</Text>
          </View>
          {!isEditing ? (
            <Text style={[styles.statValue, { color: '#7895C2' }]}>{companion.armorClass}</Text>
          ) : (
            <TextInput
              style={styles.statInput}
              value={ac}
              onChangeText={(v) => {
                setAc(v);
                handleSaveForm('armorClass', parseInt(v, 10) || 10);
              }}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* INICIATIVA */}
        <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
          <View style={styles.statIconRow}>
            <Zap size={13} color={themeColor} />
            <Text style={styles.statLabel}>INICIATIVA</Text>
          </View>
          {!isEditing ? (
            <Text style={[styles.statValue, { color: themeColor }]}>
              {companion.initiativeBonus >= 0
                ? `+${companion.initiativeBonus}`
                : `${companion.initiativeBonus}`}
            </Text>
          ) : (
            <TextInput
              style={styles.statInput}
              value={init}
              onChangeText={(v) => {
                setInit(v);
                handleSaveForm('initiativeBonus', parseInt(v, 10) || 0);
              }}
              keyboardType="numbers-and-punctuation"
            />
          )}
        </View>

        {/* BÔNUS DE PROFICIÊNCIA */}
        <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
          <View style={styles.statIconRow}>
            <Award size={13} color="#D8B4FE" />
            <Text style={styles.statLabel}>PROFICIÊNCIA</Text>
          </View>
          {!isEditing ? (
            <Text style={[styles.statValue, { color: '#D8B4FE' }]}>
              +{companion.proficiencyBonus}
            </Text>
          ) : (
            <TextInput
              style={styles.statInput}
              value={pb}
              onChangeText={(v) => {
                setPb(v);
                handleSaveForm('proficiencyBonus', parseInt(v, 10) || 2);
              }}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* DESLOCAMENTO */}
        <View
          style={[
            styles.statCard,
            isMobile ? styles.statCardMobile : { flex: 1.5, minWidth: 140 },
          ]}
        >
          <View style={styles.statIconRow}>
            <Compass size={13} color="#78C288" />
            <Text style={styles.statLabel}>DESLOCAMENTO</Text>
          </View>
          {!isEditing ? (
            <Text style={[styles.statValueSmall, { color: '#78C288' }]} numberOfLines={1}>
              {companion.speed || 'Terrestre 9m'}
            </Text>
          ) : (
            <TextInput
              style={styles.statInputText}
              value={speed}
              onChangeText={(v) => {
                setSpeed(v);
                handleSaveForm('speed', v);
              }}
              placeholder="Ex: Terrestre 12m, Voo 18m"
              placeholderTextColor="#6B6257"
            />
          )}
        </View>
      </View>

      {/* 2. CARD DE PONTOS DE VIDA (PV) COM DANO / CURA */}
      <View style={styles.hpCard}>
        <View style={styles.hpHeaderRow}>
          <View style={styles.hpTitleWrap}>
            <Heart size={16} color="#B82828" />
            <Text style={styles.hpTitle}>
              {isMobile ? 'PONTOS DE VIDA (PV)' : 'PONTOS DE VIDA DO COMPANHEIRO'}
            </Text>
            {companion.tempHp > 0 && (
              <View style={styles.tempHpBadge}>
                <Shield size={10} color="#C5A059" />
                <Text style={styles.tempHpText}>+{companion.tempHp} TEMP</Text>
              </View>
            )}
          </View>

          {!isEditing ? (
            <View style={styles.hpNumbersWrap}>
              <Text style={styles.hpCurrentVal}>{companion.currentHp}</Text>
              <Text style={styles.hpMaxVal}>/ {companion.maxHp}</Text>
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handleFullHeal}
                activeOpacity={0.7}
              >
                <RefreshCw size={11} color="#78C288" />
                <Text style={styles.restoreBtnText}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.hpEditNumbersRow}>
              <View style={styles.hpEditField}>
                <Text style={styles.hpEditLabel}>MÁX:</Text>
                <TextInput
                  style={styles.hpEditInput}
                  value={maxHp}
                  onChangeText={(v) => {
                    setMaxHp(v);
                    handleSaveForm('maxHp', Math.max(1, parseInt(v, 10) || 1));
                  }}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.hpEditField}>
                <Text style={styles.hpEditLabel}>TEMP:</Text>
                <TextInput
                  style={styles.hpEditInput}
                  value={tempHp}
                  onChangeText={(v) => {
                    setTempHp(v);
                    handleSaveForm('tempHp', Math.max(0, parseInt(v, 10) || 0));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* BARRA DE PROGRESSO DE VIDA */}
        <View style={styles.hpBarTrack}>
          <View style={[styles.hpBarFill, { width: `${hpPercent}%`, backgroundColor: hpColor }]} />
        </View>

        {/* INPUT CUSTOMIZADO DE DANO / CURA */}
        <View style={styles.customHpRow}>
          <TextInput
            style={styles.customHpInput}
            value={customHp}
            onChangeText={setCustomHp}
            placeholder={isMobile ? 'Qtd. dano/cura' : 'Valor de dano ou cura'}
            placeholderTextColor="#6B6257"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.hpActionBtn, isMobile && styles.hpActionBtnMobile, styles.dmgBtn]}
            onPress={() => handleApplyHpDelta(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dmgBtnText}>- Dano</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hpActionBtn, isMobile && styles.hpActionBtnMobile, styles.healBtn]}
            onPress={() => handleApplyHpDelta(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.healBtnText}>+ Cura</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  statCardMobile: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: '#8A8073',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statInput: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 44,
    height: 30,
  },
  statInputText: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#FFF',
    fontSize: 11,
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: '100%',
    height: 30,
    textAlign: 'center',
  },
  hpCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  hpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  hpTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  hpTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  tempHpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  tempHpText: {
    color: '#E6C280',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  hpNumbersWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 0,
  },
  hpCurrentVal: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hpMaxVal: {
    color: '#7A7265',
    fontSize: 14,
    fontWeight: '600',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#141E15',
    borderWidth: 1,
    borderColor: '#2F6A35',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 4,
  },
  restoreBtnText: {
    color: '#78C288',
    fontSize: 9.5,
    fontWeight: '600',
  },
  hpEditNumbersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  hpEditField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hpEditLabel: {
    color: '#8A8073',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  hpEditInput: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: 44,
  },
  hpBarTrack: {
    height: 8,
    backgroundColor: '#12100E',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2B251E',
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  customHpRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  customHpInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  hpActionBtn: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hpActionBtnMobile: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  dmgBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.25)',
    borderWidth: 1,
    borderColor: '#B82828',
  },
  dmgBtnText: {
    color: '#E57373',
    fontSize: 12,
    fontWeight: 'bold',
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.25)',
    borderWidth: 1,
    borderColor: '#38783C',
  },
  healBtnText: {
    color: '#78C288',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
