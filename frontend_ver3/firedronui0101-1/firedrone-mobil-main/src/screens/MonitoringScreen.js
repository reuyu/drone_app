import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getWeatherData, getDangerLevel } from '../utils/weather';
import { requestNotificationPermissions, scheduleTestNotification, sendFireDetectionNotification } from '../utils/notifications';
import { mockDetectionLogs, mockVideoUrls } from '../utils/mockData';
import { fetchStreamVideoUrl, fetchRealtimeDetection, fetchDroneLogs, fetchLivePhotos } from '../utils/api';
import { DetectionCard } from '../components/DetectionCard';
import { DetectionDetailModal } from '../components/DetectionDetailModal';
import { AISLogo } from '../components/AISLogo';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { AlertTriangle, Bell } from 'lucide-react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';

export const MonitoringScreen = ({ route, navigation }) => {
  const { drone } = route.params || {};
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [weather, setWeather] = useState(null);
  const [dangerLevel, setDangerLevel] = useState(null);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [livePhotos, setLivePhotos] = useState([]);

  useEffect(() => {
    // 타임아웃 추가: 최대 5초 후에는 로딩 해제
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Initialize screen timeout, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    initializeScreen().catch((error) => {
      console.error('Initialize screen failed:', error);
      setLoading(false);
    });

    return () => clearTimeout(timeout);
  }, []);

  // 로그 및 라이브 포토 폴링
  useEffect(() => {
    if (!drone || loading) return;

    const loadData = async () => {
      const droneName = drone.drone_name || drone.name;
      if (!droneName) return;

      try {
        // 최근 로그 10개 조회
        const recentLogs = await fetchDroneLogs(droneName);
        if (recentLogs && recentLogs.length > 0) {
          setLogs(recentLogs);
        }

        // 라이브 포토 조회
        const photos = await fetchLivePhotos(droneName);
        if (photos && photos.length > 0) {
          setLivePhotos(photos);
        }
      } catch (error) {
        console.error('Load data error:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 1000); // 1초 간격
    return () => clearInterval(interval);
  }, [drone, loading]);

  // 산불 감지 시 자동 알림 (확신도 75% 이상)
  // Jetson Orin Nano의 RT-DETR 모델 분석 결과 모니터링
  useEffect(() => {
    if (loading) return;

    const checkForFireDetection = async () => {
      const droneDbId = drone.drone_db_id || drone.id;
      
      // 실시간 감지 데이터 조회 (Jetson에서 분석한 데이터)
      const realtimeData = await fetchRealtimeDetection(droneDbId);
      
      if (realtimeData && realtimeData.smoke_score >= 75) {
        await sendFireDetectionNotification(
          droneDbId,
          realtimeData.smoke_score || realtimeData.detection_probability
        );
        return;
      }

      // 모의 데이터로 폴백
      const criticalDetections = mockDetectionLogs.filter(
        (detection) => 
          (detection.smoke_score >= 75 || detection.detection_probability >= 75) && 
          detection.drone_db_id === droneDbId
      );

      if (criticalDetections.length > 0) {
        const mostRecent = criticalDetections[0];
        await sendFireDetectionNotification(
          droneDbId,
          mostRecent.smoke_score || mostRecent.detection_probability
        );
      }
    };

    checkForFireDetection();
  }, [loading, drone.drone_db_id, drone.id]);

  const initializeScreen = async () => {
    try {
      let currentLocation = null;

      // 드론의 GPS 정보 사용 (MySQL의 drone_lat, drone_lon)
      if (drone.drone_lat && drone.drone_lon) {
        currentLocation = {
          coords: {
            latitude: parseFloat(drone.drone_lat),
            longitude: parseFloat(drone.drone_lon),
          }
        };
        setLocation(currentLocation.coords);
      } else {
        // GPS 정보가 없으면 현재 위치 사용
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);
          } else {
            // 위치 권한이 없으면 기본값 사용
            currentLocation = {
              coords: {
                latitude: 37.5665,
                longitude: 126.9780,
              }
            };
            setLocation(currentLocation.coords);
          }
        } catch (error) {
          console.error('Location error:', error);
          // 위치 권한 오류 시 기본값 사용
          currentLocation = {
            coords: {
              latitude: 37.5665,
              longitude: 126.9780,
            }
          };
          setLocation(currentLocation.coords);
        }
      }

      // 알림 권한 요청
      await requestNotificationPermissions();

      // 비디오 스트리밍 URL 조회 (video_url 테이블)
      const droneName = drone.drone_name || drone.name;
      try {
        const videoUrl = await fetchStreamVideoUrl(droneName);
        if (videoUrl) {
          setStreamUrl(videoUrl);
        } else {
          // 모의 데이터 사용
          setStreamUrl(mockVideoUrls[droneName] || null);
        }
      } catch (error) {
        console.error('Video URL error:', error);
        setStreamUrl(mockVideoUrls[droneName] || null);
      }

      // 기상 데이터 가져오기 (위치 정보가 있을 때만)
      if (currentLocation && currentLocation.coords) {
        try {
          const weatherData = await getWeatherData(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
          setWeather(weatherData);

          // 위험 등급 계산
          const danger = getDangerLevel(weatherData.humidity, weatherData.windSpeed);
          setDangerLevel(danger);
        } catch (error) {
          console.error('Weather data error:', error);
          // 기본 날씨 데이터 설정
          const defaultWeather = { windSpeed: 5, humidity: 50 };
          setWeather(defaultWeather);
          setDangerLevel(getDangerLevel(defaultWeather.humidity, defaultWeather.windSpeed));
        }
      } else {
        // 기본 날씨 데이터 설정
        const defaultWeather = { windSpeed: 5, humidity: 50 };
        setWeather(defaultWeather);
        setDangerLevel(getDangerLevel(defaultWeather.humidity, defaultWeather.windSpeed));
      }
    } catch (error) {
      console.error('Initialize screen error:', error);
      // 에러 발생 시에도 기본값으로 화면 표시
      setLocation({ latitude: 37.5665, longitude: 126.9780 });
      setWeather({ windSpeed: 5, humidity: 50 });
      setDangerLevel(getDangerLevel(50, 5));
    } finally {
      setLoading(false);
    }
  };

  const handleTestFire = async () => {
    const droneDbId = drone.drone_db_id || drone.id;
    await scheduleTestNotification(droneDbId, 98);
    Alert.alert('알림 예약', '3초 후 화재 감지 알림이 전송됩니다.');
  };

  const handleDetectionPress = (detection) => {
    setSelectedDetection(detection);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  // drone이 없으면 로딩 상태 유지
  if (!drone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  // 로그 데이터 처리 (서버 데이터 우선, 없으면 모의 데이터)
  const droneDbId = drone.drone_db_id || drone.id;
  const droneName = drone.drone_name || drone.name;
  
  // 서버에서 가져온 로그가 있으면 사용, 없으면 모의 데이터 사용
  const displayLogs = logs.length > 0 
    ? logs.map(log => ({
        id: log.id,
        drone_db_id: log.drone_db_id || droneDbId,
        drone_name: droneName,
        smoke_score: log.confidence ? (log.confidence * 100) : null,
        detection_probability: log.confidence ? (log.confidence * 100) : null,
        drone_connect_time: log.event_time ? new Date(log.event_time) : new Date(),
        image_url: log.image_path,
        drone_lat: log.gps_lat,
        drone_lon: log.gps_lon,
      }))
    : mockDetectionLogs.filter(
        (log) => log.drone_db_id === droneDbId || log.droneId === droneDbId
      );
  
  const latestDetection = displayLogs.length > 0 ? displayLogs[0] : null;
  const todayEventCount = displayLogs.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) }}
      >
        {/* 헤더 - 뒤로 버튼, 드론 이름, 경고 배지 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{drone.drone_name || drone.name}</Text>
          </View>
          <View style={styles.headerRight}>
            {dangerLevel && dangerLevel.level === 'danger' && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={14} color="#FFFFFF" />
                <Text style={styles.warningText}>WARNING: HIGH RISK</Text>
              </View>
            )}
            {/* AIS 로고 - 경고 배지 옆에 배치 */}
            <View style={styles.headerLogo}>
              <AISLogo size={14} color="#2196F3" />
            </View>
          </View>
        </View>

        {/* GPS 정보 - 헤더 아래로 이동 */}
        <View style={styles.gpsContainer}>
          <Text style={styles.gpsText}>
            {location?.latitude.toFixed(2)}, {location?.longitude.toFixed(2)}
          </Text>
        </View>

        {/* 날씨 정보 */}
        {weather && (
          <View style={styles.weatherRow}>
            <Text style={styles.weatherText}>Wind {weather.windSpeed.toFixed(0)} m/s</Text>
            <Text style={styles.weatherSeparator}>•</Text>
            <Text style={styles.weatherText}>Hum {weather.humidity.toFixed(0)}%</Text>
          </View>
        )}

        {/* LIVE FEED 영역 - Raspberry Pi에서 스트리밍 */}
        <View style={styles.videoContainer}>
          {streamUrl ? (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>LIVE FEED</Text>
              <Text style={styles.streamUrlText}>{streamUrl}</Text>
              {/* 실제 구현 시 <Video> 컴포넌트로 스트리밍 재생 */}
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>LIVE FEED</Text>
              <Text style={styles.videoSubtext}>스트리밍 준비 중...</Text>
            </View>
          )}
        </View>

        {/* Detection Log 섹션 */}
        <View style={[styles.detectionSection, { paddingBottom: Math.max(insets.bottom, 100) }]}>
          <View style={styles.detectionHeader}>
            <View>
              <Text style={styles.detectionTitle}>Detection Log</Text>
              <Text style={styles.eventCount}>Today, {todayEventCount} events</Text>
            </View>
          </View>

          {/* Latest Detection - Jetson AI 분석 결과 */}
          {latestDetection && (
            <View style={styles.latestDetection}>
              <Text style={styles.latestLabel}>Latest Detection</Text>
              <View style={styles.latestInfoRow}>
                <Text style={styles.latestProbability}>
                  {latestDetection.smoke_score || latestDetection.detection_probability}% Probability
                </Text>
                <Text style={styles.latestTime}>
                  {format(latestDetection.drone_connect_time || latestDetection.timestamp, 'HH:mm', { locale: ko })} 
                  {latestDetection.weather && ` Wind: ${latestDetection.weather.windSpeed.toFixed(0)}m/s`}
                </Text>
              </View>
            </View>
          )}

          {/* Detection Cards - Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.detectionList}
          >
            {displayLogs.map((detection, index) => (
              <DetectionCard
                key={detection.id || index}
                detection={detection}
                onPress={() => handleDetectionPress(detection)}
              />
            ))}
          </ScrollView>

          {/* 라이브 포토 필름스트립 */}
          {livePhotos.length > 0 && (
            <View style={styles.livePhotosSection}>
              <Text style={styles.livePhotosTitle}>📸 실시간 감지 갤러리 ({livePhotos.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.livePhotosList}
              >
                {livePhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.livePhotoItem}
                    onPress={() => handleDetectionPress({
                      id: photo.id,
                      drone_db_id: droneDbId,
                      drone_name: droneName,
                      smoke_score: photo.confidence ? (photo.confidence * 100) : null,
                      detection_probability: photo.confidence ? (photo.confidence * 100) : null,
                      drone_connect_time: photo.event_time ? new Date(photo.event_time) : new Date(),
                      image_url: photo.image_path,
                      drone_lat: photo.gps_lat,
                      drone_lon: photo.gps_lon,
                    })}
                  >
                    {photo.image_path ? (
                      <Image source={{ uri: photo.image_path }} style={styles.livePhotoImage} />
                    ) : (
                      <View style={styles.livePhotoPlaceholder}>
                        <Text style={styles.livePhotoPlaceholderText}>No Image</Text>
                      </View>
                    )}
                    <View style={styles.livePhotoInfo}>
                      <Text style={styles.livePhotoTime}>
                        {photo.event_time ? new Date(photo.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                      <Text style={[styles.livePhotoConfidence, photo.confidence >= 0.8 && styles.livePhotoConfidenceHigh]}>
                        {photo.confidence ? (photo.confidence * 100).toFixed(0) : 0}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Simulate Fire Button */}
          <TouchableOpacity style={styles.simulateButton} onPress={handleTestFire}>
            <Bell size={16} color="#FFFFFF" />
            <Text style={styles.simulateButtonText}>Simulate Fire</Text>
          </TouchableOpacity>

          {/* 저작권 표시 */}
          <CopyrightFooter />
        </View>
      </ScrollView>

      {/* 상세 정보 모달 */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 50,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    marginLeft: 4,
  },
  gpsContainer: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  gpsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  weatherText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  weatherSeparator: {
    fontSize: 14,
    color: '#8E8E93',
  },
  videoContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  streamUrlText: {
    color: '#999999',
    fontSize: 12,
    marginTop: 8,
  },
  videoSubtext: {
    color: '#999999',
    fontSize: 14,
  },
  detectionSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    // 하단 네비게이션과 겹치지 않도록 추가 여백은 동적으로 설정됨
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  eventCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  latestDetection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  latestLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  latestInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latestProbability: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  latestTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detectionList: {
    paddingVertical: 8,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  livePhotosSection: {
    marginTop: 24,
  },
  livePhotosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  livePhotosList: {
    paddingVertical: 8,
  },
  livePhotoItem: {
    marginRight: 12,
    width: 120,
  },
  livePhotoImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  livePhotoPlaceholder: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePhotoPlaceholderText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  livePhotoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  livePhotoTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  livePhotoConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  livePhotoConfidenceHigh: {
    color: '#FF3B30',
  },
});
