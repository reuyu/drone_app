#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mock_detector.py - 드론 화재 감지 시뮬레이터

Jetson Nano 로컬 테스트용 더미 스크립트입니다.
실제 AI 모델 없이 백엔드 API를 테스트할 수 있습니다.

사용법:
    python mock_detector.py

필요 라이브러리:
    pip install requests
"""

import requests
import random
import time
import json
from datetime import datetime

# ============================================
# 설정
# ============================================
API_BASE_URL = "http://localhost:3000"

# 테스트용 드론 정보
DRONE_CONFIG = {
    "drone_name": "test_drone_01",
    "drone_db_id": "DRN001",
    "drone_lat": 37.5665,  # 서울시청 좌표 (테스트용)
    "drone_lon": 126.9780
}

# 시뮬레이션 설정
MIN_INTERVAL_SEC = 3      # 최소 감지 간격 (초)
MAX_INTERVAL_SEC = 10     # 최대 감지 간격 (초)
DETECTION_PROBABILITY = 0.7  # 화재 감지 확률 (70%)


def register_drone():
    """
    드론을 서버에 등록합니다.
    서버 시작 후 최초 1회 실행해야 합니다.
    """
    url = f"{API_BASE_URL}/api/register"
    
    print(f"📡 드론 등록 요청: {DRONE_CONFIG['drone_name']}")
    
    try:
        response = requests.post(url, json=DRONE_CONFIG, timeout=10)
        result = response.json()
        
        if result.get("success"):
            print(f"✅ 드론 등록 성공!")
            print(f"   - 드론 이름: {result['data']['drone_name']}")
            print(f"   - 로그 테이블: {result['data']['log_table']}")
            return True
        else:
            print(f"❌ 드론 등록 실패: {result.get('message')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 서버 연결 실패. 서버가 실행 중인지 확인하세요: {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False


def send_fire_event(confidence, gps_lat=None, gps_lon=None):
    """
    화재 감지 이벤트를 서버로 전송합니다.
    
    Args:
        confidence: 화재 감지 신뢰도 (0.0 ~ 1.0)
        gps_lat: GPS 위도 (선택사항)
        gps_lon: GPS 경도 (선택사항)
    """
    url = f"{API_BASE_URL}/api/event"
    
    # GPS 좌표에 약간의 랜덤 변동 추가 (드론 이동 시뮬레이션)
    if gps_lat is None:
        gps_lat = DRONE_CONFIG["drone_lat"] + random.uniform(-0.001, 0.001)
    if gps_lon is None:
        gps_lon = DRONE_CONFIG["drone_lon"] + random.uniform(-0.001, 0.001)
    
    event_data = {
        "drone_name": DRONE_CONFIG["drone_name"],
        "confidence": round(confidence, 4),
        "image_path": f"/captures/{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg",
        "gps_lat": round(gps_lat, 8),
        "gps_lon": round(gps_lon, 8),
        "risk_level": round(confidence * 100, 2)  # Use confidence as risk level for simulation (0-100)
    }
    
    try:
        response = requests.post(url, json=event_data, timeout=10)
        result = response.json()
        
        if result.get("success"):
            print(f"🔥 화재 감지 이벤트 전송 성공!")
            print(f"   - 신뢰도: {confidence:.2%}")
            print(f"   - 위치: ({gps_lat:.6f}, {gps_lon:.6f})")
            print(f"   - 이벤트 ID: {result['data']['event_id']}")
            return True
        else:
            print(f"❌ 이벤트 전송 실패: {result.get('message')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 서버 연결 실패")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False


def check_server_health():
    """
    서버 상태를 확인합니다.
    """
    url = f"{API_BASE_URL}/api/health"
    
    try:
        response = requests.get(url, timeout=5)
        result = response.json()
        
        if result.get("success"):
            print(f"✅ 서버 상태: {result['status']}")
            print(f"   - 데이터베이스: {result['database']}")
            return True
        return False
        
    except:
        return False


def run_simulation():
    """
    화재 감지 시뮬레이션을 실행합니다.
    무한 루프로 랜덤한 간격으로 화재 감지 이벤트를 생성합니다.
    """
    print("=" * 60)
    print("🔥 드론 화재 감지 시뮬레이터 시작")
    print("=" * 60)
    
    # 1. 서버 상태 확인
    print("\n[1/2] 서버 상태 확인 중...")
    if not check_server_health():
        print("❌ 서버에 연결할 수 없습니다. 서버를 먼저 시작하세요.")
        print(f"   명령어: cd backend && npm start")
        return
    
    # 2. 드론 등록
    print("\n[2/2] 드론 등록 중...")
    if not register_drone():
        print("⚠️ 드론 등록에 실패했지만 시뮬레이션을 계속합니다.")
    
    # 3. 시뮬레이션 시작
    print("\n" + "=" * 60)
    print("🚁 시뮬레이션 시작! (중지: Ctrl+C)")
    print("=" * 60 + "\n")
    
    event_count = 0
    
    try:
        while True:
            # 랜덤한 시간 대기
            wait_time = random.uniform(MIN_INTERVAL_SEC, MAX_INTERVAL_SEC)
            print(f"⏳ {wait_time:.1f}초 후 다음 감지 시도...")
            time.sleep(wait_time)
            
            # 화재 감지 확률 체크
            if random.random() < DETECTION_PROBABILITY:
                event_count += 1
                # 랜덤 신뢰도 생성 (0.5 ~ 0.99)
                confidence = random.uniform(0.5, 0.99)
                
                print(f"\n[이벤트 #{event_count}] {datetime.now().strftime('%H:%M:%S')}")
                send_fire_event(confidence)
                print()
            else:
                print(f"👀 스캔 완료 - 화재 미감지\n")
                
    except KeyboardInterrupt:
        print("\n\n⛔ 시뮬레이션 종료")
        print(f"   - 총 전송된 이벤트: {event_count}개")


if __name__ == "__main__":
    run_simulation()
