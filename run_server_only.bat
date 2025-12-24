@echo off
chcp 65001
echo ========================================================
echo 🚀 드론 화재 감지 서버 (Production Mode)
echo ========================================================
echo.
echo [INFO] Jetson 연동 모드로 서버를 시작합니다.
echo [INFO] 시뮬레이터(mock_detector)는 실행되지 않습니다.
echo.
echo 접속 주소:
echo   - 관리자(PC): http://localhost:3000
echo   - 외부 접속: http://220.69.241.189:3000 (공유기 설정 시)
echo.

cd backend
node server.js
pause
