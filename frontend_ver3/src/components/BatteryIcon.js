import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Battery } from 'lucide-react-native';

export const BatteryIcon = ({ percentage, size = 20 }) => {
  const getBatteryColor = (percent) => {
    if (percent > 50) return '#34C759'; // 초록색
    if (percent > 20) return '#FF9500'; // 주황색
    return '#FF3B30'; // 빨간색
  };

  return (
    <View style={styles.container}>
      <Battery size={size} color={getBatteryColor(percentage)} strokeWidth={2} />
      <View 
        style={[
          styles.batteryFill, 
          { 
            width: `${Math.max(0, Math.min(100, percentage))}%`,
            backgroundColor: getBatteryColor(percentage),
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 24,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryFill: {
    position: 'absolute',
    height: 8,
    borderRadius: 1,
    left: 2,
    top: 2,
  },
});

