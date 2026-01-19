// UI 개발용 Mock 데이터
export const mockDrones = [
  {
    drone_db_id: 'GK_2025_01',
    drone_name: 'drone_alpha',
    drone_video_url: 'http://192.168.1.100:8080/?action=stream',
    drone_connect_time: new Date().toISOString(),
    drone_lat: 37.5665,
    drone_lon: 126.9780,
  },
  {
    drone_db_id: 'GK_2025_02',
    drone_name: 'drone_beta',
    drone_video_url: 'http://192.168.1.101:8080/?action=stream',
    drone_connect_time: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
    drone_lat: 37.5651,
    drone_lon: 126.9895,
  },
  {
    drone_db_id: 'GK_2025_03',
    drone_name: 'drone_gamma',
    drone_video_url: null,
    drone_connect_time: null, // 오프라인
    drone_lat: 37.5680,
    drone_lon: 126.9750,
  },
];

// 가상 이벤트 데이터 (다양한 확률과 상황)
export const mockLogs = {
  'drone_alpha': [
    {
      id: Date.now(),
      drone_db_id: 'GK_2025_01',
      event_time: new Date().toISOString(), // 방금 전
      confidence: 0.98, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=CRITICAL+98%25',
      gps_lat: 37.5665,
      gps_lon: 126.9780,
      risk_level: 'critical',
      temperature: 53.5,
      humidity: 16,
      wind_speed: 14.2,
    },
    {
      id: Date.now() - 1,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 20000).toISOString(), // 20초 전
      confidence: 0.99, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=CRITICAL+99%25',
      gps_lat: 37.5665,
      gps_lon: 126.9780,
      risk_level: 'critical',
      temperature: 52.3,
      humidity: 18,
      wind_speed: 13.1,
    },
    {
      id: Date.now() - 1,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 30000).toISOString(), // 30초 전
      confidence: 0.97, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=CRITICAL+97%25',
      gps_lat: 37.5665,
      gps_lon: 126.9780,
      risk_level: 'critical',
      temperature: 49.2,
      humidity: 21,
      wind_speed: 10.5,
    },
    {
      id: Date.now() + 1,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 120000).toISOString(), // 2분 전
      confidence: 0.96, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=CRITICAL+96%25',
      gps_lat: 37.5665,
      gps_lon: 126.9780,
      risk_level: 'critical',
      temperature: 47.8,
      humidity: 23,
      wind_speed: 9.2,
    },
    {
      id: 1,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 300000).toISOString(), // 5분 전
      confidence: 0.98, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=CRITICAL+98%25',
      gps_lat: 37.5665,
      gps_lon: 126.9780,
      risk_level: 'critical',
      temperature: 45.5,
      humidity: 25,
      wind_speed: 8.2,
    },
    {
      id: 2,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 60000).toISOString(), // 1분 전
      confidence: 0.92, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+92%25',
      gps_lat: 37.5666,
      gps_lon: 126.9781,
      risk_level: 'high',
      temperature: 42.3,
      humidity: 28,
      wind_speed: 7.5,
    },
    {
      id: 3,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 180000).toISOString(), // 3분 전
      confidence: 0.85, // 위험
      image_path: 'https://via.placeholder.com/800x600/FF9500/FFFFFF?text=Fire+Detection+85%25',
      gps_lat: 37.5667,
      gps_lon: 126.9782,
      risk_level: 'high',
      temperature: 38.7,
      humidity: 32,
      wind_speed: 6.8,
    },
    {
      id: 4,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 300000).toISOString(), // 5분 전
      confidence: 0.78, // 위험
      image_path: 'https://via.placeholder.com/800x600/FF9500/FFFFFF?text=Fire+Detection+78%25',
      gps_lat: 37.5668,
      gps_lon: 126.9783,
      risk_level: 'medium',
      temperature: 35.2,
      humidity: 35,
      wind_speed: 5.5,
    },
    {
      id: 5,
      drone_db_id: 'GK_2025_01',
      event_time: new Date(Date.now() - 600000).toISOString(), // 10분 전
      confidence: 0.65, // 주의
      image_path: 'https://via.placeholder.com/800x600/FFCC00/FFFFFF?text=Fire+Detection+65%25',
      gps_lat: 37.5669,
      gps_lon: 126.9784,
      risk_level: 'medium',
      temperature: 32.1,
      humidity: 40,
      wind_speed: 4.2,
    },
  ],
  'drone_beta': [
    {
      id: Date.now() - 2,
      drone_db_id: 'GK_2025_02',
      event_time: new Date().toISOString(), // 방금 전 (오늘)
      confidence: 0.95, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+95%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 54.2,
      humidity: 14,
      wind_speed: 13.5,
    },
    {
      id: Date.now() - 3,
      drone_db_id: 'GK_2025_02',
      event_time: new Date(Date.now() - 25000).toISOString(), // 25초 전
      confidence: 0.96, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+96%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 51.7,
      humidity: 15,
      wind_speed: 12.8,
    },
    {
      id: Date.now() - 3,
      drone_db_id: 'GK_2025_02',
      event_time: new Date(Date.now() - 45000).toISOString(), // 45초 전
      confidence: 0.93, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+93%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 50.1,
      humidity: 17,
      wind_speed: 11.2,
    },
    {
      id: Date.now() + 2,
      drone_db_id: 'GK_2025_02',
      event_time: new Date(Date.now() - 180000).toISOString(), // 3분 전
      confidence: 0.95, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+95%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 48.5,
      humidity: 18,
      wind_speed: 10.1,
    },
    {
      id: 1,
      drone_db_id: 'GK_2025_02',
      event_time: new Date(Date.now() - 180000).toISOString(), // 3분 전
      confidence: 0.94, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+94%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 46.2,
      humidity: 20,
      wind_speed: 9.5,
    },
    {
      id: 2,
      drone_db_id: 'GK_2025_02',
      // 오늘 오후 2시 30분
      event_time: (() => {
        const today = new Date();
        today.setHours(14, 30, 0, 0);
        return today.toISOString();
      })(),
      confidence: 0.91, // 매우 위험
      image_path: 'https://via.placeholder.com/800x600/FF3B30/FFFFFF?text=Fire+Detection+91%25',
      gps_lat: 37.5651,
      gps_lon: 126.9895,
      risk_level: 'critical',
      temperature: 44.8,
      humidity: 22,
      wind_speed: 9.1,
    },
    {
      id: 3,
      drone_db_id: 'GK_2025_02',
      // 오늘 오전 11시 15분
      event_time: (() => {
        const today = new Date();
        today.setHours(11, 15, 0, 0);
        return today.toISOString();
      })(),
      confidence: 0.88, // 위험
      image_path: 'https://via.placeholder.com/800x600/FF9500/FFFFFF?text=Fire+Detection+88%25',
      gps_lat: 37.5652,
      gps_lon: 126.9896,
      risk_level: 'high',
      temperature: 40.5,
      humidity: 26,
      wind_speed: 7.8,
    },
  ],
  'drone_gamma': [],
};

export const mockLivePhotos = {
  'drone_alpha': [
    {
      id: Date.now() - 10,
      event_time: new Date().toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+98%25',
      confidence: 0.98,
      gps_lat: 37.5665,
      gps_lon: 126.9780,
    },
    {
      id: Date.now() - 11,
      event_time: new Date(Date.now() - 20000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+99%25',
      confidence: 0.99,
      gps_lat: 37.5665,
      gps_lon: 126.9780,
    },
    {
      id: Date.now() - 11,
      event_time: new Date(Date.now() - 30000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+97%25',
      confidence: 0.97,
      gps_lat: 37.5665,
      gps_lon: 126.9780,
    },
    {
      id: Date.now() + 10,
      event_time: new Date(Date.now() - 120000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+96%25',
      confidence: 0.96,
      gps_lat: 37.5665,
      gps_lon: 126.9780,
    },
    {
      id: 1,
      event_time: new Date(Date.now() - 300000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+98%25',
      confidence: 0.98,
      gps_lat: 37.5665,
      gps_lon: 126.9780,
    },
    {
      id: 2,
      event_time: new Date(Date.now() - 60000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+92%25',
      confidence: 0.92,
      gps_lat: 37.5666,
      gps_lon: 126.9781,
    },
    {
      id: 3,
      event_time: new Date(Date.now() - 120000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF9500/FFFFFF?text=Live+85%25',
      confidence: 0.85,
      gps_lat: 37.5667,
      gps_lon: 126.9782,
    },
    {
      id: 4,
      event_time: new Date(Date.now() - 180000).toISOString(),
      image_path: 'https://via.placeholder.com/400x300/FF9500/FFFFFF?text=Live+78%25',
      confidence: 0.78,
      gps_lat: 37.5668,
      gps_lon: 126.9783,
    },
  ],
  'drone_beta': [
    {
      id: Date.now() - 20,
      event_time: new Date().toISOString(), // 방금 전 (오늘)
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+95%25',
      confidence: 0.95,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: Date.now() - 21,
      event_time: new Date(Date.now() - 25000).toISOString(), // 25초 전
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+96%25',
      confidence: 0.96,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: Date.now() - 21,
      event_time: new Date(Date.now() - 45000).toISOString(), // 45초 전
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+93%25',
      confidence: 0.93,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: Date.now() + 20,
      event_time: new Date(Date.now() - 180000).toISOString(), // 3분 전
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+95%25',
      confidence: 0.95,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: 1,
      event_time: new Date(Date.now() - 180000).toISOString(), // 3분 전
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+94%25',
      confidence: 0.94,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: 2,
      // 오늘 오후 2시 30분
      event_time: (() => {
        const today = new Date();
        today.setHours(14, 30, 0, 0);
        return today.toISOString();
      })(),
      image_path: 'https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Live+91%25',
      confidence: 0.91,
      gps_lat: 37.5651,
      gps_lon: 126.9895,
    },
    {
      id: 3,
      // 오늘 오전 11시 15분
      event_time: (() => {
        const today = new Date();
        today.setHours(11, 15, 0, 0);
        return today.toISOString();
      })(),
      image_path: 'https://via.placeholder.com/400x300/FF9500/FFFFFF?text=Live+88%25',
      confidence: 0.88,
      gps_lat: 37.5652,
      gps_lon: 126.9896,
    },
  ],
  'drone_gamma': [],
};

// 실시간 이벤트 시뮬레이션용 함수
export const generateRandomEvent = (droneName, droneDbId) => {
  const confidences = [0.95, 0.88, 0.82, 0.75, 0.65, 0.55];
  const confidence = confidences[Math.floor(Math.random() * confidences.length)];
  const riskLevels = ['critical', 'high', 'medium', 'low'];
  const riskLevel = confidence >= 0.9 ? 'critical' : confidence >= 0.75 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  
  return {
    id: Date.now(),
    drone_db_id: droneDbId,
    event_time: new Date().toISOString(),
    confidence: confidence,
    image_path: `https://via.placeholder.com/800x600/${confidence >= 0.9 ? 'FF3B30' : confidence >= 0.75 ? 'FF9500' : 'FFCC00'}/FFFFFF?text=Fire+${(confidence * 100).toFixed(0)}%25`,
    gps_lat: 37.5665 + (Math.random() - 0.5) * 0.01,
    gps_lon: 126.9780 + (Math.random() - 0.5) * 0.01,
    risk_level: riskLevel,
    temperature: 30 + Math.random() * 20,
    humidity: 20 + Math.random() * 30,
    wind_speed: 3 + Math.random() * 10,
  };
};

