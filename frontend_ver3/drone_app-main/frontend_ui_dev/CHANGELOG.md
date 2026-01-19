# UI 개선 변경사항

## 📅 2026-01-01

### ✨ 주요 변경사항

#### 1. 모바일 최적화
- 모바일 퍼스트 디자인 적용
- Safe Area 처리 (상단/하단)
- 터치 최적화 (최소 44px 터치 영역)

#### 2. Detection Log 재구성
- **형식 변경**: "오늘 n개 탐지" 형식으로 표시
- **최근 탐지 섹션**:
  - 확률 색상으로 위험도 표시 (90% 이상: 빨강, 75% 이상: 주황, 60% 이상: 노랑)
  - 시간 24시간 형식 표시
  - 지역명 표시
  - 풍속, 온도 정보 표시
- **긴급 표시 제거**: 확률 색상으로만 위험도 표시

#### 3. Detection Card 재구성
- **레이아웃 변경**: 확률 → 시간 → 지역 순서
- **경고 배지 제거**: 이모티콘 중첩 문제 해결
- **클릭 피드백**: 토스 스타일의 부드러운 클릭 효과

#### 4. HistoryPage 재구성
- **정보 순서**: 날짜 → 시간(24시간) → 지역 → 탐지 드론 → 풍속, 온도
- **시간 형식**: 24시간 형식으로 통일
- **지역명 표시**: GPS 좌표 옆에 지역명 표시

#### 5. 드론 목록 개선
- **오늘 탐지 사건 수 표시**: 각 드론 카드에 "오늘 n개 탐지" 배지 추가
- 빨간색으로 강조 표시

#### 6. 하단 네비게이션 개선
- **기본 색상**: 검은색 (#000000)
- **활성 탭**: 볼드체 (font-weight: 700)

#### 7. 연결 상태 표시
- **MonitorPage 헤더 우측**: 초록색 점으로 연결 상태 표시
- 드론이 연결되어 있을 때만 표시

#### 8. 지역명 기능 추가
- **위도/경도 → 지역명 변환**: `src/utils/location.js`
- GPS 좌표 옆에 지역명 표시 (예: "서울시 중구")
- Detection Card, MonitorPage, HistoryPage, 상세 모달에 적용

### 📁 변경된 파일 목록

#### 새로 추가된 파일
- `src/utils/location.js` - 지역명 변환 유틸리티
- `src/mockData.js` - Mock 데이터 (임시 이벤트 포함)

#### 수정된 파일
- `src/pages/HomePage.jsx` - 드론 목록에 오늘 탐지 수 표시
- `src/pages/MonitorPage.jsx` - Detection Log 재구성, 지역명 추가, 연결 상태 표시
- `src/pages/HistoryPage.jsx` - 정보 순서 재구성, 지역명 추가
- `src/components/DetectionCard.jsx` - 레이아웃 변경, 경고 배지 제거, 클릭 피드백
- `src/components/DetectionDetailModal.jsx` - GPS에 지역명 추가
- `src/components/BottomNav.jsx` - 색상 변경, 활성 탭 볼드체
- `src/pages/HomePage.css` - 오늘 탐지 배지 스타일 추가
- `src/pages/MonitorPage.css` - 연결 상태 점 스타일 추가
- `src/components/DetectionCard.css` - 클릭 피드백 스타일 추가
- `src/pages/HistoryPage.css` - 지역명 스타일 추가

### 🎨 디자인 개선사항

1. **토스 스타일 클릭 피드백**
   - `scale(0.98)` 변환
   - 배경색 변경 (#F9F9F9)
   - 부드러운 transition

2. **색상 체계**
   - 위험도별 확률 색상:
     - 90% 이상: #FF3B30 (빨강)
     - 75% 이상: #FF9500 (주황)
     - 60% 이상: #FFCC00 (노랑)
     - 60% 미만: #34C759 (초록)

3. **타이포그래피**
   - 기본 색상: 검은색 (#000000)
   - 보조 텍스트: 회색 (#8E8E93)
   - 활성 탭: 볼드체

### 🚀 실행 방법

```bash
cd frontend_ui_dev
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 📝 참고사항

- Mock 데이터로 작동하므로 서버 없이도 UI 확인 가능
- `src/mockData.js`에서 임시 이벤트 데이터 확인 가능
- 지역명은 위도/경도 기반으로 간단하게 매핑 (실제로는 API 연동 필요)

