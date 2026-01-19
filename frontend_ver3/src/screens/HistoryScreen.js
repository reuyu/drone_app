import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { mockDetectionHistory } from '../utils/mockData';
import { getDangerLevel } from '../utils/weather';
import { DetectionDetailModal } from '../components/DetectionDetailModal';

export const HistoryScreen = ({ navigation }) => {
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 위험도순으로 정렬 (확률 높은 순)
  const sortedHistory = [...mockDetectionHistory].sort(
    (a, b) => b.probability - a.probability
  );

  const handleDetectionPress = (detection) => {
    setSelectedDetection(detection);
    setModalVisible(true);
  };

  const renderHistoryItem = ({ item }) => {
    const dangerLevel = getDangerLevel(item.weather.humidity, item.weather.windSpeed);

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleDetectionPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image }} style={styles.historyImage} />
        <View style={styles.historyInfo}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyDate}>
              {format(item.timestamp, 'yyyy년 MM월 dd일', { locale: ko })}
            </Text>
            <View style={[styles.dangerBadge, { backgroundColor: dangerLevel.color + '20' }]}>
              <Text style={[styles.dangerBadgeText, { color: dangerLevel.color }]}>
                {dangerLevel.text}
              </Text>
            </View>
          </View>
          <Text style={styles.historyTime}>
            {format(item.timestamp, 'HH:mm:ss', { locale: ko })}
          </Text>
          <View style={styles.historyDetails}>
            <Text style={styles.droneIdText}>Drone #{item.droneId}</Text>
            <Text style={styles.probabilityText}>확률: {item.probability}%</Text>
          </View>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>
              풍속 {item.weather.windSpeed.toFixed(1)}m/s • 습도 {item.weather.humidity.toFixed(1)}% • {item.weather.windDirection}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>화재 감지 이력</Text>
      </View>
      <FlatList
        data={sortedHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <DetectionDetailModal
        visible={modalVisible}
        detection={selectedDetection}
        onClose={() => {
          setModalVisible(false);
          setSelectedDetection(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  listContainer: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  historyImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  historyInfo: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dangerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dangerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  droneIdText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  probabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  weatherInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  weatherText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});

