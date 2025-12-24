@echo off
chcp 65001
echo ========================================================
echo 🚀 드론 화재 감지 시스템 시작 (Drone Fire Detection System)
echo ========================================================

echo.
echo [1/2] 백엔드 서버 시작 (Backend Server)...
start "Drone Backend Server" /d "backend" node server.js

echo.
echo [2/2] 화재 감지 시뮬레이터 시작 (Mock Detector)...
start "Drone Simulator" /d "edge_script" python mock_detector.py

echo.
echo ========================================================
echo ✅ 시스템이 시작되었습니다!
echo.
echo 🌐 접속 주소:
echo   - 로컬: http://localhost:3000
echo   - 외부: http://220.69.241.189:3000 (포트포워딩 설정 완료 시)
echo.
echo (창을 닫아도 서버는 계속 실행됩니다. 종료하려면 각각의 창을 닫으세요.)
echo ========================================================
pause
