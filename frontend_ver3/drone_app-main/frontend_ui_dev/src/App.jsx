import { useState, useEffect, useCallback } from 'react'
import './App.css'

// 컴포넌트
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';

// Mock 데이터
import { mockDrones, mockLogs, mockLivePhotos } from './mockData';

// UI 개발 모드 설정
// true: Mock 데이터 사용 (서버 없이 UI 작업)
// false: 실제 API 사용 (서버 필요)
// 자동 감지: 서버 연결 테스트 후 결정
const AUTO_DETECT_SERVER = true; // true면 서버 자동 감지
const USE_MOCK_DATA = !AUTO_DETECT_SERVER; // AUTO_DETECT_SERVER가 false면 이 값 사용

// Mock 데이터를 안전하게 복사
const getInitialDrones = () => {
  try {
    console.log('📦 Mock 데이터 로드:', mockDrones);
    return [...mockDrones];
  } catch (error) {
    console.error('❌ Mock 데이터 로드 실패:', error);
    return [];
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'app'
  const [useMockData, setUseMockData] = useState(USE_MOCK_DATA);

  // 초기 상태에 Mock 데이터 바로 설정
  const [drones, setDrones] = useState(getInitialDrones);
  const [selectedDrone, setSelectedDrone] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);

  // 서버 연결 테스트 (자동 감지 모드)
  useEffect(() => {
    if (AUTO_DETECT_SERVER) {
      const testServer = async () => {
        try {
          const response = await fetch('/api/health', { 
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2초 타임아웃
          });
          if (response.ok) {
            console.log('✅ 서버 연결 성공 - 실제 API 사용');
            setUseMockData(false);
            // 실제 드론 목록 가져오기
            fetchDronesReal();
          }
        } catch (error) {
          console.log('⚠️ 서버 연결 실패 - Mock 데이터 사용');
          setUseMockData(true);
          setDrones(getInitialDrones());
        }
      };
      testServer();
    }
  }, []);

  // 실제 API로 드론 목록 조회
  const fetchDronesReal = useCallback(async () => {
    try {
      const response = await fetch('/api/drones');
      const data = await response.json();
      if (data.success) {
        console.log('📡 실제 드론 목록 가져옴:', data.data.drones);
        setDrones(data.data.drones);
      }
    } catch (err) {
      console.error('❌ 드론 목록 조회 실패:', err);
      // 실패 시 Mock 데이터로 폴백
      setUseMockData(true);
      setDrones(getInitialDrones());
    }
  }, []);

  // 드론 목록 조회 (Mock 또는 실제 API)
  const fetchDrones = useCallback(async () => {
    if (useMockData) {
      // Mock 모드: 항상 Mock 데이터로 설정
      console.log('🔄 Mock 데이터로 드론 목록 갱신');
      setDrones([...mockDrones]);
      return;
    }

    // 실제 API 호출
    await fetchDronesReal();
  }, [useMockData, fetchDronesReal]);

  // 초기 로드 및 폴링
  useEffect(() => {
    if (useMockData) {
      // Mock 모드: 초기 데이터만 설정
      console.log('🚀 초기 로드: Mock 데이터 설정');
      setDrones([...mockDrones]);
    } else {
      // 실제 API 모드: 폴링 시작
      fetchDrones();
      const interval = setInterval(fetchDrones, 5000); // 5초 간격
      return () => clearInterval(interval);
    }
  }, [useMockData]); // useMockData가 변경될 때만 실행

  // 드론 선택 핸들러 (Home -> Monitor)
  const handleSelectDrone = async (drone) => {
    // 1. UI 상태 변경 (먼저 진입)
    setSelectedDrone(drone);
    setViewMode('app');
    setActiveTab('monitor');

    // 2. 실제 API 모드에서만 접속 시간 업데이트
    if (!useMockData) {
      try {
        await fetch(`/api/drones/${drone.drone_name}/connect`, {
          method: 'POST'
        });
        fetchDrones();
      } catch (err) {
        console.error('접속 시간 업데이트 실패:', err);
      }
    }
  };

  // 홈으로 가기 (Disconnect)
  const handleGoHome = () => {
    setSelectedDrone(null);
    setViewMode('home');
  };

  // 드론 등록 핸들러
  const handleRegister = async (droneName) => {
    setIsRegistering(true);
    
    // Mock 모드: 목록에 추가만
    if (useMockData) {
      setTimeout(() => {
        const newDrone = {
          drone_db_id: `GK_2025_${String(drones.length + 1).padStart(2, '0')}`,
          drone_name: droneName,
          drone_video_url: null,
          drone_connect_time: new Date().toISOString(),
          drone_lat: 37.5665,
          drone_lon: 126.9780,
        };
        setDrones([...drones, newDrone]);
        setIsRegistering(false);
        alert(`✅ 등록 완료: ${droneName}\nID: ${newDrone.drone_db_id}`);
      }, 500);
      return;
    }

    // 실제 API 호출
    try {
      const res = await fetch('/api/register', {
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

  // 디버깅: 드론 목록 상태 확인
  useEffect(() => {
    console.log('📊 현재 드론 목록:', drones);
    console.log('📊 드론 개수:', drones.length);
    console.log('📊 Mock 모드:', useMockData ? 'ON' : 'OFF');
  }, [drones, useMockData]);

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
            API_BASE=""
            useMockData={useMockData}
            mockLogs={mockLogs}
            mockLivePhotos={mockLivePhotos}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage
            selectedDrone={selectedDrone}
            drones={drones}
            onDroneSelect={(d) => setSelectedDrone(d)}
            API_BASE=""
            useMockData={useMockData}
            mockLogs={mockLogs}
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
