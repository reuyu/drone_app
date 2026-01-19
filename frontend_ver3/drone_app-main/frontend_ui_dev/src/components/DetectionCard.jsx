import React from 'react';
import { getLocationName } from '../utils/location';
import './DetectionCard.css';

function DetectionCard({ detection, onPress }) {
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

  const warning = getWarningLevel(probability);
  const displayProbability = typeof probability === 'number' ? probability : (probability * 100);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const locationName = getLocationName(
    detection.gps_lat || detection.drone_lat,
    detection.gps_lon || detection.drone_lon
  );

  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <div
      className={`detection-card ${probability >= 75 ? 'detection-card-high' : ''} ${isPressed ? 'detection-card-pressed' : ''}`}
      style={{
        borderColor: warning.color,
        borderWidth: probability >= 75 ? '2px' : '1px',
      }}
      onClick={onPress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <img
        src={detection.image_url || detection.image_path || detection.image || ''}
        alt="Detection"
        className="detection-image"
        onError={(e) => {
          e.target.style.display = 'none';
          if (e.target.nextSibling) {
            e.target.nextSibling.style.display = 'flex';
          }
        }}
      />
      <div className="detection-no-image" style={{ display: 'none' }}>
        No Image
      </div>
      <div className="detection-info-container">
        <div className="detection-probability-container" style={{ marginBottom: '4px' }}>
          <span className="detection-probability" style={{ color: warning.color, fontSize: '20px', fontWeight: '700' }}>
            {displayProbability.toFixed(0)}%
          </span>
        </div>
        <span className="detection-time" style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '2px', display: 'block' }}>
          {formatTime(detection.drone_connect_time || detection.event_time || detection.timestamp)}
        </span>
        {locationName && (
          <div style={{ fontSize: '12px', color: '#000' }}>
            {locationName}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetectionCard;

