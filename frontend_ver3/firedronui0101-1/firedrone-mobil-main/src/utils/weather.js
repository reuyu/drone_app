// 기상청 API 또는 모의 데이터 생성
export const getWeatherData = async (latitude, longitude) => {
  // 실제 구현 시 기상청 API 호출
  // 현재는 모의 데이터 반환
  return {
    windSpeed: Math.random() * 15, // 0-15 m/s
    humidity: Math.random() * 100, // 0-100%
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
  };
};

// 위험 등급 판별
export const getDangerLevel = (humidity, windSpeed) => {
  if (humidity < 30 || windSpeed > 10) {
    return {
      level: 'danger',
      color: '#FF3B30',
      text: '위험',
    };
  }
  if (humidity < 50 || windSpeed > 7) {
    return {
      level: 'warning',
      color: '#FF9500',
      text: '주의',
    };
  }
  return {
    level: 'safe',
    color: '#34C759',
    text: '안전',
  };
};

