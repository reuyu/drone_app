# 🔥 FireDrone - AI 드론 화재 감지 시스템 모바일 앱

React Native (Expo) 기반의 드론 화재 감지 모니터링 앱입니다.

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# Node.js 설치 확인 (v18 이상 필요)
node --version

# 의존성 설치
npm install
```

### 2. 앱 실행
```bash
# PowerShell에서 (Node.js 경로 추가 필요 시)
$env:Path += ";C:\Program Files\nodejs"
npx expo start

# 또는
npm start
```

### 3. 실행 옵션
- **모바일**: QR 코드 스캔 (Expo Go 앱 필요)
- **웹**: 터미널에서 `w` 키
- **Android**: 터미널에서 `a` 키
- **iOS**: 터미널에서 `i` 키

## ✨ 주요 기능

- ✅ 드론 목록 조회 및 등록 (이름만 입력, ID 자동 생성)
- ✅ 실시간 모니터링 (GPS, 날씨, 로그, 라이브 포토)
- ✅ 날짜별 이력 조회
- ✅ 자동 새로고침 (5초/1초 간격)
- ✅ 서버 연동 (실패 시 모의 데이터 사용)

## 📚 문서

- **📋 [인수인계서.md](./인수인계서.md)** - 전체 인수인계 가이드 (⚠️ 처음 시작할 때 읽기)
- **📖 [프로젝트_개요서.md](./프로젝트_개요서.md)** - 프로젝트 전체 개요 및 플로우차트
- **🔄 [차이점_비교표.md](./차이점_비교표.md)** - 기존 버전과의 차이점
- **🛠️ [작업자_가이드.md](./작업자_가이드.md)** - 상세 개발 가이드

## ⚙️ 설정

### API 서버 주소 설정
`src/utils/api.js` 파일에서 수정:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';  // 서버 주소
```

**참고**: 서버가 없어도 모의 데이터로 작동합니다.

## 🛠️ 기술 스택

- React Native (Expo) ~54.0.30
- React Navigation (Bottom Tabs, Native Stack)
- Expo Location, Notifications, AV
- Lucide React Native (아이콘)
- date-fns (날짜 처리)

## ❓ 문제 해결

**`npx` 명령어 인식 안 됨**:
```powershell
$env:Path += ";C:\Program Files\nodejs"
& "C:\Program Files\nodejs\npx.cmd" expo start
```

**자세한 문제 해결 방법은 [인수인계서.md](./인수인계서.md) 참고**

## 프로젝트 구조

```
src/
├── screens/          # 화면 컴포넌트
├── components/       # 재사용 컴포넌트
├── navigation/       # 네비게이션 설정
└── utils/            # 유틸리티 함수 및 API
```
