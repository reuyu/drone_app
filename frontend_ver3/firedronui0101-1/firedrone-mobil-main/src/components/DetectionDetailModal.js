import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { X } from 'lucide-react-native';

export const DetectionDetailModal = ({ visible, detection, onClose }) => {
  if (!detection) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>감지 상세 정보</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Image source={{ uri: detection.image_url || detection.image }} style={styles.detailImage} />

            <View style={styles.infoSection}>
              <InfoRow 
                label="감지 시간" 
                value={format(detection.drone_connect_time || detection.timestamp, 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })} 
              />
              <View style={styles.probabilityRow}>
                <Text style={styles.infoLabel}>연기 점수 (AI 확신도)</Text>
                <View style={styles.probabilityBadgeContainer}>
                  <Text style={[
                    styles.probabilityValue,
                    { 
                      color: (detection.smoke_score || detection.detection_probability || detection.probability) >= 90 
                        ? '#FF3B30' 
                        : (detection.smoke_score || detection.detection_probability || detection.probability) >= 75 
                        ? '#FF9500' 
                        : '#000' 
                    }
                  ]}>
                    {detection.smoke_score || detection.detection_probability || detection.probability}%
                  </Text>
                  {(detection.smoke_score || detection.detection_probability || detection.probability) >= 90 && (
                    <View style={styles.criticalBadge}>
                      <Text style={styles.criticalBadgeText}>🚨 매우 위험</Text>
                    </View>
                  )}
                  {(detection.smoke_score || detection.detection_probability || detection.probability) >= 75 && 
                   (detection.smoke_score || detection.detection_probability || detection.probability) < 90 && (
                    <View style={styles.highBadge}>
                      <Text style={styles.highBadgeText}>⚠️ 위험</Text>
                    </View>
                  )}
                </View>
              </View>
              <InfoRow label="드론 ID" value={detection.drone_db_id || `Drone #${detection.droneId}`} />
              <InfoRow label="드론 이름" value={detection.drone_name || '-'} />
              {detection.drone_lat && detection.drone_lon && (
                <InfoRow 
                  label="GPS 위치" 
                  value={`${detection.drone_lat.toFixed(6)}, ${detection.drone_lon.toFixed(6)}`} 
                />
              )}
              {detection.object_class && (
                <InfoRow label="객체 분류" value={detection.object_class} />
              )}
            </View>

            {detection.weather && (
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>기상 정보</Text>
                <InfoRow label="풍속" value={`${detection.weather.windSpeed.toFixed(1)} m/s`} />
                <InfoRow label="습도" value={`${detection.weather.humidity.toFixed(1)}%`} />
                <InfoRow label="풍향" value={detection.weather.windDirection} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  weatherSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  probabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  probabilityBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  probabilityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  criticalBadge: {
    backgroundColor: '#FF3B3015',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  criticalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
  },
  highBadge: {
    backgroundColor: '#FF950015',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
  },
});

