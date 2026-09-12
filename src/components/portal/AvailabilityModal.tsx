import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  Check,
  X,
  Sparkles,
  Info,
  Clock,
  CalendarCheck,
  HelpCircle,
  Flame,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ApiService, AvailabilityResponseData, AvailabilityRecord } from '@/services/api';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FANTASY_COLORS = [
  { bg: '#C5A059', text: '#110F0D', border: '#E6C280' }, // Ouro Nobre
  { bg: '#4E9C8E', text: '#110F0D', border: '#7AC5B8' }, // Esmeralda Élfica
  { bg: '#C95B5B', text: '#FFF', border: '#E57373' },    // Rubi Guerreiro
  { bg: '#7E57C2', text: '#FFF', border: '#B39DDB' },    // Ametista Arcana
  { bg: '#42A5F5', text: '#110F0D', border: '#90CAF9' }, // Safira Astral
  { bg: '#FFA726', text: '#110F0D', border: '#FFCC80' }, // Âmbar do Ladino
  { bg: '#26A69A', text: '#110F0D', border: '#80CBC4' }, // Jade do Ranger
  { bg: '#AB47BC', text: '#FFF', border: '#CE93D8' },    // Púrpura Feiticeiro
];

function getPlayerColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FANTASY_COLORS.length;
  return FANTASY_COLORS[index];
}

interface DateAvailabilityItem {
  dateStr: string;
  formattedDate: string;
  dayNum: number;
  dayOfWeek: string;
  records: AvailabilityRecord[];
  confirmedUsers: { id: string; name: string; role: any }[];
  pendingUsers: { id: string; name: string; role: any }[];
  count: number;
  isPerfect: boolean;
  isMajor: boolean;
  isPast: boolean;
  isToday: boolean;
  isMyAvailable: boolean;
  quorumPercent: number;
}

interface AvailabilityModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDateForSession?: (dateIso: string) => void;
}

export default function AvailabilityModal({
  visible,
  onClose,
  onSelectDateForSession,
}: AvailabilityModalProps) {
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  // Modo de visualização: Calendário Grid vs Visão em Lista das Melhores Datas
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [listFilter, setListFilter] = useState<'ALL' | 'PERFECT' | 'MY'>('ALL');

  // Mês selecionado no formato YYYY-MM
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityResponseData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Armazena as datas marcadas pelo usuário logado de forma otimista
  const [myDates, setMyDates] = useState<Set<string>>(new Set());

  // Parse do ano e mês numéricos
  const [currentYear, currentMonthIndex] = useMemo(() => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    return [y, m - 1];
  }, [currentYearMonth]);

  // Carrega os dados da API
  const loadAvailability = useCallback(async (monthStr: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ApiService.getAvailability(monthStr);
      setAvailabilityData(res);

      // Preenche o conjunto de datas do usuário atual
      if (user && res.records) {
        const userDates = new Set(
          res.records
            .filter((r) => r.userId === user.id)
            .map((r) => r.date)
        );
        setMyDates(userDates);
      }
    } catch (err) {
      console.error('Erro ao carregar disponibilidade:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      loadAvailability(currentYearMonth);
    }
  }, [visible, currentYearMonth, loadAvailability]);

  // Listener para sincronização em tempo real quando outro jogador marcar datas
  useRealtimeSync((event) => {
    if (event.type === 'AVAILABILITY_UPDATED') {
      loadAvailability(currentYearMonth, true);
    }
  });

  // Navegação de Meses
  const handlePrevMonth = () => {
    const prevDate = new Date(currentYear, currentMonthIndex - 1, 1);
    const yyyy = prevDate.getFullYear();
    const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${yyyy}-${mm}`);
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(currentYear, currentMonthIndex + 1, 1);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${yyyy}-${mm}`);
    setSelectedDate(null);
  };

  // Mapeamento de registros por data YYYY-MM-DD
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AvailabilityRecord[]>();
    if (!availabilityData?.records) return map;

    for (const rec of availabilityData.records) {
      if (!map.has(rec.date)) {
        map.set(rec.date, []);
      }
      map.get(rec.date)!.push(rec);
    }
    return map;
  }, [availabilityData]);

  // Total de jogadores da comitiva
  const totalPlayers = availabilityData?.totalPlayers || (availabilityData?.users?.length || 1);

  // Dias com Quórum Total no mês
  const perfectQuorumDates = useMemo(() => {
    const dates: string[] = [];
    recordsByDate.forEach((recs, d) => {
      if (recs.length >= totalPlayers && totalPlayers > 1) {
        dates.push(d);
      }
    });
    return dates;
  }, [recordsByDate, totalPlayers]);

  // Dias do Mês e Alinhamento da Semana
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  }, [currentYear, currentMonthIndex]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonthIndex, 1).getDay();
  }, [currentYear, currentMonthIndex]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Lista cronológica de datas para a Visão por Datas / Melhores Datas
  const datesWithAvailability = useMemo(() => {
    const list: DateAvailabilityItem[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecs = recordsByDate.get(dStr) || [];
      const count = dayRecs.length;

      // Inclui no mural os dias que possuem ao menos 1 aventureiro marcado OU que são hoje/futuros no mês
      if (count > 0 || dStr >= todayStr) {
        const dateObj = new Date(currentYear, currentMonthIndex, day);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });
        const dayOfWeek = WEEKDAYS[dateObj.getDay()];
        const confirmedUsers = dayRecs.map((r) => r.user);
        const confirmedIds = new Set(dayRecs.map((r) => r.userId));
        const pendingUsers = (availabilityData?.users || []).filter((u) => !confirmedIds.has(u.id));

        const isPerfect = count >= totalPlayers && totalPlayers > 1;
        const isMajor = count >= Math.ceil(totalPlayers * 0.6) && !isPerfect;
        const isPast = dStr < todayStr;
        const isToday = dStr === todayStr;
        const isMyAvailable = myDates.has(dStr);
        const quorumPercent = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;

        list.push({
          dateStr: dStr,
          formattedDate,
          dayNum: day,
          dayOfWeek,
          records: dayRecs,
          confirmedUsers,
          pendingUsers,
          count,
          isPerfect,
          isMajor,
          isPast,
          isToday,
          isMyAvailable,
          quorumPercent,
        });
      }
    }

    // Cronológica por padrão (conforme escolha do usuário)
    return list;
  }, [daysInMonth, currentYear, currentMonthIndex, recordsByDate, todayStr, availabilityData, totalPlayers, myDates]);

  // Filtro ativo na Visão em Lista
  const filteredDatesForList = useMemo(() => {
    return datesWithAvailability.filter((d) => {
      if (listFilter === 'PERFECT') return d.isPerfect;
      if (listFilter === 'MY') return d.isMyAvailable;
      // 'ALL': exibe todas as datas com marcação ou que ainda vão acontecer no mês
      return d.count > 0 || !d.isPast;
    });
  }, [datesWithAvailability, listFilter]);

  // Alternar disponibilidade de uma data específica
  const handleToggleDay = async (dateStr: string) => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Faça login com seu herói na Taverna para registrar sua disponibilidade!');
      } else {
        Alert.alert('Identificação Necessária', 'Faça login com seu herói para registrar sua disponibilidade.');
      }
      return;
    }

    // Atualização otimista local
    const nextDates = new Set(myDates);
    const willAdd = !nextDates.has(dateStr);
    if (willAdd) {
      nextDates.add(dateStr);
    } else {
      nextDates.delete(dateStr);
    }
    setMyDates(nextDates);
    setSelectedDate(dateStr);

    try {
      await ApiService.toggleAvailability(user.id, dateStr);
      // Recarrega silenciosamente para alinhar dados com o servidor
      loadAvailability(currentYearMonth, true);
    } catch (err) {
      console.error('Falha ao alternar data:', err);
      // Reverter estado
      loadAvailability(currentYearMonth, false);
    }
  };

  // Atalho: Marcar todos os finais de semana do mês
  const handleSelectAllWeekends = async () => {
    if (!user) return;
    const weekendDates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonthIndex, day);
      const dayOfWeek = dateObj.getDay();
      const dStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if ((dayOfWeek === 0 || dayOfWeek === 6) && dStr >= todayStr) {
        weekendDates.push(dStr);
      }
    }

    // Combina com as datas já existentes
    const merged = Array.from(new Set([...Array.from(myDates), ...weekendDates]));
    setMyDates(new Set(merged));

    try {
      await ApiService.batchSetAvailability(user.id, currentYearMonth, merged);
      loadAvailability(currentYearMonth, true);
    } catch (err) {
      console.error('Erro ao marcar finais de semana:', err);
      loadAvailability(currentYearMonth, false);
    }
  };

  // Atalho: Limpar todas as minhas datas do mês
  const handleClearMyMonth = async () => {
    if (!user) return;
    setMyDates(new Set());
    try {
      await ApiService.batchSetAvailability(user.id, currentYearMonth, []);
      loadAvailability(currentYearMonth, true);
    } catch (err) {
      console.error('Erro ao limpar mês:', err);
      loadAvailability(currentYearMonth, false);
    }
  };

  // Detalhes do dia inspecionado
  const inspectedDayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const recs = recordsByDate.get(selectedDate) || [];
    const availableUserIds = new Set(recs.map((r) => r.userId));

    const confirmedUsers = recs.map((r) => r.user);
    const pendingUsers = (availabilityData?.users || []).filter(
      (u) => !availableUserIds.has(u.id)
    );

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });

    const isAvailable = myDates.has(selectedDate);
    const isPerfect = recs.length >= totalPlayers && totalPlayers > 1;
    const isPast = selectedDate < todayStr;

    return {
      dateStr: selectedDate,
      formattedDate,
      confirmedUsers,
      pendingUsers,
      count: recs.length,
      total: totalPlayers,
      isAvailable,
      isPerfect,
      isPast,
    };
  }, [selectedDate, recordsByDate, availabilityData, myDates, totalPlayers, todayStr]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
          {/* ============================================================ */}
          {/* CABEÇALHO DO MODAL                                            */}
          {/* ============================================================ */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconBadge}>
                <CalendarIcon color="#C5A059" size={20} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Disponibilidade da Comitiva</Text>
                <Text style={styles.modalSubtitle}>
                  Marque seus dias livres para definirmos a próxima sessão
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X color="#A89F91" size={20} />
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* SELETOR DE MODO DE VISUALIZAÇÃO                              */}
          {/* ============================================================ */}
          <View style={styles.viewModeSwitcher}>
            <TouchableOpacity
              style={[styles.viewModeTab, viewMode === 'CALENDAR' && styles.viewModeTabActive]}
              onPress={() => setViewMode('CALENDAR')}
              activeOpacity={0.8}
            >
              <CalendarIcon size={14} color={viewMode === 'CALENDAR' ? '#C5A059' : '#80776C'} />
              <Text style={[styles.viewModeTabText, viewMode === 'CALENDAR' && styles.viewModeTabTextActive]}>
                Calendário Mensal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeTab, viewMode === 'LIST' && styles.viewModeTabActive]}
              onPress={() => setViewMode('LIST')}
              activeOpacity={0.8}
            >
              <Users size={14} color={viewMode === 'LIST' ? '#C5A059' : '#80776C'} />
              <Text style={[styles.viewModeTabText, viewMode === 'LIST' && styles.viewModeTabTextActive]}>
                Visão por Datas ({datesWithAvailability.filter((d) => d.count > 0).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* NAVEGAÇÃO DE MÊS & DESTAQUE DE QUÓRUM                         */}
          {/* ============================================================ */}
          <View style={styles.monthBar}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.75}
            >
              <ChevronLeft color="#E6C280" size={20} />
            </TouchableOpacity>

            <View style={styles.monthCenterInfo}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[currentMonthIndex]} {currentYear}
              </Text>
              {perfectQuorumDates.length > 0 ? (
                <View style={styles.quorumHeaderBadge}>
                  <Crown color="#E6C280" size={12} />
                  <Text style={styles.quorumHeaderText}>
                    {perfectQuorumDates.length} dia{perfectQuorumDates.length > 1 ? 's' : ''} com quórum total!
                  </Text>
                </View>
              ) : (
                <Text style={styles.quorumHeaderSub}>
                  {availabilityData?.records?.length || 0} presenças registradas
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handleNextMonth}
              activeOpacity={0.75}
            >
              <ChevronRight color="#E6C280" size={20} />
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* LEGENDA RÁPIDA (MODO CALENDÁRIO)                             */}
          {/* ============================================================ */}
          {viewMode === 'CALENDAR' && (
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#2E7D32', borderColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Meu Dia Livre</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: 'rgba(197, 160, 89, 0.35)', borderColor: '#C5A059' }]} />
                <Text style={styles.legendText}>Quórum Total 👑</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#1A1714', borderColor: '#3D342C' }]} />
                <Text style={styles.legendText}>Parcial</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#C5A059', borderColor: '#E6C280', borderRadius: 6 }]} />
                <Text style={styles.legendText}>Heróis (Iniciais)</Text>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* CORPO DO MODAL (CALENDÁRIO OU LISTA DE DATAS)                */}
          {/* ============================================================ */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#C5A059" size="large" />
                <Text style={styles.loadingText}>Consultando oráculo das datas...</Text>
              </View>
            ) : viewMode === 'CALENDAR' ? (
              <>
                {/* Cabeçalho dos dias da semana */}
                <View style={styles.weekHeaderRow}>
                  {WEEKDAYS.map((w, idx) => (
                    <View key={w} style={styles.weekDayHeaderCell}>
                      <Text
                        style={[
                          styles.weekDayHeaderText,
                          (idx === 0 || idx === 6) && styles.weekDayHeaderWeekend,
                        ]}
                      >
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Grid das Células dos Dias */}
                <View style={styles.calendarGrid}>
                  {/* Células vazias de deslocamento inicial */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                  ))}

                  {/* Dias do mês */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isPast = dateStr < todayStr;
                    const isToday = dateStr === todayStr;
                    const isSelected = selectedDate === dateStr;
                    const isMyAvailable = myDates.has(dateStr);

                    const dayRecs = recordsByDate.get(dateStr) || [];
                    const count = dayRecs.length;
                    const isPerfect = count >= totalPlayers && totalPlayers > 1;
                    const isMajor = count >= Math.ceil(totalPlayers * 0.6) && !isPerfect;
                    const confirmedNames = dayRecs.map((r) => r.user.name).join(', ');
                    const tooltipText = isPast
                      ? `Dia ${dayNum} (Passado)`
                      : count > 0
                      ? `Dia ${dayNum}: ${count}/${totalPlayers} heróis disponíveis (${confirmedNames})`
                      : `Dia ${dayNum}: Nenhum herói marcado ainda. Toque para inspecionar.`;

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.dayCell,
                          isPast && styles.dayCellPast,
                          isToday && styles.dayCellToday,
                          isMyAvailable && styles.dayCellMyAvailable,
                          isPerfect && styles.dayCellPerfectQuorum,
                          isSelected && styles.dayCellFocused,
                        ]}
                        activeOpacity={isPast ? 1 : 0.7}
                        disabled={isPast}
                        onPress={() => setSelectedDate(dateStr)}
                        {...(Platform.OS === 'web' ? ({ title: tooltipText } as any) : {})}
                        accessibilityLabel={tooltipText}
                      >
                        {/* Indicador superior: número do dia */}
                        <View style={styles.dayNumRow}>
                          <Text
                            style={[
                              styles.dayNumText,
                              isToday && styles.dayNumTextToday,
                              isMyAvailable && styles.dayNumTextMyAvailable,
                              isPast && styles.dayNumTextPast,
                            ]}
                          >
                            {dayNum}
                          </Text>

                          {isPerfect && (
                            <Crown color="#E6C280" size={12} style={styles.crownIcon} />
                          )}
                          {!isPerfect && isMyAvailable && (
                            <View style={styles.checkPill}>
                              <Check color="#A5D6A7" size={10} strokeWidth={3} />
                            </View>
                          )}
                        </View>

                        {/* Mini chips dos heróis disponíveis no dia */}
                        {!isPast && count > 0 && (
                          <View style={styles.dayPlayersMiniRow}>
                            {dayRecs.slice(0, 3).map((rec) => {
                              const pColor = getPlayerColor(rec.user.name);
                              const initials = rec.user.name.slice(0, 2).toUpperCase();
                              return (
                                <View
                                  key={rec.userId}
                                  style={[
                                    styles.playerMiniChip,
                                    {
                                      backgroundColor: pColor.bg,
                                      borderColor: pColor.border,
                                    },
                                  ]}
                                >
                                  <Text style={[styles.playerMiniChipText, { color: pColor.text }]}>
                                    {initials}
                                  </Text>
                                </View>
                              );
                            })}
                            {count > 3 && (
                              <View style={styles.playerMiniChipMore}>
                                <Text style={styles.playerMiniChipMoreText}>+{count - 3}</Text>
                              </View>
                            )}
                          </View>
                        )}

                        {/* Indicador inferior: quórum de jogadores */}
                        {!isPast && (
                          <View
                            style={[
                              styles.quorumBadge,
                              isPerfect
                                ? styles.quorumBadgePerfect
                                : isMajor
                                ? styles.quorumBadgeMajor
                                : count > 0
                                ? styles.quorumBadgeSome
                                : styles.quorumBadgeZero,
                            ]}
                          >
                            <Users
                              size={9}
                              color={
                                isPerfect
                                  ? '#110F0D'
                                  : isMajor
                                  ? '#4E9C8E'
                                  : count > 0
                                  ? '#E6C280'
                                  : '#5C544B'
                              }
                            />
                            <Text
                              style={[
                                styles.quorumBadgeText,
                                isPerfect
                                  ? styles.quorumBadgeTextPerfect
                                  : isMajor
                                  ? styles.quorumBadgeTextMajor
                                  : count > 0
                                  ? styles.quorumBadgeTextSome
                                  : styles.quorumBadgeTextZero,
                              ]}
                            >
                              {count}/{totalPlayers}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ============================================================ */}
                {/* PAINEL DE INSPEÇÃO DA DATA SELECIONADA                       */}
                {/* ============================================================ */}
                {inspectedDayDetails ? (
                  <View style={styles.inspectorCard}>
                    <View style={styles.inspectorHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inspectorDateTitle}>
                          {inspectedDayDetails.formattedDate}
                        </Text>
                        <Text style={styles.inspectorSub}>
                          {inspectedDayDetails.count} de {inspectedDayDetails.total} heróis disponíveis
                          {inspectedDayDetails.isPerfect && ' • Quórum Total da Mesa! 👑'}
                        </Text>
                      </View>

                      {!inspectedDayDetails.isPast && user && (
                        <TouchableOpacity
                          style={[
                            styles.inspectToggleBtn,
                            inspectedDayDetails.isAvailable
                              ? styles.inspectToggleBtnActive
                              : styles.inspectToggleBtnInactive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleToggleDay(inspectedDayDetails.dateStr)}
                        >
                          {inspectedDayDetails.isAvailable ? (
                            <>
                              <Check color="#110F0D" size={14} strokeWidth={3} />
                              <Text style={styles.inspectToggleBtnTextActive}>Você marcou</Text>
                            </>
                          ) : (
                            <>
                              <CalendarCheck color="#E6C280" size={14} />
                              <Text style={styles.inspectToggleBtnTextInactive}>Marcar que posso</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Lista de Heróis Confirmados */}
                    <View style={styles.heroesSection}>
                      <Text style={styles.heroesSectionTitle}>
                        Heróis Confirmados ({inspectedDayDetails.confirmedUsers.length}):
                      </Text>
                      {inspectedDayDetails.confirmedUsers.length > 0 ? (
                        <View style={styles.heroesTagWrap}>
                          {inspectedDayDetails.confirmedUsers.map((u) => {
                            const pColor = getPlayerColor(u.name);
                            const initials = u.name.slice(0, 2).toUpperCase();
                            return (
                              <View key={u.id} style={styles.heroTagConfirmed}>
                                <View
                                  style={[
                                    styles.playerAvatarCircleMini,
                                    { backgroundColor: pColor.bg, borderColor: pColor.border },
                                  ]}
                                >
                                  <Text style={[styles.playerAvatarTextMini, { color: pColor.text }]}>
                                    {initials}
                                  </Text>
                                </View>
                                <Text style={styles.heroTagConfirmedText}>{u.name}</Text>
                                {u.role === 'DM' && <Text style={styles.roleMiniBadge}>MESTRE</Text>}
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.noHeroesText}>
                          Nenhum herói marcou disponibilidade para esta data ainda.
                        </Text>
                      )}
                    </View>

                    {/* Heróis Pendentes */}
                    {inspectedDayDetails.pendingUsers.length > 0 && (
                      <View style={styles.heroesSection}>
                        <Text style={styles.heroesSectionTitlePending}>Ainda não marcaram:</Text>
                        <View style={styles.heroesTagWrap}>
                          {inspectedDayDetails.pendingUsers.map((u) => (
                            <View key={u.id} style={styles.heroTagPending}>
                              <Clock color="#80776C" size={11} />
                              <Text style={styles.heroTagPendingText}>{u.name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Ação rápida para o Mestre: Agendar sessão nesta data */}
                    {(user?.role === 'DM' || user?.role === 'MECHANIC') &&
                      onSelectDateForSession &&
                      !inspectedDayDetails.isPast && (
                        <TouchableOpacity
                          style={styles.scheduleFromDateBtn}
                          activeOpacity={0.85}
                          onPress={() => {
                            onClose();
                            onSelectDateForSession(inspectedDayDetails.dateStr);
                          }}
                        >
                          <Flame color="#110F0D" size={15} />
                          <Text style={styles.scheduleFromDateBtnText}>
                            Conclamar Sessão Nesta Data ({inspectedDayDetails.formattedDate})
                          </Text>
                          <ArrowRight color="#110F0D" size={15} />
                        </TouchableOpacity>
                      )}
                  </View>
                ) : (
                  <View style={styles.selectDayNotice}>
                    <Info color="#80776C" size={16} />
                    <Text style={styles.selectDayNoticeText}>
                      Toque em um dia no calendário para inspecionar quem está livre e marcar sua presença.
                    </Text>
                  </View>
                )}

                {/* ATALHOS RÁPIDOS & UTILITÁRIOS */}
                {user ? (
                  <View style={styles.shortcutsBox}>
                    <Text style={styles.shortcutsTitle}>Atalhos da Taverna:</Text>
                    <View style={styles.shortcutsRow}>
                      <TouchableOpacity
                        style={styles.shortcutButton}
                        activeOpacity={0.75}
                        onPress={handleSelectAllWeekends}
                      >
                        <Sparkles color="#E6C280" size={14} />
                        <Text style={styles.shortcutButtonText}>Marcar Finais de Semana</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shortcutButtonSecondary}
                        activeOpacity={0.75}
                        onPress={handleClearMyMonth}
                      >
                        <X color="#A89F91" size={14} />
                        <Text style={styles.shortcutButtonSecondaryText}>Limpar Meu Mês</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.notLoggedNotice}>
                    <HelpCircle color="#C5A059" size={18} />
                    <Text style={styles.notLoggedNoticeText}>
                      Você está visualizando o calendário em modo visitante. Entre com seu usuário no Portal para registrar seus dias livres!
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* ============================================================ */}
                {/* MODO LISTA: VISÃO POR DATAS COM TODOS OS PLAYERS EXIBIDOS   */}
                {/* ============================================================ */}
                <View style={styles.dateListFiltersRow}>
                  <TouchableOpacity
                    style={[
                      styles.dateListFilterBtn,
                      listFilter === 'ALL' && styles.dateListFilterBtnActive,
                    ]}
                    onPress={() => setListFilter('ALL')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dateListFilterText,
                        listFilter === 'ALL' && styles.dateListFilterTextActive,
                      ]}
                    >
                      Todas as Datas ({datesWithAvailability.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dateListFilterBtn,
                      listFilter === 'PERFECT' && styles.dateListFilterBtnActive,
                    ]}
                    onPress={() => setListFilter('PERFECT')}
                    activeOpacity={0.8}
                  >
                    <Crown size={12} color={listFilter === 'PERFECT' ? '#110F0D' : '#E6C280'} />
                    <Text
                      style={[
                        styles.dateListFilterText,
                        listFilter === 'PERFECT' && styles.dateListFilterTextActive,
                      ]}
                    >
                      Quórum Total ({datesWithAvailability.filter((d) => d.isPerfect).length})
                    </Text>
                  </TouchableOpacity>

                  {user && (
                    <TouchableOpacity
                      style={[
                        styles.dateListFilterBtn,
                        listFilter === 'MY' && styles.dateListFilterBtnActive,
                      ]}
                      onPress={() => setListFilter('MY')}
                      activeOpacity={0.8}
                    >
                      <Check size={12} color={listFilter === 'MY' ? '#110F0D' : '#4CAF50'} />
                      <Text
                        style={[
                          styles.dateListFilterText,
                          listFilter === 'MY' && styles.dateListFilterTextActive,
                        ]}
                      >
                        Minhas Datas ({datesWithAvailability.filter((d) => d.isMyAvailable).length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {filteredDatesForList.length === 0 ? (
                  <View style={styles.dateListEmptyState}>
                    <Info color="#80776C" size={24} />
                    <Text style={styles.dateListEmptyStateTitle}>Nenhuma data encontrada</Text>
                    <Text style={styles.dateListEmptyStateDesc}>
                      Nenhum dia corresponde aos filtros selecionados neste mês.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dateListContainer}>
                    {filteredDatesForList.map((item) => {
                      return (
                        <View
                          key={item.dateStr}
                          style={[
                            styles.dateListItemCard,
                            item.isPerfect && styles.dateListItemCardPerfect,
                            item.isPast && styles.dateListItemCardPast,
                          ]}
                        >
                          {/* Cabeçalho do Card da Data */}
                          <View style={styles.dateListItemHeader}>
                            <View style={{ flex: 1 }}>
                              <View style={styles.dateListItemTitleRow}>
                                <Text style={styles.dateListItemTitle}>
                                  {item.formattedDate}
                                </Text>
                                {item.isToday && (
                                  <View style={styles.todayBadge}>
                                    <Text style={styles.todayBadgeText}>HOJE</Text>
                                  </View>
                                )}
                                {item.isPerfect && (
                                  <View style={styles.perfectBadge}>
                                    <Crown size={12} color="#110F0D" />
                                    <Text style={styles.perfectBadgeText}>Quórum Total 👑</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.dateListItemSub}>
                                {item.count} de {totalPlayers} heróis disponíveis ({item.quorumPercent}%)
                              </Text>
                            </View>

                            {/* Ação rápida de 1-toque para o usuário marcar / desmarcar presença */}
                            {!item.isPast && user && (
                              <TouchableOpacity
                                style={[
                                  styles.dateListQuickRsvpBtn,
                                  item.isMyAvailable
                                    ? styles.dateListQuickRsvpBtnActive
                                    : styles.dateListQuickRsvpBtnInactive,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => handleToggleDay(item.dateStr)}
                              >
                                {item.isMyAvailable ? (
                                  <>
                                    <Check color="#110F0D" size={13} strokeWidth={3} />
                                    <Text style={styles.dateListQuickRsvpTextActive}>Confirmado</Text>
                                  </>
                                ) : (
                                  <>
                                    <CalendarCheck color="#C5A059" size={13} />
                                    <Text style={styles.dateListQuickRsvpTextInactive}>Posso Jogar</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Barra visual de Quórum */}
                          <View style={styles.dateListProgressBarTrack}>
                            <View
                              style={[
                                styles.dateListProgressBarFill,
                                {
                                  width: `${Math.min(100, item.quorumPercent)}%`,
                                  backgroundColor: item.isPerfect
                                    ? '#E6C280'
                                    : item.isMajor
                                    ? '#4E9C8E'
                                    : item.count > 0
                                    ? '#C5A059'
                                    : '#3D342C',
                                },
                              ]}
                            />
                          </View>

                          {/* SEÇÃO PRINCIPAL: TODOS OS PLAYERS QUE PODEM JOGAR NESTE DIA */}
                          <View style={styles.dateListMembersSection}>
                            <View style={styles.dateListSectionHeader}>
                              <Users size={13} color="#C5A059" />
                              <Text style={styles.dateListSectionLabel}>
                                HERÓIS DISPONÍVEIS ({item.confirmedUsers.length}):
                              </Text>
                            </View>

                            {item.confirmedUsers.length > 0 ? (
                              <View style={styles.dateListChipsWrap}>
                                {item.confirmedUsers.map((u) => {
                                  const pColor = getPlayerColor(u.name);
                                  const initials = u.name.slice(0, 2).toUpperCase();
                                  const isMe = user?.id === u.id;

                                  return (
                                    <View
                                      key={u.id}
                                      style={[
                                        styles.dateListPlayerChip,
                                        isMe && styles.dateListPlayerChipMe,
                                      ]}
                                    >
                                      {/* Avatar circular estilizado com iniciais */}
                                      <View
                                        style={[
                                          styles.playerAvatarCircle,
                                          {
                                            backgroundColor: pColor.bg,
                                            borderColor: pColor.border,
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.playerAvatarText,
                                            { color: pColor.text },
                                          ]}
                                        >
                                          {initials}
                                        </Text>
                                      </View>

                                      {/* Nome do jogador em destaque */}
                                      <Text
                                        style={[
                                          styles.dateListPlayerName,
                                          isMe && styles.dateListPlayerNameMe,
                                        ]}
                                      >
                                        {u.name}
                                        {isMe && ' (Você)'}
                                      </Text>

                                      {/* Badge de Mestre se for DM */}
                                      {u.role === 'DM' && (
                                        <View style={styles.dmRoleBadge}>
                                          <Crown size={9} color="#110F0D" />
                                          <Text style={styles.dmRoleBadgeText}>MESTRE</Text>
                                        </View>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            ) : (
                              <Text style={styles.dateListEmptyNotice}>
                                Nenhum herói registrou disponibilidade para este dia ainda.
                              </Text>
                            )}
                          </View>

                          {/* Jogadores Pendentes */}
                          {item.pendingUsers.length > 0 && (
                            <View style={styles.dateListPendingSection}>
                              <Clock size={11} color="#80776C" />
                              <Text style={styles.dateListPendingLabel}>Ainda não marcaram:</Text>
                              <Text style={styles.dateListPendingNames}>
                                {item.pendingUsers.map((p) => p.name).join(', ')}
                              </Text>
                            </View>
                          )}

                          {/* Ação do Mestre para Agendar Sessão Diretamente nesta Data */}
                          {(user?.role === 'DM' || user?.role === 'MECHANIC') &&
                            onSelectDateForSession &&
                            !item.isPast && (
                              <TouchableOpacity
                                style={styles.scheduleFromDateBtnCompact}
                                activeOpacity={0.85}
                                onPress={() => {
                                  onClose();
                                  onSelectDateForSession(item.dateStr);
                                }}
                              >
                                <Flame color="#110F0D" size={13} />
                                <Text style={styles.scheduleFromDateBtnCompactText}>
                                  Agendar Sessão Nesta Data
                                </Text>
                                <ArrowRight color="#110F0D" size={13} />
                              </TouchableOpacity>
                            )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ATALHOS RÁPIDOS & UTILITÁRIOS */}
                {user ? (
                  <View style={styles.shortcutsBox}>
                    <Text style={styles.shortcutsTitle}>Atalhos da Taverna:</Text>
                    <View style={styles.shortcutsRow}>
                      <TouchableOpacity
                        style={styles.shortcutButton}
                        activeOpacity={0.75}
                        onPress={handleSelectAllWeekends}
                      >
                        <Sparkles color="#E6C280" size={14} />
                        <Text style={styles.shortcutButtonText}>Marcar Finais de Semana</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shortcutButtonSecondary}
                        activeOpacity={0.75}
                        onPress={handleClearMyMonth}
                      >
                        <X color="#A89F91" size={14} />
                        <Text style={styles.shortcutButtonSecondaryText}>Limpar Meu Mês</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.notLoggedNotice}>
                    <HelpCircle color="#C5A059" size={18} />
                    <Text style={styles.notLoggedNoticeText}>
                      Você está visualizando o calendário em modo visitante. Entre com seu usuário no Portal para registrar seus dias livres!
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Rodapé do Modal */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeFooterBtnText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 4, 3, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      } as any,
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    backgroundColor: '#141210',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D342C',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 24,
  },
  modalCardMobile: {
    maxHeight: '96%',
    borderRadius: 10,
    paddingHorizontal: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
    backgroundColor: '#1A1714',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#F0E6D2',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  modalSubtitle: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: '#141210',
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  viewModeTabActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  viewModeTabText: {
    color: '#80776C',
    fontSize: 12,
    fontWeight: '600',
  },
  viewModeTabTextActive: {
    color: '#F0E6D2',
    fontWeight: 'bold',
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161412',
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#3D342C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterInfo: {
    alignItems: 'center',
  },
  monthTitle: {
    color: '#F0E6D2',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
  quorumHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C5A059',
    marginTop: 4,
  },
  quorumHeaderText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quorumHeaderSub: {
    color: '#80776C',
    fontSize: 10,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    color: '#80776C',
    fontSize: 11,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#C5A059',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayHeaderText: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  weekDayHeaderWeekend: {
    color: '#C5A059',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCellEmpty: {
    width: '13.3%',
    aspectRatio: 1,
    minHeight: 48,
  },
  dayCell: {
    width: '13.3%',
    aspectRatio: 1,
    minHeight: 58,
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2620',
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCellPast: {
    opacity: 0.3,
    backgroundColor: '#110F0D',
    borderColor: '#1D1A17',
  },
  dayCellToday: {
    borderColor: '#80776C',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayCellMyAvailable: {
    backgroundColor: 'rgba(46, 125, 50, 0.22)',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  dayCellPerfectQuorum: {
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
    borderColor: '#E6C280',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(197, 160, 89, 0.35)',
      } as any,
    }),
  },
  dayCellFocused: {
    borderColor: '#FFF',
    borderWidth: 2,
  },
  dayNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayNumText: {
    color: '#D4C8B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayNumTextToday: {
    color: '#FFF',
  },
  dayNumTextMyAvailable: {
    color: '#A5D6A7',
    fontWeight: 'bold',
  },
  dayNumTextPast: {
    color: '#5C544B',
  },
  crownIcon: {
    marginLeft: 2,
  },
  checkPill: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 4,
    padding: 1,
  },
  dayPlayersMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginVertical: 1,
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  playerMiniChip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerMiniChipText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 8,
  },
  playerMiniChipMore: {
    backgroundColor: '#26221E',
    borderRadius: 7,
    paddingHorizontal: 2,
    height: 14,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#3D342C',
  },
  playerMiniChipMoreText: {
    fontSize: 7,
    color: '#D4C8B8',
    fontWeight: 'bold',
  },
  quorumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    width: '100%',
    justifyContent: 'center',
  },
  quorumBadgePerfect: {
    backgroundColor: '#E6C280',
  },
  quorumBadgeMajor: {
    backgroundColor: 'rgba(78, 156, 142, 0.2)',
    borderWidth: 0.5,
    borderColor: '#4E9C8E',
  },
  quorumBadgeSome: {
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  quorumBadgeZero: {
    backgroundColor: 'transparent',
  },
  quorumBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  quorumBadgeTextPerfect: {
    color: '#110F0D',
  },
  quorumBadgeTextMajor: {
    color: '#4E9C8E',
  },
  quorumBadgeTextSome: {
    color: '#C5A059',
  },
  quorumBadgeTextZero: {
    color: '#5C544B',
  },
  inspectorCard: {
    backgroundColor: '#1A1714',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  inspectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#26221E',
    paddingBottom: 10,
  },
  inspectorDateTitle: {
    color: '#F0E6D2',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  inspectorSub: {
    color: '#C5A059',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  inspectToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inspectToggleBtnActive: {
    backgroundColor: '#4CAF50',
  },
  inspectToggleBtnInactive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  inspectToggleBtnTextActive: {
    color: '#110F0D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inspectToggleBtnTextInactive: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroesSection: {
    gap: 6,
  },
  heroesSectionTitle: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroesSectionTitlePending: {
    color: '#6E665B',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroesTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTagConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroTagConfirmedText: {
    color: '#C8E6C9',
    fontSize: 11,
    fontWeight: '600',
  },
  playerAvatarCircleMini: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarTextMini: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  roleMiniBadge: {
    backgroundColor: '#C5A059',
    color: '#110F0D',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  heroTagPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: '#26221E',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTagPendingText: {
    color: '#80776C',
    fontSize: 10,
  },
  noHeroesText: {
    color: '#80776C',
    fontSize: 11,
    fontStyle: 'italic',
  },
  scheduleFromDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  scheduleFromDateBtnText: {
    color: '#110F0D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectDayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26221E',
  },
  selectDayNoticeText: {
    color: '#80776C',
    fontSize: 11,
    flex: 1,
  },
  shortcutsBox: {
    gap: 8,
    marginTop: 4,
  },
  shortcutsTitle: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shortcutButtonText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '600',
  },
  shortcutButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shortcutButtonSecondaryText: {
    color: '#A89F91',
    fontSize: 11,
    fontWeight: '600',
  },
  notLoggedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderWidth: 1,
    borderColor: '#C5A059',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  notLoggedNoticeText: {
    color: '#E6C280',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#26221E',
    backgroundColor: '#161412',
    alignItems: 'flex-end',
  },
  closeFooterBtn: {
    backgroundColor: '#26221E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  closeFooterBtnText: {
    color: '#F0E6D2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ============================================================
  // ESTILOS DA VISÃO EM LISTA (TODOS OS PLAYERS VISÍVEIS)
  // ============================================================
  dateListFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  dateListFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  dateListFilterBtnActive: {
    backgroundColor: '#C5A059',
    borderColor: '#E6C280',
  },
  dateListFilterText: {
    color: '#A89F91',
    fontSize: 11,
    fontWeight: '600',
  },
  dateListFilterTextActive: {
    color: '#110F0D',
    fontWeight: 'bold',
  },
  dateListContainer: {
    gap: 12,
  },
  dateListItemCard: {
    backgroundColor: '#1A1714',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D2620',
    padding: 14,
    gap: 10,
  },
  dateListItemCardPerfect: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderColor: '#C5A059',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(197, 160, 89, 0.18)',
      } as any,
    }),
  },
  dateListItemCardPast: {
    opacity: 0.45,
    backgroundColor: '#12100E',
  },
  dateListItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateListItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateListItemTitle: {
    color: '#F0E6D2',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  todayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#80776C',
  },
  todayBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C5A059',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perfectBadgeText: {
    color: '#110F0D',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateListItemSub: {
    color: '#A89F91',
    fontSize: 11,
    marginTop: 3,
  },
  dateListQuickRsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateListQuickRsvpBtnActive: {
    backgroundColor: '#4CAF50',
  },
  dateListQuickRsvpBtnInactive: {
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  dateListQuickRsvpTextActive: {
    color: '#110F0D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateListQuickRsvpTextInactive: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '600',
  },
  dateListProgressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#26221E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dateListProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  dateListMembersSection: {
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24201C',
  },
  dateListSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateListSectionLabel: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateListChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateListPlayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1E1B18',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  dateListPlayerChipMe: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  playerAvatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  dateListPlayerName: {
    color: '#F0E6D2',
    fontSize: 12,
    fontWeight: '500',
  },
  dateListPlayerNameMe: {
    color: '#C8E6C9',
    fontWeight: 'bold',
  },
  dmRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C5A059',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dmRoleBadgeText: {
    color: '#110F0D',
    fontSize: 8,
    fontWeight: 'bold',
  },
  dateListEmptyNotice: {
    color: '#80776C',
    fontSize: 11,
    fontStyle: 'italic',
  },
  dateListPendingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 2,
  },
  dateListPendingLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
  },
  dateListPendingNames: {
    color: '#A89F91',
    fontSize: 10,
  },
  scheduleFromDateBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  scheduleFromDateBtnCompactText: {
    color: '#110F0D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateListEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  dateListEmptyStateTitle: {
    color: '#D4C8B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateListEmptyStateDesc: {
    color: '#80776C',
    fontSize: 12,
    textAlign: 'center',
  },
});
