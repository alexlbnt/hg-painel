import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Plus, Trash, BookOpen, User as UserIcon, Edit2, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Author {
  name: string;
  role: 'PLAYER' | 'DM';
}

interface NoteData {
  id: string;
  content: string;
  authorId: string;
  author: Author;
  createdAt: string;
}

interface SessionData {
  id: string;
  title: string;
  date: string;
  notes: NoteData[];
}

export default function JournalScreen() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const isDM = user?.role === 'DM';

  const loadSessions = async () => {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch('/api/journal/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          if (data.length > 0 && !activeSessionId) {
            setActiveSessionId(data[data.length - 1].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim() || !user) return;
    setLoading(true);
    setModalVisible(false);
    try {
      const res = await fetch('/api/journal/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSessionTitle, authorId: user.id }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setActiveSessionId(newSession.id);
        await loadSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setNewSessionTitle('');
    }
  };

  const handlePostNote = async () => {
    if (!newNoteContent.trim() || !user || !activeSessionId) return;
    try {
      const res = await fetch('/api/journal/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          authorId: user.id,
          sessionId: activeSessionId,
        }),
      });
      if (res.ok) {
        setNewNoteContent('');
        await loadSessions();
      } else {
        const err = await res.json().catch(() => null);
        alert(`Erro ao registrar: ${err?.error || res.status}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Erro de conexão: ${e.message}`);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNoteContent.trim() || !user || !editingNoteId) return;
    try {
      const res = await fetch('/api/journal/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: editingNoteId,
          userId: user.id,
          content: editingNoteContent,
        }),
      });
      if (res.ok) {
        setEditingNoteId(null);
        setEditingNoteContent('');
        await loadSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSession = async () => {
    if (!editSessionTitle.trim() || !user || !activeSessionId) return;
    try {
      const res = await fetch('/api/journal/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          userId: user.id,
          title: editSessionTitle,
        }),
      });
      if (res.ok) {
        setIsEditingSession(false);
        await loadSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    if (confirm('Deletar esta anotação definitivamente?')) {
      try {
        const res = await fetch('/api/journal/notes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId, userId: user.id }),
        });
        if (res.ok) {
          await loadSessions();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <View style={[styles.container, isMobile && { padding: 12, flexDirection: 'column' }]}>
      {/* Sidebar - Sessions List */}
      <View style={[styles.sidebar, isMobile && { width: '100%', borderRightWidth: 0, borderBottomWidth: 1, paddingBottom: 16, marginBottom: 16 }]}>
        <TouchableOpacity 
          style={styles.sidebarHeader}
          activeOpacity={isMobile ? 0.7 : 1}
          onPress={() => isMobile && setIsSidebarExpanded(!isSidebarExpanded)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BookOpen color="#C5A059" size={24} />
            <Text style={styles.sidebarTitle}>Capítulos</Text>
          </View>
          {isMobile && (
            isSidebarExpanded ? <ChevronUp color="#C5A059" size={20} /> : <ChevronDown color="#C5A059" size={20} />
          )}
        </TouchableOpacity>
        
        {(!isMobile || isSidebarExpanded) && (
          <>
            <ScrollView style={styles.sessionList}>
              {sessions.map(session => (
                <TouchableOpacity 
                  key={session.id} 
                  style={[styles.sessionTab, activeSessionId === session.id && styles.sessionTabActive]}
                  onPress={() => {
                    setActiveSessionId(session.id);
                    if (isMobile) setIsSidebarExpanded(false);
                  }}
                >
                  <Text style={[styles.sessionTabText, activeSessionId === session.id && styles.sessionTabTextActive]}>
                    {session.title}
                  </Text>
                  <Text style={styles.sessionTabDate}>
                    {new Date(session.date).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
              {sessions.length === 0 && !loading && (
                <Text style={styles.emptyText}>Nenhuma sessão registrada.</Text>
              )}
            </ScrollView>

            {isDM && (
              <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                <Plus color="#110F0D" size={20} />
                <Text style={styles.createButtonText}>Nova Sessão</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Main Content - Journal Notes */}
      <View style={styles.mainContent}>
        {loading && sessions.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.fantasy.gold} style={{ marginTop: 50 }} />
        ) : activeSession ? (
          <>
            <View style={styles.sessionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {isEditingSession ? (
                  <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingVertical: 8 }]}
                      value={editSessionTitle}
                      onChangeText={setEditSessionTitle}
                      placeholder="Novo título..."
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setIsEditingSession(false)}>
                      <Text style={styles.btnCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSave} onPress={handleUpdateSession}>
                      <Text style={styles.btnSaveText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.sessionTitle}>{activeSession.title}</Text>
                    {isDM && (
                      <TouchableOpacity onPress={() => {
                        setEditSessionTitle(activeSession.title);
                        setIsEditingSession(true);
                      }}>
                        <Edit2 color="#BAAFA0" size={18} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
              <Text style={styles.sessionDate}>{new Date(activeSession.date).toLocaleDateString()}</Text>
            </View>

            <ScrollView style={styles.notesScroll} contentContainerStyle={styles.notesContainer}>
              {activeSession.notes.length === 0 ? (
                <Text style={styles.emptyText}>Sem anotações neste episódio. Seja o primeiro a escrever!</Text>
              ) : (
                activeSession.notes.map(note => {
                  const isMine = user?.id === note.authorId;
                  const isDMNote = note.author.role === 'DM';

                  return (
                    <View key={note.id} style={[styles.noteCard, isDMNote && styles.noteCardDM]}>
                      <View style={styles.noteHeader}>
                        <View style={styles.authorInfo}>
                          <UserIcon color={isDMNote ? "#C5A059" : "#BAAFA0"} size={14} />
                          <Text style={[styles.authorName, isDMNote && { color: '#C5A059' }]}>
                            {note.author.name}
                          </Text>
                          <Text style={styles.noteDate}>
                            {new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {isMine && (
                            <TouchableOpacity onPress={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteContent(note.content);
                            }}>
                              <Edit2 color="#BAAFA0" size={14} />
                            </TouchableOpacity>
                          )}
                          {(isMine || isDM) && (
                            <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                              <Trash color="#B82828" size={14} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.noteContent}>
                        {editingNoteId === note.id ? (
                          <View>
                            <TextInput
                              style={[styles.textInput, { minHeight: 60, marginBottom: 8, padding: 8 }]}
                              multiline
                              value={editingNoteContent}
                              onChangeText={setEditingNoteContent}
                            />
                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                              <TouchableOpacity style={styles.btnCancel} onPress={() => setEditingNoteId(null)}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.btnSave} onPress={handleUpdateNote}>
                                <Text style={styles.btnSaveText}>Salvar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <Markdown style={darkMarkdownStyles}>
                            {note.content}
                          </Markdown>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {user ? (
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Escreva suas anotações... (Aceita Markdown)"
                  placeholderTextColor="#666"
                  value={newNoteContent}
                  onChangeText={setNewNoteContent}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !newNoteContent.trim() && { opacity: 0.5 }]} 
                  onPress={handlePostNote}
                  disabled={!newNoteContent.trim()}
                >
                  <Text style={styles.sendButtonText}>Registrar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loginRequiredBox}>
                <Text style={styles.loginRequiredText}>Faça login para adicionar anotações.</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noSessionSelected}>
            <BookOpen color="#3D342C" size={48} />
            <Text style={styles.emptyText}>Selecione ou crie uma sessão para abrir o diário.</Text>
          </View>
        )}
      </View>

      {/* Modal Nova Sessão */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Novo Capítulo (Sessão)</Text>
            <Text style={styles.label}>Título do Episódio</Text>
            <TextInput 
              style={styles.input} 
              value={newSessionTitle} 
              onChangeText={setNewSessionTitle} 
              placeholderTextColor="#666" 
              placeholder="Ex: Sessão 5 - A Caverna do Dragão" 
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleCreateSession}>
                <Text style={styles.btnSaveText}>Criar Sessão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const darkMarkdownStyles = {
  body: {
    color: '#E2D8C3',
    fontSize: 15,
    lineHeight: 22,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    color: '#E6C280',
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
    color: '#C5A059',
  },
} as any;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#3D342C',
    paddingRight: 16,
    flexDirection: 'column',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sidebarTitle: {
    color: '#E6C280',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  sessionList: {
    flex: 1,
  },
  sessionTab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sessionTabActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderColor: '#5C4E40',
  },
  sessionTabText: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionTabTextActive: {
    color: '#E6C280',
    fontWeight: 'bold',
  },
  sessionTabDate: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#1A1714',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D342C',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  noSessionSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#80776C',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sessionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sessionTitle: {
    color: '#E6C280',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  sessionDate: {
    color: '#80776C',
    fontSize: 12,
    marginTop: 4,
  },
  notesScroll: {
    flex: 1,
  },
  notesContainer: {
    padding: 20,
    gap: 16,
  },
  noteCard: {
    backgroundColor: 'rgba(36, 32, 28, 0.6)',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
  },
  noteCardDM: {
    borderColor: 'rgba(197, 160, 89, 0.4)',
    backgroundColor: 'rgba(36, 32, 28, 0.8)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    color: '#BAAFA0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noteDate: {
    color: '#666',
    fontSize: 11,
  },
  noteContent: {
    marginTop: 4,
  },
  inputArea: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    backgroundColor: '#110F0D',
  },
  textInput: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    color: '#E2D8C3',
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#C5A059',
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 12,
  },
  sendButtonText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginRequiredBox: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    alignItems: 'center',
  },
  loginRequiredText: {
    color: '#C5A059',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1A1714',
    width: '100%',
    maxWidth: 500,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 24,
  },
  modalTitle: {
    color: '#C5A059',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", serif' : undefined,
  },
  label: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    color: '#fff',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  btnCancelText: {
    color: '#BAAFA0',
    fontWeight: 'bold',
  },
  btnSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#C5A059',
  },
  btnSaveText: {
    color: '#110F0D',
    fontWeight: 'bold',
  }
});
