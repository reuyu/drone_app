import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * AIS 로고 컴포넌트 (로고 스타일)
 * 텍스트 기반 로고를 브랜드 스타일로 표시
 */
export const AISLogo = ({ size = 16, color = '#2196F3' }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.logoBox, { width: size * 1.5, height: size * 1.2 }]}>
        <Text style={[styles.aisText, { fontSize: size * 0.7, color }]}>AIS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  aisText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});
