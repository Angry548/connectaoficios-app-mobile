import React from 'react';
import { Image } from 'react-native';

export default function BrandMark({ size = 52, style }) {
  return <Image accessibilityLabel="ConnectaOficios" source={require('../assets/brand/app-icon.png')}
    style={[{ width: size, height: size, borderRadius: Math.round(size * 0.26) }, style]} />;
}
