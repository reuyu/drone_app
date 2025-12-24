import React, { useState, useEffect } from 'react';
import './HistoryPage.css';

function HistoryPage({ selectedDrone, drones, onDroneSelect, API_BASE }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedDrone && selectedDate) {
            fetchHistory();
        }
    }, [selectedDrone, selectedDate]);

    const fetchHistory = async () => {
        setIsLoading(true);
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

    if (!selectedDrone) return <div className="history-empty">드론을 선택해주세요.</div>;

    return (
        <div className="history-page">
            <h2>📅 히스토리 조회</h2>

            {/* 컨트롤 영역 */}
            <div className="history-controls">
                <select
                    className="drone-select"
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
                    className="date-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            {/* 결과 그리드 */}
            <div className="history-grid">
                {isLoading ? (
                    <p className="loading">로딩 중...</p>
                ) : logs.length > 0 ? (
                    logs.map(log => (
                        <div key={log.id} className="history-item">
                            <div className="img-box">
                                {log.image_path ? (
                                    <img src={log.image_path} alt="Log" loading="lazy" />
                                ) : (
                                    <div className="no-img">No Image</div>
                                )}
                                <span className="confidence-badge">{(log.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="info-box">
                                <span className="time">{new Date(log.event_time).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-result">
                        <span className="icon">📭</span>
                        <p>해당 날짜에 기록된 데이터가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;
