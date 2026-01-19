import React from 'react';
import { getLocationName } from '../utils/location';
import './DetectionDetailModal.css';

function DetectionDetailModal({ visible, detection, onClose }) {
  if (!visible || !detection) return null;

  const probability = detection.smoke_score || detection.detection_probability || detection.probability || 0;
  const displayProbability = typeof probability === 'number' ? probability : (probability * 100);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatGPS = (lat, lon) => {
    if (!lat || !lon) return '-';
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
  };

  return (
    <div className="detection-modal-overlay" onClick={onClose}>
      <div className="detection-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="detection-modal-header">
          <h2 className="detection-modal-title">감지 상세 정보</h2>
          <button className="detection-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detection-modal-content">
          <img
            src={detection.image_url || detection.image_path || detection.image || ''}
            alt="Detection Detail"
            className="detection-detail-image"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div className="detection-detail-no-image" style={{ display: 'none' }}>
            No Image
          </div>

          <div className="detection-info-section">
            <InfoRow
              label="감지 시간"
              value={formatDateTime(detection.drone_connect_time || detection.event_time || detection.timestamp)}
            />
            <div className="detection-probability-row">
              <span className="detection-info-label">연기 점수 (AI 확신도)</span>
              <div className="detection-probability-badge-container">
                <span
                  className="detection-probability-value"
                  style={{
                    color:
                      displayProbability >= 90
                        ? '#FF3B30'
                        : displayProbability >= 75
                        ? '#FF9500'
                        : '#000',
                  }}
                >
                  {displayProbability.toFixed(0)}%
                </span>
                {displayProbability >= 90 && (
                  <span className="detection-critical-badge">🚨 매우 위험</span>
                )}
                {displayProbability >= 75 && displayProbability < 90 && (
                  <span className="detection-high-badge">⚠️ 위험</span>
                )}
              </div>
            </div>
            <InfoRow
              label="드론 ID"
              value={detection.drone_db_id || `Drone #${detection.droneId || '-'}`}
            />
            <InfoRow label="드론 이름" value={detection.drone_name || '-'} />
            {(detection.drone_lat || detection.gps_lat) && (detection.drone_lon || detection.gps_lon) && (
              <InfoRow
                label="GPS 위치"
                value={`${getLocationName(detection.drone_lat || detection.gps_lat, detection.drone_lon || detection.gps_lon) || ''} ${getLocationName(detection.drone_lat || detection.gps_lat, detection.drone_lon || detection.gps_lon) ? '•' : ''} ${formatGPS(detection.drone_lat || detection.gps_lat, detection.drone_lon || detection.gps_lon)}`}
              />
            )}
            {detection.object_class && (
              <InfoRow label="객체 분류" value={detection.object_class} />
            )}
          </div>

            {/* 기상 정보 (temperature, humidity, wind_speed가 있으면 표시) */}
            {(detection.temperature || detection.humidity || detection.wind_speed) && (
              <div className="detection-weather-section">
                <h3 className="detection-section-title">기상 정보</h3>
                {detection.temperature && (
                  <InfoRow
                    label="온도"
                    value={`${detection.temperature.toFixed(1)}°C`}
                  />
                )}
                {detection.humidity && (
                  <InfoRow
                    label="습도"
                    value={`${detection.humidity.toFixed(0)}%`}
                  />
                )}
                {detection.wind_speed && (
                  <InfoRow
                    label="풍속"
                    value={`${detection.wind_speed.toFixed(1)} m/s`}
                  />
                )}
                {detection.weather?.windDirection && (
                  <InfoRow label="풍향" value={detection.weather.windDirection} />
                )}
              </div>
            )}
            {detection.weather && !detection.temperature && (
              <div className="detection-weather-section">
                <h3 className="detection-section-title">기상 정보</h3>
                <InfoRow
                  label="풍속"
                  value={`${detection.weather.windSpeed?.toFixed(1) || '-'} m/s`}
                />
                <InfoRow
                  label="습도"
                  value={`${detection.weather.humidity?.toFixed(1) || '-'}%`}
                />
                {detection.weather.windDirection && (
                  <InfoRow label="풍향" value={detection.weather.windDirection} />
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="detection-info-row">
      <span className="detection-info-label">{label}</span>
      <span className="detection-info-value">{value}</span>
    </div>
  );
}

export default DetectionDetailModal;
