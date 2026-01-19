import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockDrones } from '../utils/mockData';
import { Drone, Zap, Plus, X } from 'lucide-react-native';
import { BatteryIcon } from '../components/BatteryIcon';
import { AISLogo } from '../components/AISLogo';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { registerDrone, fetchDroneList, updateDroneConnectTime } from '../utils/api';

export const DroneListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [drones, setDrones] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [droneName, setDroneName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 드론 목록 조회
  const loadDrones = useCallback(async () => {
    try {
      const droneList = await fetchDroneList();
      if (droneList) {
        // 서버 데이터에 status와 battery 추가 (기존 디자인 유지)
        const dronesWithStatus = droneList.map(drone => ({
          ...drone,
          status: drone.drone_connect_time ? 'Active' : 'Offline',
          battery: drone.drone_connect_time ? 82 : 0,
        }));
        setDrones(dronesWithStatus);
      } else {
        // API 실패 시 모의 데이터 사용
        setDrones(mockDrones);
      }
    } catch (error) {
      console.error('Load drones error:', error);
      setDrones(mockDrones);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드 및 폴링
  useEffect(() => {
    loadDrones();
    const interval = setInterval(loadDrones, 5000); // 5초 간격
    return () => clearInterval(interval);
  }, [loadDrones]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return { bg: '#E3F2FD', icon: '#2196F3', text: '#2196F3' };
      case 'Charging':
        return { bg: '#FFF3E0', icon: '#FF9800', text: '#FF9800' };
      case 'Offline':
        return { bg: '#F5F5F5', icon: '#9E9E9E', text: '#9E9E9E' };
      default:
        return { bg: '#F5F5F5', icon: '#9E9E9E', text: '#9E9E9E' };
    }
  };

  const handleRegisterDrone = async () => {
    if (!droneName.trim()) {
      Alert.alert('입력 오류', '드론 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerDrone({
        drone_name: droneName.trim(),
        drone_lat: 37.5665,
        drone_lon: 126.9780,
      });
      
      if (result) {
        Alert.alert('성공', `드론이 등록되었습니다.\nID: ${result.drone_db_id}`);
        setIsModalVisible(false);
        setDroneName('');
        // 목록 갱신
        loadDrones();
      } else {
        Alert.alert('오류', '드론 등록에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '드론 등록 중 오류가 발생했습니다.');
      console.error('Register drone error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setDroneName('');
  };

  const handleSelectDrone = async (drone) => {
    try {
      // 접속 시간 업데이트
      await updateDroneConnectTime(drone.drone_name);
    } catch (error) {
      console.error('Update connect time error:', error);
    }
    
    // 목록 갱신
    loadDrones();
    
    // 모니터링 화면으로 이동 (serializable 데이터만 전달)
    const serializableDrone = {
      drone_db_id: drone.drone_db_id || drone.id,
      drone_name: drone.drone_name || drone.name,
      drone_lat: drone.drone_lat,
      drone_lon: drone.drone_lon,
      drone_connect_time: drone.drone_connect_time ? drone.drone_connect_time.toString() : null,
      status: drone.status,
      battery: drone.battery,
    };
    
    navigation.navigate('Monitoring', { drone: serializableDrone });
  };

  const renderDroneItem = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    // MySQL 구조에 맞게 drone_name 사용
    const droneName = item.drone_name || item.name;

    return (
      <TouchableOpacity
        style={styles.droneCard}
        onPress={() => handleSelectDrone(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.droneIconContainer, { backgroundColor: statusColors.bg }]}>
          <Zap size={24} color={statusColors.icon} />
        </View>
        <View style={styles.droneInfo}>
          <Text style={styles.droneName}>{droneName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {item.status === 'Active' ? 'Active' : item.status === 'Charging' ? 'Charging' : 'Offline'}
              </Text>
            </View>
            <View style={styles.batteryContainer}>
              <BatteryIcon percentage={item.battery} />
              <Text style={styles.batteryText}>{item.battery}%</Text>
            </View>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>드론 목록</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>드론 목록</Text>
          {/* AIS 로고 - 헤더 텍스트와 같은 높이 */}
          <View style={styles.topLogoContainer}>
            <AISLogo size={16} color="#2196F3" />
          </View>
        </View>
      </View>
      <FlatList
        data={drones}
        renderItem={renderDroneItem}
        keyExtractor={(item) => (item.drone_db_id || item.id).toString()}
        contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 100) }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 드론이 없습니다.</Text>
          </View>
        }
        ListFooterComponent={<CopyrightFooter />}
      />
      
      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 60 }]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 드론 등록 모달 */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>드론 등록</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>드론 이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: drone_alpha"
                  value={droneName}
                  onChangeText={setDroneName}
                  autoCapitalize="none"
                />
                <Text style={styles.inputHint}>
                  * 이름 입력 후 등록하면 ID가 자동 발급됩니다.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleRegisterDrone}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? '등록 중...' : '등록하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  listContainer: {
    padding: 16,
  },
  droneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  droneIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  droneInfo: {
    flex: 1,
  },
  droneName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  arrow: {
    fontSize: 24,
    color: '#8E8E93',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  inputHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
});

