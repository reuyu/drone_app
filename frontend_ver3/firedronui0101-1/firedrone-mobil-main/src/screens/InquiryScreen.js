import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { mockDetectionHistory } from '../utils/mockData';
import { fetchDetectionHistory, fetchDroneLogs } from '../utils/api';
import { getDangerLevel } from '../utils/weather';
import { DetectionDetailModal } from '../components/DetectionDetailModal';
import { AISLogo } from '../components/AISLogo';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { Calendar } from 'lucide-react-native';

export const InquiryScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);

  // route에서 드론 정보 가져오기 (선택 사항)
  useEffect(() => {
    if (route?.params?.drone) {
      setSelectedDrone(route.params.drone);
    }
  }, [route]);

  // 날짜 변경 시 로그 조회
  useEffect(() => {
    if (selectedDrone) {
      loadHistory();
    } else {
      // 드론이 없으면 모의 데이터 사용
      const mockFiltered = mockDetectionHistory.filter((item) => {
        const itemDate = format(item.drone_connect_time || item.timestamp, 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return itemDate === selectedDateStr;
      }).sort((a, b) => 
        (b.smoke_score || b.detection_probability || b.probability) - 
        (a.smoke_score || a.detection_probability || a.probability)
      );
      setFilteredHistory(mockFiltered);
    }
  }, [selectedDate, selectedDrone]);

  const loadHistory = async () => {
    if (!selectedDrone) return;
    
    setIsLoading(true);
    try {
      const droneName = selectedDrone.drone_name || selectedDrone.name;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const logs = await fetchDroneLogs(droneName, dateStr);
      
      if (logs && logs.length > 0) {
        // 서버 데이터를 화면에 맞게 변환
        const formattedLogs = logs.map(log => ({
          id: log.id,
          drone_db_id: log.drone_db_id || selectedDrone.drone_db_id,
          drone_name: droneName,
          smoke_score: log.confidence ? (log.confidence * 100) : null,
          detection_probability: log.confidence ? (log.confidence * 100) : null,
          drone_connect_time: log.event_time ? new Date(log.event_time) : new Date(),
          image_url: log.image_path,
          drone_lat: log.gps_lat,
          drone_lon: log.gps_lon,
        })).sort((a, b) => 
          (b.smoke_score || b.detection_probability || 0) - 
          (a.smoke_score || a.detection_probability || 0)
        );
        setFilteredHistory(formattedLogs);
      } else {
        setFilteredHistory([]);
      }
    } catch (error) {
      console.error('Load history error:', error);
      // 에러 시 모의 데이터 사용
      const mockFiltered = mockDetectionHistory.filter((item) => {
        const itemDate = format(item.drone_connect_time || item.timestamp, 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return itemDate === selectedDateStr;
      }).sort((a, b) => 
        (b.smoke_score || b.detection_probability || b.probability) - 
        (a.smoke_score || a.detection_probability || a.probability)
      );
      setFilteredHistory(mockFiltered);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
      }
    } else {
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleDetectionPress = (detection) => {
    setSelectedDetection(detection);
    setModalVisible(true);
  };

  const renderHistoryItem = ({ item }) => {
    const smokeScore = item.smoke_score || item.detection_probability || item.probability || 0;
    const dangerLevel = item.weather 
      ? getDangerLevel(item.weather.humidity, item.weather.windSpeed)
      : { color: '#34C759', text: '안전' };

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleDetectionPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image_url || item.image }} style={styles.historyImage} />
        <View style={styles.historyInfo}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTime}>
              {format(item.drone_connect_time || item.timestamp, 'HH:mm:ss', { locale: ko })}
            </Text>
            <View style={[styles.dangerBadge, { backgroundColor: dangerLevel.color + '20' }]}>
              <Text style={[styles.dangerBadgeText, { color: dangerLevel.color }]}>
                {dangerLevel.text}
              </Text>
            </View>
          </View>
          <View style={styles.historyDetails}>
            <Text style={styles.droneIdText}>{item.drone_name || `Drone #${item.drone_db_id || item.droneId}`}</Text>
            <Text style={[styles.probabilityText, { color: smokeScore >= 90 ? '#FF3B30' : smokeScore >= 75 ? '#FF9500' : '#000' }]}>
              확률: {smokeScore}%
            </Text>
          </View>
          {item.weather && (
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherText}>
                풍속 {item.weather.windSpeed.toFixed(1)}m/s • 습도 {item.weather.humidity.toFixed(1)}% • {item.weather.windDirection}
              </Text>
            </View>
          )}
          {item.drone_lat && item.drone_lon && (
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsText}>
                GPS: {item.drone_lat.toFixed(6)}, {item.drone_lon.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>조회</Text>
          {/* AIS 로고 - 헤더 텍스트와 같은 높이 */}
          <View style={styles.topLogoContainer}>
            <AISLogo size={16} color="#2196F3" />
          </View>
        </View>
      </View>

      {/* 날짜 선택 버튼 */}
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setDatePickerVisible(true)}
      >
        <Calendar size={20} color="#000" />
        <Text style={styles.datePickerText}>
          {format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })}
        </Text>
        <Text style={styles.datePickerArrow}>›</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.emptyText}>로딩 중...</Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            선택한 날짜({format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })})에
          </Text>
          <Text style={styles.emptyText}>감지된 기록이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<CopyrightFooter />}
        />
      )}

      {/* 날짜 선택기 - Android */}
      {Platform.OS === 'android' && datePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* 날짜 선택기 - iOS Modal */}
      {Platform.OS === 'ios' && datePickerVisible && (
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.modalCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>날짜 선택</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.modalDone}>완료</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

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
  headerContainer: {
    position: 'relative',
  },
  header: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  datePickerArrow: {
    fontSize: 20,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  historyTime: {
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
    fontWeight: '700',
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
  gpsInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gpsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalDone: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
});

