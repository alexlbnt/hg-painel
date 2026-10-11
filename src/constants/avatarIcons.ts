import React from 'react';
import {
  Sword,
  Shield,
  Flame,
  Sparkles,
  Skull,
  Crown,
  Zap,
  Moon,
  BookOpen,
  Axe,
  Eye,
  Feather,
  Compass,
  Crosshair,
  Sun,
  Ghost,
} from 'lucide-react-native';

export interface AvatarIconPreset {
  id: string;
  label: string;
  category: 'combate' | 'magia' | 'divino' | 'exploracao' | 'sombrio';
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export const AVATAR_ICON_PRESETS: AvatarIconPreset[] = [
  {
    id: 'icon:sword',
    label: 'Lâmina Dourada',
    category: 'combate',
    IconComponent: Sword,
    iconColor: '#E6C280',
    bgColor: '#22190F',
    borderColor: '#8C704F',
    glowColor: 'rgba(230, 194, 128, 0.3)',
  },
  {
    id: 'icon:shield',
    label: 'Escudo Guardião',
    category: 'combate',
    IconComponent: Shield,
    iconColor: '#A4C0E3',
    bgColor: '#111B26',
    borderColor: '#2E5B7D',
    glowColor: 'rgba(164, 192, 227, 0.3)',
  },
  {
    id: 'icon:flame',
    label: 'Chama Dracônica',
    category: 'magia',
    IconComponent: Flame,
    iconColor: '#E39494',
    bgColor: '#261214',
    borderColor: '#8E2F3C',
    glowColor: 'rgba(227, 148, 148, 0.3)',
  },
  {
    id: 'icon:sparkles',
    label: 'Centelha Arcana',
    category: 'magia',
    IconComponent: Sparkles,
    iconColor: '#CDAEE3',
    bgColor: '#1D1426',
    borderColor: '#61427A',
    glowColor: 'rgba(205, 174, 227, 0.3)',
  },
  {
    id: 'icon:crown',
    label: 'Coroa Imperial',
    category: 'divino',
    IconComponent: Crown,
    iconColor: '#E6C280',
    bgColor: '#22190F',
    borderColor: '#8C704F',
    glowColor: 'rgba(230, 194, 128, 0.3)',
  },
  {
    id: 'icon:skull',
    label: 'Caveira Sombria',
    category: 'sombrio',
    IconComponent: Skull,
    iconColor: '#CFC8BC',
    bgColor: '#1C1A17',
    borderColor: '#6E675D',
    glowColor: 'rgba(207, 200, 188, 0.25)',
  },
  {
    id: 'icon:zap',
    label: 'Raio da Tempestade',
    category: 'magia',
    IconComponent: Zap,
    iconColor: '#93CBC0',
    bgColor: '#10201E',
    borderColor: '#3E7A70',
    glowColor: 'rgba(147, 203, 192, 0.3)',
  },
  {
    id: 'icon:moon',
    label: 'Lua Mística',
    category: 'divino',
    IconComponent: Moon,
    iconColor: '#A4C0E3',
    bgColor: '#111B26',
    borderColor: '#2E5B7D',
    glowColor: 'rgba(164, 192, 227, 0.3)',
  },
  {
    id: 'icon:book',
    label: 'Grimório Arcano',
    category: 'magia',
    IconComponent: BookOpen,
    iconColor: '#A3CBA6',
    bgColor: '#12201A',
    borderColor: '#3D6B47',
    glowColor: 'rgba(163, 203, 166, 0.3)',
  },
  {
    id: 'icon:axe',
    label: 'Machado de Batalha',
    category: 'combate',
    IconComponent: Axe,
    iconColor: '#E2AC72',
    bgColor: '#24170D',
    borderColor: '#8A5A2B',
    glowColor: 'rgba(226, 172, 114, 0.3)',
  },
  {
    id: 'icon:eye',
    label: 'Olho Onisciente',
    category: 'sombrio',
    IconComponent: Eye,
    iconColor: '#CDAEE3',
    bgColor: '#1D1426',
    borderColor: '#61427A',
    glowColor: 'rgba(205, 174, 227, 0.3)',
  },
  {
    id: 'icon:feather',
    label: 'Pena do Bardo',
    category: 'divino',
    IconComponent: Feather,
    iconColor: '#E39494',
    bgColor: '#261214',
    borderColor: '#8E2F3C',
    glowColor: 'rgba(227, 148, 148, 0.3)',
  },
  {
    id: 'icon:compass',
    label: 'Bússola Ancestral',
    category: 'exploracao',
    IconComponent: Compass,
    iconColor: '#93CBC0',
    bgColor: '#10201E',
    borderColor: '#3E7A70',
    glowColor: 'rgba(147, 203, 192, 0.3)',
  },
  {
    id: 'icon:crosshair',
    label: 'Mira do Caçador',
    category: 'exploracao',
    IconComponent: Crosshair,
    iconColor: '#A3CBA6',
    bgColor: '#12201A',
    borderColor: '#3D6B47',
    glowColor: 'rgba(163, 203, 166, 0.3)',
  },
  {
    id: 'icon:sun',
    label: 'Sol da Justiça',
    category: 'divino',
    IconComponent: Sun,
    iconColor: '#E2AC72',
    bgColor: '#24170D',
    borderColor: '#8A5A2B',
    glowColor: 'rgba(226, 172, 114, 0.3)',
  },
  {
    id: 'icon:ghost',
    label: 'Espírito Astral',
    category: 'sombrio',
    IconComponent: Ghost,
    iconColor: '#CFC8BC',
    bgColor: '#1C1A17',
    borderColor: '#6E675D',
    glowColor: 'rgba(207, 200, 188, 0.25)',
  },
];

export function getAvatarIconPreset(id?: string | null): AvatarIconPreset | null {
  if (!id) return null;
  const clean = id.trim().toLowerCase();
  return AVATAR_ICON_PRESETS.find((p) => p.id.toLowerCase() === clean) || null;
}

export function isAvatarIconId(id?: string | null): boolean {
  if (!id) return false;
  return id.startsWith('icon:') || !!getAvatarIconPreset(id);
}
