import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 저작권 표시 컴포넌트 (업계 표준)
 * 앱 하단에 작게 표시되는 저작권 정보
 */
export const CopyrightFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <View style={styles.container}>
      <Text style={styles.copyrightText}>
        © {currentYear} AIS. All rights reserved.
      </Text>
      <Text style={styles.madeByText}>
        Made by AIS Lab
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  copyrightText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '400',
    marginBottom: 4,
  },
  madeByText: {
    fontSize: 9,
    color: '#C7C7CC',
    fontWeight: '400',
  },
});

