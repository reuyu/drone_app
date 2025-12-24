import React, { useState } from 'react';
import './HomePage.css';

function HomePage({ drones, onSelectDrone, onRegister, isRegistering }) {
  const [newDroneName, setNewDroneName] = useState('');

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (newDroneName.trim()) {
      onRegister(newDroneName);
      setNewDroneName('');
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>🔥 FireGuard AI</h1>
        <p>드론 화재 감지 모니터링 시스템</p>
      </header>

      <div className="section-title">
        <h3>📡 모니터링할 드론 선택</h3>
      </div>

      <div className="drone-grid">
        {drones.length > 0 ? (
          drones.map(drone => (
            <div
              key={drone.drone_db_id}
              className="drone-card"
              onClick={() => onSelectDrone(drone)}
            >
              <div className="drone-icon">🚁</div>
              <div className="drone-info">
                <span className="name">{drone.drone_name}</span>
                <span className="id">{drone.drone_db_id}</span>
                <span className="status">● Connected</span>
              </div>
              <div className="arrow">→</div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>등록된 드론이 없습니다.</p>
          </div>
        )}
      </div>

      <div className="register-section">
        <h3>➕ 새 드론 등록</h3>
        <form onSubmit={handleRegisterSubmit} className="register-form">
          <input
            type="text"
            placeholder="드론 이름 (예: drone_01)"
            value={newDroneName}
            onChange={(e) => setNewDroneName(e.target.value)}
            required
            disabled={isRegistering}
          />
          <button type="submit" disabled={isRegistering}>
            {isRegistering ? '등록 중...' : '등록 시작'}
          </button>
        </form>
        <p className="register-hint">
          * 이름 입력 후 등록하면 ID가 자동 발급됩니다.<br />
          * 이미 존재하는 이름이면 접속 기록이 갱신됩니다.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
