// MySQL drone_list 테이블 구조에 맞춘 모의 드론 데이터
// 실제 시스템에서는 API를 통해 조회됨
export const mockDrones = [
  { 
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_video_url: null,
    drone_connect_time: new Date('2024-12-26T10:00:00'),
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    // UI 표시용 추가 필드
    status: 'Active',
    battery: 82,
  },
  { 
    drone_db_id: 'DRONE002',
    drone_name: 'Drone Beta',
    drone_video_url: null,
    drone_connect_time: new Date('2024-12-26T09:30:00'),
    drone_lat: 37.5565,
    drone_lon: 126.9680,
    status: 'Charging',
    battery: 10,
  },
  { 
    drone_db_id: 'DRONE003',
    drone_name: 'Drone Gamma',
    drone_video_url: null,
    drone_connect_time: null,
    drone_lat: null,
    drone_lon: null,
    status: 'Offline',
    battery: 0,
  },
];

// MySQL drone_name 테이블 구조에 맞춘 모의 감지 이미지 데이터
// Jetson Orin Nano의 RT-DETR 모델 분석 결과
// 실제 시스템에서는 각 드론별 테이블(drone_name)에서 조회됨
export const mockDetectionHistory = [
  {
    id: 1,
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_video_url: 'https://example.com/video1.mp4',
    drone_connect_time: new Date('2024-12-26T10:30:00'),
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    // Jetson AI 분석 결과
    smoke_score: 98, // 연기 점수 (0-100)
    detection_probability: 98, // 탐지 확률
    object_class: 'smoke', // 객체 분류
    bounding_box: { x: 100, y: 150, width: 200, height: 180 }, // 위치 추정
    image_url: 'https://via.placeholder.com/300x200?text=Fire+Detection+1',
  },
  {
    id: 2,
    drone_db_id: 'DRONE002',
    drone_name: 'Drone Beta',
    drone_video_url: 'https://example.com/video2.mp4',
    drone_connect_time: new Date('2024-12-26T09:15:00'),
    drone_lat: 37.5565,
    drone_lon: 126.9680,
    smoke_score: 87,
    detection_probability: 87,
    object_class: 'smoke',
    bounding_box: { x: 120, y: 180, width: 180, height: 160 },
    image_url: 'https://via.placeholder.com/300x200?text=Fire+Detection+2',
  },
  {
    id: 3,
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_video_url: 'https://example.com/video3.mp4',
    drone_connect_time: new Date('2024-12-26T08:00:00'),
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    smoke_score: 92,
    detection_probability: 92,
    object_class: 'smoke',
    bounding_box: { x: 90, y: 140, width: 220, height: 200 },
    image_url: 'https://via.placeholder.com/300x200?text=Fire+Detection+3',
  },
  {
    id: 4,
    drone_db_id: 'DRONE003',
    drone_name: 'Drone Gamma',
    drone_video_url: 'https://example.com/video4.mp4',
    drone_connect_time: new Date('2024-12-25T16:45:00'),
    drone_lat: 37.5765,
    drone_lon: 126.9880,
    smoke_score: 76,
    detection_probability: 76,
    object_class: 'smoke',
    bounding_box: { x: 150, y: 200, width: 160, height: 140 },
    image_url: 'https://via.placeholder.com/300x200?text=Fire+Detection+4',
  },
];

// 실시간 감지 로그 (MonitoringScreen용)
// Jetson Orin Nano의 RT-DETR 모델이 실시간으로 분석한 데이터
export const mockDetectionLogs = [
  {
    id: 1,
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_connect_time: new Date(Date.now() - 300000), // 5분 전
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    smoke_score: 95,
    detection_probability: 95,
    object_class: 'smoke',
    bounding_box: { x: 100, y: 150, width: 200, height: 180 },
    image_url: 'https://via.placeholder.com/300x200/FF3B30/FFFFFF?text=Fire+1',
    // 기상 데이터는 별도 API로 조회 가능
    weather: { windSpeed: 12.5, humidity: 25, windDirection: 'NE' },
  },
  {
    id: 2,
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_connect_time: new Date(Date.now() - 600000), // 10분 전
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    smoke_score: 88,
    detection_probability: 88,
    object_class: 'smoke',
    bounding_box: { x: 120, y: 180, width: 180, height: 160 },
    image_url: 'https://via.placeholder.com/300x200/FF9500/FFFFFF?text=Fire+2',
    weather: { windSpeed: 9.2, humidity: 35, windDirection: 'SW' },
  },
  {
    id: 3,
    drone_db_id: 'DRONE001',
    drone_name: 'Drone Alpha',
    drone_connect_time: new Date(Date.now() - 900000), // 15분 전
    drone_lat: 37.5665,
    drone_lon: 126.9780,
    smoke_score: 92,
    detection_probability: 92,
    object_class: 'smoke',
    bounding_box: { x: 90, y: 140, width: 220, height: 200 },
    image_url: 'https://via.placeholder.com/300x200/FF3B30/FFFFFF?text=Fire+3',
    weather: { windSpeed: 11.8, humidity: 28, windDirection: 'E' },
  },
];

// video_url 테이블 구조에 맞춘 모의 스트리밍 URL 데이터
export const mockVideoUrls = {
  'Drone Alpha': 'http://192.168.0.100:5000/stream',
  'Drone Beta': 'http://192.168.0.101:5000/stream',
  'Drone Gamma': null,
};

