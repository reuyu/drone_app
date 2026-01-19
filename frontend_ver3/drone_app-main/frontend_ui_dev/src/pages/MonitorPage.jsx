import React, { useState, useEffect, useCallback } from 'react';
import Filmstrip from '../components/Filmstrip';
import DetectionCard from '../components/DetectionCard';
import DetectionDetailModal from '../components/DetectionDetailModal';
import { generateRandomEvent, mockLogs as importedMockLogs, mockLivePhotos as importedMockLivePhotos } from '../mockData';
import { getLocationName } from '../utils/location';
import './MonitorPage.css';

function MonitorPage({ selectedDrone, API_BASE, onGoBack, useMockData = false, mockLogs = {}, mockLivePhotos = {} }) {
    // 초기 상태: selectedDrone이 있으면 바로 데이터 로드
    const getInitialLogs = () => {
        if (useMockData && selectedDrone) {
            const droneName = selectedDrone.drone_name;
            const logsSource = importedMockLogs || mockLogs || {};
            return Array.isArray(logsSource[droneName]) ? [...logsSource[droneName]] : [];
        }
        return [];
    };
    
    const getInitialPhotos = () => {
        if (useMockData && selectedDrone) {
            const droneName = selectedDrone.drone_name;
            const photosSource = importedMockLivePhotos || mockLivePhotos || {};
            return Array.isArray(photosSource[droneName]) ? [...photosSource[droneName]] : [];
        }
        return [];
    };
    
    const [logs, setLogs] = useState(getInitialLogs);
    const [livePhotos, setLivePhotos] = useState(getInitialPhotos);
    const [selectedDetection, setSelectedDetection] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [location, setLocation] = useState(null);
    const [weather, setWeather] = useState(null);
    const [eventCounter, setEventCounter] = useState(0); // 이벤트 카운터

    // 데이터 폴링
    const fetchData = useCallback(async () => {
        if (!selectedDrone) return;

        // Mock 데이터 사용
        if (useMockData) {
            const droneName = selectedDrone.drone_name;
            // 직접 import한 mockLogs 사용
            const logsSource = importedMockLogs || mockLogs || {};
            const photosSource = importedMockLivePhotos || mockLivePhotos || {};
            
            const droneLogs = Array.isArray(logsSource[droneName]) ? [...logsSource[droneName]] : [];
            const dronePhotos = Array.isArray(photosSource[droneName]) ? [...photosSource[droneName]] : [];
            
            console.log('📊 Mock 데이터 로드 (fetchData):', {
                droneName,
                logsCount: droneLogs.length,
                photosCount: dronePhotos.length,
                logs: droneLogs
            });
            
            setLogs(droneLogs);
            setLivePhotos(dronePhotos);
            return;
        }

        // 실제 API 호출
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
    }, [selectedDrone, API_BASE, useMockData, mockLogs, mockLivePhotos]);

    // selectedDrone이 변경될 때마다 데이터 로드
    useEffect(() => {
        if (!selectedDrone) {
            setLogs([]);
            setLivePhotos([]);
            return;
        }

        const droneName = selectedDrone.drone_name;
        
        // Mock 데이터 사용
        if (useMockData) {
            // 직접 import한 mockLogs 사용 (props보다 우선)
            const logsSource = importedMockLogs || mockLogs || {};
            const photosSource = importedMockLivePhotos || mockLivePhotos || {};
            
            const droneLogs = Array.isArray(logsSource[droneName]) ? [...logsSource[droneName]] : [];
            const dronePhotos = Array.isArray(photosSource[droneName]) ? [...photosSource[droneName]] : [];
            
            console.log('🚀 Mock 데이터 로드 (useEffect):', {
                droneName,
                logsCount: droneLogs.length,
                photosCount: dronePhotos.length,
                hasImportedLogs: !!importedMockLogs,
                logsSourceKeys: Object.keys(logsSource),
                droneLogs: droneLogs
            });
            
            // 즉시 상태 업데이트
            setLogs(droneLogs);
            setLivePhotos(dronePhotos);
        } else {
            // 실제 API 호출
            fetchData();
            const interval = setInterval(fetchData, 1000);
            return () => clearInterval(interval);
        }
    }, [selectedDrone?.drone_name, useMockData]); // drone_name만 의존성으로 사용

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
    const displayLogs = logs.map(log => {
        // confidence가 이미 0-1 범위인지 확인
        const confidenceValue = log.confidence || log.smoke_score || log.detection_probability || 0;
        const confidencePercent = confidenceValue <= 1 ? confidenceValue * 100 : confidenceValue;
        
        return {
            id: log.id,
            drone_db_id: log.drone_db_id || (selectedDrone ? selectedDrone.drone_db_id : null),
            drone_name: selectedDrone ? selectedDrone.drone_name : '',
            smoke_score: confidencePercent,
            detection_probability: confidencePercent,
            drone_connect_time: log.event_time ? new Date(log.event_time) : new Date(),
            image_url: log.image_path || log.image_url,
            image_path: log.image_path || log.image_url,
            drone_lat: log.gps_lat || log.drone_lat,
            drone_lon: log.gps_lon || log.drone_lon,
            gps_lat: log.gps_lat || log.drone_lat,
            gps_lon: log.gps_lon || log.drone_lon,
            event_time: log.event_time || log.timestamp,
            timestamp: log.event_time || log.timestamp,
            probability: confidencePercent,
            // 기상 정보 추가
            temperature: log.temperature,
            humidity: log.humidity,
            wind_speed: log.wind_speed,
            risk_level: log.risk_level,
            weather: log.weather || (log.temperature ? {
                windSpeed: log.wind_speed || 5,
                humidity: log.humidity || 50,
                windDirection: 'N'
            } : null),
        };
    });

    const latestDetection = displayLogs.length > 0 ? displayLogs[0] : null;
    const todayEventCount = displayLogs.length;
    
    // 디버깅 로그
    if (useMockData && selectedDrone) {
        console.log('📊 Detection Log 상태:', {
            droneName: selectedDrone.drone_name,
            logsCount: logs.length,
            displayLogsCount: displayLogs.length,
            todayEventCount,
            hasLatestDetection: !!latestDetection,
            latestDetection: latestDetection ? {
                id: latestDetection.id,
                confidence: latestDetection.smoke_score,
                time: latestDetection.event_time
            } : null
        });
    }

    const handleDetectionPress = (detection) => {
        setSelectedDetection(detection);
        setModalVisible(true);
    };

    // 가상 이벤트 생성 (테스트용)
    const handleSimulateEvent = () => {
        if (!selectedDrone || !useMockData) return;
        
        const newEvent = generateRandomEvent(selectedDrone.drone_name, selectedDrone.drone_db_id);
        const newLivePhoto = {
            id: Date.now(),
            event_time: newEvent.event_time,
            image_path: newEvent.image_path.replace('800x600', '400x300'),
            confidence: newEvent.confidence,
            gps_lat: newEvent.gps_lat,
            gps_lon: newEvent.gps_lon,
        };

        // 로그에 추가 (맨 앞에)
        setLogs(prevLogs => [newEvent, ...prevLogs]);
        
        // 라이브 포토에 추가 (맨 앞에)
        setLivePhotos(prevPhotos => [newLivePhoto, ...prevPhotos]);
        
        setEventCounter(prev => prev + 1);
        
        console.log('🔥 새 이벤트 생성:', newEvent);
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
                <div className="monitor-header-right">
                    {selectedDrone.drone_connect_time && (
                        <span 
                            className="monitor-status-dot"
                            style={{
                                height: '10px',
                                width: '10px',
                                backgroundColor: '#34C759',
                                borderRadius: '50%',
                                display: 'inline-block'
                            }}
                            title="연결됨"
                        ></span>
                    )}
                </div>
            </div>

            {/* GPS 정보 */}
            <div className="monitor-gps-container">
                <span className="monitor-gps-text">
                    {getLocationName(currentLat, currentLon) && (
                        <span style={{ marginRight: '8px' }}>{getLocationName(currentLat, currentLon)}</span>
                    )}
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
                        <p className="monitor-event-count">
                            오늘 {todayEventCount}개 탐지
                        </p>
                    </div>
                </div>

                {/* Latest Detection */}
                {latestDetection ? (
                    <div className="monitor-latest-detection">
                        <span className="monitor-latest-label">최근 탐지</span>
                        <div style={{ marginTop: '8px' }}>
                            <span 
                                className="monitor-latest-probability"
                                style={{
                                    color: (() => {
                                        const prob = Math.round(latestDetection.smoke_score || latestDetection.detection_probability || 0);
                                        if (prob >= 90) return '#FF3B30';
                                        if (prob >= 75) return '#FF9500';
                                        if (prob >= 60) return '#FFCC00';
                                        return '#34C759';
                                    })()
                                }}
                            >
                                {Math.round(latestDetection.smoke_score || latestDetection.detection_probability || 0)}%
                            </span>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#000' }}>
                            {latestDetection.drone_connect_time
                                ? latestDetection.drone_connect_time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                                : latestDetection.event_time
                                ? new Date(latestDetection.event_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                                : ''}
                            {' • '}
                            {getLocationName(latestDetection.gps_lat || latestDetection.drone_lat, latestDetection.gps_lon || latestDetection.drone_lon) || '위치 정보 없음'}
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#8E8E93' }}>
                            풍속: {latestDetection.wind_speed ? `${latestDetection.wind_speed.toFixed(1)}m/s` : (weather ? `${weather.windSpeed.toFixed(0)}m/s` : '-')}
                            {' • '}
                            온도: {latestDetection.temperature ? `${latestDetection.temperature.toFixed(1)}°C` : '-'}
                        </div>
                    </div>
                ) : (
                    <div style={{ 
                        padding: '16px', 
                        textAlign: 'center', 
                        color: '#8E8E93', 
                        fontSize: '14px',
                        borderBottom: '1px solid #F0F0F0',
                        marginBottom: '16px'
                    }}>
                        아직 감지된 이벤트가 없습니다
                    </div>
                )}

                {/* Detection Cards - Horizontal Scroll */}
                {displayLogs.length > 0 ? (
                    <div className="monitor-detection-list">
                        {displayLogs.map((detection, index) => (
                            <DetectionCard
                                key={detection.id || index}
                                detection={detection}
                                onPress={() => handleDetectionPress(detection)}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        padding: '24px', 
                        textAlign: 'center', 
                        color: '#8E8E93', 
                        fontSize: '14px',
                        backgroundColor: '#F9F9F9',
                        borderRadius: '12px',
                        marginTop: '8px'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                        <div>감지된 이벤트가 없습니다</div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#C7C7CC' }}>
                            새 이벤트가 감지되면 여기에 표시됩니다
                        </div>
                    </div>
                )}

                {/* 라이브 포토 필름스트립 */}
                {livePhotos.length > 0 && (
                    <div className="monitor-live-photos-section">
                        <h4 className="monitor-live-photos-title">
                            📸 실시간 감지 갤러리 ({livePhotos.length})
                        </h4>
                        <Filmstrip photos={livePhotos} />
                    </div>
                )}

                {/* 이벤트 시뮬레이션 버튼 (Mock 모드에서만 표시) */}
                {useMockData && (
                    <button 
                        className="simulate-event-button"
                        onClick={handleSimulateEvent}
                    >
                        🔥 새 이벤트 시뮬레이션
                    </button>
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
