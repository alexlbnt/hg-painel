import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Check, CircleHelp, Edit3, MapPin, X } from 'lucide-react-native';
import { Colors, FontFamily, Radius, Type } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import type { RsvpStatus, ScheduledSessionData, SessionRsvpData } from '@/services/api';

/** "em 2 dias e 3 horas", "em 40 minutos", "hoje às 19:30", "agora". Atualiza por minuto, sem contador de segundos. */
export function describeWhen(target: Date, now = new Date()): { relative: string; isToday: boolean; started: boolean } {
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
  const time = target.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isToday = target.toDateString() === now.toDateString();
  if (diffMin <= 0) return { relative: diffMin > -240 ? 'A sessão já começou' : 'A data já passou', isToday, started: true };
  if (isToday) return { relative: diffMin < 60 ? `Hoje, em ${diffMin} min` : `Hoje às ${time}`, isToday, started: false };
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) return { relative: `Amanhã às ${time}`, isToday, started: false };
  const days = Math.floor(diffMin / 1440);
  const hours = Math.floor((diffMin % 1440) / 60);
  return {
    relative: `Em ${days} ${days === 1 ? 'dia' : 'dias'}${hours ? ` e ${hours} ${hours === 1 ? 'hora' : 'horas'}` : ''}`,
    isToday,
    started: false,
  };
}

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: any; color: string; bg: string }[] = [
  { status: 'CONFIRMED', label: 'Vou', icon: Check, color: Colors.fantasy.successText, bg: 'rgba(56, 120, 60, 0.28)' },
  { status: 'MAYBE', label: 'Talvez', icon: CircleHelp, color: Colors.fantasy.warningText, bg: 'rgba(197, 160, 89, 0.22)' },
  { status: 'DECLINED', label: 'Não vou', icon: X, color: Colors.fantasy.dangerText, bg: 'rgba(184, 40, 40, 0.22)' },
];

interface NextSessionCardProps {
  session: ScheduledSessionData | null;
  totalPlayers: number;
  myStatus: RsvpStatus | null;
  canManage: boolean;
  submitting: boolean;
  isMobile: boolean;
  onRsvp: (status: RsvpStatus) => void;
  onOpenAvailability: () => void;
  onOpenSchedule: () => void;
}

export function NextSessionCard({
  session,
  totalPlayers,
  myStatus,
  canManage,
  submitting,
  isMobile,
  onRsvp,
  onOpenAvailability,
  onOpenSchedule,
}: NextSessionCardProps) {
  const now = useMinuteClock();
  const date = session?.scheduledAt ? new Date(session.scheduledAt) : null;
  const validDate = date && !isNaN(date.getTime()) ? date : null;

  if (!session || !validDate) {
    return (
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        <Text style={styles.eyebrow}>Próxima sessão</Text>
        <Text style={styles.title}>Ainda sem data</Text>
        <Text style={styles.body}>
          {canManage
            ? 'Veja os dias em que a mesa pode jogar e marque a próxima sessão.'
            : 'Marque os dias em que você pode jogar. Isso ajuda o Mestre a escolher a data.'}
        </Text>
        <View style={[styles.actions, isMobile && styles.actionsMobile]}>
          {canManage && <Button label="Agendar sessão" icon={Calendar} variant="primary" onPress={onOpenSchedule} />}
          <Button
            label={canManage ? 'Ver disponibilidade' : 'Marcar dias livres'}
            icon={Calendar}
            variant={canManage ? 'secondary' : 'primary'}
            onPress={onOpenAvailability}
          />
        </View>
      </View>
    );
  }

  const when = describeWhen(validDate, now);
  const longDate = validDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = validDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const rsvps: SessionRsvpData[] = session.rsvps || [];
  const going = rsvps.filter((r) => r.status === 'CONFIRMED');
  const maybe = rsvps.filter((r) => r.status === 'MAYBE');
  const notGoing = rsvps.filter((r) => r.status === 'DECLINED');
  const total = Math.max(totalPlayers, rsvps.length, 1);
  const pending = Math.max(0, total - rsvps.length);

  return (
    <View style={[styles.card, styles.cardScheduled, isMobile && styles.cardMobile]}>
      <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.eyebrow}>Próxima sessão</Text>
          <Text style={styles.title}>{session.title || 'Próxima sessão'}</Text>
          <Text style={[styles.when, when.isToday && styles.whenToday]}>{when.relative}</Text>
        </View>
        {canManage && (
          <Button label="Editar sessão" icon={Edit3} size="sm" onPress={onOpenSchedule} />
        )}
      </View>

      <View style={styles.metaList}>
        <View style={styles.metaItem}>
          <Calendar size={16} color={Colors.fantasy.gold} />
          <Text style={styles.metaText}>
            {longDate.charAt(0).toUpperCase() + longDate.slice(1)}, às {time}
          </Text>
        </View>
        {!!session.location && (
          <View style={styles.metaItem}>
            <MapPin size={16} color={Colors.fantasy.gold} />
            <Text style={styles.metaText}>{session.location}</Text>
          </View>
        )}
      </View>

      {!!session.description && (
        <View style={styles.agenda}>
          <Text style={styles.agendaLabel}>Pauta</Text>
          <Text style={styles.agendaText}>{session.description}</Text>
        </View>
      )}

      {/* Resposta de presença em um toque */}
      <View style={styles.rsvpBlock}>
        <Text style={styles.rsvpQuestion}>
          {myStatus ? 'Sua resposta' : 'Você vai?'}
        </Text>
        <View style={styles.rsvpRow} accessibilityRole="radiogroup">
          {RSVP_OPTIONS.map((opt) => {
            const selected = myStatus === opt.status;
            const Icon = opt.icon;
            return (
              <Pressable
                key={opt.status}
                onPress={() => onRsvp(opt.status)}
                disabled={submitting}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: submitting }}
                style={(s: any) => [
                  styles.rsvpBtn,
                  selected && { backgroundColor: opt.bg, borderColor: opt.color },
                  !selected && (s.hovered || s.pressed) && styles.rsvpBtnHover,
                  submitting && { opacity: 0.6 },
                ]}
              >
                <Icon size={16} color={selected ? opt.color : Colors.fantasy.textSecondary} />
                <Text style={[styles.rsvpText, selected && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Quem vai */}
      <View style={styles.partyBlock}>
        <View style={styles.partyBar} accessibilityLabel={`${going.length} de ${total} confirmaram`}>
          <View style={[styles.partyFill, { flex: going.length, backgroundColor: '#5E9E68' }]} />
          <View style={[styles.partyFill, { flex: maybe.length, backgroundColor: Colors.fantasy.gold }]} />
          <View style={[styles.partyFill, { flex: notGoing.length, backgroundColor: '#9E4545' }]} />
          <View style={[styles.partyFill, { flex: pending, backgroundColor: 'transparent' }]} />
        </View>
        <Text style={styles.partySummary}>
          {going.length} de {total} {going.length === 1 ? 'confirmou' : 'confirmaram'}
          {pending > 0 ? `, ${pending} ainda não ${pending === 1 ? 'respondeu' : 'responderam'}` : ''}.
        </Text>
        <View style={styles.people}>
          {[...going.map((r) => [r, 'Vai'] as const), ...maybe.map((r) => [r, 'Talvez'] as const), ...notGoing.map((r) => [r, 'Não vai'] as const)].map(
            ([r, label]) => (
              <View key={r.id} style={styles.person}>
                <Text style={styles.personName}>{r.user?.name || 'Jogador'}</Text>
                <Text
                  style={[
                    styles.personStatus,
                    { color: label === 'Vai' ? Colors.fantasy.successText : label === 'Talvez' ? Colors.fantasy.warningText : Colors.fantasy.dangerText },
                  ]}
                >
                  {label}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <Pressable onPress={onOpenAvailability} accessibilityRole="button" style={styles.linkBtn}>
        <Text style={styles.link}>Ver disponibilidade da mesa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    padding: 24,
    gap: 16,
  },
  cardScheduled: {
    borderColor: Colors.fantasy.goldDark,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 0 1px rgba(197,160,89,0.08), 0 12px 32px rgba(0,0,0,0.35)' } as any) : null),
  },
  cardMobile: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerRowMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  eyebrow: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
    fontWeight: '600',
  },
  title: {
    color: Colors.fantasy.text,
    fontSize: Type.heading,
    lineHeight: 28,
    fontFamily: FontFamily.display,
    fontWeight: '700',
  },
  when: {
    color: Colors.fantasy.goldBright,
    fontSize: Type.bodyLg,
    fontWeight: '700',
  },
  whenToday: {
    color: Colors.fantasy.successText,
  },
  body: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.body,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionsMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  metaList: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    flexShrink: 1,
  },
  agenda: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.fantasy.goldDark,
    gap: 2,
  },
  agendaLabel: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.caption,
    fontWeight: '700',
  },
  agendaText: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    lineHeight: 21,
    fontFamily: FontFamily.serif,
  },
  rsvpBlock: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.fantasy.border,
  },
  rsvpQuestion: {
    color: Colors.fantasy.text,
    fontSize: Type.bodyLg,
    fontWeight: '700',
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#4A3E33',
  },
  rsvpBtnHover: {
    backgroundColor: 'rgba(226, 216, 195, 0.06)',
  },
  rsvpText: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    fontWeight: '700',
  },
  partyBlock: {
    gap: 8,
  },
  partyBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.fantasy.backgroundElement,
  },
  partyFill: {
    height: '100%',
  },
  partySummary: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.small,
  },
  people: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.fantasy.backgroundElement,
  },
  personName: {
    color: Colors.fantasy.text,
    fontSize: Type.small,
    fontWeight: '600',
  },
  personStatus: {
    fontSize: Type.caption,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  link: {
    color: Colors.fantasy.goldBright,
    fontSize: Type.small,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
