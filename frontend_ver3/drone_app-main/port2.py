import threading
import time
import json
import serial
import requests
import pynmea2
import mysql.connector
import io
import socket
import atexit
import sys
import numpy as np

from mysql.connector import Error
from flask import Flask, Response
from PIL import Image
from picamera2 import Picamera2
from datetime import datetime

# =======================================================
# [1] 통합 설정 (CONFIG)
# =======================================================
DB_CONFIG = {
    'host': '220.69.241.189',
    'port': 3306,
    'user': 'GK_2025_00',   
    'password': '',         # [필수] DB 비밀번호 입력
    'database': 'smoke_db'
}

SERIAL_PORT = "/dev/ttyUSB0"
BAUD_RATE = 9600
MY_API_KEY = "a3d40dd220725b4053af9409651cbbec"             # [필수] OpenWeatherMap API 키 입력

MY_DRONE_ID = DB_CONFIG['user']

# =======================================================
# [2] 전역 변수 및 공유 데이터
# =======================================================
shared_gps_data = {
    'lat': 36.5683, 
    'lon': 128.7297,
    'updated': False
}

# 공인 IP 확인 (실패 시 로컬호스트)
try:
    public_ip = requests.get("http://checkip.amazonaws.com/", timeout=3).text.strip()
except:
    public_ip = "127.0.0.1"

VIDEO_STREAM_URL = f"http://{public_ip}:8080/stream"

app = Flask(__name__)
picam2 = None

# =======================================================
# [3] 카메라 초기화
# =======================================================
try:
    picam2 = Picamera2()
    # 해상도 및 FPS 설정
    config = picam2.create_video_configuration(
        main={"size": (600, 600), "format": "RGB888"},
        controls={"FrameDurationLimits": (33333, 33333)}
    )
    picam2.configure(config)
    picam2.start()
    print(f"📷 카메라 초기화 완료! 스트리밍 주소: {VIDEO_STREAM_URL}")

    @atexit.register
    def stop_camera():
        if picam2 and picam2.started:
            picam2.stop()
except Exception as e:
    print(f"❌ 카메라 초기화 실패: {e}")
    picam2 = None

# =======================================================
# [4] 기능 모듈 (함수 정의)
# =======================================================
def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"❌ DB 연결 실패: {e}")
        return None

def calculate_risk(temp, wind_speed, humidity):
    """위험도 계산 로직"""
    score = (temp * 0.2) + (wind_speed * 0.5) + ((100 - humidity) * 0.3)
    if score >= 80: status = "Critical"
    elif score >= 50: status = "Caution"
    else: status = "Normal"
    return round(score, 2), status

def get_weather(lat, lon):
    """OpenWeatherMap API 호출"""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": MY_API_KEY, "units": "metric"}
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200: return res.json()
    except: pass
    return None

# =======================================================
# [5] 스레드 작업 함수 (GPS, Weather)
# =======================================================
def gps_thread_task():
    """GPS 수신 및 위치 DB 업데이트 스레드"""
    print("🛰️ GPS 스레드 시작")
    conn = get_db_connection()
    try:
        ser = serial.Serial(SERIAL_PORT, baudrate=BAUD_RATE, timeout=1)
    except Exception as e:
        print(f"❌ 시리얼 포트 오류: {e}")
        return

    while True:
        try:
            line = ser.readline().decode('ascii', errors='replace')
            if line.startswith('$GPRMC'):
                try:
                    msg = pynmea2.parse(line)
                    if msg.status == 'A':
                        lat = msg.latitude
                        lon = msg.longitude
                        
                        # 공유 변수 및 DB 업데이트
                        shared_gps_data['lat'] = lat
                        shared_gps_data['lon'] = lon
                        shared_gps_data['updated'] = True
                        
                        if conn and conn.is_connected():
                            cursor = conn.cursor()
                            query = "UPDATE drone_list SET drone_lat = %s, drone_lon = %s WHERE drone_db_id = %s"
                            cursor.execute(query, (lat, lon, MY_DRONE_ID))
                            conn.commit()
                            cursor.close()
                        else:
                            conn = get_db_connection()
                        
                        time.sleep(3) # 3초 간격
                except pynmea2.ParseError:
                    continue
        except Exception as e:
            print(f"⚠️ GPS 루프 오류: {e}")
            time.sleep(1)

def weather_risk_thread_task():
    """날씨 조회 및 통합 정보(위험도, URL, 날씨) DB 업데이트 스레드"""
    print("☁️ 날씨/위험도 스레드 시작")
    
    while True:
        # GPS 정보가 수신될 때까지 대기
        if not shared_gps_data['updated']:
            time.sleep(2)
            continue
            
        lat = shared_gps_data['lat']
        lon = shared_gps_data['lon']
        
        # 날씨 API 호출
        w_data = get_weather(lat, lon)
        
        if w_data:
            try:
                main = w_data.get("main", {})
                wind = w_data.get("wind", {})
                
                temp = main.get("temp", 0)       # 기온
                humid = main.get("humidity", 0)  # 습도
                ws = wind.get("speed", 0)        # 풍속
                
                # 위험도 계산
                risk_score, risk_status = calculate_risk(temp, ws, humid)
                
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    
                    # ---------------------------------------------------------
                    # [수정완료] lisk_level -> risk_level 로 변경됨
                    # ---------------------------------------------------------
                    query = """
                        UPDATE drone_list 
                        SET risk_level = %s, 
                            drone_video_url = %s,
                            temperature = %s,
                            humidity = %s,
                            wind_speed = %s
                        WHERE drone_db_id = %s
                    """
                    cursor.execute(query, (risk_score, VIDEO_STREAM_URL, temp, humid, ws, MY_DRONE_ID))
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                    
                    now = datetime.now().strftime("%H:%M:%S")
                    print(f"[{now}] ✅ 정보 업데이트 | 위험도: {risk_score} | 기온: {temp}°C | 습도: {humid}% | 풍속: {ws}m/s")
            except Exception as e:
                print(f"⚠️ DB 업데이트 중 오류: {e}")
        else:
            print("⚠️ 날씨 데이터를 가져올 수 없습니다.")
            
        time.sleep(10) # 10초 간격

# =======================================================
# [6] Flask 스트리밍 관련 함수
# =======================================================
def generate_frames():
    if picam2 is None:
        yield b"Camera Error"
        return

    while True:
        try:
            frame = picam2.capture_array()
            frame = frame[..., ::-1] # BGR -> RGB
            img = Image.fromarray(frame)
            
            with io.BytesIO() as output:
                img.save(output, format="JPEG", quality=70)
                frame_bytes = output.getvalue()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.02)
        except Exception:
            time.sleep(1)

@app.route('/stream')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return f'<img src="/stream" width="640" height="640"><br><h2>Drone ID: {MY_DRONE_ID}</h2>'

# =======================================================
# [7] 메인 실행부
# =======================================================
if __name__ == "__main__":
    print(f">>> 시스템 시작: ID [{MY_DRONE_ID}]")

    # 스레드 시작
    t_gps = threading.Thread(target=gps_thread_task, daemon=True)
    t_gps.start()

    t_weather = threading.Thread(target=weather_risk_thread_task, daemon=True)
    t_weather.start()

    # 메인 Flask 서버 시작
    print(f"📡 영상 서버 시작: http://0.0.0.0:8080 (외부접속: {VIDEO_STREAM_URL})")
    app.run(host='0.0.0.0', port=8080, threaded=True)
