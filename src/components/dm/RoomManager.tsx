import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { useRoom } from '@/contexts/RoomContext';
import { Badge, Card } from '@/components/ui/Card';
import { Colors, Radius } from '@/constants/theme';

/** Super-Mestre: lista as mesas e cria novas (o mestre da mesa é definido pelo username). */
export default function RoomManager() {
  const { rooms, refreshRooms } = useRoom();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [dmUsername, setDmUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    if (name.trim().length < 2 || code.trim().length < 3) {
      return setError('Informe o nome (mín. 2) e o código (mín. 3 caracteres) da mesa.');
    }
    setSaving(true);
    try {
      await ApiService.createRoom({
        name: name.trim(),
        code: code.trim().toUpperCase().replace(/\s+/g, '-'),
        dmUsername: dmUsername.trim().toLowerCase() || null,
        dmName: dmUsername.trim() ? `${dmUsername.trim()} (Mestre)` : 'Mestre',
      });
      setName('');
      setCode('');
      setDmUsername('');
      await refreshRooms();
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar a mesa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Mesas da campanha">
      <View style={styles.list}>
        {rooms.map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.roomName}>{r.name}</Text>
            <Badge label={r.code} />
            <Text style={styles.meta}>
              {r.dmUsername ? `Mestre: ${r.dmUsername}` : 'Sem mestre definido'}
              {typeof r._count?.characters === 'number' ? ` · ${r._count.characters} ficha(s)` : ''}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.subtitle}>Nova mesa</Text>
      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome (ex.: Mesa das Cinzas)"
          placeholderTextColor={Colors.fantasy.textMuted}
          accessibilityLabel="Nome da nova mesa"
          style={styles.input}
        />
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="Código único (ex.: MESA-CINZAS)"
          placeholderTextColor={Colors.fantasy.textMuted}
          accessibilityLabel="Código da nova mesa"
          style={styles.input}
        />
        <TextInput
          value={dmUsername}
          onChangeText={setDmUsername}
          autoCapitalize="none"
          placeholder="Username do mestre (opcional)"
          placeholderTextColor={Colors.fantasy.textMuted}
          accessibilityLabel="Username do mestre da nova mesa"
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          onPress={create}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Criar mesa"
          style={[styles.btn, saving && { opacity: 0.6 }]}
        >
          {saving ? (
            <ActivityIndicator color="#110F0D" />
          ) : (
            <>
              <Plus color="#110F0D" size={16} />
              <Text style={styles.btnText}>Criar mesa</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  roomName: { color: Colors.fantasy.text, fontWeight: '700', fontSize: 14 },
  meta: { color: Colors.fantasy.textMuted, fontSize: 12 },
  subtitle: { color: Colors.fantasy.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 6 },
  form: { gap: 8 },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    color: Colors.fantasy.text,
    backgroundColor: Colors.fantasy.background,
  },
  error: { color: '#E26A6A', fontSize: 12 },
  btn: {
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.fantasy.gold,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#110F0D', fontWeight: '800' },
});
