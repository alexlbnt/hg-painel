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
    iconColor: '#F59E0B',
    bgColor: '#24190C',
    borderColor: '#D97706',
    glowColor: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'icon:shield',
    label: 'Escudo Guardião',
    category: 'combate',
    IconComponent: Shield,
    iconColor: '#38BDF8',
    bgColor: '#0C1E2D',
    borderColor: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.35)',
  },
  {
    id: 'icon:flame',
    label: 'Chama Dracônica',
    category: 'magia',
    IconComponent: Flame,
    iconColor: '#EF4444',
    bgColor: '#280F0F',
    borderColor: '#DC2626',
    glowColor: 'rgba(239, 68, 68, 0.35)',
  },
  {
    id: 'icon:sparkles',
    label: 'Centelha Arcana',
    category: 'magia',
    IconComponent: Sparkles,
    iconColor: '#C084FC',
    bgColor: '#1F102F',
    borderColor: '#9333EA',
    glowColor: 'rgba(192, 132, 252, 0.35)',
  },
  {
    id: 'icon:crown',
    label: 'Coroa Imperial',
    category: 'divino',
    IconComponent: Crown,
    iconColor: '#FACC15',
    bgColor: '#28200A',
    borderColor: '#CA8A04',
    glowColor: 'rgba(250, 204, 21, 0.35)',
  },
  {
    id: 'icon:skull',
    label: 'Caveira Sombria',
    category: 'sombrio',
    IconComponent: Skull,
    iconColor: '#E2E8F0',
    bgColor: '#1C1917',
    borderColor: '#64748B',
    glowColor: 'rgba(226, 232, 240, 0.35)',
  },
  {
    id: 'icon:zap',
    label: 'Raio da Tempestade',
    category: 'magia',
    IconComponent: Zap,
    iconColor: '#22D3EE',
    bgColor: '#0A222B',
    borderColor: '#0891B2',
    glowColor: 'rgba(34, 211, 238, 0.35)',
  },
  {
    id: 'icon:moon',
    label: 'Lua Mística',
    category: 'divino',
    IconComponent: Moon,
    iconColor: '#A5B4FC',
    bgColor: '#12162B',
    borderColor: '#6366F1',
    glowColor: 'rgba(165, 180, 252, 0.35)',
  },
  {
    id: 'icon:book',
    label: 'Grimório Arcano',
    category: 'magia',
    IconComponent: BookOpen,
    iconColor: '#34D399',
    bgColor: '#0A241A',
    borderColor: '#059669',
    glowColor: 'rgba(52, 211, 153, 0.35)',
  },
  {
    id: 'icon:axe',
    label: 'Machado de Batalha',
    category: 'combate',
    IconComponent: Axe,
    iconColor: '#FB923C',
    bgColor: '#29160B',
    borderColor: '#EA580C',
    glowColor: 'rgba(251, 146, 60, 0.35)',
  },
  {
    id: 'icon:eye',
    label: 'Olho Onisciente',
    category: 'sombrio',
    IconComponent: Eye,
    iconColor: '#E879F9',
    bgColor: '#270D29',
    borderColor: '#C026D3',
    glowColor: 'rgba(232, 121, 249, 0.35)',
  },
  {
    id: 'icon:feather',
    label: 'Pena do Bardo',
    category: 'divino',
    IconComponent: Feather,
    iconColor: '#F472B6',
    bgColor: '#2A0E1D',
    borderColor: '#DB2777',
    glowColor: 'rgba(244, 114, 182, 0.35)',
  },
  {
    id: 'icon:compass',
    label: 'Bússola Ancestral',
    category: 'exploracao',
    IconComponent: Compass,
    iconColor: '#2DD4BF',
    bgColor: '#0B2524',
    borderColor: '#0D9488',
    glowColor: 'rgba(45, 212, 191, 0.35)',
  },
  {
    id: 'icon:crosshair',
    label: 'Mira do Caçador',
    category: 'exploracao',
    IconComponent: Crosshair,
    iconColor: '#A3E635',
    bgColor: '#17240B',
    borderColor: '#65A30D',
    glowColor: 'rgba(163, 230, 53, 0.35)',
  },
  {
    id: 'icon:sun',
    label: 'Sol da Justiça',
    category: 'divino',
    IconComponent: Sun,
    iconColor: '#FBBF24',
    bgColor: '#2B1D08',
    borderColor: '#D97706',
    glowColor: 'rgba(251, 191, 36, 0.35)',
  },
  {
    id: 'icon:ghost',
    label: 'Espírito Astral',
    category: 'sombrio',
    IconComponent: Ghost,
    iconColor: '#CBD5E1',
    bgColor: '#161E2E',
    borderColor: '#475569',
    glowColor: 'rgba(203, 213, 225, 0.35)',
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
