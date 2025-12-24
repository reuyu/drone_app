import React, { useState, useEffect, useCallback } from 'react';
import Filmstrip from '../components/Filmstrip';
import './MonitorPage.css';

function MonitorPage({ selectedDrone, API_BASE }) {
    const [logs, setLogs] = useState([]);
    const [livePhotos, setLivePhotos] = useState([]);

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

    if (!selectedDrone) return <div className="loading-msg">드론 정보를 불러오는 중...</div>;

    // 실시간 GPS 정보 (로그가 없으면 드론 초기 좌표 사용)
    const currentLat = logs.length > 0 ? logs[0].gps_lat : selectedDrone.drone_lat;
    const currentLon = logs.length > 0 ? logs[0].gps_lon : selectedDrone.drone_lon;

    // 안전한 숫자 포맷 함수
    const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        const val = Number(num);
        return isNaN(val) ? 'N/A' : val.toFixed(4);
    };

    const formatPercent = (num) => {
        if (num === null || num === undefined) return '0';
        const val = Number(num);
        return isNaN(val) ? '0' : (val * 100).toFixed(0);
    };

    return (
        <div className="monitor-page">
            <div className="monitor-header-card">
                <div className="drone-title">
                    <span className="icon">🚁</span>
                    <div>
                        <h2>{selectedDrone.drone_name}</h2>
                        <span className="sub-id">{selectedDrone.drone_db_id}</span>
                    </div>
                </div>
                <div className="drone-status-info">
                    <div className="gps-info">
                        <span className="label">GPS</span>
                        <span className="value">
                            {formatNumber(currentLat)}, {formatNumber(currentLon)}
                        </span>
                    </div>
                    <div className="status-indicator">
                        <span className="dot online"></span>
                        <span>Online</span>
                    </div>
                </div>
            </div>

            {/* 메인 영상 영역 */}
            <div className="video-area">
                {selectedDrone.drone_video_url ? (
                    <img
                        src={`${API_BASE}/api/proxy/video?url=${encodeURIComponent(selectedDrone.drone_video_url)}`}
                        className="live-feed"
                        alt="Drone Feed"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                ) : null}
                <div className="video-fallback" style={{ display: selectedDrone.drone_video_url ? 'none' : 'flex' }}>
                    <span className="icon">📡</span>
                    <p>실시간 영상 연결 중...</p>
                </div>

                <div className="status-overlay">
                    <span className="status-badge live">LIVE</span>
                </div>
            </div>

            {/* 최근 로그 (최신 1건 요약) */}
            <div className="latest-log-card">
                <h4>🔥 최신 감지 알림</h4>
                {logs.length > 0 ? (
                    <div className="log-summary">
                        <div className="log-row">
                            <span className="time">{new Date(logs[0].event_time).toLocaleTimeString()}</span>
                            <span className={`confidence-tag ${logs[0].confidence >= 0.8 ? 'danger' : 'warning'}`}>
                                {formatPercent(logs[0].confidence)}% 화재 확률
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="no-data">감지된 특이사항 없음</div>
                )}
            </div>

            {/* 하단 필름스트립 */}
            <Filmstrip photos={livePhotos} />
        </div>
    );
}

export default MonitorPage;
