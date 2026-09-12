import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Crown,
  ExternalLink,
  Folder,
  Globe,
  Scroll,
  Shield,
  Sparkles,
  Zap,
  ClipboardList,
  Key,
  Users,
  Calendar,
  Clock,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Edit3,
  X,
  Sun,
} from 'lucide-react-native';
import AvailabilityModal from '@/components/portal/AvailabilityModal';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import {
  ApiService,
  CampaignSessionData,
  ScheduleResponseData,
  RsvpStatus,
} from '@/services/api';
import { CharacterData, TaskData } from '@/lib/mockData';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const TASK_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LORE: { bg: 'rgba(253, 253, 150, 0.15)', text: '#FDFD96', border: '#C5A059' },
  MECANICA: { bg: 'rgba(174, 198, 207, 0.15)', text: '#AEC6CF', border: '#4E9C8E' },
  ARTE: { bg: 'rgba(255, 183, 178, 0.15)', text: '#FFB7B2', border: '#C95B5B' },
  DEV: { bg: 'rgba(207, 208, 211, 0.15)', text: '#CFD0D3', border: '#80776C' },
  ESPECIAL: { bg: 'rgba(225, 198, 153, 0.15)', text: '#E1C699', border: '#E6C280' },
};

interface CountdownProps {
  targetIso: string | null | undefined;
}

const CountdownTimer = React.memo(function CountdownTimer({ targetIso }: CountdownProps) {
  const { isMobile } = useResponsive();
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPassed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetIso) {
      setTimeRemaining(null);
      return;
    }

    const calc = () => {
      const target = new Date(targetIso).getTime();
      const now = Date.now();
      const diff = target - now;

      if (isNaN(diff)) {
        setTimeRemaining(null);
        return;
      }

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeRemaining({ days, hours, minutes, seconds, isPassed: false });
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  return (
    <View style={[styles.timerContainer, isMobile && { padding: 12, gap: 8 }]}>
      <Text style={[styles.timerLabel, isMobile && { fontSize: 9, letterSpacing: 1 }]}>
        CONTAGEM REGRESSIVA PARA O CHAMADO
      </Text>
      {timeRemaining?.isPassed ? (
        <View style={styles.sessionOngoingNotice}>
          <Sparkles color="#4E9C8E" size={20} />
          <Text style={styles.sessionOngoingText}>
            O momento chegou! A sessão está em andamento ou pronta para iniciar.
          </Text>
        </View>
      ) : (
        <View style={[styles.timerDigitsRow, isMobile && { gap: 4 }]}>
          <View style={[styles.timerBox, isMobile && { minWidth: 50, paddingHorizontal: 6, paddingVertical: 8 }]}>
            <Text style={[styles.timerNumber, isMobile && { fontSize: 20 }]}>{String(timeRemaining?.days || 0).padStart(2, '0')}</Text>
            <Text style={[styles.timerUnit, isMobile && { fontSize: 8 }]}>DIAS</Text>
          </View>
          <Text style={[styles.timerColon, isMobile && { fontSize: 18 }]}>:</Text>
          <View style={[styles.timerBox, isMobile && { minWidth: 50, paddingHorizontal: 6, paddingVertical: 8 }]}>
            <Text style={[styles.timerNumber, isMobile && { fontSize: 20 }]}>{String(timeRemaining?.hours || 0).padStart(2, '0')}</Text>
            <Text style={[styles.timerUnit, isMobile && { fontSize: 8 }]}>HORAS</Text>
          </View>
          <Text style={[styles.timerColon, isMobile && { fontSize: 18 }]}>:</Text>
          <View style={[styles.timerBox, isMobile && { minWidth: 50, paddingHorizontal: 6, paddingVertical: 8 }]}>
            <Text style={[styles.timerNumber, isMobile && { fontSize: 20 }]}>{String(timeRemaining?.minutes || 0).padStart(2, '0')}</Text>
            <Text style={[styles.timerUnit, isMobile && { fontSize: 8 }]}>MIN</Text>
          </View>
          <Text style={[styles.timerColon, isMobile && { fontSize: 18 }]}>:</Text>
          <View style={[styles.timerBox, isMobile && { minWidth: 50, paddingHorizontal: 6, paddingVertical: 8 }]}>
            <Text style={[styles.timerNumber, { color: '#C5A059' }, isMobile && { fontSize: 20 }]}>
              {String(timeRemaining?.seconds || 0).padStart(2, '0')}
            </Text>
            <Text style={[styles.timerUnit, isMobile && { fontSize: 8 }]}>SEG</Text>
          </View>
        </View>
      )}
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { width } = useWindowDimensions();
  const { user, isLoading: authLoading } = useAuth();

  const [driveUrl] = useState<string>(() => {
    const defaultUrl = 'https://drive.google.com/drive/folders/1_Jz1km6fxK8pgtERQqPrMvi1y5wfQlOJ?usp=sharing';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('hg_drive_url') || defaultUrl;
    }
    return defaultUrl;
  });

  // Dados reais da mesa
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [sessions, setSessions] = useState<CampaignSessionData[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleResponseData>({ session: null });
  const [loadingData, setLoadingData] = useState(true);

  // Estados de RSVP e Agendamento

  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    dateStr: '',
    timeStr: '19:30',
    location: '',
    description: '',
    resetRsvps: false,
  });

  const handleScheduleFromAvailability = (dateStr: string) => {
    setScheduleForm((p) => ({
      ...p,
      dateStr,
      title: p.title || 'Próxima Sessão de Campanha',
      location: p.location || 'Discord - Taverna Principal',
    }));
    setIsScheduleModalOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [charsData, tasksData, sessionsData, schedData] = await Promise.all([
          ApiService.getCharacters().catch(() => []),
          ApiService.getTasks().catch(() => []),
          ApiService.getSessions().catch(() => []),
          ApiService.getScheduledSession().catch(() => ({ session: null })),
        ]);
        if (!isMounted) return;
        setCharacters(charsData);
        setTasks(tasksData);
        setSessions(sessionsData);
        setScheduleData(schedData);
      } catch (err) {
        console.warn('Erro ao carregar dados da taverna:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);


  // Sincronização em tempo real via SSE
  useRealtimeSync((event) => {
    if (event.type === 'SCHEDULE_UPDATED' || event.type === 'RSVP_UPDATED') {
      ApiService.getScheduledSession().then(setScheduleData).catch(() => {});
    } else if (event.type === 'TASK_CREATED' || event.type === 'TASK_UPDATED' || event.type === 'TASK_DELETED') {
      ApiService.getTasks().then(setTasks).catch(() => {});
    } else if (event.type === 'CHARACTER_UPDATED' || event.type === 'CHARACTER_CREATED' || event.type === 'CHARACTER_DELETED') {
      ApiService.getCharacters().then(setCharacters).catch(() => {});
    } else if (event.type === 'JOURNAL_NOTE_CREATED' || event.type === 'JOURNAL_SESSION_CREATED') {
      ApiService.getSessions().then(setSessions).catch(() => {});
    }
  });

  // Ação de confirmar presença (RSVP)
  const handleRsvp = async (status: RsvpStatus) => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Identifique-se na taverna (faça login) para confirmar sua presença na sessão!');
      } else {
        Alert.alert('Identificação Necessária', 'Faça login para confirmar sua presença na sessão.');
      }
      return;
    }

    if (!scheduleData.session?.id) return;

    setIsSubmittingRsvp(true);
    try {
      await ApiService.submitRsvp({
        scheduledSessionId: scheduleData.session.id,
        userId: user.id,
        status,
      });
      const updated = await ApiService.getScheduledSession();
      setScheduleData(updated);
    } catch (err: any) {
      const msg = err.message || 'Erro ao registrar presença';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Abrir modal de agendamento (Mestre / Mecânico)
  const handleOpenScheduleModal = () => {
    const current = scheduleData?.session;
    let dStr = '';
    let tStr = '19:30';

    if (current?.scheduledAt) {
      const d = new Date(current.scheduledAt);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dStr = `${year}-${month}-${day}`;

        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        tStr = `${hours}:${mins}`;
      }
    }

    setScheduleForm({
      title: current?.title || 'Próxima Sessão',
      dateStr: dStr,
      timeStr: tStr,
      location: current?.location || 'Discord - Canal Honra & Egoísmo',
      description: current?.description || '',
      resetRsvps: false,
    });
    setIsScheduleModalOpen(true);
  };

  // Salvar agendamento
  const handleSaveSchedule = async () => {
    if (!user) return;
    setIsSavingSchedule(true);
    try {
      let combinedIso: string | null = null;
      if (scheduleForm.dateStr) {
        const timePart = scheduleForm.timeStr ? scheduleForm.timeStr.trim() : '19:30';
        combinedIso = new Date(`${scheduleForm.dateStr}T${timePart}:00`).toISOString();
      }

      await ApiService.saveScheduledSession({
        title: scheduleForm.title.trim() || 'Próxima Sessão',
        scheduledAt: combinedIso,
        location: scheduleForm.location.trim() || 'Discord - Canal Honra & Egoísmo',
        description: scheduleForm.description.trim(),
        userId: user.id,
        resetRsvps: scheduleForm.resetRsvps,
      });

      const updated = await ApiService.getScheduledSession();
      setScheduleData(updated);
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Erro ao salvar agendamento';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // RSVP do usuário atual
  const myRsvp = scheduleData.session?.rsvps?.find((r) => r.userId === user?.id);
  const myRsvpStatus = myRsvp ? myRsvp.status : null;

  // Listas de RSVP da sessão
  const confirmedList = useMemo(() => {
    return scheduleData.session?.rsvps?.filter((r) => r.status === 'CONFIRMED') || [];
  }, [scheduleData.session?.rsvps]);

  const maybeList = useMemo(() => {
    return scheduleData.session?.rsvps?.filter((r) => r.status === 'MAYBE') || [];
  }, [scheduleData.session?.rsvps]);

  const declinedList = useMemo(() => {
    return scheduleData.session?.rsvps?.filter((r) => r.status === 'DECLINED') || [];
  }, [scheduleData.session?.rsvps]);


  // Personagem do jogador logado (se houver)
  const myCharacter = user
    ? characters.find((c) => c.username && c.username.toLowerCase() === user.username.toLowerCase())
    : null;

  // Saudação contextual por horário
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Filtro de categorias do Mural de Missões
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<'ALL' | 'LORE' | 'MECANICA' | 'ARTE' | 'DEV'>('ALL');

  const taskCounts = useMemo(() => {
    return {
      ALL: tasks.length,
      LORE: tasks.filter((t) => t.category === 'LORE').length,
      MECANICA: tasks.filter((t) => t.category === 'MECANICA').length,
      ARTE: tasks.filter((t) => t.category === 'ARTE').length,
      DEV: tasks.filter((t) => t.category === 'DEV').length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const active = tasks.filter((t) => t.status === 'ANDAMENTO' || t.status === 'SUGERIDO');
    if (taskCategoryFilter === 'ALL') return active.slice(0, 3);
    return active.filter((t) => t.category === taskCategoryFilter).slice(0, 3);
  }, [tasks, taskCategoryFilter]);

  // Dados de Quórum e Proximidade da Sessão
  const scheduledAt = scheduleData.session?.scheduledAt;
  const sessionScheduledDate = useMemo(() => {
    if (!scheduledAt) return null;
    const d = new Date(scheduledAt);
    return isNaN(d.getTime()) ? null : d;
  }, [scheduledAt]);

  const sessionIsToday = useMemo(() => {
    if (!sessionScheduledDate) return false;
    return sessionScheduledDate.toDateString() === new Date().toDateString();
  }, [sessionScheduledDate]);

  const sessionIsTomorrow = useMemo(() => {
    if (!sessionScheduledDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return sessionScheduledDate.toDateString() === tomorrow.toDateString();
  }, [sessionScheduledDate]);

  const totalRegisteredParty = Math.max(characters.length || 0, 4);
  const quorumPercent = Math.min(100, Math.round((confirmedList.length / totalRegisteredParty) * 100));
  const isQuorumReached = confirmedList.length >= Math.min(characters.length || 4, 3);

  // Estatísticas para Mestre e Mecânico
  const totalPartyHp = characters.reduce((acc, c) => acc + (c.currentHp || 0), 0);
  const maxPartyHp = characters.reduce((acc, c) => acc + (c.maxHp || 10), 0);
  const woundedCount = characters.filter((c) => (c.currentHp || 0) < (c.maxHp || 10)).length;

  // Última sessão do diário
  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const latestNote =
    latestSession && latestSession.notes && latestSession.notes.length > 0
      ? latestSession.notes[latestSession.notes.length - 1]
      : null;

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', minHeight: 400 }]}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  const isWide = width >= 900;

  return (
    <ScrollView
      style={styles.scrollWrapper}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ============================================================ */}
      {/* 1. HERO & BANNER DE BOAS-VINDAS CONTEXTUAL                  */}
      {/* ============================================================ */}
      <View style={styles.hero}>
        <View style={styles.heroGlowEffect} />

        <View style={styles.heroTopRow}>
          {/* Badge de Identidade de Campanha / Função */}
          <View style={styles.badge}>
            {user?.role === 'DM' ? (
              <>
                <Crown color="#C5A059" size={13} />
                <Text style={styles.badgeText}>MESTRE DA CAMPANHA</Text>
              </>
            ) : user?.role === 'MECHANIC' ? (
              <>
                <Sparkles color="#4E9C8E" size={13} />
                <Text style={[styles.badgeText, { color: '#4E9C8E' }]}>ARTÍFICE MECÂNICO</Text>
              </>
            ) : user ? (
              <>
                <Shield color="#C5A059" size={13} />
                <Text style={styles.badgeText}>AVENTUREIRO</Text>
              </>
            ) : (
              <>
                <Scroll color="#C5A059" size={13} />
                <Text style={styles.badgeText}>TAVERNA D&D 5E</Text>
              </>
            )}
          </View>

          {/* Micro-cápsula do Herói Ativo (se houver) */}
          {myCharacter && (
            <TouchableOpacity
              style={[styles.heroHeroCapsule, isMobile && { maxWidth: '100%' }]}
              activeOpacity={0.8}
              onPress={() => router.push('/player')}
            >
              <Shield color={myCharacter.themeColor || '#C5A059'} size={13} />
              <Text style={styles.heroHeroCapsuleText} numberOfLines={1}>
                {myCharacter.name} • {myCharacter.class} Nv.{myCharacter.level} ({myCharacter.currentHp}/{myCharacter.maxHp} HP)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Título Principal com Saudação Dinâmica */}
        <Text style={[styles.heroTitle, isMobile && { fontSize: 24, letterSpacing: 1 }]}>
          {user ? `${timeGreeting.toUpperCase()}, ${user.name.toUpperCase()}` : 'HONRA & EGOÍSMO'}
        </Text>

        {/* Subtítulo Dinâmico e Conciso */}
        <Text style={[styles.heroSubtitle, isMobile && { fontSize: 13, lineHeight: 18 }]}>
          {user?.role === 'DM'
            ? 'O Escudo do Mestre e o destino da comitiva repousam sob seu comando.'
            : user?.role === 'MECHANIC'
            ? 'A bancada de artífice está aberta para forjar e auditar fichas.'
            : user
            ? 'A comitiva se reúne ao redor da fogueira. Prepare suas armas e magias para a jornada.'
            : 'Portal moderno para D&D 5e: fichas em tempo real, diário de bordo e convocação de sessões.'}
        </Text>
      </View>

      {/* ============================================================ */}
      {/* 1.1 BARRA RÁPIDA DE SESSÃO & QUÓRUM (MODO DIA DE SESSÃO)     */}
      {/* ============================================================ */}
      {scheduleData.session?.scheduledAt && (
        <View style={[styles.quickSessionBar, sessionIsToday && styles.quickSessionBarToday]}>
          <View style={[styles.quickSessionMainRow, !isWide && styles.quickSessionMainCol]}>
            {/* Lado Esquerdo: Tag, Título e Data */}
            <View style={[styles.quickSessionInfoCol, isMobile && { width: '100%', minWidth: 0 }]}>
              <View style={styles.quickSessionTagRow}>
                {sessionIsToday ? (
                  <View style={styles.pillToday}>
                    <Sparkles color="#110F0D" size={11} />
                    <Text style={styles.pillTodayText}>SESSÃO HOJE!</Text>
                  </View>
                ) : sessionIsTomorrow ? (
                  <View style={styles.pillTomorrow}>
                    <Clock color="#E6C280" size={11} />
                    <Text style={styles.pillTomorrowText}>SESSÃO AMANHÃ</Text>
                  </View>
                ) : (
                  <View style={styles.pillScheduled}>
                    <Calendar color="#C5A059" size={11} />
                    <Text style={styles.pillScheduledText}>PRÓXIMA SESSÃO</Text>
                  </View>
                )}
                <Text style={styles.quickSessionTitle} numberOfLines={1}>
                  {scheduleData.session.title || 'Sessão de Campanha'}
                </Text>
              </View>

              <View style={styles.quickSessionMetaRow}>
                <Text style={styles.quickSessionDateTime}>
                  📅 {sessionScheduledDate?.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {sessionScheduledDate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.quickSessionLocation} numberOfLines={1}>
                  📍 {scheduleData.session.location || 'Discord - Taverna Principal'}
                </Text>
              </View>
            </View>

            {/* Centro: Medidor Visual de Quórum */}
            <View style={[styles.quickSessionQuorumCol, isMobile && { width: '100%', minWidth: 0 }]}>
              <View style={styles.quorumHeaderMini}>
                <Text style={styles.quorumPercentLabel}>
                  Quórum: {confirmedList.length}/{totalRegisteredParty} ({quorumPercent}%)
                </Text>
                <Text style={[styles.quorumStatusMini, { color: isQuorumReached ? '#4E9C8E' : '#C5A059' }]}>
                  {isQuorumReached ? '⚔️ Quórum Atingido' : '⏳ Aguardando'}
                </Text>
              </View>
              <View style={styles.quorumProgressBarTrack}>
                <View
                  style={[
                    styles.quorumProgressBarFill,
                    {
                      width: `${quorumPercent}%`,
                      backgroundColor: isQuorumReached ? '#4E9C8E' : '#C5A059',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Lado Direito: Quick RSVP em 1 toque */}
            <View style={[styles.quickSessionActionCol, isMobile && { width: '100%', alignItems: 'stretch' }]}>
              {user ? (
                myRsvpStatus === 'CONFIRMED' ? (
                  <View style={[styles.quickRsvpConfirmedBadge, isMobile && { width: '100%', justifyContent: 'center' }]}>
                    <CheckCircle2 color="#4E9C8E" size={14} />
                    <Text style={styles.quickRsvpConfirmedText}>Presença Confirmada</Text>
                  </View>
                ) : (
                  <View style={[styles.quickRsvpButtonsRow, isMobile && { width: '100%' }]}>
                    <TouchableOpacity
                      style={[styles.quickRsvpBtn, styles.quickRsvpBtnConfirm, isMobile && { flex: 1, justifyContent: 'center' }]}
                      activeOpacity={0.8}
                      disabled={isSubmittingRsvp}
                      onPress={() => handleRsvp('CONFIRMED')}
                    >
                      <CheckCircle2 color="#110F0D" size={13} />
                      <Text style={styles.quickRsvpBtnConfirmText}>Confirmar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.quickRsvpBtn, styles.quickRsvpBtnMaybe, isMobile && { flex: 1, justifyContent: 'center' }]}
                      activeOpacity={0.8}
                      disabled={isSubmittingRsvp}
                      onPress={() => handleRsvp('MAYBE')}
                    >
                      <AlertCircle color="#E6C280" size={13} />
                      <Text style={styles.quickRsvpBtnMaybeText}>Dúvida</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <Text style={styles.quickSessionGuestText}>Faça login para confirmar</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. HUB CENTRAL: COMANDO DO HERÓI & MURAL DE MISSÕES         */}
      {/* ============================================================ */}
      <View style={[styles.hubGrid, isWide ? styles.hubGridRow : styles.hubGridCol]}>
        {/* CARD ESQUERDO: CENTRO DE COMANDO DO HERÓI / MESA */}
        <View style={[styles.hubColumn, isWide && styles.hubColumnWide]}>
          {user?.role === 'DM' ? (
            /* Painel do Mestre */
            <View style={[styles.hubCard, styles.dmCardBorder, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxDm}>
                  <Crown color="#C5A059" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardCategoryTagDm}>COMANDO DO MESTRE</Text>
                  <Text style={styles.cardMainTitle}>Escudo & Situação da Mesa</Text>
                </View>
              </View>

              <View style={styles.dmPartyOverviewBox}>
                <View style={styles.dmStatItem}>
                  <Text style={styles.dmStatNum}>{characters.length}</Text>
                  <Text style={styles.dmStatLbl}>HERÓIS</Text>
                </View>
                <View style={[styles.dmStatItem, { borderColor: '#B82828' }]}>
                  <Text style={[styles.dmStatNum, { color: woundedCount > 0 ? '#C95B5B' : '#4E9C8E' }]}>
                    {woundedCount}
                  </Text>
                  <Text style={styles.dmStatLbl}>FERIDOS</Text>
                </View>
                <View style={styles.dmStatItem}>
                  <Text style={styles.dmStatNum}>
                    {totalPartyHp}/{maxPartyHp}
                  </Text>
                  <Text style={styles.dmStatLbl}>HP COLETIVO</Text>
                </View>
              </View>

              <View style={styles.actionRowGrid}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.85}
                  onPress={() => router.push('/dm')}
                >
                  <Crown color="#110F0D" size={16} />
                  <Text style={styles.primaryActionButtonText}>Abrir Escudo do Mestre →</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.85}
                  onPress={() => router.push('/dm')}
                >
                  <Key color="#C5A059" size={16} />
                  <Text style={styles.secondaryActionButtonText}>Usuários & Permissões</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : user?.role === 'MECHANIC' ? (
            /* Painel do Player Mecânico */
            <View style={[styles.hubCard, styles.mechanicCardBorder, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxMechanic}>
                  <Sparkles color="#4E9C8E" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardCategoryTag, { color: '#4E9C8E' }]}>SUPORTE MECÂNICO</Text>
                  <Text style={styles.cardMainTitle}>Bancada de Regras & Fichas</Text>
                </View>
              </View>

              <Text style={styles.cardParagraph}>
                Como Player Mecânico, você tem autorização para visualizar, editar e auditar{' '}
                <Text style={{ color: '#4E9C8E', fontWeight: 'bold' }}>todas as {characters.length} fichas da mesa</Text>.
              </Text>

              <View style={styles.heroPreviewStatsRow}>
                <View style={styles.heroStatMiniBox}>
                  <Users color="#4E9C8E" size={16} />
                  <Text style={styles.heroStatValue}>{characters.length} Fichas Liberadas</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionButton, { backgroundColor: '#4E9C8E' }]}
                activeOpacity={0.85}
                onPress={() => router.push('/player')}
              >
                <Sparkles color="#110F0D" size={16} />
                <Text style={styles.primaryActionButtonText}>Inspecionar Todas as Fichas →</Text>
              </TouchableOpacity>
            </View>
          ) : user && myCharacter ? (
            /* Card do Herói do Jogador */
            <View style={[styles.hubCard, { borderColor: myCharacter.themeColor || '#C5A059' }, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.cardIconBoxHero,
                    { borderColor: myCharacter.themeColor || '#C5A059' },
                  ]}
                >
                  <Shield color={myCharacter.themeColor || '#C5A059'} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardCategoryTag, { color: myCharacter.themeColor || '#C5A059' }]}>
                    SEU HERÓI ATIVO
                  </Text>
                  <Text style={styles.cardMainTitle}>{myCharacter.name}</Text>
                  <Text style={styles.heroSubMeta}>
                    {myCharacter.race} • {myCharacter.class} • Nível {myCharacter.level}
                  </Text>
                </View>
              </View>

              {/* Barra de Vida Visual */}
              <View style={styles.hpSection}>
                <View style={styles.hpTextRow}>
                  <Text style={styles.hpLabel}>PONTOS DE VIDA</Text>
                  <Text style={styles.hpValueText}>
                    {myCharacter.currentHp} / {myCharacter.maxHp} HP
                    {myCharacter.tempHp > 0 ? ` (+${myCharacter.tempHp} temp)` : ''}
                  </Text>
                </View>
                <View style={styles.hpBarTrack}>
                  <View
                    style={[
                      styles.hpBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, (myCharacter.currentHp / (myCharacter.maxHp || 1)) * 100))}%`,
                        backgroundColor:
                          myCharacter.currentHp / myCharacter.maxHp <= 0.25
                            ? '#C95B5B'
                            : myCharacter.currentHp / myCharacter.maxHp <= 0.5
                            ? '#C5A059'
                            : '#4E9C8E',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Mini Estatísticas Rápidas */}
              <View style={styles.heroPreviewStatsRow}>
                <View style={styles.heroStatMiniBox}>
                  <Shield color="#8C6C90" size={14} />
                  <Text style={styles.heroStatValue}>{myCharacter.armorClass} CA</Text>
                </View>
                <View style={styles.heroStatMiniBox}>
                  <Zap color="#C5A059" size={14} />
                  <Text style={styles.heroStatValue}>{myCharacter.speed || '9m'}</Text>
                </View>
                <View style={styles.heroStatMiniBox}>
                  <Sun color="#E6C280" size={14} />
                  <Text style={styles.heroStatValue}>{myCharacter.gold || 0} PO</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/player')}
              >
                <Shield color="#110F0D" size={16} />
                <Text style={styles.primaryActionButtonText}>Abrir Grimório de {myCharacter.name} →</Text>
              </TouchableOpacity>
            </View>
          ) : user ? (
            /* Jogador sem ficha atribuída */
            <View style={[styles.hubCard, styles.heroCardBorder, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxHero}>
                  <Shield color="#C5A059" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardCategoryTag}>GRIMÓRIO DO JOGADOR</Text>
                  <Text style={styles.cardMainTitle}>Crie seu Aventureiro</Text>
                </View>
              </View>
              <Text style={styles.cardParagraph}>
                Nenhum personagem foi vinculado ao seu login (@{user.username}) ainda. Crie a sua ficha agora ou solicite ao Mestre para atribuir uma ficha existente a você!
              </Text>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/player')}
              >
                <Text style={styles.primaryActionButtonText}>Criar Minha Ficha →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Visitante Deslogado */
            <View style={[styles.hubCard, styles.heroCardBorder, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxHero}>
                  <Shield color="#C5A059" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardCategoryTag}>GRIMÓRIO D&D 5E</Text>
                  <Text style={styles.cardMainTitle}>Acesso à Mesa</Text>
                </View>
              </View>
              <Text style={styles.cardParagraph}>
                Identifique-se na taverna pelo botão de LOGIN no topo da tela para acessar suas fichas, magias preparadas e diários da campanha.
              </Text>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/player')}
              >
                <Text style={styles.primaryActionButtonText}>Acessar Grimório do Jogador →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CARD DIREITO: MURAL DE MISSÕES (KANBAN) */}
        <View style={[styles.hubColumn, isWide && styles.hubColumnWide]}>
          <View style={[styles.hubCard, styles.tasksCardBorder, isWide && styles.hubCardWide, isMobile && styles.hubCardMobile]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBoxTasks}>
                <ClipboardList color="#E6C280" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.cardCategoryTag}>MURAL DE MISSÕES</Text>
                  <Text style={styles.tasksCountBadge}>{tasks.length} total</Text>
                </View>
                <Text style={styles.cardMainTitle}>Demandas & Tarefas da Mesa</Text>
              </View>
            </View>

            {/* Abas de Filtro por Categoria */}
            <View style={styles.taskFilterTabsRow}>
              {(['ALL', 'LORE', 'MECANICA', 'ARTE', 'DEV'] as const).map((cat) => {
                const isActive = taskCategoryFilter === cat;
                const label = cat === 'ALL' ? 'Todas' : cat === 'MECANICA' ? 'Mecânica' : cat === 'LORE' ? 'Lore' : cat === 'ARTE' ? 'Arte' : 'Dev';
                const count = taskCounts[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.taskFilterTab, isActive && styles.taskFilterTabActive]}
                    activeOpacity={0.75}
                    onPress={() => setTaskCategoryFilter(cat)}
                  >
                    <Text style={[styles.taskFilterTabText, isActive && styles.taskFilterTabTextActive]}>
                      {label} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingData ? (
              <ActivityIndicator color="#C5A059" style={{ marginVertical: 20 }} />
            ) : filteredTasks.length === 0 ? (
              <View style={styles.emptyTaskNotice}>
                <Text style={styles.emptyTaskNoticeText}>
                  {taskCategoryFilter === 'ALL'
                    ? 'O mural está vazio no momento. Nenhuma missão ativa.'
                    : `Nenhuma missão ativa na categoria ${taskCategoryFilter}.`}
                </Text>
              </View>
            ) : (
              <View style={styles.tasksPreviewList}>
                {filteredTasks.map((t) => {
                  const catStyle = TASK_CATEGORY_COLORS[t.category] || TASK_CATEGORY_COLORS.LORE;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.taskPreviewItem}
                      activeOpacity={0.8}
                      onPress={() => router.push('/tasks')}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={[styles.categoryPill, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
                            <Text style={[styles.categoryPillText, { color: catStyle.text }]}>{t.category}</Text>
                          </View>
                          <Text style={styles.taskStatusMiniText}>
                            {t.status === 'ANDAMENTO' ? '• Em Andamento' : '• Sugerido'}
                          </Text>
                        </View>
                        <Text style={styles.taskPreviewTitle} numberOfLines={1}>
                          {t.title}
                        </Text>
                      </View>
                      <Text style={styles.taskArrowText}>→</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.secondaryActionButton}
              activeOpacity={0.85}
              onPress={() => router.push('/tasks')}
            >
              <ClipboardList color="#C5A059" size={16} />
              <Text style={styles.secondaryActionButtonText}>Ver Mural Completo de Missões →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 3. CRÔNICAS RECENTES: ÚLTIMA SESSÃO DO DIÁRIO               */}
      {/* ============================================================ */}
      <View style={styles.sectionContainer}>
        <View style={[styles.chronicleCard, isMobile && { padding: 14, gap: 14 }]}>
          <View style={[styles.chronicleHeader, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            <View style={[styles.chronicleHeaderLeft, isMobile && { width: '100%' }]}>
              <View style={styles.chronicleIconBox}>
                <BookOpen color="#C5A059" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chronicleTag}>ÚLTIMO REGISTRO DO DIÁRIO</Text>
                <Text style={styles.chronicleTitle}>
                  {latestSession ? latestSession.title : 'Crônicas de Honra & Egoísmo'}
                </Text>
                {latestSession && (
                  <Text style={styles.chronicleDate}>
                    Sessão em {new Date(latestSession.date).toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.chronicleActionBtn, isMobile && { width: '100%', justifyContent: 'center', alignItems: 'center' }]}
              activeOpacity={0.85}
              onPress={() => router.push('/journal')}
            >
              <Text style={styles.chronicleActionBtnText}>Abrir Diário Completo →</Text>
            </TouchableOpacity>
          </View>

          {latestNote ? (
            <View style={styles.chronicleSnippetBox}>
              <Text style={styles.chronicleSnippetAuthor}>
                Por {latestNote.author?.name || 'Mestre'}:
              </Text>
              <Text style={styles.chronicleSnippetContent} numberOfLines={3}>
                &ldquo;{latestNote.content.replace(/[#*`_]/g, '')}&rdquo;
              </Text>
            </View>
          ) : (
            <Text style={styles.chronicleEmptyText}>
              Nenhum relato registrado para a última sessão. Abra o Diário para registrar a história da sua aventura!
            </Text>
          )}
        </View>
      </View>

      {/* ============================================================ */}
      {/* 4. O UNIVERSO DE HONRA & EGOÍSMO: WIKI & ARQUIVOS           */}
      {/* ============================================================ */}
      <View style={styles.sectionContainer}>
        <View style={styles.worldBannerHeader}>
          <View style={styles.worldTitleRow}>
            <Globe color="#E6C280" size={16} />
            <Text style={styles.worldMainTitle}>O UNIVERSO DE HONRA & EGOÍSMO</Text>
          </View>
          <Text style={styles.worldMainSub}>
            Wiki oficial do cenário e suplementos de mecânica
          </Text>
        </View>

        <View style={[styles.worldCardsGrid, isWide ? styles.worldCardsGridRow : styles.worldCardsGridCol]}>
          {/* Card Wiki Oficial */}
          <TouchableOpacity
            style={[styles.worldCardCompact, styles.wikiCardBorder, isWide && styles.worldCardCompactWide, isMobile && { paddingHorizontal: 10, paddingVertical: 10 }]}
            activeOpacity={0.75}
            onPress={() => Linking.openURL('https://hg.a11y.host')}
          >
            <View style={[styles.worldIconBoxCompact, { backgroundColor: 'rgba(78, 156, 142, 0.12)', borderColor: 'rgba(78, 156, 142, 0.3)' }]}>
              <BookOpen color="#4E9C8E" size={18} />
            </View>

            <View style={styles.worldCardContent}>
              <View style={styles.worldCardTitleRow}>
                <Text style={styles.worldCardTitle}>Compêndio & Lore</Text>
                <View style={styles.badgePillWiki}>
                  <Sparkles color="#4E9C8E" size={10} />
                  <Text style={styles.badgePillWikiText}>WIKI</Text>
                </View>
              </View>
              <Text style={styles.worldCardDesc} numberOfLines={1}>
                Reinos, divindades, facções e regras de magia
              </Text>
            </View>

            <View style={[styles.worldCardActionIcon, { borderColor: 'rgba(78, 156, 142, 0.3)' }]}>
              <ExternalLink color="#4E9C8E" size={14} />
            </View>
          </TouchableOpacity>

          {/* Card Drive de Arquivos */}
          <TouchableOpacity
            style={[styles.worldCardCompact, styles.driveCardBorder, isWide && styles.worldCardCompactWide, isMobile && { paddingHorizontal: 10, paddingVertical: 10 }]}
            activeOpacity={0.75}
            onPress={() => Linking.openURL(driveUrl)}
          >
            <View style={[styles.worldIconBoxCompact, { backgroundColor: 'rgba(197, 160, 89, 0.12)', borderColor: 'rgba(197, 160, 89, 0.3)' }]}>
              <Folder color="#E6C280" size={18} />
            </View>

            <View style={styles.worldCardContent}>
              <View style={styles.worldCardTitleRow}>
                <Text style={styles.worldCardTitle}>Arquivos & Suplementos</Text>
                <View style={styles.badgePillDrive}>
                  <Text style={styles.badgePillDriveText}>DRIVE</Text>
                </View>
              </View>
              <Text style={styles.worldCardDesc} numberOfLines={1}>
                Livros de regras, fichas em branco e homebrews
              </Text>
            </View>

            <View style={[styles.worldCardActionIcon, { borderColor: 'rgba(197, 160, 89, 0.3)' }]}>
              <ExternalLink color="#E6C280" size={14} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 5. PRÓXIMA SESSÃO: CONVOCAÇÃO & CONFIRMAÇÃO DE PRESENÇA      */}
      {/* ============================================================ */}
      <View style={styles.sectionContainer}>
        <View style={[styles.scheduleBox, isMobile && { padding: 14, gap: 16 }]}>
          {/* Cabeçalho do Agendamento */}
          <View style={[styles.scheduleHeaderRow, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 14 }]}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, isWide ? { flex: 1 } : { width: '100%' }]}>
              <View style={styles.scheduleIconBox}>
                <Calendar color="#C5A059" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.scheduleCategoryTag}>CONVOCAÇÃO DA COMITIVA</Text>
                  {scheduleData.session?.scheduledAt ? (
                    <View style={styles.scheduleStatusPillActive}>
                      <Text style={styles.scheduleStatusPillTextActive}>• AGENDADA</Text>
                    </View>
                  ) : (
                    <View style={styles.scheduleStatusPillPending}>
                      <Text style={styles.scheduleStatusPillTextPending}>• DATA A DEFINIR</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.scheduleMainTitle}>
                  {scheduleData.session?.title || 'Próxima Sessão de Campanha'}
                </Text>
              </View>
            </View>

            {/* Ações do Cabeçalho */}
            <View style={[styles.scheduleHeaderActions, isMobile && { width: '100%', flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
              {/* Botão de Disponibilidade da Comitiva - Acessível para todos os jogadores */}
              <TouchableOpacity
                style={[styles.availabilityTriggerBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                activeOpacity={0.8}
                onPress={() => setIsAvailabilityModalOpen(true)}
              >
                <Calendar color="#E6C280" size={15} />
                <Text style={styles.availabilityTriggerBtnText}>Disponibilidade da Comitiva</Text>
              </TouchableOpacity>

              {/* Botão de Agendamento para Mestre / Mecânico */}
              {(user?.role === 'DM' || user?.role === 'MECHANIC') && (
                <TouchableOpacity
                  style={[styles.scheduleEditBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                  activeOpacity={0.8}
                  onPress={handleOpenScheduleModal}
                >
                  <Edit3 color="#110F0D" size={14} />
                  <Text style={styles.scheduleEditBtnText}>
                    {scheduleData.session?.scheduledAt ? 'Alterar Data / Pauta' : 'Definir Data'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Grid Principal: Relógio & Quórum */}
          <View style={[styles.scheduleGrid, isWide ? styles.scheduleGridRow : styles.scheduleGridCol]}>
            {/* COLUNA ESQUERDA: RELÓGIO RÚNICO & INFORMAÇÕES */}
            <View style={[styles.scheduleLeftCol, isWide ? styles.scheduleLeftColWide : styles.scheduleColMobile]}>
              {scheduleData.session?.scheduledAt ? (
                <>
                  {/* Cronômetro Rúnico */}
                  <CountdownTimer targetIso={scheduleData.session?.scheduledAt} />

                  {/* Informações de Local e Data */}
                  <View style={styles.sessionMetaList}>
                    <View style={styles.sessionMetaItem}>
                      <Calendar color="#C5A059" size={16} />
                      <Text style={styles.sessionMetaText}>
                        {new Date(scheduleData.session.scheduledAt).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        })} às {new Date(scheduleData.session.scheduledAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View style={styles.sessionMetaItem}>
                      <MapPin color="#4E9C8E" size={16} />
                      <Text style={styles.sessionMetaText}>
                        {scheduleData.session.location || 'Discord - Taverna Principal'}
                      </Text>
                    </View>
                  </View>

                  {/* Pauta / Resumo da Sessão */}
                  {scheduleData.session.description ? (
                    <View style={styles.sessionDescBox}>
                      <Text style={styles.sessionDescTitle}>Pauta & Preparativos:</Text>
                      <Text style={styles.sessionDescText}>{scheduleData.session.description}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                /* Estado sem sessão agendada */
                <View style={[styles.noScheduleBox, isMobile && { padding: 16 }]}>
                  <View style={styles.noScheduleIconBox}>
                    <Hourglass color="#C5A059" size={32} />
                  </View>
                  <Text style={styles.noScheduleTitle}>Aguardando Convocação</Text>
                  <Text style={styles.noScheduleDesc}>
                    O Mestre ainda não definiu a data do próximo encontro. Mantenha suas armas afiadas e confira os avisos da taverna!
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, width: '100%' }}>
                    <TouchableOpacity
                      style={[styles.availabilityTriggerBtnHighlight, isMobile && { width: '100%', justifyContent: 'center' }]}
                      activeOpacity={0.85}
                      onPress={() => setIsAvailabilityModalOpen(true)}
                    >
                      <Calendar color="#110F0D" size={16} />
                      <Text style={styles.availabilityTriggerBtnHighlightText}>Ver / Marcar Dias Livres</Text>
                    </TouchableOpacity>

                    {(user?.role === 'DM' || user?.role === 'MECHANIC') && (
                      <TouchableOpacity
                        style={[styles.primaryActionButton, isMobile && { width: '100%', justifyContent: 'center' }]}
                        activeOpacity={0.85}
                        onPress={handleOpenScheduleModal}
                      >
                        <Calendar color="#110F0D" size={16} />
                        <Text style={styles.primaryActionButtonText}>Agendar Próxima Sessão</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* COLUNA DIREITA: QUÓRUM DA COMITIVA & MEU RSVP */}
            <View style={[styles.scheduleRightCol, isWide ? styles.scheduleRightColWide : styles.scheduleColMobile]}>
              {/* Card de Ação do Jogador Logado */}
              <View style={[styles.rsvpActionCard, isMobile && { padding: 12, gap: 10 }]}>
                <View style={styles.rsvpCardHeader}>
                  <Users color="#C5A059" size={18} />
                  <Text style={styles.rsvpCardTitle}>SUA CONFIRMAÇÃO DE PRESENÇA</Text>
                </View>

                {user ? (
                  <>
                    <View style={styles.myRsvpStatusBox}>
                      {myRsvpStatus === 'CONFIRMED' ? (
                        <View style={[styles.myStatusPill, { backgroundColor: 'rgba(78, 156, 142, 0.15)', borderColor: '#4E9C8E' }]}>
                          <CheckCircle2 color="#4E9C8E" size={16} />
                          <Text style={[styles.myStatusPillText, { color: '#4E9C8E' }]}>Sua presença está confirmada!</Text>
                        </View>
                      ) : myRsvpStatus === 'MAYBE' ? (
                        <View style={[styles.myStatusPill, { backgroundColor: 'rgba(230, 194, 128, 0.15)', borderColor: '#E6C280' }]}>
                          <AlertCircle color="#E6C280" size={16} />
                          <Text style={[styles.myStatusPillText, { color: '#E6C280' }]}>Você marcou presença com dúvida / atraso.</Text>
                        </View>
                      ) : myRsvpStatus === 'DECLINED' ? (
                        <View style={[styles.myStatusPill, { backgroundColor: 'rgba(201, 91, 91, 0.15)', borderColor: '#C95B5B' }]}>
                          <XCircle color="#C95B5B" size={16} />
                          <Text style={[styles.myStatusPillText, { color: '#C95B5B' }]}>Você declarou ausência nesta partida.</Text>
                        </View>
                      ) : (
                        <View style={[styles.myStatusPill, { backgroundColor: 'rgba(128, 119, 108, 0.15)', borderColor: '#80776C' }]}>
                          <Clock color="#80776C" size={16} />
                          <Text style={[styles.myStatusPillText, { color: '#BAAFA0' }]}>Você ainda não respondeu ao chamado.</Text>
                        </View>
                      )}
                    </View>

                    {/* Botões de 1 clique para RSVP */}
                    {scheduleData.session ? (
                      <View style={[styles.rsvpBtnRow, isMobile && { gap: 6 }]}>
                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnConfirm,
                            isMobile && { paddingHorizontal: 4, gap: 4 },
                            myRsvpStatus === 'CONFIRMED' && styles.rsvpBtnActiveConfirm,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('CONFIRMED')}
                        >
                          <CheckCircle2 color={myRsvpStatus === 'CONFIRMED' ? '#4E9C8E' : '#AEC6CF'} size={14} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              isMobile && { fontSize: 10.5 },
                              myRsvpStatus === 'CONFIRMED' && { color: '#4E9C8E', fontWeight: 'bold' },
                            ]}
                            numberOfLines={1}
                          >
                            Confirmar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnMaybe,
                            isMobile && { paddingHorizontal: 4, gap: 4 },
                            myRsvpStatus === 'MAYBE' && styles.rsvpBtnActiveMaybe,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('MAYBE')}
                        >
                          <AlertCircle color={myRsvpStatus === 'MAYBE' ? '#E6C280' : '#AEC6CF'} size={14} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              isMobile && { fontSize: 10.5 },
                              myRsvpStatus === 'MAYBE' && { color: '#E6C280', fontWeight: 'bold' },
                            ]}
                            numberOfLines={1}
                          >
                            Em Dúvida
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnDecline,
                            isMobile && { paddingHorizontal: 4, gap: 4 },
                            myRsvpStatus === 'DECLINED' && styles.rsvpBtnActiveDecline,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('DECLINED')}
                        >
                          <XCircle color={myRsvpStatus === 'DECLINED' ? '#C95B5B' : '#AEC6CF'} size={14} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              isMobile && { fontSize: 10.5 },
                              myRsvpStatus === 'DECLINED' && { color: '#C95B5B', fontWeight: 'bold' },
                            ]}
                            numberOfLines={1}
                          >
                            Ausente
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.rsvpWaitNotice}>
                        Aguarde a definição da data pelo Mestre para confirmar sua presença.
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={styles.rsvpGuestNotice}>
                    <Text style={styles.rsvpGuestText}>
                      Identifique-se na taverna pelo botão de LOGIN no topo da tela para confirmar sua presença na próxima sessão.
                    </Text>
                  </View>
                )}
              </View>

              {/* Estatísticas de Quórum da Mesa */}
              <View style={[styles.quorumCard, isMobile && { padding: 12, gap: 10 }]}>
                <View style={styles.quorumCardHeaderRow}>
                  <Text style={styles.quorumHeaderTitle}>QUÓRUM DA COMITIVA</Text>
                  <View style={[styles.quorumBadgeCapsule, { backgroundColor: isQuorumReached ? 'rgba(78, 156, 142, 0.15)' : 'rgba(197, 160, 89, 0.15)', borderColor: isQuorumReached ? '#4E9C8E' : '#C5A059' }]}>
                    <Text style={[styles.quorumBadgeCapsuleText, { color: isQuorumReached ? '#4E9C8E' : '#C5A059' }]}>
                      {isQuorumReached ? '⚔️ QUÓRUM ATINGIDO' : '⏳ AGUARDANDO COMITIVA'}
                    </Text>
                  </View>
                </View>

                {/* Barra de Progresso Visual de Quórum */}
                <View style={styles.quorumSectionProgress}>
                  <View style={styles.quorumSectionProgressHeader}>
                    <Text style={styles.quorumProgressLabel}>Confirmações dos Jogadores</Text>
                    <Text style={[styles.quorumProgressValue, { color: isQuorumReached ? '#4E9C8E' : '#C5A059' }]}>
                      {confirmedList.length} de {totalRegisteredParty} ({quorumPercent}%)
                    </Text>
                  </View>
                  <View style={styles.quorumProgressBarTrack}>
                    <View
                      style={[
                        styles.quorumProgressBarFill,
                        {
                          width: `${quorumPercent}%`,
                          backgroundColor: isQuorumReached ? '#4E9C8E' : '#C5A059',
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={[styles.quorumStatsRow, isMobile && { gap: 6 }]}>
                  <View style={[styles.quorumStatBadge, { borderColor: '#4E9C8E' }, isMobile && { paddingVertical: 8, paddingHorizontal: 4 }]}>
                    <Text style={[styles.quorumStatNum, { color: '#4E9C8E' }, isMobile && { fontSize: 18 }]}>
                      {confirmedList.length}
                    </Text>
                    <Text style={[styles.quorumStatLbl, isMobile && { fontSize: 8.5 }]}>CONFIRMADOS</Text>
                  </View>

                  <View style={[styles.quorumStatBadge, { borderColor: '#E6C280' }, isMobile && { paddingVertical: 8, paddingHorizontal: 4 }]}>
                    <Text style={[styles.quorumStatNum, { color: '#E6C280' }, isMobile && { fontSize: 18 }]}>
                      {maybeList.length}
                    </Text>
                    <Text style={[styles.quorumStatLbl, isMobile && { fontSize: 8.5 }]}>EM DÚVIDA</Text>
                  </View>

                  <View style={[styles.quorumStatBadge, { borderColor: '#C95B5B' }, isMobile && { paddingVertical: 8, paddingHorizontal: 4 }]}>
                    <Text style={[styles.quorumStatNum, { color: '#C95B5B' }, isMobile && { fontSize: 18 }]}>
                      {declinedList.length}
                    </Text>
                    <Text style={[styles.quorumStatLbl, isMobile && { fontSize: 8.5 }]}>AUSENTES</Text>
                  </View>
                </View>

                {/* Lista de Aventureiros que já confirmaram */}
                {confirmedList.length > 0 && (
                  <View style={[styles.confirmedMembersBox, { width: '100%' }]}>
                    <Text style={styles.confirmedMembersTitle}>⚔️ Aventureiros Confirmados:</Text>
                    <View style={[styles.membersChipsRow, { width: '100%' }]}>
                      {confirmedList.map((r) => (
                        <View key={r.id} style={styles.memberChip}>
                          <CheckCircle2 color="#4E9C8E" size={12} />
                          <Text style={styles.memberChipText}>{r.user?.name || 'Aventureiro'}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {maybeList.length > 0 && (
                  <View style={[styles.confirmedMembersBox, { marginTop: 8, width: '100%' }]}>
                    <Text style={[styles.confirmedMembersTitle, { color: '#E6C280' }]}>⏳ Em Dúvida / Com Atraso:</Text>
                    <View style={[styles.membersChipsRow, { width: '100%' }]}>
                      {maybeList.map((r) => (
                        <View key={r.id} style={[styles.memberChip, { borderColor: '#E6C280' }]}>
                          <AlertCircle color="#E6C280" size={12} />
                          <Text style={styles.memberChipText}>{r.user?.name || 'Aventureiro'}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* MODAL: AGENDAMENTO DA SESSÃO (MESTRE & MECÂNICO)             */}
      {/* ============================================================ */}
      <Modal
        visible={isScheduleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsScheduleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isMobile && { width: '92%', padding: 20 }]}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Calendar color="#C5A059" size={22} />
                <Text style={styles.modalTitle}>Convocação da Próxima Sessão</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsScheduleModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X color="#AEC6CF" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {/* Título da Sessão */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Título ou Tema do Encontro</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Sessão 3: As Catacumbas Negras"
                  placeholderTextColor="#666"
                  value={scheduleForm.title}
                  onChangeText={(val) => setScheduleForm((p) => ({ ...p, title: val }))}
                />
              </View>

              {/* Data e Hora */}
              <View style={[styles.formRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Data da Sessão (AAAA-MM-DD)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="2026-10-14"
                    placeholderTextColor="#666"
                    value={scheduleForm.dateStr}
                    onChangeText={(val) => setScheduleForm((p) => ({ ...p, dateStr: val }))}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Horário de Início (HH:mm)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="19:30"
                    placeholderTextColor="#666"
                    value={scheduleForm.timeStr}
                    onChangeText={(val) => setScheduleForm((p) => ({ ...p, timeStr: val }))}
                  />
                </View>
              </View>

              {/* Local / Canal */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Local ou Canal de Voz</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Discord - Canal Honra & Egoísmo"
                  placeholderTextColor="#666"
                  value={scheduleForm.location}
                  onChangeText={(val) => setScheduleForm((p) => ({ ...p, location: val }))}
                />
              </View>

              {/* Pauta e Observações */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pauta / Ganchos para os Jogadores</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Ex: Tragam recursos contados. A descida na masmorra começará imediatamente após a rolagem de iniciativa."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  value={scheduleForm.description}
                  onChangeText={(val) => setScheduleForm((p) => ({ ...p, description: val }))}
                />
              </View>

              {/* Opção de Resetar Confirmações */}
              <View style={styles.switchRow}>
                <Switch
                  value={scheduleForm.resetRsvps}
                  onValueChange={(val) => setScheduleForm((p) => ({ ...p, resetRsvps: val }))}
                  trackColor={{ false: '#3D342C', true: '#4E9C8E' }}
                  thumbColor={scheduleForm.resetRsvps ? '#C5A059' : '#80776C'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Reiniciar lista de presenças dos jogadores?</Text>
                  <Text style={styles.switchSub}>Marque se você mudou a data e precisa que todos reconfirmem.</Text>
                </View>
              </View>
            </ScrollView>

            {/* Ações do Modal */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsScheduleModalOpen(false)}
                disabled={isSavingSchedule}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveSchedule}
                disabled={isSavingSchedule}
              >
                {isSavingSchedule ? (
                  <ActivityIndicator color="#110F0D" size="small" />
                ) : (
                  <>
                    <Calendar color="#110F0D" size={16} />
                    <Text style={styles.modalSubmitBtnText}>Salvar Convocação</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: CALENDÁRIO DE DISPONIBILIDADE DA COMITIVA             */}
      {/* ============================================================ */}
      <AvailabilityModal
        visible={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSelectDateForSession={handleScheduleFromAvailability}
      />

      {/* ============================================================ */}
      {/* 6. FOOTER IMERSIVO & STATUS DE SINCRONIZAÇÃO                */}
      {/* ============================================================ */}
      <View style={styles.footer}>
        <View style={styles.syncPulseContainer}>
          <View style={styles.syncPulseDot} />
          <Text style={styles.syncPulseText}>Mesa Sincronizada em Tempo Real (PostgreSQL Neon)</Text>
        </View>
        <Text style={styles.footerNote}>
          Honra & Egoísmo • Sistema D&D 5e • Forjado em React Native (Expo) & Neon PostgreSQL
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  container: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 60,
    gap: 32,
  },
  containerMobile: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    textAlign: 'center' as any,
    marginBottom: 4,
    position: 'relative',
  },
  heroGlowEffect: {
    position: 'absolute',
    top: -40,
    width: '100%',
    maxWidth: 600,
    height: 160,
    borderRadius: 300,
    backgroundColor: 'rgba(197, 160, 89, 0.05)',
    zIndex: -1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  badgeText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  heroHeroCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161411',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  heroHeroCapsuleText: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#E2D8C3',
    fontSize: Platform.OS === 'web' ? 34 : 24,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 680,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  // ============================================================
  // ESTILOS DA BARRA RÁPIDA DE SESSÃO (MODO DIA DE SESSÃO)
  // ============================================================
  quickSessionBar: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 10,
    padding: 14,
    marginTop: -8,
    marginBottom: 4,
  },
  quickSessionBarToday: {
    borderColor: '#C5A059',
    backgroundColor: '#1E1914',
  },
  quickSessionMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  quickSessionMainCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  quickSessionInfoCol: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  quickSessionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillToday: {
    backgroundColor: '#C5A059',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillTodayText: {
    color: '#110F0D',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  pillTomorrow: {
    backgroundColor: 'rgba(230, 194, 128, 0.15)',
    borderColor: '#E6C280',
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillTomorrowText: {
    color: '#E6C280',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  pillScheduled: {
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderColor: 'rgba(197, 160, 89, 0.35)',
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillScheduledText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  quickSessionTitle: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  quickSessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  quickSessionDateTime: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '500',
  },
  quickSessionLocation: {
    color: '#80776C',
    fontSize: 11,
  },
  quickSessionQuorumCol: {
    minWidth: 200,
    gap: 5,
    justifyContent: 'center',
  },
  quorumHeaderMini: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  quorumPercentLabel: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '600',
  },
  quorumStatusMini: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  quorumProgressBarTrack: {
    height: 6,
    backgroundColor: '#110F0D',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  quorumProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickSessionActionCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickRsvpConfirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderColor: '#4E9C8E',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  quickRsvpConfirmedText: {
    color: '#4E9C8E',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickRsvpButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickRsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  quickRsvpBtnConfirm: {
    backgroundColor: '#4E9C8E',
    borderColor: '#4E9C8E',
  },
  quickRsvpBtnConfirmText: {
    color: '#110F0D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickRsvpBtnMaybe: {
    backgroundColor: 'rgba(230, 194, 128, 0.12)',
    borderColor: '#E6C280',
  },
  quickRsvpBtnMaybeText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickSessionGuestText: {
    color: '#80776C',
    fontSize: 11,
    fontStyle: 'italic',
  },
  hubGrid: {
    gap: 20,
    width: '100%',
  },
  hubGridRow: {
    flexDirection: 'row',
  },
  hubGridCol: {
    flexDirection: 'column',
    gap: 20,
  },
  hubColumn: {
    width: '100%',
  },
  hubColumnWide: {
    flex: 1,
    minWidth: 280,
    maxWidth: '100%',
  },
  hubCard: {
    backgroundColor: '#1A1714',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  hubCardWide: {
    flex: 1,
  },
  hubCardMobile: {
    padding: 14,
    gap: 14,
  },
  heroCardBorder: {
    borderColor: '#C5A059',
  },
  dmCardBorder: {
    borderColor: '#C5A059',
  },
  mechanicCardBorder: {
    borderColor: '#4E9C8E',
  },
  tasksCardBorder: {
    borderColor: '#3D342C',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIconBoxHero: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxDm: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxMechanic: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderWidth: 1,
    borderColor: '#4E9C8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxTasks: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#26221E',
    borderWidth: 1,
    borderColor: '#3D342C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCategoryTag: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardCategoryTagDm: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardMainTitle: {
    color: '#E2D8C3',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  heroSubMeta: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 2,
  },
  cardParagraph: {
    color: '#BAAFA0',
    fontSize: 14,
    lineHeight: 22,
  },
  hpSection: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  hpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hpLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hpValueText: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: 'bold',
  },
  hpBarTrack: {
    height: 8,
    backgroundColor: '#26221E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroPreviewStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatMiniBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  heroStatValue: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dmPartyOverviewBox: {
    flexDirection: 'row',
    gap: 10,
  },
  dmStatItem: {
    flex: 1,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmStatNum: {
    color: '#E6C280',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dmStatLbl: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  actionRowGrid: {
    gap: 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryActionButtonText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  secondaryActionButtonText: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '600',
  },
  tasksCountBadge: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: '600',
  },
  taskFilterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 4,
  },
  taskFilterTab: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  taskFilterTabActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  taskFilterTabText: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
  },
  taskFilterTabTextActive: {
    color: '#C5A059',
    fontWeight: 'bold',
  },
  tasksPreviewList: {
    gap: 8,
  },
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 8,
    padding: 10,
    gap: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  taskStatusMiniText: {
    color: '#80776C',
    fontSize: 11,
  },
  taskPreviewTitle: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '600',
  },
  taskArrowText: {
    color: '#C5A059',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTaskNotice: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTaskNoticeText: {
    color: '#80776C',
    fontSize: 13,
    fontStyle: 'italic',
  },
  sectionContainer: {
    width: '100%',
  },
  chronicleCard: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  chronicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  chronicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chronicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chronicleTag: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  chronicleTitle: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  chronicleDate: {
    color: '#80776C',
    fontSize: 12,
  },
  chronicleActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#110F0D',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  chronicleActionBtnText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chronicleSnippetBox: {
    backgroundColor: '#110F0D',
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
    borderRadius: 6,
    padding: 14,
    gap: 6,
  },
  chronicleSnippetAuthor: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  chronicleSnippetContent: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  chronicleEmptyText: {
    color: '#80776C',
    fontSize: 13,
    fontStyle: 'italic',
  },
  worldBannerHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  worldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  worldMainTitle: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  worldMainSub: {
    color: '#80776C',
    fontSize: 11,
  },
  worldCardsGrid: {
    gap: 10,
  },
  worldCardsGridRow: {
    flexDirection: 'row',
  },
  worldCardsGridCol: {
    flexDirection: 'column',
  },
  worldCardCompact: {
    width: '100%',
    backgroundColor: '#171411',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  worldCardCompactWide: {
    flex: 1,
  },
  wikiCardBorder: {
    borderColor: 'rgba(78, 156, 142, 0.3)',
    borderLeftWidth: 3,
    borderLeftColor: '#4E9C8E',
  },
  driveCardBorder: {
    borderColor: 'rgba(197, 160, 89, 0.3)',
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
  },
  worldIconBoxCompact: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  worldCardContent: {
    flex: 1,
    gap: 3,
  },
  worldCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  worldCardTitle: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  worldCardDesc: {
    color: '#80776C',
    fontSize: 11,
    lineHeight: 15,
  },
  badgePillWiki: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(78, 156, 142, 0.4)',
  },
  badgePillWikiText: {
    color: '#4E9C8E',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  badgePillDrive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
  },
  badgePillDriveText: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  worldCardActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ============================================================
  // ESTILOS DA PRÓXIMA SESSÃO, QUÓRUM & RSVP
  // ============================================================
  scheduleBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 12,
    padding: 24,
    gap: 20,
    width: '100%',
    overflow: 'hidden',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
  },
  scheduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCategoryTag: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  scheduleStatusPillActive: {
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4E9C8E',
  },
  scheduleStatusPillTextActive: {
    color: '#4E9C8E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduleStatusPillPending: {
    backgroundColor: 'rgba(230, 194, 128, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E6C280',
  },
  scheduleStatusPillTextPending: {
    color: '#E6C280',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduleMainTitle: {
    color: '#F0E6D2',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  scheduleHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  availabilityTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  availabilityTriggerBtnText: {
    color: '#E6C280',
    fontSize: 12,
    fontWeight: 'bold',
  },
  availabilityTriggerBtnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  availabilityTriggerBtnHighlightText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scheduleEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  scheduleEditBtnText: {
    color: '#110F0D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleGrid: {
    gap: 24,
  },
  scheduleGridRow: {
    flexDirection: 'row',
  },
  scheduleGridCol: {
    flexDirection: 'column',
  },
  scheduleLeftCol: {
    gap: 16,
  },
  scheduleLeftColWide: {
    flex: 1.2,
  },
  scheduleRightCol: {
    gap: 16,
  },
  scheduleRightColWide: {
    flex: 1,
  },
  scheduleColMobile: {
    width: '100%',
  },
  timerContainer: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  timerLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  timerDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBox: {
    alignItems: 'center',
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 62,
  },
  timerNumber: {
    color: '#E6C280',
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  timerUnit: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  timerColon: {
    color: '#C5A059',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sessionOngoingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(78, 156, 142, 0.12)',
    borderWidth: 1,
    borderColor: '#4E9C8E',
    borderRadius: 8,
    padding: 12,
  },
  sessionOngoingText: {
    color: '#4E9C8E',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sessionMetaList: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionMetaText: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '500',
  },
  sessionDescBox: {
    backgroundColor: '#110F0D',
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
    borderRadius: 6,
    padding: 12,
    gap: 4,
  },
  sessionDescTitle: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sessionDescText: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  noScheduleBox: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center' as any,
    gap: 12,
  },
  noScheduleIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noScheduleTitle: {
    color: '#E6C280',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  noScheduleDesc: {
    color: '#80776C',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 400,
  },
  rsvpActionCard: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  rsvpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rsvpCardTitle: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  myRsvpStatusBox: {
    marginVertical: 2,
  },
  myStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  myStatusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  rsvpBtnConfirm: {
    backgroundColor: 'rgba(78, 156, 142, 0.1)',
    borderColor: 'rgba(78, 156, 142, 0.4)',
  },
  rsvpBtnActiveConfirm: {
    backgroundColor: 'rgba(78, 156, 142, 0.25)',
    borderColor: '#4E9C8E',
  },
  rsvpBtnMaybe: {
    backgroundColor: 'rgba(230, 194, 128, 0.1)',
    borderColor: 'rgba(230, 194, 128, 0.4)',
  },
  rsvpBtnActiveMaybe: {
    backgroundColor: 'rgba(230, 194, 128, 0.25)',
    borderColor: '#E6C280',
  },
  rsvpBtnDecline: {
    backgroundColor: 'rgba(201, 91, 91, 0.1)',
    borderColor: 'rgba(201, 91, 91, 0.4)',
  },
  rsvpBtnActiveDecline: {
    backgroundColor: 'rgba(201, 91, 91, 0.25)',
    borderColor: '#C95B5B',
  },
  rsvpBtnText: {
    color: '#AEC6CF',
    fontSize: 11,
    fontWeight: '500',
  },
  rsvpWaitNotice: {
    color: '#80776C',
    fontSize: 12,
    fontStyle: 'italic',
  },
  rsvpGuestNotice: {
    padding: 10,
    backgroundColor: '#1A1714',
    borderRadius: 6,
  },
  rsvpGuestText: {
    color: '#80776C',
    fontSize: 12,
    lineHeight: 18,
  },
  quorumCard: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  quorumCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  quorumHeaderTitle: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  quorumBadgeCapsule: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  quorumBadgeCapsuleText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  quorumSectionProgress: {
    marginBottom: 6,
    gap: 4,
  },
  quorumSectionProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quorumProgressLabel: {
    color: '#80776C',
    fontSize: 11,
  },
  quorumProgressValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quorumStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quorumStatBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  quorumStatNum: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quorumStatLbl: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  confirmedMembersBox: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#26221E',
    paddingTop: 10,
  },
  confirmedMembersTitle: {
    color: '#4E9C8E',
    fontSize: 11,
    fontWeight: 'bold',
  },
  membersChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#4E9C8E',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  memberChipText: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: '600',
  },
  // ============================================================
  // MODAL DE AGENDAMENTO
  // ============================================================
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: 520,
    maxWidth: '100%',
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#F0E6D2',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  modalCloseBtn: {
    padding: 4,
  },
  formGroup: {
    gap: 6,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formLabel: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#E2D8C3',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#26221E',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  switchLabel: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  switchSub: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#26221E',
    paddingTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  modalCancelBtnText: {
    color: '#80776C',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  modalSubmitBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#26221E',
    gap: 4,
  },
  syncPulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  syncPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4E9C8E',
  },
  syncPulseText: {
    color: '#80776C',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  footerNote: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
  },
});
