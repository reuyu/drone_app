// API 서버 설정 및 통신 유틸리티
// 실제 서버 주소로 변경 필요
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // 개발 환경
  : 'https://your-server.com/api'; // 프로덕션 환경

/**
 * 드론 목록 조회 (drone_list 테이블)
 * @returns {Promise<Array>} 드론 목록
 */
export const fetchDroneList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/drones`);
    if (!response.ok) throw new Error('드론 목록 조회 실패');
    const data = await response.json();
    if (data.success) {
      return data.data.drones;
    }
    return [];
  } catch (error) {
    console.error('fetchDroneList error:', error);
    // 개발 환경에서는 모의 데이터 반환
    return null;
  }
};

/**
 * 특정 드론의 감지 이미지 목록 조회 (drone_name 테이블)
 * @param {string} droneDbId - 드론 DB ID
 * @returns {Promise<Array>} 감지 이미지 목록
 */
export const fetchDroneDetections = async (droneDbId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/drones/${droneDbId}/detections`);
    if (!response.ok) throw new Error('감지 이미지 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('fetchDroneDetections error:', error);
    return null;
  }
};

/**
 * 비디오 스트리밍 URL 조회 (video_url 테이블)
 * @param {string} droneName - 드론 이름
 * @returns {Promise<string|null>} 스트리밍 URL
 */
export const fetchStreamVideoUrl = async (droneName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/video-url/${droneName}`);
    if (!response.ok) throw new Error('비디오 URL 조회 실패');
    const data = await response.json();
    return data.stream_video_url;
  } catch (error) {
    console.error('fetchStreamVideoUrl error:', error);
    return null;
  }
};

/**
 * 실시간 감지 데이터 조회 (Jetson에서 분석한 최신 데이터)
 * @param {string} droneDbId - 드론 DB ID
 * @returns {Promise<Object|null>} 실시간 감지 데이터
 */
export const fetchRealtimeDetection = async (droneDbId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/drones/${droneDbId}/realtime`);
    if (!response.ok) throw new Error('실시간 데이터 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('fetchRealtimeDetection error:', error);
    return null;
  }
};

/**
 * 날짜별 감지 이력 조회
 * @param {string} droneDbId - 드론 DB ID
 * @param {Date} date - 조회할 날짜
 * @returns {Promise<Array>} 감지 이력
 */
export const fetchDetectionHistory = async (droneDbId, date) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/drones/${droneDbId}/history?date=${dateStr}`);
    if (!response.ok) throw new Error('이력 조회 실패');
    return await response.json();
  } catch (error) {
    console.error('fetchDetectionHistory error:', error);
    return null;
  }
};

/**
 * 드론 등록 (drone_list 테이블에 추가)
 * @param {Object} droneData - 드론 데이터
 * @param {string} droneData.drone_name - 드론 이름 (필수)
 * @param {number|null} droneData.drone_lat - 위도 (선택)
 * @param {number|null} droneData.drone_lon - 경도 (선택)
 * @returns {Promise<Object|null>} 등록된 드론 데이터
 */
export const registerDrone = async (droneData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drone_name: droneData.drone_name,
        drone_lat: droneData.drone_lat || 37.5665,
        drone_lon: droneData.drone_lon || 126.9780,
      }),
    });
    if (!response.ok) throw new Error('드론 등록 실패');
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('registerDrone error:', error);
    // 개발 환경에서는 실패해도 null 반환 (로컬에서 처리)
    return null;
  }
};

/**
 * 드론 접속 시간 업데이트
 * @param {string} droneName - 드론 이름
 * @returns {Promise<boolean>} 성공 여부
 */
export const updateDroneConnectTime = async (droneName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/drones/${droneName}/connect`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('접속 시간 업데이트 실패');
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('updateDroneConnectTime error:', error);
    return false;
  }
};

/**
 * 드론 로그 조회 (drone_name 테이블)
 * @param {string} droneName - 드론 이름
 * @param {string|null} date - 날짜 (YYYY-MM-DD 형식, 선택)
 * @returns {Promise<Array>} 로그 목록
 */
export const fetchDroneLogs = async (droneName, date = null) => {
  try {
    const url = date 
      ? `${API_BASE_URL}/logs/${droneName}?date=${date}`
      : `${API_BASE_URL}/logs/${droneName}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('로그 조회 실패');
    const data = await response.json();
    if (data.success) {
      return data.data.logs;
    }
    return [];
  } catch (error) {
    console.error('fetchDroneLogs error:', error);
    return [];
  }
};

/**
 * 라이브 포토 조회 (접속 시간 이후의 포토)
 * @param {string} droneName - 드론 이름
 * @returns {Promise<Array>} 라이브 포토 목록
 */
export const fetchLivePhotos = async (droneName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/drones/${droneName}/live-photos`);
    if (!response.ok) throw new Error('라이브 포토 조회 실패');
    const data = await response.json();
    if (data.success) {
      return data.data.photos;
    }
    return [];
  } catch (error) {
    console.error('fetchLivePhotos error:', error);
    return [];
  }
};

