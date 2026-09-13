import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BookOpen, Edit2, Check, X, FileText, Eye } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

interface ChronicleBiographyProps {
  backstory: string;
  themeColor?: string;
  onSaveBackstory: (newBackstory: string) => void;
}

const TEMPLATE_ORIGIN = `## 📜 Origem & Juventude
Nascido sob a bênção de tempos mais simples, cresci em...

## ⚔️ O Ponto de Virada
Tudo mudou no dia em que...

## 🧭 O Chamado à Aventura & Motivação
Hoje viajo com meus companheiros porque busco...

## 🎯 Objetivo Atual
Meu foco imediato nesta jornada é...`;

const TEMPLATE_CHRONICLE = `## 🏕️ Diário das Sessões
- **Capítulo I:** O encontro na taverna e o primeiro contrato.
- **Capítulo II:** Os perigos das ruínas esquecidas.`;

export const ChronicleBiography: React.FC<ChronicleBiographyProps> = ({
  backstory,
  themeColor = '#C5A059',
  onSaveBackstory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(backstory);
  const [previewMode, setPreviewMode] = useState(false);

  const handleStartEdit = () => {
    setTempText(backstory);
    setPreviewMode(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewMode(false);
  };

  const handleSave = () => {
    onSaveBackstory(tempText);
    setIsEditing(false);
    setPreviewMode(false);
  };

  const insertTemplate = (tmpl: string) => {
    if (tempText.trim()) {
      setTempText(tempText + '\n\n' + tmpl);
    } else {
      setTempText(tmpl);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <BookOpen size={14} color={themeColor} />
          <Text style={styles.headerTitle}>CRÔNICAS & BIOGRAFIA DO AVENTUREIRO</Text>
        </View>

        {!isEditing ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleStartEdit}
            activeOpacity={0.7}
          >
            <Edit2 size={11} color="#BAAFA0" />
            <Text style={styles.actionBtnText}>Editar Biografia</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                previewMode && { backgroundColor: '#262017', borderColor: themeColor },
              ]}
              onPress={() => setPreviewMode(!previewMode)}
              activeOpacity={0.7}
            >
              <Eye size={11} color={previewMode ? themeColor : '#BAAFA0'} />
              <Text style={[styles.actionBtnText, previewMode && { color: themeColor }]}>
                {previewMode ? 'Editor' : 'Prévia'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <X size={11} color="#D97777" />
              <Text style={[styles.actionBtnText, { color: '#D97777' }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: themeColor, borderColor: themeColor }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Check size={11} color="#110F0D" />
              <Text style={[styles.actionBtnText, { color: '#110F0D' }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barra de Ferramentas de Templates no Modo Edição */}
      {isEditing && !previewMode && (
        <View style={styles.templateBar}>
          <Text style={styles.templateBarLabel}>Modelos rápidos:</Text>
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() => insertTemplate(TEMPLATE_ORIGIN)}
            activeOpacity={0.7}
          >
            <FileText size={10} color="#BAAFA0" />
            <Text style={styles.templateBtnText}>+ Modelo Canônico D&D</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() => insertTemplate(TEMPLATE_CHRONICLE)}
            activeOpacity={0.7}
          >
            <FileText size={10} color="#BAAFA0" />
            <Text style={styles.templateBtnText}>+ Diário de Sessões</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Conteúdo */}
      {isEditing ? (
        previewMode ? (
          <View style={styles.previewContainer}>
            {tempText.trim() ? (
              <Markdown style={markdownStyles}>{tempText}</Markdown>
            ) : (
              <Text style={styles.emptyPreviewText}>Nenhum texto para visualizar.</Text>
            )}
          </View>
        ) : (
          <TextInput
            style={styles.textInput}
            multiline
            value={tempText}
            onChangeText={setTempText}
            placeholder="Conte a história, origens, lendas e o diário do seu aventureiro (suporta Markdown com ## títulos, *itálico*, **negrito**)..."
            placeholderTextColor="#5C5449"
          />
        )
      ) : backstory ? (
        <View style={styles.markdownWrap}>
          <Markdown style={markdownStyles}>{backstory}</Markdown>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyBox}
          onPress={handleStartEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>
            Nenhuma história ou crônica redigida ainda. Toque aqui para escrever a lenda do seu herói!
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#25201A',
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
  actionBtnText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  cancelBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#2A1818',
  },
  editActions: {
    flexDirection: 'row',
    gap: 5,
  },
  templateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#26201A',
    padding: 6,
    borderRadius: 5,
  },
  templateBarLabel: {
    color: '#6E6557',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1814',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  templateBtnText: {
    color: '#BAAFA0',
    fontSize: 9.5,
  },
  textInput: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 12,
    minHeight: 260,
    fontSize: 13,
    textAlignVertical: 'top',
    lineHeight: 19,
  },
  previewContainer: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#2B241C',
    borderRadius: 6,
    padding: 12,
    minHeight: 180,
  },
  emptyPreviewText: {
    color: '#60574D',
    fontSize: 12,
    fontStyle: 'italic',
  },
  markdownWrap: {
    paddingVertical: 4,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#5C5449',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

const markdownStyles = {
  body: {
    color: '#DDD2BE',
    fontSize: 12.5,
    lineHeight: 20,
  },
  heading1: {
    color: '#E6C280',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  heading2: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  heading3: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: 'bold' as const,
    marginTop: 6,
    marginBottom: 3,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
  },
  em: {
    color: '#D1C4AD',
    fontStyle: 'italic' as const,
  },
  blockquote: {
    backgroundColor: '#171410',
    borderLeftColor: '#C5A059',
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
  },
  code_inline: {
    backgroundColor: '#14120F',
    color: '#E6C280',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
};
