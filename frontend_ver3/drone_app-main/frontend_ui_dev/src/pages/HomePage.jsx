import React, { useState } from 'react';
import BatteryIcon from '../components/BatteryIcon';
import { mockLogs } from '../mockData';
import './HomePage.css';

function HomePage({ drones, onSelectDrone, onRegister, isRegistering }) {
  const [newDroneName, setNewDroneName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (newDroneName.trim()) {
      onRegister(newDroneName);
      setNewDroneName('');
      setIsModalVisible(false);
    }
  };

  const getStatusColor = (drone) => {
    const hasConnection = drone.drone_connect_time;
    if (hasConnection) {
      return { bg: '#E3F2FD', icon: '#2196F3', text: '#2196F3', status: 'Active' };
    }
    return { bg: '#F5F5F5', icon: '#9E9E9E', text: '#9E9E9E', status: 'Offline' };
  };

  const getBatteryLevel = (drone) => {
    // 연결된 드론은 82%, 오프라인은 0%
    return drone.drone_connect_time ? 82 : 0;
  };

  // 오늘 탐지된 사건 수 계산
  const getTodayEventCount = (droneName) => {
    if (!mockLogs || !mockLogs[droneName]) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return mockLogs[droneName].filter(log => {
      const eventDate = new Date(log.event_time);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    }).length;
  };

  // 디버깅
  console.log('🏠 HomePage 렌더링 - 드론 개수:', drones.length);
  console.log('🏠 HomePage 드론 데이터:', drones);

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>드론 목록</h1>
      </header>

      <div className="drone-list-container">
        {drones && drones.length > 0 ? (
          drones.map(drone => {
            const statusColors = getStatusColor(drone);
            const battery = getBatteryLevel(drone);
            return (
              <div
                key={drone.drone_db_id}
                className="drone-card-new"
                onClick={() => onSelectDrone(drone)}
              >
                <div
                  className="drone-icon-container"
                  style={{ backgroundColor: statusColors.bg }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke={statusColors.icon}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke={statusColors.icon}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke={statusColors.icon}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="drone-info-new">
                  <span className="drone-name-new">{drone.drone_name}</span>
                  <div className="status-row">
                    <span
                      className="status-badge-new"
                      style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                      }}
                    >
                      {statusColors.status}
                    </span>
                    <div className="battery-container">
                      <BatteryIcon percentage={battery} size={20} />
                      <span className="battery-text">{battery}%</span>
                    </div>
                  </div>
                  {getTodayEventCount(drone.drone_name) > 0 && (
                    <div className="today-events-badge">
                      오늘 {getTodayEventCount(drone.drone_name)}개 탐지
                    </div>
                  )}
                </div>
                <span className="arrow-new">›</span>
              </div>
            );
          })
        ) : (
          <div className="empty-state-new">
            <p>등록된 드론이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 플로팅 액션 버튼 */}
      <button
        className="fab-button"
        onClick={() => setIsModalVisible(true)}
        aria-label="드론 등록"
      >
        <span className="fab-icon">+</span>
      </button>

      {/* 드론 등록 모달 */}
      {isModalVisible && (
        <div className="modal-overlay" onClick={() => setIsModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">드론 등록</h2>
              <button
                className="modal-close"
                onClick={() => setIsModalVisible(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">드론 이름</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="예: drone_alpha"
                  value={newDroneName}
                  onChange={(e) => setNewDroneName(e.target.value)}
                  autoCapitalize="none"
                />
                <p className="input-hint">
                  * 이름 입력 후 등록하면 ID가 자동 발급됩니다.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className={`submit-button ${isRegistering ? 'submit-button-disabled' : ''}`}
                onClick={handleRegisterSubmit}
                disabled={isRegistering}
              >
                {isRegistering ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
