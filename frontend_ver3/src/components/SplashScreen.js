import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AISLogo } from './AISLogo';

// 스플래시 스크린이 자동으로 숨겨지지 않도록 설정
SplashScreen.preventAutoHideAsync();

export const AppSplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // 앱 초기화 작업 시뮬레이션 (2초)
    const timer = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
        if (onFinish) {
          onFinish();
        }
      } catch (error) {
        console.error('Splash screen hide error:', error);
        if (onFinish) {
          onFinish();
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <AISLogo size={48} color="#2196F3" />
      <ActivityIndicator 
        size="small" 
        color="#2196F3" 
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 24,
  },
});

