import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { CharacterData, RoomData } from '@/lib/mockData';
import { Colors, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { StepAbilities, StepClass, StepIdentity, StepReview, StepSkills } from './Steps';
import {
  buildCharacterPayload,
  createInitialState,
  LAST_STEP,
  STEP_TITLES,
  validateStep,
  WizardState,
} from './wizardState';
import { InfoBox } from './wizardUi';

interface CharacterWizardProps {
  visible: boolean;
  onClose: () => void;
  /** Cria o personagem; deve rejeitar (throw) em caso de falha, para o assistente mostrar o erro */
  onCreate: (payload: Partial<CharacterData>) => Promise<void>;
  rooms: RoomData[];
  defaultRoomId?: string;
  isElevated: boolean;
  userName?: string;
  username?: string;
}

/**
 * Assistente de criação de personagem em 5 passos (Identidade, Classe, Atributos, Perícias, Revisão),
 * com predefinições de D&D 5e por classe. A edição de fichas existentes continua no CharacterModal.
 */
export default function CharacterWizard({
  visible,
  onClose,
  onCreate,
  rooms,
  defaultRoomId,
  isElevated,
  userName,
  username,
}: CharacterWizardProps) {
  const { isMobile } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);

  const initial = useMemo(
    () =>
      createInitialState({
        playerName: isElevated ? '' : userName,
        assignedUsername: isElevated ? '' : username,
        roomId: defaultRoomId,
      }),
    [isElevated, userName, username, defaultRoomId]
  );
  const [state, setState] = useState<WizardState>(initial);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reinicia ao abrir
  useEffect(() => {
    if (visible) {
      setState(initial);
      setStep(0);
      setShowErrors(false);
      setSaving(false);
      setSubmitError(null);
    }
  }, [visible, initial]);

  // Volta ao topo a cada passo
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const update = useCallback((patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch })), []);
  const replace = useCallback((next: WizardState) => setState(next), []);

  const validation = validateStep(step, state);
  const isLast = step === LAST_STEP;

  const goNext = () => {
    if (validation.errors.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(LAST_STEP, s + 1));
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const finish = async () => {
    // Revalida os passos obrigatórios antes de criar
    for (let i = 0; i < LAST_STEP; i++) {
      if (validateStep(i, state).errors.length > 0) {
        setStep(i);
        setShowErrors(true);
        return;
      }
    }
    setSaving(true);
    setSubmitError(null);
    try {
      await onCreate(buildCharacterPayload(state, { isElevated, userName, username }));
      onClose();
    } catch (e: any) {
      setSubmitError(e?.message || 'Não foi possível criar o personagem. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const stepProps = { state, update, replace };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, isMobile && styles.boxMobile]}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Novo personagem</Text>
              <Text style={styles.subtitle}>
                Passo {step + 1} de {STEP_TITLES.length}: {STEP_TITLES[step]}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar assistente" hitSlop={10} style={styles.closeBtn}>
              <X color={Colors.fantasy.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Progresso */}
          <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEP_TITLES.length, now: step + 1 }}>
            {STEP_TITLES.map((title, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <TouchableOpacity
                  key={title}
                  disabled={!done}
                  onPress={() => {
                    setShowErrors(false);
                    setStep(i);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${title}${done ? ' (concluído, tocar para voltar)' : current ? ' (atual)' : ''}`}
                  style={styles.progressItem}
                >
                  <View style={[styles.dot, (done || current) && styles.dotActive, current && styles.dotCurrent]}>
                    {done ? <Check color="#110F0D" size={12} /> : <Text style={[styles.dotText, current && { color: '#110F0D' }]}>{i + 1}</Text>}
                  </View>
                  {!isMobile && <Text style={[styles.progressLabel, current && { color: Colors.fantasy.goldBright }]}>{title}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Conteúdo */}
          <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            {step === 0 && <StepIdentity {...stepProps} isElevated={isElevated} rooms={rooms} />}
            {step === 1 && <StepClass {...stepProps} />}
            {step === 2 && <StepAbilities {...stepProps} />}
            {step === 3 && <StepSkills {...stepProps} />}
            {step === 4 && <StepReview {...stepProps} />}

            {showErrors && validation.errors.length > 0 && (
              <InfoBox tone="error">{validation.errors.join(' ')}</InfoBox>
            )}
            {validation.warnings.length > 0 && !showErrors && <InfoBox tone="warn">{validation.warnings.join(' ')}</InfoBox>}
            {submitError && <InfoBox tone="error">{submitError}</InfoBox>}
          </ScrollView>

          {/* Rodapé */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={goBack}
              disabled={step === 0 || saving}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao passo anterior"
              style={[styles.btn, styles.btnGhost, (step === 0 || saving) && { opacity: 0.35 }]}
            >
              <ChevronLeft color={Colors.fantasy.text} size={16} />
              <Text style={styles.btnGhostText}>Voltar</Text>
            </TouchableOpacity>

            {isLast ? (
              <TouchableOpacity
                onPress={finish}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Criar personagem"
                style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.7 }]}
              >
                {saving ? <ActivityIndicator color="#110F0D" /> : <Check color="#110F0D" size={16} />}
                <Text style={styles.btnPrimaryText}>{saving ? 'Criando…' : 'Criar personagem'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel="Continuar para o próximo passo"
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnPrimaryText}>Continuar</Text>
                <ChevronRight color="#110F0D" size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  box: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '94%',
    flexShrink: 1,
    backgroundColor: '#161311',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
    overflow: 'hidden',
  },
  boxMobile: { maxHeight: '100%', height: '100%', borderRadius: 0, borderWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  title: { color: Colors.fantasy.goldBright, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: Colors.fantasy.textSecondary, fontSize: 13 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.fantasy.backgroundSecondary,
  },
  dotActive: { backgroundColor: Colors.fantasy.goldDark, borderColor: Colors.fantasy.goldDark },
  dotCurrent: { backgroundColor: Colors.fantasy.gold, borderColor: Colors.fantasy.goldBright },
  dotText: { color: Colors.fantasy.textMuted, fontSize: 12, fontWeight: '800' },
  progressLabel: { color: Colors.fantasy.textMuted, fontSize: 12, fontWeight: '700' },
  body: { flexGrow: 1, flexShrink: 1 },
  bodyContent: { padding: 16, gap: 14 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.fantasy.border,
    backgroundColor: '#14110F',
  },
  btn: { minHeight: 46, paddingHorizontal: 18, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnGhost: { borderWidth: 1, borderColor: Colors.fantasy.border },
  btnGhostText: { color: Colors.fantasy.text, fontWeight: '700' },
  btnPrimary: { backgroundColor: Colors.fantasy.gold, flexGrow: 1, maxWidth: 260 },
  btnPrimaryText: { color: '#110F0D', fontWeight: '800', fontSize: 15 },
});
