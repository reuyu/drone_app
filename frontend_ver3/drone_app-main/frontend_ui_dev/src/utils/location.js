// 위도/경도를 기반으로 지역명 생성
export const getLocationName = (lat, lon) => {
  if (!lat || !lon) return '';
  
  // 서울 지역 좌표 기반으로 간단한 지역명 생성
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  // 서울 중심 좌표: 37.5665, 126.9780
  // 간단한 지역명 매핑
  if (latNum >= 37.57 && lonNum >= 126.98) {
    return '서울시 중구';
  } else if (latNum >= 37.56 && lonNum >= 126.98) {
    return '서울시 종로구';
  } else if (latNum >= 37.56 && lonNum < 126.98) {
    return '서울시 용산구';
  } else if (latNum < 37.56 && lonNum >= 126.98) {
    return '서울시 마포구';
  } else {
    return '서울시 강남구';
  }
};

