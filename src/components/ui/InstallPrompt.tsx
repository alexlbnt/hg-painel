import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Download, Share, X } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

const DISMISS_KEY = '@hg_install_dismissed_at';
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari (instalado pela tela de início)
    (window.navigator as any).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && safari;
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Convite discreto para instalar o app (PWA), só na web e só em celulares/tablets:
 *  - Android/Chrome: botão "Instalar" que abre o diálogo nativo (evento beforeinstallprompt);
 *  - iPhone/iPad (Safari): instruções de "Adicionar à Tela de Início", pois o iOS não tem diálogo.
 * Some se o app já está instalado e não volta por 14 dias depois de dispensado.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalone() || wasRecentlyDismissed()) return;

    // Só faz sentido oferecer em telas de toque (celular/tablet)
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    if (!touch) return;

    if (isIosSafari()) {
      setShowIos(true);
      setHidden(false);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
    if (outcome === 'dismissed') dismiss();
  }, [deferred, dismiss]);

  if (hidden || (!deferred && !showIos)) return null;

  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={styles.textWrap}>
        <Text style={styles.title}>Instale o HG Painel no celular</Text>
        {showIos ? (
          <Text style={styles.body}>
            Toque em <Share size={12} color={Colors.fantasy.goldBright} /> Compartilhar e depois em “Adicionar à Tela de
            Início”. O app abre em tela cheia, como um aplicativo.
          </Text>
        ) : (
          <Text style={styles.body}>Ícone na tela inicial e abertura em tela cheia durante a sessão.</Text>
        )}
      </View>
      {!showIos && (
        <TouchableOpacity
          onPress={install}
          accessibilityRole="button"
          accessibilityLabel="Instalar o aplicativo"
          style={styles.installBtn}
        >
          <Download size={14} color="#110F0D" />
          <Text style={styles.installText}>Instalar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dispensar convite de instalação"
        hitSlop={10}
        style={styles.closeBtn}
      >
        <X size={16} color={Colors.fantasy.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
    backgroundColor: 'rgba(197, 160, 89, 0.10)',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { color: Colors.fantasy.goldBright, fontSize: 13, fontWeight: '800' },
  body: { color: Colors.fantasy.text, fontSize: 12, lineHeight: 17 },
  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.fantasy.gold,
  },
  installText: { color: '#110F0D', fontWeight: '800', fontSize: 13 },
  closeBtn: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
