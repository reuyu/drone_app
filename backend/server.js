/**
 * server.js - 드론 화재 감지 시스템 메인 백엔드 서버
 * 
 * 역할:
 * 1. API 제공 (드론 등록, 이벤트 기록, 로그 조회, 라이브 포토)
 * 2. React 정적 파일 서빙
 * 3. 동적 테이블 생성 (드론별 로그 테이블)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // 추가
const { pool, initializeDatabase, createDroneLogTable, testConnection } = require('./database');

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

// 📸 [중요] 캡처 이미지 정적 서빙 (외부에서 사진 볼 수 있게 허용)
// 브라우저가 http://.../captures/파일명.jpg 로 요청하면 -> backend/captures 폴더에서 파일을 찾아줌
app.use('/captures', express.static(path.join(__dirname, 'captures')));

// ============================================
// API Endpoints
// ============================================

/**
 * POST /api/register
 * 드론 등록 API (수정됨: ID 자동 생성 + video_url 참조)
 */
app.post('/api/register', async (req, res) => {
    const { drone_name, drone_lat, drone_lon } = req.body;

    if (!drone_name) {
        return res.status(400).json({ success: false, message: 'drone_name은 필수 항목입니다.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. 기존 등록 여부 확인
        const [existing] = await connection.execute(
            'SELECT drone_db_id FROM drone_list WHERE drone_name = ?',
            [drone_name]
        );

        // 2. video_url에서 스트림 URL 조회 (테이블명 수정됨: drone_url -> video_url)
        const [urlRows] = await connection.execute(
            'SELECT stream_video_url FROM video_url WHERE drone_name = ?',
            [drone_name]
        );
        const videoUrl = urlRows.length > 0 ? urlRows[0].stream_video_url : null;

        let drone_db_id;

        if (existing.length > 0) {
            // [기존 드론] 접속 시간 업데이트
            drone_db_id = existing[0].drone_db_id;
            await connection.execute(`
                UPDATE drone_list 
                SET drone_connect_time = NOW(), 
                    drone_video_url = ?, 
                    drone_lat = ?, 
                    drone_lon = ?
                WHERE drone_name = ?
            `, [videoUrl, drone_lat || null, drone_lon || null, drone_name]);

            console.log(`✅ 드론 재접속: ${drone_name} (ID: ${drone_db_id})`);
        } else {
            // [신규 드론] ID 생성 및 등록
            const [idRows] = await connection.execute(`
                SELECT 
                    IFNULL(
                        CONCAT('GK_2025_', LPAD(CAST(SUBSTRING(MAX(drone_db_id), 9) AS UNSIGNED) + 1, 2, '0')),
                        'GK_2025_00'
                    ) AS new_id
                FROM drone_list 
                WHERE drone_db_id LIKE 'GK_2025_%'
            `);
            drone_db_id = idRows[0].new_id;

            await connection.execute(`
                INSERT INTO drone_list (drone_db_id, drone_name, drone_video_url, drone_connect_time, drone_lat, drone_lon)
                VALUES (?, ?, ?, NOW(), ?, ?)
            `, [drone_db_id, drone_name, videoUrl, drone_lat || null, drone_lon || null]);

            console.log(`✅ 드론 신규 등록: ${drone_name} (ID: ${drone_db_id})`);
        }

        // 3. 동적 로그 테이블 생성
        const logTable = await createDroneLogTable(drone_name);

        await connection.commit();

        res.json({
            success: true,
            message: '드론 등록 성공',
            data: {
                drone_name,
                drone_db_id,
                log_table: logTable,
                video_url: videoUrl
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ 드론 등록 실패:', error.message);
        res.status(500).json({ success: false, message: '드론 등록 중 오류 발생', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/event
 * 화재 감지 이벤트 기록 API
 */
app.post('/api/event', async (req, res) => {
    const { drone_name, confidence, image_path, gps_lat, gps_lon } = req.body;

    if (!drone_name) {
        return res.status(400).json({ success: false, message: 'drone_name은 필수 항목입니다.' });
    }

    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        const [droneRows] = await pool.execute(
            'SELECT drone_db_id FROM drone_list WHERE drone_name = ?',
            [drone_name]
        );

        if (droneRows.length === 0) {
            return res.status(404).json({ success: false, message: `등록되지 않은 드론입니다: ${drone_name}` });
        }

        const drone_db_id = droneRows[0].drone_db_id;

        const insertQuery = `
            INSERT INTO \`${sanitizedTableName}\` (drone_db_id, confidence, image_path, gps_lat, gps_lon)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(insertQuery, [
            drone_db_id,
            confidence || null,
            image_path || null,
            gps_lat || null,
            gps_lon || null
        ]);

        console.log(`🔥 화재 감지 이벤트: ${drone_name} (${(confidence * 100).toFixed(1)}%)`);

        res.json({
            success: true,
            message: '이벤트 기록 성공',
            data: { event_id: result.insertId }
        });

    } catch (error) {
        console.error('❌ 이벤트 기록 실패:', error.message);
        res.status(500).json({ success: false, message: '이벤트 기록 실패', error: error.message });
    }
});

/**
 * GET /api/logs/:drone_name
 * 로그 조회 API (수정됨: 날짜 필터링 지원)
 */
app.get('/api/logs/:drone_name', async (req, res) => {
    const { drone_name } = req.params;
    const { date } = req.query;

    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        let query, params;

        if (date) {
            query = `SELECT * FROM \`${sanitizedTableName}\` WHERE DATE(event_time) = ? ORDER BY event_time DESC`;
            params = [date];
        } else {
            query = `SELECT * FROM \`${sanitizedTableName}\` ORDER BY event_time DESC LIMIT 10`;
            params = [];
        }

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: {
                drone_name,
                filter: date || 'recent_10',
                count: rows.length,
                logs: rows
            }
        });

    } catch (error) {
        console.error('❌ 로그 조회 실패:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: { logs: [] } });
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/proxy/video
 * 영상 스트림 프록시 (외부 접속 시 내부 IP 접근 및 Mixed Content 문제 해결)
 */
app.get('/api/proxy/video', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            // 타임아웃 설정 (스트림 끊김 방지)
            timeout: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 303; // Redirect 허용
            }
        });

        // 원본 헤더 중 Content-Type 중요 (multipart/x-mixed-replace 등)
        res.set('Content-Type', response.headers['content-type']);

        // 데이터 파이핑
        response.data.pipe(res);

    } catch (error) {
        // 스트림 에러는 조용히 처리하거나 로그만 남김
        // console.error('Proxy Error:', error.message);
        if (!res.headersSent) res.sendStatus(502);
    }
});

/**
 * GET /api/drones/:drone_name/live-photos
app.get('/api/drones/:drone_name/live-photos', async (req, res) => {
    const { drone_name } = req.params;
    const sanitizedTableName = drone_name.replace(/[^a-zA-Z0-9_]/g, '_');

    try {
        const [droneRows] = await pool.execute(
            'SELECT drone_connect_time FROM drone_list WHERE drone_name = ?',
            [drone_name]
        );

        if (droneRows.length === 0) return res.status(404).json({ success: false, message: '드론을 찾을 수 없습니다.' });

        const connectTime = droneRows[0].drone_connect_time;
        if (!connectTime) return res.json({ success: true, data: { photos: [] } });

        const query = `
            SELECT id, event_time, image_path, confidence, gps_lat, gps_lon
            FROM \`${sanitizedTableName}\`
            WHERE event_time >= DATE_SUB(?, INTERVAL 1 SECOND)
            ORDER BY event_time DESC
        `;

        const [rows] = await pool.execute(query, [connectTime]);

        // [DEBUG] 로그 출력 (문제 해결용)
        console.log(`🔍 라이브 포토 조회: ${drone_name}`);
        console.log(`   - 접속 시간: ${connectTime}`);
        console.log(`   - 조회된 사진 수: ${rows.length}`);
        if (rows.length === 0) {
             // 쿼리 파라미터 확인
             console.log(`   - 쿼리 비교 기준: event_time >= ${new Date(new Date(connectTime).getTime() - 1000).toISOString()} (approx)`);
        }

        res.json({
            success: true,
            data: {
                drone_name,
                connect_time: connectTime,
                photos: rows
            }
        });

    } catch (error) {
        console.error('❌ 라이브 포토 조회 실패:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: { photos: [] } });
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/drones/:drone_name/connect
 * 드론 선택 시 접속 시간(세션 시작 시간)을 현재로 업데이트
 */
app.post('/api/drones/:drone_name/connect', async (req, res) => {
    const { drone_name } = req.params;

    try {
        const [result] = await pool.execute(
            'UPDATE drone_list SET drone_connect_time = NOW() WHERE drone_name = ?',
            [drone_name]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Drone not found' });
        }

        console.log(`✅ 드론 모니터링 시작 (시간 갱신): ${drone_name}`);
        res.json({ success: true, message: 'Connect time updated' });

    } catch (error) {
        console.error('❌ 접속 시간 업데이트 실패:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drones
 */
app.get('/api/drones', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT drone_db_id, drone_name, drone_video_url, drone_connect_time, drone_lat, drone_lon FROM drone_list ORDER BY drone_connect_time DESC'
        );
        res.json({ success: true, data: { drones: rows } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'running', timestamp: new Date().toISOString() });
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// START
async function startServer() {
    console.log('🚀 드론 화재 감지 시스템 서버 시작 중...');
    await testConnection();
    try { await initializeDatabase(); } catch (e) { console.warn('⚠️ 초기화 경고:', e.message); }
    app.listen(PORT, () => {
        console.log(`📡 Server running on http://localhost:${PORT}`);
    });
}

startServer();
