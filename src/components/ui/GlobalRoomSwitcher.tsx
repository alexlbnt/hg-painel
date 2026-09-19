import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Crown, ChevronDown, Check, X, Shield, Sparkles } from 'lucide-react-native';

export default function GlobalRoomSwitcher() {
  const { rooms, userAccessibleRooms, activeRoom, setActiveRoom, isSuperDm } = useRoom();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);

  const displayRooms = userAccessibleRooms && userAccessibleRooms.length > 0 ? userAccessibleRooms : rooms;

  if (!activeRoom || displayRooms.length === 0) return null;

  const getRoomIcon = (code: string) => {
    if (code.includes('ALEX')) return <Crown size={14} color="#D63939" />;
    if (code.includes('LOBO')) return <Shield size={14} color="#2E6DD1" />;
    if (code.includes('JOAO')) return <Sparkles size={14} color="#27AE60" />;
    return <Crown size={14} color="#D63939" />;
  };

  const getRoomBadgeColor = (code: string) => {
    if (code.includes('ALEX')) return '#D63939';
    if (code.includes('LOBO')) return '#2E6DD1';
    if (code.includes('JOAO')) return '#27AE60';
    return '#D63939';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.triggerButton, isMobile && styles.triggerButtonMobile]}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.triggerIconContainer}>
          {getRoomIcon(activeRoom.code)}
        </View>
        <View style={styles.triggerTextContainer}>
          <Text style={[styles.triggerSubtext, isMobile && styles.triggerSubtextMobile]}>MESA ATIVA</Text>
          <Text style={[styles.triggerRoomName, isMobile && styles.triggerRoomNameMobile]} numberOfLines={1}>
            {activeRoom.name}
          </Text>
        </View>
        {displayRooms.length > 1 && (
          <ChevronDown size={isMobile ? 11 : 14} color="#8C704F" style={{ marginLeft: isMobile ? 1 : 4 }} />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalCard, isMobile && styles.modalCardMobile]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Crown size={20} color="#C5A059" />
                <View>
                  <Text style={styles.modalTitle}>Ambientes de Mesa</Text>
                  <Text style={styles.modalSubtitle}>
                    {isSuperDm
                      ? '⭐ Alex (Super-DM): Acesso total a todas as mesas'
                      : displayRooms.length > 1
                      ? 'Alterne entre a mesa que mestra e a mesa onde joga'
                      : 'Mesa de RPG vinculada à sua conta'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <X size={18} color="#80776C" />
              </TouchableOpacity>
            </View>

            <View style={styles.roomList}>
              {displayRooms.map((r) => {
                const isSelected = activeRoom.id === r.id;
                const badgeColor = getRoomBadgeColor(r.code);
                const isMyDmRoom = user && r.dmUsername && user.username?.toLowerCase() === r.dmUsername.toLowerCase();
                const isMyPlayerRoom = user?.roomId ? (r.id === user.roomId || r.code === user.roomId) : false;

                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roomItem,
                      isSelected && {
                        borderColor: badgeColor,
                        backgroundColor: 'rgba(197, 160, 89, 0.08)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveRoom(r);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.roomItemLeft}>
                      <View
                        style={[
                          styles.roomItemIconWrapper,
                          { borderColor: badgeColor, backgroundColor: `${badgeColor}15` },
                        ]}
                      >
                        {getRoomIcon(r.code)}
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={[
                              styles.roomItemName,
                              isSelected && { color: '#F4E7D3', fontWeight: 'bold' },
                            ]}
                          >
                            {r.name}
                          </Text>
                          {isMyDmRoom && (
                            <View style={styles.myRoomTag}>
                              <Text style={styles.myRoomTagText}>MESTRE</Text>
                            </View>
                          )}
                          {!isMyDmRoom && isMyPlayerRoom && (
                            <View style={[styles.myRoomTag, { borderColor: '#4E9C8E', backgroundColor: 'rgba(78, 156, 142, 0.15)' }]}>
                              <Text style={[styles.myRoomTagText, { color: '#4E9C8E' }]}>JOGADOR</Text>
                            </View>
                          )}
                          {isSuperDm && !isMyDmRoom && !isMyPlayerRoom && (
                            <View style={[styles.myRoomTag, { borderColor: '#C5A059', backgroundColor: 'rgba(197, 160, 89, 0.15)' }]}>
                              <Text style={[styles.myRoomTagText, { color: '#C5A059' }]}>SUPER-DM</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roomItemDm}>
                          Mestre: {r.dmName} • Código: {r.code}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: badgeColor }]}>
                        <Check size={14} color="#110F0D" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                💡 O painel do Mestre e as Fichas alternam imediatamente para a mesa selecionada.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B18',
    borderWidth: 1,
    borderColor: '#3D352E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'border-color 0.2s ease',
      },
    }),
  },
  triggerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerTextContainer: {
    justifyContent: 'center',
  },
  triggerSubtext: {
    fontSize: 9,
    fontFamily: 'Cinzel-Regular',
    color: '#8C704F',
    letterSpacing: 0.8,
    lineHeight: 10,
  },
  triggerRoomName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E6D3B3',
    lineHeight: 14,
    maxWidth: 130,
  },
  triggerButtonMobile: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 5,
    borderRadius: 6,
  },
  triggerSubtextMobile: {
    fontSize: 7.5,
    lineHeight: 8,
    letterSpacing: 0.5,
  },
  triggerRoomNameMobile: {
    fontSize: 11,
    lineHeight: 12,
    maxWidth: 95,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#1A1714',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D352E',
    width: '100%',
    maxWidth: 460,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCardMobile: {
    maxWidth: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2A241F',
    backgroundColor: '#141210',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Cinzel-Bold',
    color: '#E6D3B3',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#80776C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#26221D',
  },
  roomList: {
    padding: 14,
    gap: 10,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#211D19',
    borderWidth: 1,
    borderColor: '#332B24',
    borderRadius: 10,
    padding: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.15s ease',
      },
    }),
  },
  roomItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roomItemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomItemName: {
    fontSize: 14,
    color: '#D4C3A3',
    fontWeight: '600',
  },
  myRoomTag: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
  },
  myRoomTagText: {
    fontSize: 9,
    color: '#C5A059',
    fontWeight: 'bold',
  },
  roomItemDm: {
    fontSize: 11,
    color: '#80776C',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 14,
    backgroundColor: '#141210',
    borderTopWidth: 1,
    borderTopColor: '#2A241F',
  },
  modalFooterText: {
    fontSize: 11,
    color: '#80776C',
    textAlign: 'center',
  },
});
