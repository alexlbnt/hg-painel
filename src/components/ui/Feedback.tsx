import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';
import { Colors, FontFamily, Radius, Type } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Feedback global no tema do painel, no lugar de window.alert / Alert.alert / window.confirm
 * (que na web aparecem como caixas cinzas do navegador e, no caso do Alert.alert, nem aparecem).
 *
 *   notify('Perfil salvo.')                      → aviso de sucesso
 *   notify('Não foi possível salvar.', 'error')  → aviso de erro
 *   confirmAction('Excluir a sessão?', onOk, 'Excluir sessão', { confirmLabel: 'Excluir', destructive: true })
 */

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
}

type Listener = () => void;
const state: { toasts: Toast[]; confirm: ConfirmRequest | null } = { toasts: [], confirm: null };
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
let nextId = 1;

export function notify(message: string, tone: ToastTone = 'success') {
  const toast = { id: nextId++, message, tone };
  state.toasts = [...state.toasts.slice(-2), toast];
  emit();
  setTimeout(() => dismissToast(toast.id), tone === 'error' ? 7000 : 4500);
}

function dismissToast(id: number) {
  state.toasts = state.toasts.filter((t) => t.id !== id);
  emit();
}

/** Mensagem de erro legível a partir de qualquer exceção. */
export function errorText(e: unknown, fallback = 'Algo deu errado. Tente de novo.') {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function confirmAction(
  message: string,
  onConfirm: () => void,
  title: string = 'Confirmar',
  options: { confirmLabel?: string; destructive?: boolean } = {}
) {
  // Ações de exclusão são destrutivas por padrão
  const destructive = options.destructive ?? /exclu|delet|remov|apag/i.test(`${title} ${message}`);
  state.confirm = {
    title,
    message,
    confirmLabel: options.confirmLabel ?? (destructive ? 'Excluir' : 'Confirmar'),
    destructive,
    onConfirm,
  };
  emit();
}

function closeConfirm() {
  state.confirm = null;
  emit();
}

function useFeedbackState() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

const TONES: Record<ToastTone, { icon: any; color: string; border: string }> = {
  success: { icon: CheckCircle, color: Colors.fantasy.successText, border: 'rgba(143, 199, 154, 0.45)' },
  error: { icon: AlertCircle, color: Colors.fantasy.dangerText, border: 'rgba(242, 184, 181, 0.45)' },
  info: { icon: Info, color: Colors.fantasy.infoText, border: 'rgba(157, 187, 224, 0.45)' },
};

export function FeedbackHost() {
  const { toasts, confirm } = useFeedbackState();
  const { isMobile } = useResponsive();

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.toastArea, isMobile ? styles.toastAreaMobile : styles.toastAreaDesktop]}
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone];
          const Icon = tone.icon;
          return (
            <View
              key={t.id}
              style={[styles.toast, { borderColor: tone.border }]}
              accessibilityRole={t.tone === 'error' ? 'alert' : undefined}
              accessibilityLiveRegion="polite"
            >
              <Icon size={18} color={tone.color} />
              <Text style={styles.toastText}>{t.message}</Text>
              <Pressable
                onPress={() => dismissToast(t.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso"
              >
                <X size={16} color={Colors.fantasy.textMuted} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.overlay}>
          <View style={styles.dialog} accessibilityRole="alert">
            <Text style={styles.dialogTitle}>{confirm?.title}</Text>
            <Text style={styles.dialogMessage}>{confirm?.message}</Text>
            <View style={styles.dialogButtons}>
              <Pressable
                onPress={closeConfirm}
                accessibilityRole="button"
                style={(s: any) => [styles.btn, styles.btnCancel, s.hovered && styles.btnCancelHover]}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const run = confirm?.onConfirm;
                  closeConfirm();
                  run?.();
                }}
                accessibilityRole="button"
                style={(s: any) => [
                  styles.btn,
                  confirm?.destructive ? styles.btnDanger : styles.btnPrimary,
                  s.hovered && { opacity: 0.9 },
                ]}
              >
                <Text style={confirm?.destructive ? styles.btnDangerText : styles.btnPrimaryText}>
                  {confirm?.confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toastArea: {
    position: 'absolute',
    zIndex: 1000,
    gap: 8,
  },
  toastAreaDesktop: {
    right: 20,
    bottom: 20,
    width: 380,
  },
  toastAreaMobile: {
    left: 12,
    right: 12,
    bottom: Platform.OS === 'web' ? ('calc(84px + env(safe-area-inset-bottom))' as any) : 84,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: '#211C17',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' } as any) : { elevation: 8 }),
  },
  toastText: {
    flex: 1,
    color: Colors.fantasy.text,
    fontSize: Type.body,
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    padding: 22,
  },
  dialogTitle: {
    color: Colors.fantasy.goldBright,
    fontSize: Type.heading,
    fontFamily: FontFamily.notice,
    marginBottom: 8,
  },
  dialogMessage: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    lineHeight: 21,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  btn: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnCancel: {
    borderColor: Colors.fantasy.border,
  },
  btnCancelHover: {
    backgroundColor: 'rgba(226, 216, 195, 0.06)',
  },
  btnCancelText: {
    color: Colors.fantasy.textSecondary,
    fontWeight: '700',
    fontSize: Type.body,
  },
  btnPrimary: {
    backgroundColor: Colors.fantasy.gold,
    borderColor: Colors.fantasy.gold,
  },
  btnPrimaryText: {
    color: '#1A140F',
    fontWeight: '700',
    fontSize: Type.body,
  },
  btnDanger: {
    backgroundColor: '#8E1F1F',
    borderColor: '#8E1F1F',
  },
  btnDangerText: {
    color: '#FBEAEA',
    fontWeight: '700',
    fontSize: Type.body,
  },
});
