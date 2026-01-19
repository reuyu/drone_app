import React from 'react';
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
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`detection-card ${probability >= 75 ? 'detection-card-high' : ''}`}
      style={{
        borderColor: warning.color,
        borderWidth: probability >= 75 ? '2px' : '1px',
      }}
      onClick={onPress}
    >
      <div
        className="detection-warning-badge"
        style={{
          backgroundColor: warning.bgColor,
        }}
      >
        <span className="warning-icon">⚠️</span>
        <span className="warning-text" style={{ color: warning.color }}>
          {warning.text}
        </span>
      </div>
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
        <span className="detection-time">
          {formatTime(detection.drone_connect_time || detection.event_time || detection.timestamp)}
        </span>
        <div className="detection-probability-container">
          <span className="detection-probability" style={{ color: warning.color }}>
            {displayProbability.toFixed(0)}%
          </span>
          {probability >= 90 && (
            <span className="detection-critical-text">🔥 긴급!</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetectionCard;

