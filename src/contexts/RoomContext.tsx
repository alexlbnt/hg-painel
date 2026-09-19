import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { RoomData, INITIAL_ROOMS } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { useAuth } from './AuthContext';

interface RoomContextData {
  rooms: RoomData[];
  userAccessibleRooms: RoomData[];
  activeRoom: RoomData | null;
  setActiveRoom: (room: RoomData) => void;
  selectRoomById: (roomId: string) => void;
  isLoadingRooms: boolean;
  refreshRooms: () => Promise<RoomData[]>;
  isSuperDm: boolean;
}

export const getRoomColor = (code?: string): string => {
  if (!code) return '#D63939';
  const c = code.toUpperCase();
  if (c.includes('ALEX')) return '#D63939';
  if (c.includes('LOBO')) return '#2E6DD1';
  if (c.includes('JOAO')) return '#27AE60';
  return '#D63939';
};

const STORAGE_KEY_ACTIVE_ROOM = '@hg_active_room_id';

const RoomContext = createContext<RoomContextData>({} as RoomContextData);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [activeRoom, setActiveRoomState] = useState<RoomData | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Usuário Alex é o Super-DM com visão e controle global sobre todas as mesas
  const isSuperDm = useMemo(() => {
    if (!user) return false;
    const username = (user.username || '').toLowerCase().trim();
    return username === 'alex.g' || (user.role === 'DM' && user.name.toLowerCase().includes('alex'));
  }, [user]);

  // Mesas acessíveis pelo usuário atual:
  // - Super-DM Alex: todas as mesas
  // - Mestres (ex: João, Lobo): mesa que mestram + mesa onde jogam
  // - Jogadores (ex: Allan, Leo, Gabi, Dantas, Pastor, Luis): mesa onde jogam
  const userAccessibleRooms = useMemo(() => {
    if (!user) return rooms;
    if (isSuperDm) return rooms;

    const username = (user.username || '').toLowerCase().trim();
    const accessible = rooms.filter((r) => {
      const isDmOfRoom = (r.dmUsername || '').toLowerCase().trim() === username;
      const isUserRoom = user.roomId ? (r.id === user.roomId || r.code === user.roomId) : false;
      return isDmOfRoom || isUserRoom;
    });

    return accessible.length > 0 ? accessible : rooms;
  }, [rooms, user, isSuperDm]);

  const loadRooms = useCallback(async () => {
    try {
      const data = await ApiService.getRooms();
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
        return data;
      }
    } catch (e) {
      console.warn('Erro ao carregar mesas:', e);
    }
    return INITIAL_ROOMS;
  }, []);

  const setActiveRoom = useCallback((room: RoomData) => {
    setActiveRoomState(room);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_ACTIVE_ROOM, room.id);
      } catch (e) {
        console.warn('Erro ao salvar mesa ativa no localStorage:', e);
      }
    }
  }, []);

  const selectRoomById = useCallback((roomId: string) => {
    const found = rooms.find(r => r.id === roomId || r.code === roomId);
    if (found) {
      setActiveRoom(found);
    }
  }, [rooms, setActiveRoom]);

  // Inicialização e sincronização da mesa ativa
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoadingRooms(true);
      const loaded = await loadRooms();
      if (!isMounted) return;

      let chosenRoom: RoomData | null = null;

      // 1. Tenta recuperar preferência salva no storage
      let savedId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          savedId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_ROOM);
        } catch {}
      }

      if (savedId) {
        chosenRoom = loaded.find(r => r.id === savedId || r.code === savedId) || null;
      }

      // 2. Se o usuário logado for um dos mestres específicos ou se a mesa escolhida não for válida:
      if (user) {
        const u = (user.username || '').toLowerCase().trim();
        if (u === 'alex.g') {
          if (!chosenRoom) {
            chosenRoom = loaded.find(r => r.dmUsername === 'alex.g' || r.code === 'MESA-ALEX') || loaded[0];
          }
        } else if (u === 'joao.c') {
          if (!chosenRoom || (chosenRoom.code !== 'MESA-JOAO' && chosenRoom.code !== 'MESA-LOBO')) {
            chosenRoom = loaded.find(r => r.dmUsername === 'joao.c' || r.code === 'MESA-JOAO') || loaded[0];
          }
        } else if (u === 'lobo.l') {
          if (!chosenRoom || (chosenRoom.code !== 'MESA-LOBO' && chosenRoom.code !== 'MESA-ALEX')) {
            chosenRoom = loaded.find(r => r.dmUsername === 'lobo.l' || r.code === 'MESA-LOBO') || loaded[0];
          }
        } else if (user.roomId) {
          // Jogador comum: deve ir diretamente para a mesa vinculada a ele
          const bound = loaded.find(r => r.id === user.roomId || r.code === user.roomId);
          if (bound) chosenRoom = bound;
        }
      }

      // 3. Fallback para a primeira mesa disponível
      if (!chosenRoom && loaded.length > 0) {
        chosenRoom = loaded[0];
      }

      if (chosenRoom) {
        setActiveRoomState(chosenRoom);
      }
      setIsLoadingRooms(false);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [loadRooms, user]);

  // Se a mesa ativa atual não estiver na lista de mesas acessíveis pelo usuário, reajusta para a primeira acessível
  useEffect(() => {
    if (!isLoadingRooms && activeRoom && userAccessibleRooms.length > 0) {
      const hasAccess = userAccessibleRooms.some(r => r.id === activeRoom.id);
      if (!hasAccess) {
        const dmRoom = userAccessibleRooms.find(r => (r.dmUsername || '').toLowerCase().trim() === (user?.username || '').toLowerCase().trim());
        setActiveRoom(dmRoom || userAccessibleRooms[0]);
      }
    }
  }, [isLoadingRooms, activeRoom, userAccessibleRooms, user?.username, setActiveRoom]);

  return (
    <RoomContext.Provider
      value={{
        rooms,
        userAccessibleRooms,
        activeRoom,
        setActiveRoom,
        selectRoomById,
        isLoadingRooms,
        refreshRooms: loadRooms,
        isSuperDm,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
