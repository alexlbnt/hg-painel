import { X, Search, Loader2, BookOpen, PlusCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, FlatList, ActivityIndicator, Platform, ScrollView } from 'react-native';

interface SrdSearchResult {
  index: string;
  name: string;
  url: string;
}

interface SrdSearchModalProps {
  visible: boolean;
  type: 'spell' | 'ability';
  onClose: () => void;
  onSelect: (data: any) => void;
  themeColor?: string;
}

export function SrdSearchModal({ visible, type, onClose, onSelect, themeColor = '#C5A059' }: SrdSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SrdSearchResult[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    setLoadingList(true);
    setError('');
    try {
      const endpoint = type === 'spell' ? 'spells' : 'features';
      // Busca aproximada pelo nome
      const res = await fetch(`https://www.dnd5eapi.co/api/${endpoint}/?name=${encodeURIComponent(query)}`);
      
      if (!res.ok) throw new Error('Erro na busca');
      
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError('Erro ao buscar dados do SRD.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelect = async (item: SrdSearchResult) => {
    setLoadingDetail(item.index);
    setError('');
    try {
      const endpoint = type === 'spell' ? 'spells' : 'features';
      const res = await fetch(`https://www.dnd5eapi.co/api/${endpoint}/${item.index}`);
      if (!res.ok) throw new Error('Falha ao buscar detalhes');
      const details = await res.json();

      // Mapear para o formato do nosso app
      if (type === 'spell') {
        const spellData = {
          name: details.name,
          level: details.level || 0,
          castingTime: details.casting_time || '1 Ação',
          range: details.range || 'Toque',
          duration: details.duration || 'Instantânea',
          components: (details.components || []).join(', '),
          description: (details.desc || []).join('\n\n') + 
            (details.higher_level ? '\n\nEm níveis superiores: ' + details.higher_level.join('\n') : ''),
          isPrepared: false
        };
        onSelect(spellData);
      } else {
        const abilityData = {
          name: details.name,
          description: (details.desc || []).join('\n\n'),
          maxUses: 1, // Default
          currentUses: 1,
          resetType: 'SHORT_REST'
        };
        onSelect(abilityData);
      }
    } catch (err: any) {
      setError('Erro ao baixar detalhes completos.');
    } finally {
      setLoadingDetail(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <BookOpen color={themeColor} size={22} />
              <Text style={styles.title}>
                Buscar {type === 'spell' ? 'Magia' : 'Habilidade'} (SRD)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#BAAFA0" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search color="#80776C" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Digite o nome (em Inglês)..."
              placeholderTextColor="#80776C"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loadingList ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={themeColor} size="large" />
              <Text style={styles.loadingText}>Procurando nos pergaminhos antigos...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.index}
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                  disabled={!!loadingDetail}
                >
                  <View style={styles.resultTextCol}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultUrl}>{item.url}</Text>
                  </View>
                  
                  {loadingDetail === item.index ? (
                    <ActivityIndicator color={themeColor} size="small" />
                  ) : (
                    <PlusCircle color={themeColor} size={22} />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : query.length >= 3 ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Nenhum feitiço ou habilidade encontrado.</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Digite pelo menos 3 letras para buscar.</Text>
            </View>
          )}

          <Text style={styles.footerNote}>
            Baseado na 5e SRD (System Reference Document). O conteúdo retornado pela API oficial está em Inglês.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 15, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#E2D8C3',
    fontSize: 16,
    paddingVertical: 16,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
    outlineStyle: 'none' as any, // Web focus fix
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#BAAFA0',
    marginTop: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  errorText: {
    color: '#C95B5B',
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  resultTextCol: {
    flex: 1,
  },
  resultName: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultUrl: {
    color: '#80776C',
    fontSize: 12,
  },
  footerNote: {
    padding: 12,
    color: '#80776C',
    fontSize: 11,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    fontStyle: 'italic',
  }
});
