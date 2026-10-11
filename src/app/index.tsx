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
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CreateCharacterBanner } from '@/components/player/wizard/FirstCharacterInvite';
import {
  BookOpen,
  ExternalLink,
  Folder,
  Globe,
  Shield,
  ClipboardList,
  Calendar,
  X,
} from 'lucide-react-native';
import AvailabilityModal from '@/components/portal/AvailabilityModal';
import { CharacterShowcaseSection } from '@/components/portal/showcase';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { useResponsive } from '@/hooks/useResponsive';
import {
  ApiService,
  CampaignSessionData,
  ScheduleResponseData,
  RsvpStatus,
} from '@/services/api';
import { CharacterData, TaskData } from '@/lib/mockData';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { errorText, notify } from '@/utils/confirm';
import { Button } from '@/components/ui/Button';
import { NextSessionCard, describeWhen } from '@/components/portal/NextSessionCard';
import { Colors, FontFamily, Radius, Type } from '@/constants/theme';

const TASK_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LORE: { bg: 'rgba(253, 253, 150, 0.15)', text: '#FDFD96', border: '#C5A059' },
  MECANICA: { bg: 'rgba(174, 198, 207, 0.15)', text: '#AEC6CF', border: '#4E9C8E' },
  ARTE: { bg: 'rgba(255, 183, 178, 0.15)', text: '#FFB7B2', border: '#C95B5B' },
  DEV: { bg: 'rgba(207, 208, 211, 0.15)', text: '#CFD0D3', border: '#80776C' },
  ESPECIAL: { bg: 'rgba(225, 198, 153, 0.15)', text: '#E1C699', border: '#E6C280' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { activeRoom } = useRoom();
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
  const [allCharacters, setAllCharacters] = useState<CharacterData[]>([]);
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
        const [charsData, allCharsData, tasksData, sessionsData, schedData] = await Promise.all([
          ApiService.getCharacters({ roomId: activeRoom?.id }).catch(() => []),
          ApiService.getCharacters().catch(() => []),
          ApiService.getTasks().catch(() => []),
          ApiService.getSessions(activeRoom?.id).catch(() => []),
          ApiService.getScheduledSession(activeRoom?.id).catch(() => ({ session: null })),
        ]);
        if (!isMounted) return;
        setCharacters(charsData);
        setAllCharacters(allCharsData);
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
  }, [activeRoom?.id]);

  // Sincronização em tempo real via SSE
  useRealtimeSync((event) => {
    if (event.type === 'SCHEDULE_UPDATED' || event.type === 'RSVP_UPDATED') {
      ApiService.getScheduledSession(activeRoom?.id).then(setScheduleData).catch(() => {});
    } else if (event.type === 'TASK_CREATED' || event.type === 'TASK_UPDATED' || event.type === 'TASK_DELETED') {
      ApiService.getTasks().then(setTasks).catch(() => {});
    } else if (event.type === 'CHARACTER_UPDATED' && event.data && event.data.id) {
      setCharacters((prev) => prev.map((c) => (c.id === event.data.id ? { ...c, ...event.data } : c)));
      setAllCharacters((prev) => prev.map((c) => (c.id === event.data.id ? { ...c, ...event.data } : c)));
    } else if (event.type === 'CHARACTER_DELETED' && event.id) {
      setCharacters((prev) => prev.filter((c) => c.id !== event.id));
      setAllCharacters((prev) => prev.filter((c) => c.id !== event.id));
    } else if (event.type === 'CHARACTER_CREATED' && event.data && event.data.id) {
      setCharacters((prev) => {
        if (prev.some((c) => c.id === event.data.id)) return prev;
        if (!activeRoom || event.data.roomId === activeRoom.id) return [...prev, event.data];
        return prev;
      });
      setAllCharacters((prev) => {
        if (prev.some((c) => c.id === event.data.id)) return prev;
        return [...prev, event.data];
      });
    } else if (event.type === 'CHARACTER_UPDATED' || event.type === 'CHARACTER_CREATED' || event.type === 'CHARACTER_DELETED' || event.type === 'USER_UPDATED') {
      ApiService.getCharacters({ roomId: activeRoom?.id }).then(setCharacters).catch(() => {});
      ApiService.getCharacters().then(setAllCharacters).catch(() => {});
    } else if (
      event.type === 'JOURNAL_NOTE_CREATED' ||
      event.type === 'JOURNAL_NOTE_UPDATED' ||
      event.type === 'JOURNAL_NOTE_DELETED' ||
      event.type === 'JOURNAL_SESSION_CREATED' ||
      event.type === 'JOURNAL_SESSION_UPDATED' ||
      event.type === 'JOURNAL_SESSION_DELETED'
    ) {
      ApiService.getSessions(activeRoom?.id).then(setSessions).catch(() => {});
    }
  });

  // Ação de confirmar presença (RSVP)
  const handleRsvp = async (status: RsvpStatus) => {
    if (!user) {
      notify('Entre com sua conta para confirmar presença.', 'info');
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
      const updated = await ApiService.getScheduledSession(activeRoom?.id);
      setScheduleData(updated);
      notify(status === 'CONFIRMED' ? 'Presença confirmada.' : status === 'MAYBE' ? 'Marcado como "em dúvida".' : 'Ausência registrada.');
    } catch (err: any) {
      notify(errorText(err, 'Não foi possível registrar sua resposta. Tente de novo.'), 'error');
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
        roomId: activeRoom?.id,
        resetRsvps: scheduleForm.resetRsvps,
      });

      const updated = await ApiService.getScheduledSession(activeRoom?.id);
      setScheduleData(updated);
      setIsScheduleModalOpen(false);
      notify('Sessão agendada. A mesa já pode confirmar presença.');
    } catch (err: any) {
      notify(errorText(err, 'Não foi possível salvar o agendamento.'), 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // RSVP do usuário atual
  const myRsvp = scheduleData.session?.rsvps?.find((r) => r.userId === user?.id);
  const myRsvpStatus = myRsvp ? myRsvp.status : null;

  // Personagem do jogador logado (se houver)
  const myCharacter = user
    ? characters.find((c) => c.username && c.username.toLowerCase() === user.username.toLowerCase())
    : null;

  // Data da próxima sessão
  const scheduledAt = scheduleData.session?.scheduledAt;
  const sessionScheduledDate = useMemo(() => {
    if (!scheduledAt) return null;
    const d = new Date(scheduledAt);
    return isNaN(d.getTime()) ? null : d;
  }, [scheduledAt]);


  // Última sessão do diário
  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const latestNote =
    latestSession && latestSession.notes && latestSession.notes.length > 0
      ? latestSession.notes[latestSession.notes.length - 1]
      : null;

  const [renderedAt] = useState(() => Date.now());
  const canManage = user?.role === 'DM' || user?.role === 'MECHANIC';
  const firstName = (user?.name || '').split(' ')[0];

  // Tarefas que pedem ação de quem está olhando (gestor: revisar; jogador: as suas)
  const tasksForMe = useMemo(() => {
    if (!user) return [];
    const mine = (t: TaskData) => t.assignedToId === user.id || (!t.assignedToId && t.assignedTo === user.name);
    const list = canManage
      ? tasks.filter((t) => t.status === 'SUGERIDO' || t.status === 'FINALIZADO')
      : tasks.filter((t) => (t.status === 'ANDAMENTO' && mine(t)) || (t.status === 'RECUSADO' && t.createdById === user.id));
    return list.slice(0, 4);
  }, [tasks, user, canManage]);
  const openTasks = tasks.filter((t) => t.status === 'PARADO');

  const taskActionLabel = (t: TaskData) =>
    t.status === 'SUGERIDO'
      ? `Sugestão de ${t.createdByName || 'um jogador'}, aguarda sua análise`
      : t.status === 'FINALIZADO'
      ? `Concluída por ${t.assignedTo || 'um jogador'}, aguarda aprovação`
      : t.status === 'RECUSADO'
      ? 'Sua sugestão foi recusada e pode ser ajustada'
      : t.status === 'ANDAMENTO'
      ? 'Com você, em andamento'
      : 'Livre para assumir';

  // Frase do topo: a coisa mais útil a fazer agora
  const headline = (() => {
    const upcoming = sessionScheduledDate && sessionScheduledDate.getTime() > renderedAt;
    if (scheduleData.session && upcoming && !myRsvpStatus) {
      const weekday = sessionScheduledDate!.toLocaleDateString('pt-BR', { weekday: 'long' });
      return `Você ainda não respondeu se vai à sessão de ${weekday}.`;
    }
    if (canManage && tasksForMe.length) {
      return `${tasksForMe.length} ${tasksForMe.length === 1 ? 'tarefa aguarda' : 'tarefas aguardam'} sua revisão.`;
    }
    if (myCharacter && myCharacter.maxHp && myCharacter.currentHp / myCharacter.maxHp <= 0.5) {
      return `${myCharacter.name} está com ${myCharacter.currentHp} de ${myCharacter.maxHp} PV.`;
    }
    if (upcoming) return `Próxima sessão: ${describeWhen(sessionScheduledDate!).relative.toLowerCase()}.`;
    return 'Nenhuma sessão marcada ainda.';
  })();

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
      {/* Topo: saudação curta e a coisa mais útil a fazer agora */}
      <View style={t.header}>
        <Text style={[t.greeting, isMobile && t.greetingMobile]} accessibilityRole="header">
          {user ? `Olá, ${firstName}` : 'Honra & Egoísmo'}
        </Text>
        <Text style={t.headline}>{headline}</Text>
      </View>

      {/* Convite para quem ainda não tem personagem (jogador comum) */}
      {!loadingData &&
        user?.role === 'PLAYER' &&
        !allCharacters.concat(characters).some(
          (c) => c.userId === user.id || (c.username || '').toLowerCase() === (user.username || '').toLowerCase()
        ) && (
          <View style={{ marginBottom: 20 }}>
            <CreateCharacterBanner onStart={() => router.push('/player?new=1' as any)} />
          </View>
        )}

      {/* Próxima sessão: a informação com prazo vem primeiro */}
      <View style={t.section}>
        <NextSessionCard
          session={scheduleData.session}
          totalPlayers={scheduleData.totalUsers || scheduleData.quorum?.totalUsers || characters.length}
          myStatus={myRsvpStatus}
          canManage={canManage}
          submitting={isSubmittingRsvp}
          isMobile={isMobile}
          onRsvp={handleRsvp}
          onOpenAvailability={() => setIsAvailabilityModalOpen(true)}
          onOpenSchedule={handleOpenScheduleModal}
        />
      </View>

      {/* Seu personagem e o que pede você */}
      <View style={[t.section, t.grid, isWide && t.gridRow]}>
        {user?.role === 'MECHANIC' ? (
          <View style={[t.panel, isWide && t.panelWide]}>
            <Text style={t.panelEyebrow}>Fichas da mesa</Text>
            <Text style={t.panelTitle}>Você cuida das regras</Text>
            <Text style={t.panelBody}>
              Como Mecânico, você pode ver e editar as {characters.length} fichas desta mesa.
            </Text>
            <Button label="Abrir fichas" icon={Shield} variant="primary" onPress={() => router.push('/player')} />
          </View>
        ) : myCharacter ? (
          <View style={[t.panel, isWide && t.panelWide, { borderLeftColor: myCharacter.themeColor || Colors.fantasy.gold }, t.panelAccent]}>
            <Text style={t.panelEyebrow}>Seu personagem</Text>
            <Text style={t.charName}>{myCharacter.name}</Text>
            <Text style={t.panelBody}>
              {myCharacter.race} {myCharacter.class.toLowerCase()}
              {myCharacter.archetype ? ` (${myCharacter.archetype})` : ''}, nível {myCharacter.level}
            </Text>

            <View style={t.hpBlock}>
              <View style={t.hpRow}>
                <Text style={t.hpLabel}>Pontos de vida</Text>
                <Text style={t.hpValue}>
                  {myCharacter.currentHp} de {myCharacter.maxHp}
                  {myCharacter.tempHp > 0 ? ` (+${myCharacter.tempHp} temporários)` : ''}
                </Text>
              </View>
              <View style={t.hpTrack}>
                <View
                  style={[
                    t.hpFill,
                    {
                      width: `${Math.min(100, Math.max(0, (myCharacter.currentHp / (myCharacter.maxHp || 1)) * 100))}%`,
                      backgroundColor:
                        myCharacter.currentHp / (myCharacter.maxHp || 1) <= 0.25
                          ? '#B84545'
                          : myCharacter.currentHp / (myCharacter.maxHp || 1) <= 0.5
                          ? Colors.fantasy.gold
                          : '#5E9E68',
                    },
                  ]}
                />
              </View>
            </View>

            {myCharacter.conditions?.length > 0 && (
              <View style={t.conditions}>
                {myCharacter.conditions.map((c) => (
                  <View key={c.id} style={t.condition}>
                    <Text style={t.conditionText}>{c.name}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={t.stats}>
              <Text style={t.stat}>
                <Text style={t.statValue}>{myCharacter.armorClass}</Text> CA
              </Text>
              <Text style={t.stat}>
                <Text style={t.statValue}>{myCharacter.speed || '9m'}</Text> de deslocamento
              </Text>
              <Text style={t.stat}>
                <Text style={t.statValue}>{myCharacter.gold || 0}</Text> PO
              </Text>
            </View>

            <Button label="Abrir ficha" icon={Shield} variant="primary" onPress={() => router.push('/player')} />
          </View>
        ) : null}

        <View style={[t.panel, isWide && t.panelWide]}>
          <View style={t.panelHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={t.panelEyebrow}>Tarefas</Text>
              <Text style={t.panelTitle}>
                {tasksForMe.length ? (canManage ? 'Para você revisar' : 'Com você') : 'Livres para assumir'}
              </Text>
            </View>
          </View>

          {loadingData ? (
            <ActivityIndicator color={Colors.fantasy.gold} style={{ marginVertical: 16 }} />
          ) : (tasksForMe.length ? tasksForMe : openTasks.slice(0, 3)).length === 0 ? (
            <Text style={t.panelBody}>Nenhuma tarefa precisa de você agora.</Text>
          ) : (
            <View style={t.taskList}>
              {(tasksForMe.length ? tasksForMe : openTasks.slice(0, 3)).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push('/tasks')}
                  accessibilityRole="link"
                  style={(s: any) => [t.taskItem, (s.hovered || s.pressed) && t.taskItemHover]}
                >
                  <View style={[t.taskDot, { backgroundColor: TASK_CATEGORY_COLORS[task.category]?.border || Colors.fantasy.gold }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={t.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={t.taskMeta}>{taskActionLabel(task)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Button label="Abrir tarefas" icon={ClipboardList} onPress={() => router.push('/tasks')} />
        </View>
      </View>

      {/* Personagens da mesa */}
      <CharacterShowcaseSection
        characters={allCharacters.length > 0 ? allCharacters : characters}
        isMobile={isMobile}
        containerWidth={width}
        isLoading={loadingData}
      />

      {/* Diário: última sessão */}
      <View style={t.section}>
        <View style={t.panel}>
          <View style={[t.panelHeaderRow, isMobile && t.panelHeaderRowMobile]}>
            <View style={{ flex: 1 }}>
              <Text style={t.panelEyebrow}>Diário</Text>
              <Text style={t.panelTitle}>{latestSession ? latestSession.title : 'Nenhuma sessão registrada'}</Text>
              {latestSession && (
                <Text style={t.panelMeta}>
                  {new Date(latestSession.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {latestSession.notes?.length
                    ? `, ${latestSession.notes.length} ${latestSession.notes.length === 1 ? 'anotação' : 'anotações'}`
                    : ''}
                </Text>
              )}
            </View>
            <Button
              label={latestNote ? 'Abrir diário' : 'Escrever no diário'}
              icon={BookOpen}
              size="sm"
              onPress={() => router.push('/journal')}
            />
          </View>

          {latestNote ? (
            <View style={t.quote}>
              <Text style={t.quoteText} numberOfLines={3}>
                {latestNote.content.replace(/[#*`_]/g, '')}
              </Text>
              <Text style={t.quoteAuthor}>{latestNote.author?.name || 'Mestre'}</Text>
            </View>
          ) : (
            <Text style={t.panelBody}>
              Ninguém escreveu sobre esta sessão ainda. O que aconteceu? Quem vocês conheceram?
            </Text>
          )}
        </View>
      </View>

      {/* Referências do cenário (links externos) */}
      <View style={t.section}>
        <Text style={t.sectionTitle}>Referências do cenário</Text>
        <View style={[t.grid, isWide && t.gridRow]}>
          {[
            {
              title: 'Wiki do cenário',
              desc: 'Reinos, divindades, facções e regras de magia',
              icon: Globe,
              url: 'https://hg.a11y.host',
            },
            {
              title: 'Arquivos no Drive',
              desc: 'Livros de regras, fichas em branco e homebrews',
              icon: Folder,
              url: driveUrl,
            },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Pressable
                key={link.title}
                onPress={() => Linking.openURL(link.url)}
                accessibilityRole="link"
                accessibilityLabel={`${link.title} (abre em outra aba)`}
                style={(s: any) => [t.linkCard, isWide && t.panelWide, (s.hovered || s.pressed) && t.linkCardHover]}
              >
                <Icon size={20} color={Colors.fantasy.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={t.linkTitle}>{link.title}</Text>
                  <Text style={t.linkDesc} numberOfLines={1}>
                    {link.desc}
                  </Text>
                </View>
                <ExternalLink size={16} color={Colors.fantasy.textMuted} />
              </Pressable>
            );
          })}
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
  // ============================================================
  // ESTILOS DA BARRA RÁPIDA DE SESSÃO (MODO DIA DE SESSÃO)
  // ============================================================
  // ============================================================
  // ESTILOS DA PRÓXIMA SESSÃO, QUÓRUM & RSVP
  // ============================================================
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
    fontSize: 12,
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
});

// Estilos do layout reorganizado da Taverna
const t = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 24,
  },
  greeting: {
    color: Colors.fantasy.goldBright,
    fontSize: Type.display + 4,
    fontFamily: FontFamily.display,
    fontWeight: '700',
  },
  greetingMobile: {
    fontSize: Type.display - 2,
  },
  headline: {
    color: Colors.fantasy.text,
    fontSize: Type.bodyLg + 1,
    lineHeight: 25,
    fontFamily: FontFamily.serif,
    maxWidth: 680,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: Colors.fantasy.text,
    fontSize: Type.title,
    fontWeight: '700',
    fontFamily: FontFamily.serif,
    marginBottom: 12,
  },
  grid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    padding: 20,
    gap: 14,
  },
  panelWide: {
    flex: 1,
    flexBasis: 0,
  },
  panelAccent: {
    borderLeftWidth: 4,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  panelHeaderRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  panelEyebrow: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
    fontWeight: '600',
    marginBottom: 2,
  },
  panelTitle: {
    color: Colors.fantasy.text,
    fontSize: Type.title + 2,
    fontWeight: '700',
    fontFamily: FontFamily.serif,
  },
  panelMeta: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
    marginTop: 4,
  },
  panelBody: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.body,
    lineHeight: 21,
  },
  charName: {
    color: Colors.fantasy.goldBright,
    fontSize: Type.heading + 2,
    fontFamily: FontFamily.display,
    fontWeight: '700',
    marginTop: -6,
  },
  hpBlock: {
    gap: 6,
  },
  hpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  hpLabel: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.small,
  },
  hpValue: {
    color: Colors.fantasy.text,
    fontSize: Type.bodyLg,
    fontWeight: '700',
  },
  hpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.fantasy.backgroundElement,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 4,
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  condition: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(184, 40, 40, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(184, 40, 40, 0.45)',
  },
  conditionText: {
    color: Colors.fantasy.dangerText,
    fontSize: Type.caption,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stat: {
    color: Colors.fantasy.textSecondary,
    fontSize: Type.small,
  },
  statValue: {
    color: Colors.fantasy.text,
    fontSize: Type.bodyLg,
    fontWeight: '700',
  },
  taskList: {
    gap: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: Radius.sm,
  },
  taskItemHover: {
    backgroundColor: 'rgba(226, 216, 195, 0.05)',
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskTitle: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    fontWeight: '600',
  },
  taskMeta: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.caption,
    marginTop: 2,
  },
  quote: {
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: Colors.fantasy.goldDark,
    gap: 6,
  },
  quoteText: {
    color: Colors.fantasy.text,
    fontSize: Type.bodyLg - 1,
    lineHeight: 24,
    fontFamily: FontFamily.notice,
  },
  quoteAuthor: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    backgroundColor: Colors.fantasy.backgroundSecondary,
  },
  linkCardHover: {
    borderColor: Colors.fantasy.goldDark,
  },
  linkTitle: {
    color: Colors.fantasy.text,
    fontSize: Type.body,
    fontWeight: '700',
  },
  linkDesc: {
    color: Colors.fantasy.textMuted,
    fontSize: Type.small,
    marginTop: 2,
  },
});
