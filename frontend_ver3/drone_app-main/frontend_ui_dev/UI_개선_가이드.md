# UI 개선 가이드

## 📋 기본 원칙

### 1. 프로젝트 인수인계서 기반 (근본 원칙)
- **아키텍처**: React + Vite (웹 애플리케이션)
- **API 구조**: 프로젝트 인수인계서에 명시된 엔드포인트 사용
  - `POST /api/register`
  - `POST /api/event`
  - `GET /api/logs/:drone_name`
- **데이터베이스 스키마**: 인수인계서의 MySQL 구조 준수
- **기본 UI 구성**:
  - Header: 드론 상태 요약
  - Main Left: Video (MJPEG 스트림)
  - Main Right: Log (1초마다 폴링)

### 2. firedronui0101-1 UI 참고 (디자인 요소만)
- **디자인 스타일**: 모던한 화이트 테마
- **컴포넌트 디자인**: 
  - BatteryIcon (배터리 아이콘)
  - DetectionCard (감지 카드)
  - DetectionDetailModal (상세 정보 모달)
- **UI 패턴**:
  - 카드 기반 레이아웃
  - 상태 배지 (Active/Offline)
  - 플로팅 액션 버튼 (FAB)
  - 모달 기반 등록

## 🎨 UI 개선 방향

### 현재 상태
- ✅ firedronui0101-1 스타일 적용 완료
- ✅ Mock 데이터로 UI 테스트 가능
- ✅ 기본 컴포넌트 구현 완료

### 개선할 부분

#### 1. 레이아웃 구조 (프로젝트 인수인계서 기준)
```
┌─────────────────────────────────┐
│ Header: 드론 상태 요약            │
├──────────────┬──────────────────┤
│ Main Left    │ Main Right       │
│ (Video)      │ (Log)            │
│              │                  │
│ MJPEG Stream │ Detection Log    │
│              │ (1초 폴링)       │
└──────────────┴──────────────────┘
```

#### 2. firedronui0101-1에서 참고할 UI 요소

**컴포넌트:**
- ✅ BatteryIcon - 배터리 표시
- ✅ DetectionCard - 감지 로그 카드
- ✅ DetectionDetailModal - 상세 정보 모달

**스타일:**
- ✅ 화이트 배경 (#FFFFFF)
- ✅ 카드 디자인 (border-radius: 16px)
- ✅ 상태 배지 색상 (Active: #2196F3, Offline: #9E9E9E)
- ✅ 플로팅 액션 버튼 (우측 하단)

**레이아웃:**
- ✅ 드론 목록: 카드 형태
- ✅ 모니터링: GPS, 날씨, 영상, 로그 순서
- ✅ 히스토리: 날짜별 필터링

## 🔄 작업 우선순위

### Phase 1: 기본 UI 완성 (현재)
- [x] Mock 데이터 설정
- [x] 드론 목록 화면
- [x] 모니터링 화면
- [x] 히스토리 화면
- [x] 기본 컴포넌트

### Phase 2: UI 세부 개선
- [ ] 레이아웃 최적화 (프로젝트 인수인계서 구조 반영)
- [ ] 반응형 디자인
- [ ] 애니메이션 추가
- [ ] 로딩 상태 개선

### Phase 3: 통합 및 최종 점검
- [ ] 원본 프로젝트에 반영
- [ ] API 연동 테스트
- [ ] 성능 최적화

## 📝 참고 파일

### 프로젝트 인수인계서
- `drone_app-main/프로젝트 인수인계서.txt`
- 핵심: React + Vite, API 구조, DB 스키마

### firedronui0101-1 UI 참고
- `firedronui0101-1/firedrone-mobil-main/src/screens/`
- `firedronui0101-1/firedrone-mobil-main/src/components/`
- 핵심: 디자인 스타일, 컴포넌트 구조

## ⚠️ 주의사항

1. **로직은 프로젝트 인수인계서 기준**
   - API 호출 방식
   - 데이터 구조
   - 폴링 주기 (5초/1초)

2. **UI는 firedronui0101-1 참고**
   - 디자인 스타일만
   - 컴포넌트 디자인만
   - 레이아웃 패턴만

3. **웹 환경 고려**
   - React Native → React 웹으로 변환
   - 모바일 전용 기능 제거
   - 웹 브라우저 최적화

