import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { AlertTriangle } from 'lucide-react-native';

export const DetectionCard = ({ detection, onPress }) => {
  // Jetson AI 분석 결과의 연기 점수 또는 탐지 확률 사용
  const probability = detection.smoke_score || detection.detection_probability || detection.probability || 0;
  
  // 확신도에 따른 경고 레벨 계산
  const getWarningLevel = (probability) => {
    if (probability >= 90) {
      return {
        level: 'critical',
        color: '#FF3B30',
        text: '🚨 매우 위험',
        bgColor: '#FF3B3015',
      };
    } else if (probability >= 75) {
      return {
        level: 'high',
        color: '#FF9500',
        text: '⚠️ 위험',
        bgColor: '#FF950015',
      };
    } else if (probability >= 60) {
      return {
        level: 'medium',
        color: '#FFCC00',
        text: '주의',
        bgColor: '#FFCC0015',
      };
    }
    return {
      level: 'low',
      color: '#34C759',
      text: '정상',
      bgColor: '#34C75915',
    };
  };

  const warning = getWarningLevel(detection.probability);

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: warning.color, borderWidth: detection.probability >= 75 ? 2 : 1 }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={[styles.warningBadge, { backgroundColor: warning.bgColor }]}>
        <AlertTriangle size={12} color={warning.color} />
        <Text style={[styles.warningText, { color: warning.color }]}>
          {warning.text}
        </Text>
      </View>
      <Image source={{ uri: detection.image_url || detection.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.time}>
          {format(detection.drone_connect_time || detection.timestamp, 'HH:mm', { locale: ko })}
        </Text>
        <View style={styles.probabilityContainer}>
          <Text style={[styles.probability, { color: warning.color }]}>
            {probability}%
          </Text>
          {probability >= 90 && (
            <Text style={styles.criticalText}>🔥 긴급!</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  infoContainer: {
    padding: 12,
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  probabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  probability: {
    fontSize: 18,
    fontWeight: '700',
  },
  criticalText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
});

