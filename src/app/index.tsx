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
    <View style={styles.timerContainer}>
      <Text style={styles.timerLabel}>CONTAGEM REGRESSIVA PARA O CHAMADO</Text>
      {timeRemaining?.isPassed ? (
        <View style={styles.sessionOngoingNotice}>
          <Sparkles color="#4E9C8E" size={20} />
          <Text style={styles.sessionOngoingText}>
            O momento chegou! A sessão está em andamento ou pronta para iniciar.
          </Text>
        </View>
      ) : (
        <View style={styles.timerDigitsRow}>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(timeRemaining?.days || 0).padStart(2, '0')}</Text>
            <Text style={styles.timerUnit}>DIAS</Text>
          </View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(timeRemaining?.hours || 0).padStart(2, '0')}</Text>
            <Text style={styles.timerUnit}>HORAS</Text>
          </View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(timeRemaining?.minutes || 0).padStart(2, '0')}</Text>
            <Text style={styles.timerUnit}>MIN</Text>
          </View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBox}>
            <Text style={[styles.timerNumber, { color: '#C5A059' }]}>
              {String(timeRemaining?.seconds || 0).padStart(2, '0')}
            </Text>
            <Text style={styles.timerUnit}>SEG</Text>
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
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    dateStr: '',
    timeStr: '19:30',
    location: '',
    description: '',
    resetRsvps: false,
  });

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

  // Estatísticas para Mestre e Mecânico
  const totalPartyHp = characters.reduce((acc, c) => acc + (c.currentHp || 0), 0);
  const maxPartyHp = characters.reduce((acc, c) => acc + (c.maxHp || 10), 0);
  const woundedCount = characters.filter((c) => (c.currentHp || 0) < (c.maxHp || 10)).length;

  // Missões ativas do Mural (em andamento ou sugeridas)
  const activeTasks = tasks
    .filter((t) => t.status === 'ANDAMENTO' || t.status === 'SUGERIDO')
    .slice(0, 3);

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
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ============================================================ */}
      {/* 1. HERO & BANNER DE BOAS-VINDAS CONTEXTUAL                  */}
      {/* ============================================================ */}
      <View style={styles.hero}>
        <View style={styles.heroGlowEffect} />

        {/* Badge de Identidade de Campanha / Função */}
        <View style={styles.badge}>
          {user?.role === 'DM' ? (
            <>
              <Crown color="#C5A059" size={14} />
              <Text style={styles.badgeText}>MESTRE DA CAMPANHA • ESCUDO ATIVO</Text>
            </>
          ) : user?.role === 'MECHANIC' ? (
            <>
              <Sparkles color="#4E9C8E" size={14} />
              <Text style={[styles.badgeText, { color: '#4E9C8E' }]}>ARTÍFICE MECÂNICO • TODAS AS FICHAS</Text>
            </>
          ) : user ? (
            <>
              <Shield color="#C5A059" size={14} />
              <Text style={styles.badgeText}>AVENTUREIRO DE HONRA & EGOÍSMO</Text>
            </>
          ) : (
            <>
              <Scroll color="#C5A059" size={14} />
              <Text style={styles.badgeText}>D&D 5E • TAVERNA DE HONRA & EGOÍSMO</Text>
            </>
          )}
        </View>

        {/* Título Principal */}
        <Text style={[styles.heroTitle, isMobile && { fontSize: 32, letterSpacing: 1.5 }]}>
          {user ? `BEM-VINDO, ${user.name.toUpperCase()}` : 'HONRA & EGOÍSMO'}
        </Text>

        {/* Subtítulo Narrativo */}
        <Text style={[styles.heroSubtitle, isMobile && { fontSize: 14, lineHeight: 22 }]}>
          {user?.role === 'DM'
            ? 'A taverna repousa sob seu comando. O Escudo do Mestre, rituais divinos e o controle de aventureiros estão à sua inteira disposição.'
            : user?.role === 'MECHANIC'
            ? 'A bancada de artífice está aberta. Inspecione atributos, balanceie espaços de magia e auxilie qualquer companheiro da campanha.'
            : user
            ? 'O fogo da lareira crepita enquanto os bardos cantam glórias passadas. Seu grimório, armas e feitiços estão a postos para o chamado.'
            : 'O portal interativo e moderno para D&D 5e. Esqueça contas manuais: fichas, combates em tempo real e diários de campanha na ponta dos dedos.'}
        </Text>
      </View>

      {/* ============================================================ */}
      {/* 2. HUB CENTRAL: COMANDO DO HERÓI & MURAL DE MISSÕES         */}
      {/* ============================================================ */}
      <View style={[styles.hubGrid, isWide ? styles.hubGridRow : styles.hubGridCol]}>
        {/* CARD ESQUERDO: CENTRO DE COMANDO DO HERÓI / MESA */}
        <View style={styles.hubColumn}>
          {user?.role === 'DM' ? (
            /* Painel do Mestre */
            <View style={[styles.hubCard, styles.dmCardBorder]}>
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
            <View style={[styles.hubCard, styles.mechanicCardBorder]}>
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
            <View style={[styles.hubCard, { borderColor: myCharacter.themeColor || '#C5A059' }]}>
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
            <View style={[styles.hubCard, styles.heroCardBorder]}>
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
            <View style={[styles.hubCard, styles.heroCardBorder]}>
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
        <View style={styles.hubColumn}>
          <View style={[styles.hubCard, styles.tasksCardBorder]}>
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

            {loadingData ? (
              <ActivityIndicator color="#C5A059" style={{ marginVertical: 20 }} />
            ) : activeTasks.length === 0 ? (
              <View style={styles.emptyTaskNotice}>
                <Text style={styles.emptyTaskNoticeText}>O mural está vazio no momento. Nenhuma missão ativa.</Text>
              </View>
            ) : (
              <View style={styles.tasksPreviewList}>
                {activeTasks.map((t) => {
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
        <View style={styles.chronicleCard}>
          <View style={styles.chronicleHeader}>
            <View style={styles.chronicleHeaderLeft}>
              <View style={styles.chronicleIconBox}>
                <BookOpen color="#C5A059" size={22} />
              </View>
              <View>
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
              style={styles.chronicleActionBtn}
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
            <Globe color="#E6C280" size={26} />
            <Text style={styles.worldMainTitle}>O UNIVERSO DE HONRA & EGOÍSMO</Text>
          </View>
          <Text style={styles.worldMainSub}>
            Acesse a cronologia das eras, o panteão divino, os suplementos de mecânicas e os compêndios oficiais.
          </Text>
        </View>

        <View style={[styles.worldCardsGrid, isWide ? styles.worldCardsGridRow : styles.worldCardsGridCol]}>
          {/* Card Wiki Oficial */}
          <TouchableOpacity
            style={[styles.worldCard, styles.wikiCardBorder]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://hg.a11y.host')}
          >
            <View style={styles.worldCardHeader}>
              <View style={[styles.worldIconBox, { backgroundColor: 'rgba(78, 156, 142, 0.15)', borderColor: '#4E9C8E' }]}>
                <BookOpen color="#4E9C8E" size={26} />
              </View>
              <View style={styles.badgePillWiki}>
                <Sparkles color="#4E9C8E" size={12} />
                <Text style={styles.badgePillWikiText}>WIKI OFICIAL & LORE</Text>
              </View>
            </View>

            <Text style={styles.worldCardTitle}>Compêndio & Lore do Mundo</Text>
            <Text style={styles.worldCardDesc}>
              Portal interativo com a história dos reinos, divindades, facções, bestiário e regras de magia exclusivas do cenário de Honra & Egoísmo.
            </Text>

            <View style={[styles.worldBtn, { backgroundColor: '#4E9C8E' }]}>
              <Text style={styles.worldBtnText}>Acessar Portal da Wiki 🌐</Text>
              <ExternalLink color="#110F0D" size={16} />
            </View>
          </TouchableOpacity>

          {/* Card Drive de Arquivos */}
          <View style={[styles.worldCard, styles.driveCardBorder]}>
            <View style={styles.worldCardHeader}>
              <View style={[styles.worldIconBox, { backgroundColor: 'rgba(197, 160, 89, 0.15)', borderColor: '#C5A059' }]}>
                <Folder color="#E6C280" size={26} />
              </View>
              <View style={styles.badgePillDrive}>
                <Text style={styles.badgePillDriveText}>SUPLEMENTOS & REGRAS</Text>
              </View>
            </View>

            <Text style={styles.worldCardTitle}>Arquivos de Mecânicas (Drive)</Text>
            <Text style={styles.worldCardDesc}>
              Repositório na nuvem com os livros de regras, PDFs de classes homebrew, tabelas de itens mágicos, fichas em branco e guias da nossa mesa.
            </Text>

            <TouchableOpacity
              style={[styles.worldBtn, { backgroundColor: '#C5A059' }]}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(driveUrl)}
            >
              <Text style={[styles.worldBtnText, { color: '#110F0D' }]}>Abrir Google Drive </Text>
              <ExternalLink color="#110F0D" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 5. PRÓXIMA SESSÃO: CONVOCAÇÃO & CONFIRMAÇÃO DE PRESENÇA      */}
      {/* ============================================================ */}
      <View style={styles.sectionContainer}>
        <View style={styles.scheduleBox}>
          {/* Cabeçalho do Agendamento */}
          <View style={styles.scheduleHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
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

            {/* Botão de Agendamento para Mestre / Mecânico */}
            {(user?.role === 'DM' || user?.role === 'MECHANIC') && (
              <TouchableOpacity
                style={styles.scheduleEditBtn}
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

          {/* Grid Principal: Relógio & Quórum */}
          <View style={[styles.scheduleGrid, isWide ? styles.scheduleGridRow : styles.scheduleGridCol]}>
            {/* COLUNA ESQUERDA: RELÓGIO RÚNICO & INFORMAÇÕES */}
            <View style={styles.scheduleLeftCol}>
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
                <View style={styles.noScheduleBox}>
                  <View style={styles.noScheduleIconBox}>
                    <Hourglass color="#C5A059" size={32} />
                  </View>
                  <Text style={styles.noScheduleTitle}>Aguardando Convocação</Text>
                  <Text style={styles.noScheduleDesc}>
                    O Mestre ainda não definiu a data do próximo encontro. Mantenha suas armas afiadas e confira os avisos da taverna!
                  </Text>
                  {(user?.role === 'DM' || user?.role === 'MECHANIC') && (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      activeOpacity={0.85}
                      onPress={handleOpenScheduleModal}
                    >
                      <Calendar color="#110F0D" size={16} />
                      <Text style={styles.primaryActionButtonText}>Agendar Próxima Sessão Agora</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* COLUNA DIREITA: QUÓRUM DA COMITIVA & MEU RSVP */}
            <View style={styles.scheduleRightCol}>
              {/* Card de Ação do Jogador Logado */}
              <View style={styles.rsvpActionCard}>
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
                      <View style={styles.rsvpBtnRow}>
                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnConfirm,
                            myRsvpStatus === 'CONFIRMED' && styles.rsvpBtnActiveConfirm,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('CONFIRMED')}
                        >
                          <CheckCircle2 color={myRsvpStatus === 'CONFIRMED' ? '#4E9C8E' : '#AEC6CF'} size={15} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              myRsvpStatus === 'CONFIRMED' && { color: '#4E9C8E', fontWeight: 'bold' },
                            ]}
                          >
                            Confirmar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnMaybe,
                            myRsvpStatus === 'MAYBE' && styles.rsvpBtnActiveMaybe,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('MAYBE')}
                        >
                          <AlertCircle color={myRsvpStatus === 'MAYBE' ? '#E6C280' : '#AEC6CF'} size={15} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              myRsvpStatus === 'MAYBE' && { color: '#E6C280', fontWeight: 'bold' },
                            ]}
                          >
                            Em Dúvida
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.rsvpBtn,
                            styles.rsvpBtnDecline,
                            myRsvpStatus === 'DECLINED' && styles.rsvpBtnActiveDecline,
                          ]}
                          activeOpacity={0.8}
                          disabled={isSubmittingRsvp}
                          onPress={() => handleRsvp('DECLINED')}
                        >
                          <XCircle color={myRsvpStatus === 'DECLINED' ? '#C95B5B' : '#AEC6CF'} size={15} />
                          <Text
                            style={[
                              styles.rsvpBtnText,
                              myRsvpStatus === 'DECLINED' && { color: '#C95B5B', fontWeight: 'bold' },
                            ]}
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
              <View style={styles.quorumCard}>
                <Text style={styles.quorumHeaderTitle}>QUÓRUM DA COMITIVA</Text>

                <View style={styles.quorumStatsRow}>
                  <View style={[styles.quorumStatBadge, { borderColor: '#4E9C8E' }]}>
                    <Text style={[styles.quorumStatNum, { color: '#4E9C8E' }]}>
                      {confirmedList.length}
                    </Text>
                    <Text style={styles.quorumStatLbl}>CONFIRMADOS</Text>
                  </View>

                  <View style={[styles.quorumStatBadge, { borderColor: '#E6C280' }]}>
                    <Text style={[styles.quorumStatNum, { color: '#E6C280' }]}>
                      {maybeList.length}
                    </Text>
                    <Text style={styles.quorumStatLbl}>EM DÚVIDA</Text>
                  </View>

                  <View style={[styles.quorumStatBadge, { borderColor: '#C95B5B' }]}>
                    <Text style={[styles.quorumStatNum, { color: '#C95B5B' }]}>
                      {declinedList.length}
                    </Text>
                    <Text style={styles.quorumStatLbl}>AUSENTES</Text>
                  </View>
                </View>

                {/* Lista de Aventureiros que já confirmaram */}
                {confirmedList.length > 0 && (
                  <View style={styles.confirmedMembersBox}>
                    <Text style={styles.confirmedMembersTitle}>⚔️ Aventureiros Confirmados:</Text>
                    <View style={styles.membersChipsRow}>
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
                  <View style={[styles.confirmedMembersBox, { marginTop: 8 }]}>
                    <Text style={[styles.confirmedMembersTitle, { color: '#E6C280' }]}>⏳ Em Dúvida / Com Atraso:</Text>
                    <View style={styles.membersChipsRow}>
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
      {/* 6. FOOTER IMERSIVO                                           */}
      {/* ============================================================ */}
      <View style={styles.footer}>
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
  hero: {
    alignItems: 'center',
    textAlign: 'center' as any,
    marginBottom: 8,
    position: 'relative',
  },
  heroGlowEffect: {
    position: 'absolute',
    top: -40,
    width: '100%',
    maxWidth: 600,
    height: 200,
    borderRadius: 300,
    backgroundColor: 'rgba(197, 160, 89, 0.06)',
    zIndex: -1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  heroTitle: {
    color: '#E2D8C3',
    fontSize: Platform.OS === 'web' ? 46 : 32,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#BAAFA0',
    fontSize: 15,
    lineHeight: 25,
    maxWidth: 760,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
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
  },
  hubColumn: {
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
    flex: 1,
    justifyContent: 'space-between',
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
    marginBottom: 20,
    gap: 6,
  },
  worldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  worldMainTitle: {
    color: '#E6C280',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  worldMainSub: {
    color: '#80776C',
    fontSize: 13,
    lineHeight: 20,
  },
  worldCardsGrid: {
    gap: 20,
  },
  worldCardsGridRow: {
    flexDirection: 'row',
  },
  worldCardsGridCol: {
    flexDirection: 'column',
  },
  worldCard: {
    flex: 1,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    gap: 14,
    justifyContent: 'space-between',
  },
  wikiCardBorder: {
    borderColor: '#4E9C8E',
  },
  driveCardBorder: {
    borderColor: '#C5A059',
  },
  worldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  worldIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillWiki: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4E9C8E',
  },
  badgePillWikiText: {
    color: '#4E9C8E',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  badgePillDrive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  badgePillDriveText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  worldCardTitle: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  worldCardDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 20,
  },
  worldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 6,
  },
  worldBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
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
  scheduleEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
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
    flex: 1.2,
    gap: 16,
  },
  scheduleRightCol: {
    flex: 1,
    gap: 16,
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
  quorumHeaderTitle: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
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
  },
  modalSubmitBtnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#26221E',
  },
  footerNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
