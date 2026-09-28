import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Crown, Sparkles, Shield, User } from 'lucide-react-native';
import { getAvatarIconPreset, isAvatarIconId } from '@/constants/avatarIcons';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  fallbackRole?: string;
  showBorder?: boolean;
  borderWidth?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  size = 36,
  style,
  imageStyle,
  fallbackRole,
  showBorder = true,
  borderWidth = 1,
}) => {
  const cleanUrl = (avatarUrl || '').trim();
  const iconPreset = getAvatarIconPreset(cleanUrl);

  const borderRadius = size / 2;

  // 1. Caso seja um ícone colorido heróico
  if (iconPreset) {
    const IconComp = iconPreset.IconComponent;
    const iconSize = Math.max(12, Math.round(size * 0.52));

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: iconPreset.bgColor,
            borderColor: showBorder ? iconPreset.borderColor : 'transparent',
            borderWidth: showBorder ? borderWidth : 0,
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={name ? `Avatar de ${name}: ${iconPreset.label}` : iconPreset.label}
      >
        <IconComp size={iconSize} color={iconPreset.iconColor} />
      </View>
    );
  }

  // 2. Caso seja uma URL de imagem externa (http/https/data)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    const roleBorderColor =
      fallbackRole === 'DM'
        ? '#C5A059'
        : fallbackRole === 'MECHANIC'
        ? '#4E9C8E'
        : '#8C704F';

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: '#12100E',
            borderColor: showBorder ? roleBorderColor : 'transparent',
            borderWidth: showBorder ? borderWidth : 0,
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={name ? `Foto de ${name}` : 'Avatar do usuário'}
      >
        <Image
          source={{ uri: cleanUrl }}
          style={[styles.image, { width: '100%', height: '100%' }, imageStyle]}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  // 3. Fallback de Role / Padrão
  const isDm = fallbackRole === 'DM';
  const isMechanic = fallbackRole === 'MECHANIC';
  const fallbackBorderColor = isDm ? '#C5A059' : isMechanic ? '#4E9C8E' : '#5C4E40';
  const fallbackIconColor = isDm ? '#C5A059' : isMechanic ? '#4E9C8E' : '#BAAFA0';
  const iconSize = Math.max(12, Math.round(size * 0.5));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: '#161412',
          borderColor: showBorder ? fallbackBorderColor : 'transparent',
          borderWidth: showBorder ? borderWidth : 0,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Perfil de ${name}` : 'Avatar'}
    >
      {isDm ? (
        <Crown size={iconSize} color={fallbackIconColor} />
      ) : isMechanic ? (
        <Sparkles size={iconSize} color={fallbackIconColor} />
      ) : (
        <Shield size={iconSize} color={fallbackIconColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
