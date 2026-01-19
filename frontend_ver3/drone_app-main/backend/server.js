/**
 * server.js - 드론 화재 감지 시스템 메인 백엔드 서버
 * 
 * 역할:
 * 1. API 제공 (드론 등록, 이벤트 기록, 로그 조회, 라이브 포토)
 * 2. React 정적 파일 서빙
 * 3. [1번 방식 전용] DB에 저장된 이미지 URL 그대로 반환
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { Expo } = require('expo-server-sdk');
const { pool, initializeDatabase, createDroneLogTable, createDroneDbUser, testConnection } = require('./database');

// Expo Push Notification 클라이언트
const expo = new Expo();

/**
 * 모든 등록된 기기에 푸시 알림 전송
 */
async function sendPushNotifications(data) {
    console.log('📢 sendPushNotifications 호출됨:', data);
    try {
        const [tokenRows] = await pool.execute('SELECT expo_push_token FROM push_tokens');
        if (tokenRows.length === 0) {
            console.log('📱 등록된 푸시 토큰이 없습니다.');
            return;
        }

        const messages = [];
        for (const row of tokenRows) {
            const token = row.expo_push_token;
            if (!Expo.isExpoPushToken(token)) {
                console.warn(`⚠️ 유효하지 않은 토큰: ${token}`);
                continue;
            }

            // 위험도 텍스트 변환
            // 위험도 텍스트 설
            const riskData = parseFloat(data.risk_level) || 0;
            let riskText = '안전';
            if (riskData >= 80) riskText = '위험';
            else if (riskData >= 50) riskText = '주의';

            messages.push({
                to: token,
                sound: 'default',
                title: `[${data.drone_name}] 연기 감지`,
                body: `연기 확률: ${(data.confidence * 100).toFixed(0)}% | 산불 위험도: ${riskText}`,
                data: {
                    type: 'fire_detection',
                    drone_name: data.drone_name,
                    confidence: data.confidence,
                    risk_level: data.risk_level
                },
                priority: 'high',
            });
        }

        if (messages.length === 0) return;

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(`📤 푸시 알림 전송 완료: ${ticketChunk.length}건`);
            } catch (error) {
                console.error('❌ 푸시 전송 실패:', error.message);
            }
        }
    } catch (error) {
        console.error('❌ 푸시 알림 처리 오류:', error.message);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 미들웨어 설정
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (React 빌드 파일)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ============================================
// API Endpoints
// ============================================

/**
 * POST /api/register
 */
app.post('/api/register', async (req, res) => {
    const { drone_name, drone_lat, drone_lon } = req.body;

    if (!drone_name) return res.status(400).json({ success: false, message: 'drone_name requried' });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.execute('SELECT drone_db_id FROM drone_list WHERE drone_name = ?', [drone_name]);
        const [urlRows] = await connection.execute('SELECT stream_video_url FROM video_url WHERE drone_name = ?', [drone_name]);
        const videoUrl = urlRows.length > 0 ? urlRows[0].stream_video_url : null;

        let drone_db_id;

        if (existing.length > 0) {
            drone_db_id = existing[0].drone_db_id;
            await connection.execute(`
                UPDATE drone_list 
                SET drone_connect_time = NOW(), drone_video_url = ?, drone_lat = ?, drone_lon = ?
                WHERE drone_name = ?
            `, [videoUrl, drone_lat || null, drone_lon || null, drone_name]);
        } else {
            const [idRows] = await connection.execute(`
                SELECT IFNULL(CONCAT('GK_2025_', LPAD(CAST(SUBSTRING(MAX(drone_db_id), 9) AS UNSIGNED) + 1, 2, '0')), 'GK_2025_00') AS new_id
                FROM drone_list WHERE drone_db_id LIKE 'GK_2025_%'
            `);
            drone_db_id = idRows[0].new_id;

            await connection.execute(`
                INSERT INTO drone_list (drone_db_id, drone_name, drone_video_url, drone_connect_time, drone_lat, drone_lon)
                VALUES (?, ?, ?, NOW(), ?, ?)
            `, [drone_db_id, drone_name, videoUrl, drone_lat || null, drone_lon || null]);
        }

        const logTable = await createDroneLogTable(drone_name);

        // [NEW] 드론 전용 DB 유저 생성 및 권한 부여 (실패해도 등록은 성공)
        let userCreated = false;
        try {
            await createDroneDbUser(drone_db_id, drone_name);
            userCreated = true;
        } catch (userError) {
            console.warn(`⚠️ DB 유저 생성 실패 (드론 등록은 계속 진행): ${userError.message}`);
            // 유저 생성 실패해도 드론 등록은 성공으로 처리
        }

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Registered', 
            data: { 
                drone_name, 
                drone_db_id, 
                log_table: logTable, 
                video_url: videoUrl,
                db_user_created: userCreated
            } 
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Register Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/event
 */
app.post('/api/event', async (req, res) => {
    const { drone_name, confidence, image_path, gps_lat, gps_lon, risk_level, temperature, humidity, wind_speed } = req.body;
    if (!drone_name) return res.status(400).json({ success: false, message: 'drone_name required' });

    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        const [droneRows] = await pool.execute('SELECT drone_db_id FROM drone_list WHERE drone_name = ?', [drone_name]);
        if (droneRows.length === 0) return res.status(404).json({ success: false, message: 'Drone not found' });

        const drone_db_id = droneRows[0].drone_db_id;

        // 1. 로그 테이블에 이벤트 기록
        const [result] = await pool.execute(`
            INSERT INTO \`${sanitizedTableName}\` (drone_db_id, confidence, image_path, gps_lat, gps_lon, risk_level, temperature, humidity, wind_speed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            drone_db_id,
            confidence || null,
            image_path || null,
            gps_lat || null,
            gps_lon || null,
            risk_level || null,
            temperature || null,
            humidity || null,
            wind_speed || null
        ]);

        // 2. drone_list 최신 상태 업데이트 (모니터링 화면용)
        await pool.execute(`
            UPDATE drone_list 
            SET drone_connect_time = NOW(),
                drone_lat = ?, 
                drone_lon = ?,
                risk_level = ?,
                temperature = ?,
                humidity = ?,
                wind_speed = ?
            WHERE drone_name = ?
        `, [
            gps_lat || null,
            gps_lon || null,
            risk_level || null,
            temperature || null,
            humidity || null,
            wind_speed || null,
            drone_name
        ]);

        console.log(`🔥 Fire Event: ${drone_name} (${(confidence * 100).toFixed(1)}%) - Risk: ${risk_level}`);

        // 3. 푸시 알림 전송 (비동기, 응답 블로킹 안함)
        sendPushNotifications({ drone_name, confidence, risk_level }).catch(err =>
            console.error('Push notification error:', err.message)
        );

        res.json({ success: true, message: 'Event saved', data: { event_id: result.insertId } });

    } catch (error) {
        console.error('❌ Event Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/logs/:drone_name
 */
app.get('/api/logs/:drone_name', async (req, res) => {
    const { drone_name } = req.params;
    const { date, since } = req.query;
    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        let query;
        let params = [];

        if (date) {
            query = `SELECT * FROM \`${sanitizedTableName}\` WHERE DATE(event_time) = ? ORDER BY event_time DESC`;
            params = [date];
        } else if (since) {
            query = `SELECT * FROM \`${sanitizedTableName}\` WHERE event_time > ? ORDER BY event_time DESC`;
            params = [since];
        } else {
            query = `SELECT * FROM \`${sanitizedTableName}\` ORDER BY event_time DESC LIMIT 10`;
        }

        const [rows] = await pool.execute(query, params);

        // [Ngrok 우회] ngrok 무료 도메인은 브라우저 접속 시 경고 페이지(HTML)를 먼저 띄워 이미지가 깨짐.
        // 따라서 내 서버가 대신 헤더('ngrok-skip-browser-warning')를 달고 가져오는 프록시 경로로 변환해줘야 함.
        const logsWithProxy = rows.map(log => ({
            ...log,
            image_path: log.image_path && (log.image_path.startsWith('http') || log.image_path.includes('ngrok'))
                ? `/api/proxy/image?url=${encodeURIComponent(log.image_path)}`
                : log.image_path
        }));

        res.json({ success: true, data: { logs: logsWithProxy } });

    } catch (error) {
        console.error('❌ 로그 조회 에러:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: { logs: [] } });
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drones/:drone_name/live-photos
 */
app.get('/api/drones/:drone_name/live-photos', async (req, res) => {
    const { drone_name } = req.params;
    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        const [droneRows] = await pool.execute('SELECT drone_connect_time FROM drone_list WHERE drone_name = ?', [drone_name]);
        if (droneRows.length === 0) return res.status(404).json({ success: false, message: 'Drone not found' });

        const connectTime = droneRows[0].drone_connect_time;
        if (!connectTime) return res.json({ success: true, data: { photos: [] } });

        const [rows] = await pool.execute(`
            SELECT id, event_time, image_path, confidence, gps_lat, gps_lon, risk_level, temperature, humidity, wind_speed
            FROM \`${sanitizedTableName}\`
            WHERE event_time > ?
            ORDER BY event_time DESC
        `, [connectTime]);

        // [Ngrok 우회] 라이브 포토에도 동일하게 프록시 적용
        const photosWithProxy = rows.map(photo => ({
            ...photo,
            image_path: photo.image_path && (photo.image_path.startsWith('http') || photo.image_path.includes('ngrok'))
                ? `/api/proxy/image?url=${encodeURIComponent(photo.image_path)}`
                : photo.image_path
        }));

        res.json({ success: true, data: { drone_name, connect_time: connectTime, photos: photosWithProxy } });

    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: { photos: [] } });
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/proxy/image
 * 이미지 전용 프록시 (Ngrok Browser Warning 우회용)
 */
app.get('/api/proxy/image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 5000,
            headers: {
                // 이 헤더가 있어야 ngrok 경고 페이지 없이 바로 이미지를 줌
                'ngrok-skip-browser-warning': 'true'
            },
            validateStatus: (status) => status >= 200 && status < 303
        });

        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        // 이미지가 없거나 타임아웃 등
        if (!res.headersSent) res.sendStatus(404);
    }
});



/**
 * POST /api/drones/:drone_name/connect
 */
app.post('/api/drones/:drone_name/connect', async (req, res) => {
    try {
        await pool.execute('UPDATE drone_list SET drone_connect_time = NOW() WHERE drone_name = ?', [req.params.drone_name]);
        res.json({ success: true, message: 'Connected' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drones/:drone_name/video-url
 */
app.get('/api/drones/:drone_name/video-url', async (req, res) => {
    const { drone_name } = req.params;
    try {
        const [rows] = await pool.execute('SELECT stream_video_url FROM video_url WHERE drone_name = ?', [drone_name]);
        if (rows.length > 0) {
            res.json({ success: true, data: { videoUrl: rows[0].stream_video_url } });
        } else {
            res.json({ success: true, data: { videoUrl: null } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drones/:drone_name/status
 */
app.get('/api/drones/:drone_name/status', async (req, res) => {
    const { drone_name } = req.params;
    try {
        const [rows] = await pool.execute(
            'SELECT drone_lat, drone_lon, drone_connect_time, risk_level, temperature, humidity, wind_speed FROM drone_list WHERE drone_name = ?',
            [drone_name]
        );
        if (rows.length > 0) {
            // battery 정보 제거
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Drone not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drones
 */
app.get('/api/drones', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT drone_db_id, drone_name, drone_video_url, drone_connect_time, drone_lat, drone_lon FROM drone_list ORDER BY drone_connect_time DESC');
        res.json({ success: true, data: { drones: rows } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/push-token
 * 푸시 알림 토큰 등록
 */
app.post('/api/push-token', async (req, res) => {
    const { expo_push_token, device_id } = req.body;

    if (!expo_push_token) {
        return res.status(400).json({ success: false, message: 'expo_push_token required' });
    }

    try {
        // UPSERT: 이미 있으면 업데이트, 없으면 삽입
        await pool.execute(`
            INSERT INTO push_tokens (expo_push_token, device_id, created_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE device_id = ?, created_at = NOW()
        `, [expo_push_token, device_id || null, device_id || null]);

        console.log(`📱 푸시 토큰 등록: ${expo_push_token.substring(0, 30)}...`);
        res.json({ success: true, message: 'Token registered' });
    } catch (error) {
        console.error('❌ 토큰 등록 실패:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => res.json({ status: 'running', timestamp: new Date().toISOString() }));

// SPA Fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

// DB 모니터링 (3초 간격) - 앱 종료 시에도 알림 발송용
let lastCheckTime = new Date();
let isProcessing = false;

function startDatabaseWatcher() {
    console.log('👀 DB 모니터링 시작 (3초 간격) - 자동 알림 활성화');
    setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            // 1. 드론 목록 가져오기
            const [drones] = await pool.execute('SELECT drone_name FROM drone_list');

            // 현재 시간 기록 (쿼리 후 갱신용)
            // 주의: DB Insert 시간과 서버 시간 차이를 고려하여, 약간의 버퍼를 둘 수도 있음
            const nextCheckTime = new Date();

            for (const drone of drones) {
                const tableName = drone.drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

                // 2. 각 드론의 로그 테이블에서 새로운 고위험 데이터 조회
                try {
                    const [rows] = await pool.execute(
                        `SELECT * FROM \`${tableName}\` WHERE event_time > ? AND confidence >= 0.75 ORDER BY event_time ASC`,
                        [lastCheckTime]
                    );

                    for (const row of rows) {
                        // 3. 알림 전송
                        await sendPushNotifications({
                            drone_name: drone.drone_name,
                            confidence: row.confidence,
                            risk_level: row.risk_level
                        });
                    }
                } catch (err) {
                    // 테이블이 아직 없을 수 있음 (무시)
                    if (err.code !== 'ER_NO_SUCH_TABLE') {
                        // console.error(`Watch Error`, err.message);
                    }
                }
            }
            lastCheckTime = nextCheckTime; // 시간 갱신

        } catch (error) {
            console.error('DB Watcher Error:', error.message);
        } finally {
            isProcessing = false;
        }
    }, 3000);
}

// START
async function startServer() {
    console.log('🚀 드론 화재 감지 시스템 서버 (Optimized Mode)');
    await testConnection();
    try { await initializeDatabase(); } catch (e) { console.warn('DB Init Warn:', e.message); }

    // 모니터링 시작
    startDatabaseWatcher();

    app.listen(PORT, () => console.log(`📡 Server running on http://localhost:${PORT}`));
}

startServer();
