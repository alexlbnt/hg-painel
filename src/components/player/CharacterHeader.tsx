import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { getProfBonus } from '@/utils/dnd5e';
import { Colors, FontFamily, Radius, Type } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Download, Edit, FileText, MoreHorizontal, Scale, Skull, Sun, Trash2 } from 'lucide-react-native';

interface CharacterHeaderProps {
  char: CharacterData;
  passivePerception: number;
  totalAc: number;
  themeColor?: string;
  isMobile?: boolean;
  onOpenSpeedModal: () => void;
  onExportJson: () => void;
  onExportPdf?: () => void;
  onEditChar: () => void;
  onDeleteChar: () => void;
}

const DEITY_STYLE: Record<string, { icon: any; color: string }> = {
  Arcké: { icon: Scale, color: '#E89A9A' },
  Vitta: { icon: Sun, color: '#E6C280' },
  Thanatos: { icon: Skull, color: '#9DBBE0' },
};

/** Menu "Mais": ações raras (exportar) e destrutivas (excluir) ficam fora da área nobre da ficha. */
function MoreMenu({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: { label: string; icon: any; onPress: () => void; danger?: boolean }[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose} accessibilityLabel="Fechar menu">
        <View style={styles.menu}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                accessibilityRole="menuitem"
                style={(s: any) => [styles.menuItem, (s.hovered || s.pressed) && styles.menuItemHover]}
              >
                <Icon size={18} color={item.danger ? Colors.fantasy.dangerText : Colors.fantasy.textSecondary} />
                <Text style={[styles.menuText, item.danger && { color: Colors.fantasy.dangerText }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = React.memo(({
  char,
  passivePerception,
  totalAc,
  themeColor = '#C5A059',
  isMobile = false,
  onOpenSpeedModal,
  onExportJson,
  onExportPdf,
  onEditChar,
  onDeleteChar,
}) => {
  const prof = getProfBonus(char.level);
  const [menuOpen, setMenuOpen] = useState(false);
  const deity = char.deity && char.deity !== 'Nenhum' ? char.deity : null;
  const deityStyle = deity ? DEITY_STYLE[deity] : null;
  const DeityIcon = deityStyle?.icon;
  const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  const stats: { label: string; short: string; value: string; onPress?: () => void }[] = [
    { label: 'Classe de armadura', short: 'CA', value: String(totalAc) },
    { label: 'Iniciativa', short: 'Inic.', value: signed(char.initiativeBonus) },
    { label: 'Proficiência', short: 'Prof.', value: `+${prof}` },
    { label: 'Percepção passiva', short: 'Perc.', value: String(passivePerception) },
    { label: 'Deslocamento', short: 'Desl.', value: char.speed || '9m', onPress: onOpenSpeedModal },
  ];

  return (
    <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>
      {/* Identidade */}
      <View style={[styles.identity, isMobile && { minWidth: '100%' }]}>
        <Text style={styles.kicker}>
          Nível {char.level}, {char.race}
        </Text>
        <Text style={[styles.charName, isMobile && { fontSize: 26 }, { color: themeColor }]}>{char.name}</Text>
        <Text style={styles.charMeta}>
          {char.class}
          {char.archetype ? ` (${char.archetype})` : ''}, jogado por{' '}
          <Text style={{ color: Colors.fantasy.text, fontWeight: '700' }}>{char.playerName}</Text>
        </Text>
        {!!deity && (
          <View style={styles.deity}>
            {DeityIcon && <DeityIcon size={14} color={deityStyle!.color} />}
            <Text style={[styles.deityText, deityStyle && { color: deityStyle.color }]}>Devoto de {deity}</Text>
          </View>
        )}
      </View>

      {/* Números de combate: uma cor só; o rótulo diz o que é */}
      <View style={[styles.stats, isMobile && styles.statsMobile]}>
        {stats.map((s) => {
          const content = (
            <>
              <Text style={styles.statValue}>{s.value}</Text>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {isMobile ? s.short : s.label}
                </Text>
                {s.onPress && <Edit size={11} color={Colors.fantasy.textMuted} />}
              </View>
            </>
          );
          return s.onPress ? (
            <TouchableOpacity
              key={s.label}
              style={[styles.stat, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
              onPress={s.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${s.label}: ${s.value}. Toque para alterar`}
            >
              {content}
            </TouchableOpacity>
          ) : (
            <View key={s.label} style={styles.stat} accessibilityLabel={`${s.label}: ${s.value}`}>
              {content}
            </View>
          );
        })}
      </View>

      {/* Ações: editar à vista; exportar e excluir no menu */}
      <View style={[styles.actions, isMobile && styles.actionsMobile]}>
        <Button label="Editar ficha" icon={Edit} size="sm" onPress={onEditChar} grow={isMobile} />
        <Button
          label="Mais"
          icon={MoreHorizontal}
          size="sm"
          variant="ghost"
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="Mais ações da ficha"
        />
      </View>

      <MoreMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { label: 'Baixar ficha em PDF', icon: FileText, onPress: () => onExportPdf?.() },
          { label: 'Baixar backup em JSON', icon: Download, onPress: onExportJson },
          { label: 'Excluir personagem', icon: Trash2, onPress: onDeleteChar, danger: true },
        ].filter((i) => i.label !== 'Baixar ficha em PDF' || !!onExportPdf)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 18,
  },
  headerContainerMobile: {
    gap: 14,
    paddingBottom: 14,
  },
  identity: {
    flexShrink: 1,
    minWidth: 200,
    gap: 2,
  },
  kicker: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
    fontWeight: '600',
  },
  charName: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: FontFamily.display,
  },
  charMeta: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.body,
  },
  deity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  deityText: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.small,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 28,
  },
  statsMobile: {
    width: '100%',
    justifyContent: 'space-between',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
  },
  stat: {
    alignItems: 'center',
    minWidth: 44,
  },
  statValue: {
    color: Colors.fantasy.text,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.caption,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsMobile: {
    width: '100%',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  menuItemHover: {
    backgroundColor: 'rgba(226, 216, 195, 0.06)',
  },
  menuText: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    fontWeight: '600',
  },
});

CharacterHeader.displayName = 'CharacterHeader';
