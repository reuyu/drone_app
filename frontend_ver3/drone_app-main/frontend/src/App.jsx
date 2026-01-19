import { useState, useEffect, useCallback } from 'react'
import './App.css'

// 컴포넌트
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';
// RegisterPage는 HomePage에 통합됨 (간편 등록)

// API URL (배포 시 빈 문자열)
const API_BASE = '';

function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'app'

  const [drones, setDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);

  // 드론 목록 조회 (useCallback 의존성 제거하여 무한 루프 방지)
  const fetchDrones = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/drones`)
      const data = await response.json()
      if (data.success) {
        setDrones(data.data.drones)
      }
    } catch (err) {
      console.error('드론 목록 조회 실패:', err)
    }
  }, []) // 의존성 없음

  // 초기 로드 및 폴링
  useEffect(() => {
    fetchDrones();
    const interval = setInterval(fetchDrones, 5000); // 5초 간격
    return () => clearInterval(interval);
  }, [fetchDrones]);

  // 드론 선택 핸들러 (Home -> Monitor)
  const handleSelectDrone = async (drone) => {
    // 1. UI 상태 변경 (먼저 진입)
    setSelectedDrone(drone);
    setViewMode('app');
    setActiveTab('monitor');

    // 2. 서버에 접속 시간 업데이트 요청
    try {
      await fetch(`${API_BASE}/api/drones/${drone.drone_name}/connect`, {
        method: 'POST'
      });
      // 3. 드론 목록 갱신 (시간 업데이트 반영)
      fetchDrones();
    } catch (err) {
      console.error('접속 시간 업데이트 실패:', err);
    }
  };

  // 홈으로 가기 (Disconnect)
  const handleGoHome = () => {
    setSelectedDrone(null);
    setViewMode('home');
  };

  // 드론 등록 핸들러 (HomePage에서 직접 호출)
  const handleRegister = async (droneName) => {
    setIsRegistering(true);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drone_name: droneName,
          drone_lat: 37.5665,
          drone_lon: 126.9780
        })
      });
      const data = await res.json();
      if (data.success) {
        const message = data.data.db_user_created === false 
          ? `✅ 등록 완료: ${data.data.drone_name}\n⚠️ DB 유저 생성은 실패했지만 드론 등록은 성공했습니다.`
          : `✅ 등록 완료: ${data.data.drone_name}\nID: ${data.data.drone_db_id}`;
        alert(message);
        // 등록 후 목록 갱신
        fetchDrones();
      } else {
        const errorMsg = data.error || data.message || '알 수 없는 오류';
        alert(`❌ 등록 실패: ${errorMsg}`);
      }
    } catch (err) {
      console.error('등록 오류:', err);
      alert(`❌ 서버 연결 실패: ${err.message}\n백엔드 서버가 실행 중인지 확인해주세요.`);
    } finally {
      setIsRegistering(false);
    }
  };

  // ==========================================
  // 렌더링 로직
  // ==========================================

  // 1. Home 화면 (드론 선택/등록)
  if (viewMode === 'home') {
    return (
      <div className="app">
        <HomePage
          drones={drones}
          onSelectDrone={handleSelectDrone}
          onRegister={handleRegister}
          isRegistering={isRegistering}
        />
      </div>
    );
  }

  // 2. App 화면 (Monitor / History)
  return (
    <div className="app">
      <header className="main-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleGoHome} style={{
            background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1rem'
          }}>
            ← Home
          </button>
        </div>
        <h1 style={{ fontSize: '1rem', margin: '0 10px' }}>{selectedDrone ? selectedDrone.drone_name : 'FireGuard'}</h1>
        <div className="header-right">
          <span className="status-dot online" style={{
            height: '10px', width: '10px', backgroundColor: '#238636', borderRadius: '50%', display: 'inline-block'
          }}></span>
        </div>
      </header>

      <main className="content-area">
        {activeTab === 'monitor' && (
          <MonitorPage
            selectedDrone={selectedDrone}
            drones={drones}
            onDroneSelect={(d) => setSelectedDrone(d)}
            onGoBack={handleGoHome}
            API_BASE={API_BASE}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage
            selectedDrone={selectedDrone}
            drones={drones}
            onDroneSelect={(d) => setSelectedDrone(d)}
            API_BASE={API_BASE}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'register') {
            // 탭에서 설정을 누르면 홈으로 이동
            handleGoHome();
          } else {
            setActiveTab(tab);
          }
        }}
      />
    </div>
  )
}

export default App
