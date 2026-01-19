import React, { useState, useEffect } from 'react';
import DetectionDetailModal from '../components/DetectionDetailModal';
import { getLocationName } from '../utils/location';
import './HistoryPage.css';

function HistoryPage({ selectedDrone, drones, onDroneSelect, API_BASE, useMockData = false, mockLogs = {} }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDetection, setSelectedDetection] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (selectedDrone && selectedDate) {
            fetchHistory();
        }
    }, [selectedDrone, selectedDate]);

    const fetchHistory = async () => {
        setIsLoading(true);
        
        // Mock 데이터 사용
        if (useMockData) {
            setTimeout(() => {
                const droneName = selectedDrone.drone_name;
                const droneLogs = mockLogs[droneName] || [];
                // 날짜 필터링 (간단하게 모든 로그 반환)
                setLogs(droneLogs);
                setIsLoading(false);
            }, 300);
            return;
        }

        // 실제 API 호출
        try {
            const res = await fetch(`${API_BASE}/api/logs/${selectedDrone.drone_name}?date=${selectedDate}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.logs);
            }
        } catch (err) {
            console.error('히스토리 조회 실패:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getDangerLevel = (probability) => {
        if (probability >= 90) {
            return { level: 'critical', color: '#FF3B30', text: '매우 위험' };
        } else if (probability >= 75) {
            return { level: 'high', color: '#FF9500', text: '위험' };
        } else if (probability >= 60) {
            return { level: 'medium', color: '#FFCC00', text: '주의' };
        }
        return { level: 'low', color: '#34C759', text: '정상' };
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const handleDetectionPress = (log) => {
        const detection = {
            id: log.id,
            drone_db_id: log.drone_db_id || selectedDrone.drone_db_id,
            drone_name: selectedDrone.drone_name,
            smoke_score: log.confidence ? (log.confidence * 100) : 0,
            detection_probability: log.confidence ? (log.confidence * 100) : 0,
            probability: log.confidence ? (log.confidence * 100) : 0,
            drone_connect_time: log.event_time ? new Date(log.event_time) : new Date(),
            event_time: log.event_time,
            timestamp: log.event_time,
            image_url: log.image_path,
            image_path: log.image_path,
            drone_lat: log.gps_lat,
            drone_lon: log.gps_lon,
            gps_lat: log.gps_lat,
            gps_lon: log.gps_lon,
            temperature: log.temperature,
            wind_speed: log.wind_speed,
            humidity: log.humidity,
            weather: { 
                windSpeed: log.wind_speed || 5, 
                humidity: log.humidity || 50, 
                windDirection: 'N' 
            },
        };
        setSelectedDetection(detection);
        setModalVisible(true);
    };

    if (!selectedDrone) return <div className="history-empty-new">드론을 선택해주세요.</div>;

    // 확률순으로 정렬
    const sortedLogs = [...logs].sort((a, b) => {
        const probA = (a.confidence || 0) * 100;
        const probB = (b.confidence || 0) * 100;
        return probB - probA;
    });

    return (
        <div className="history-page-new">
            <div className="history-header-new">
                <h2 className="history-header-title">화재 감지 이력</h2>
            </div>

            {/* 컨트롤 영역 */}
            <div className="history-controls-new">
                <select
                    className="history-drone-select"
                    value={selectedDrone.drone_db_id}
                    onChange={(e) => {
                        const drone = drones.find(d => d.drone_db_id === e.target.value);
                        onDroneSelect(drone);
                    }}
                >
                    {drones.map(d => (
                        <option key={d.drone_db_id} value={d.drone_db_id}>{d.drone_name}</option>
                    ))}
                </select>

                <input
                    type="date"
                    className="history-date-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            {/* 결과 리스트 */}
            <div className="history-list-container">
                {isLoading ? (
                    <div className="history-loading">로딩 중...</div>
                ) : sortedLogs.length > 0 ? (
                    sortedLogs.map(log => {
                        const probability = (log.confidence || 0) * 100;
                        const dangerLevel = getDangerLevel(probability);
                        return (
                            <div
                                key={log.id}
                                className="history-card-new"
                                onClick={() => handleDetectionPress(log)}
                            >
                                <img
                                    src={log.image_path || ''}
                                    alt="History"
                                    className="history-image-new"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className="history-no-image" style={{ display: 'none' }}>
                                    No Image
                                </div>
                                <div className="history-info-new">
                                    {/* 날짜 */}
                                    <div className="history-date-new">
                                        {formatDate(log.event_time)}
                                    </div>
                                    {/* 시간, 지역 */}
                                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                                        <span className="history-time-new">
                                            {formatTime(log.event_time)}
                                        </span>
                                        {' • '}
                                        <span className="history-location-new">
                                            {getLocationName(log.gps_lat, log.gps_lon) || '위치 정보 없음'}
                                        </span>
                                    </div>
                                    {/* 탐지 드론 */}
                                    <div className="history-drone-id" style={{ marginBottom: '8px' }}>
                                        Drone #{log.drone_db_id || selectedDrone.drone_db_id}
                                    </div>
                                    {/* 풍속, 온도 */}
                                    <div className="history-weather-info">
                                        <span className="history-weather-text">
                                            풍속: {log.wind_speed ? `${log.wind_speed.toFixed(1)}m/s` : '5.0m/s'}
                                            {' • '}
                                            온도: {log.temperature ? `${log.temperature.toFixed(1)}°C` : '-'}
                                        </span>
                                    </div>
                                    {/* 확률 배지 */}
                                    <div style={{ marginTop: '8px' }}>
                                        <span
                                            className="history-danger-badge"
                                            style={{
                                                backgroundColor: dangerLevel.color + '20',
                                                color: dangerLevel.color,
                                            }}
                                        >
                                            확률: {probability.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="history-no-result">
                        <span className="history-no-result-icon">📭</span>
                        <p>해당 날짜에 기록된 데이터가 없습니다.</p>
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

export default HistoryPage;
