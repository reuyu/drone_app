import React, { useState, useEffect, useCallback } from 'react';
import Filmstrip from '../components/Filmstrip';
import DetectionCard from '../components/DetectionCard';
import DetectionDetailModal from '../components/DetectionDetailModal';
import './MonitorPage.css';

function MonitorPage({ selectedDrone, API_BASE, onGoBack }) {
    const [logs, setLogs] = useState([]);
    const [livePhotos, setLivePhotos] = useState([]);
    const [selectedDetection, setSelectedDetection] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [location, setLocation] = useState(null);
    const [weather, setWeather] = useState(null);

    // 데이터 폴링
    const fetchData = useCallback(async () => {
        if (!selectedDrone) return;

        try {
            // 1. 최근 로그 10개
            const logRes = await fetch(`${API_BASE}/api/logs/${selectedDrone.drone_name}`);
            const logData = await logRes.json();
            if (logData.success) {
                setLogs(logData.data.logs);
            }

            // 2. 라이브 포토 (접속 이후)
            const photoRes = await fetch(`${API_BASE}/api/drones/${selectedDrone.drone_name}/live-photos`);
            const photoData = await photoRes.json();
            if (photoData.success) {
                setLivePhotos(photoData.data.photos);
            }
        } catch (err) {
            console.error('데이터 조회 실패:', err);
        }
    }, [selectedDrone, API_BASE]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // 위치 및 날씨 정보 초기화
    useEffect(() => {
        if (selectedDrone) {
            // GPS 정보 설정
            if (selectedDrone.drone_lat && selectedDrone.drone_lon) {
                setLocation({
                    latitude: parseFloat(selectedDrone.drone_lat),
                    longitude: parseFloat(selectedDrone.drone_lon),
                });
            } else {
                setLocation({ latitude: 37.5665, longitude: 126.9780 });
            }

            // 기본 날씨 데이터
            setWeather({ windSpeed: 5, humidity: 50 });
        }
    }, [selectedDrone]);

    if (!selectedDrone) return <div className="monitor-loading">드론 정보를 불러오는 중...</div>;

    // 실시간 GPS 정보 (로그가 없으면 드론 초기 좌표 사용)
    const currentLat = logs.length > 0 ? logs[0].gps_lat : (location?.latitude || selectedDrone.drone_lat);
    const currentLon = logs.length > 0 ? logs[0].gps_lon : (location?.longitude || selectedDrone.drone_lon);

    // 안전한 숫자 포맷 함수
    const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        const val = Number(num);
        return isNaN(val) ? 'N/A' : val.toFixed(2);
    };

    const formatPercent = (num) => {
        if (num === null || num === undefined) return 0;
        const val = Number(num);
        return isNaN(val) ? 0 : val * 100;
    };

    // 로그 데이터를 DetectionCard 형식으로 변환
    const displayLogs = logs.map(log => ({
        id: log.id,
        drone_db_id: log.drone_db_id || selectedDrone.drone_db_id,
        drone_name: selectedDrone.drone_name,
        smoke_score: formatPercent(log.confidence),
        detection_probability: formatPercent(log.confidence),
        drone_connect_time: log.event_time ? new Date(log.event_time) : new Date(),
        image_url: log.image_path,
        image_path: log.image_path,
        drone_lat: log.gps_lat,
        drone_lon: log.gps_lon,
        gps_lat: log.gps_lat,
        gps_lon: log.gps_lon,
        event_time: log.event_time,
        timestamp: log.event_time,
        probability: formatPercent(log.confidence),
    }));

    const latestDetection = displayLogs.length > 0 ? displayLogs[0] : null;
    const todayEventCount = displayLogs.length;

    const handleDetectionPress = (detection) => {
        setSelectedDetection(detection);
        setModalVisible(true);
    };

    return (
        <div className="monitor-page-new">
            {/* 헤더 */}
            <div className="monitor-header-new">
                {onGoBack && (
                    <button className="monitor-back-button" onClick={onGoBack}>
                        ‹
                    </button>
                )}
                <div className="monitor-header-center">
                    <h2 className="monitor-header-title">{selectedDrone.drone_name}</h2>
                </div>
                <div className="monitor-header-right"></div>
            </div>

            {/* GPS 정보 */}
            <div className="monitor-gps-container">
                <span className="monitor-gps-text">
                    {formatNumber(currentLat)}, {formatNumber(currentLon)}
                </span>
            </div>

            {/* 날씨 정보 */}
            {weather && (
                <div className="monitor-weather-row">
                    <span className="monitor-weather-text">Wind {weather.windSpeed.toFixed(0)} m/s</span>
                    <span className="monitor-weather-separator">•</span>
                    <span className="monitor-weather-text">Hum {weather.humidity.toFixed(0)}%</span>
                </div>
            )}

            {/* LIVE FEED 영역 */}
            <div className="monitor-video-container">
                {selectedDrone.drone_video_url ? (
                    <div className="monitor-video-placeholder">
                        <span className="monitor-video-placeholder-text">LIVE FEED</span>
                        <img
                            src={`${API_BASE}/api/proxy/video?url=${encodeURIComponent(selectedDrone.drone_video_url)}`}
                            className="monitor-live-feed"
                            alt="Drone Feed"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="monitor-video-fallback" style={{ display: 'none' }}>
                            <span className="monitor-video-subtext">스트리밍 준비 중...</span>
                        </div>
                    </div>
                ) : (
                    <div className="monitor-video-placeholder">
                        <span className="monitor-video-placeholder-text">LIVE FEED</span>
                        <span className="monitor-video-subtext">스트리밍 준비 중...</span>
                    </div>
                )}
            </div>

            {/* Detection Log 섹션 */}
            <div className="monitor-detection-section">
                <div className="monitor-detection-header">
                    <div>
                        <h3 className="monitor-detection-title">Detection Log</h3>
                        <p className="monitor-event-count">Today, {todayEventCount} events</p>
                    </div>
                </div>

                {/* Latest Detection */}
                {latestDetection && (
                    <div className="monitor-latest-detection">
                        <span className="monitor-latest-label">Latest Detection</span>
                        <div className="monitor-latest-info-row">
                            <span className="monitor-latest-probability">
                                {latestDetection.smoke_score || latestDetection.detection_probability}% Probability
                            </span>
                            <span className="monitor-latest-time">
                                {latestDetection.drone_connect_time
                                    ? latestDetection.drone_connect_time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                                {weather && ` Wind: ${weather.windSpeed.toFixed(0)}m/s`}
                            </span>
                        </div>
                    </div>
                )}

                {/* Detection Cards - Horizontal Scroll */}
                <div className="monitor-detection-list">
                    {displayLogs.map((detection, index) => (
                        <DetectionCard
                            key={detection.id || index}
                            detection={detection}
                            onPress={() => handleDetectionPress(detection)}
                        />
                    ))}
                </div>

                {/* 라이브 포토 필름스트립 */}
                {livePhotos.length > 0 && (
                    <div className="monitor-live-photos-section">
                        <h4 className="monitor-live-photos-title">
                            📸 실시간 감지 갤러리 ({livePhotos.length})
                        </h4>
                        <Filmstrip photos={livePhotos} />
                    </div>
                )}
            </div>

            {/* 상세 정보 모달 */}
            <DetectionDetailModal
                visible={modalVisible}
                detection={selectedDetection}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedDetection(null);
                }}
            />
        </div>
    );
}

export default MonitorPage;
