/**
 * database.js - MySQL 연결 풀 설정
 * 
 * Jetson 로컬 MySQL 서버에 연결하는 Connection Pool을 관리합니다.
 * 환경 변수 또는 기본값을 사용하여 연결 설정을 구성합니다.
 */

const mysql = require('mysql2/promise');

// MySQL Connection Pool 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST || '220.69.241.189',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'flex_user',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'smoke_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 타임아웃 설정 (외부 네트워크 고려하여 10초로 설정)
    connectTimeout: 10000,
    // 자동 재연결 지원을 위한 설정
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * 데이터베이스 초기화 함수
 * 필수 테이블들을 생성합니다.
 */
async function initializeDatabase() {
    const connection = await pool.getConnection();

    try {
        console.log('🔧 데이터베이스 초기화 시작...');

        // 1. drone_list 테이블 생성 (드론 등록 정보)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS drone_list (
                drone_db_id VARCHAR(20) NOT NULL PRIMARY KEY,
                drone_name VARCHAR(100) NOT NULL UNIQUE,
                drone_video_url VARCHAR(255) NULL,
                drone_connect_time DATETIME NULL,
                drone_lat DECIMAL(10,8) NULL,
                drone_lon DECIMAL(11,8) NULL
            )
        `);
        console.log('✅ drone_list 테이블 준비 완료');

        // 2. video_url 테이블 생성 (사전 정의된 URL 매핑) - 사용자 요청 반영 (drone_url -> video_url)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS video_url (
                drone_name VARCHAR(100) NULL UNIQUE,
                stream_video_url VARCHAR(2048) NULL
            )
        `);
        console.log('✅ video_url 테이블 준비 완료');

        // 3. push_tokens 테이블 생성 (푸시 알림용)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS push_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                expo_push_token VARCHAR(255) NOT NULL UNIQUE,
                device_id VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ push_tokens 테이블 준비 완료');

        console.log('🎉 데이터베이스 초기화 완료!');
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 드론별 동적 로그 테이블 생성 함수
 * @param {string} droneName - 드론 이름 (테이블명으로 사용)
 */
async function createDroneLogTable(droneName) {
    // SQL Injection 방지를 위한 드론 이름 검증
    const sanitizedName = droneName.replace(/[^a-zA-Z0-9_]/g, '_');

    if (sanitizedName !== droneName) {
        console.warn(`⚠️ 드론 이름이 정제되었습니다: ${droneName} -> ${sanitizedName}`);
    }

    const connection = await pool.getConnection();

    try {
        // 동적 테이블 생성 쿼리
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS \`${sanitizedName}\` (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                drone_db_id VARCHAR(20) NOT NULL,
                event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                confidence FLOAT NULL,
                image_path VARCHAR(255) NULL,
                gps_lat DECIMAL(10,8) NULL,
                gps_lon DECIMAL(11,8) NULL,
                risk_level CHAR(100) NULL,
                temperature FLOAT NULL,
                humidity INT NULL,
                wind_speed FLOAT NULL
            )
        `;

        await connection.execute(createTableQuery);
        console.log(`✅ 드론 로그 테이블 생성 완료: ${sanitizedName}`);

        return sanitizedName;
    } catch (error) {
        console.error(`❌ 드론 로그 테이블 생성 실패 (${sanitizedName}):`, error.message);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 드론 전용 DB 유저 생성 및 권한 부여 함수
 * @param {string} droneDbId - 드론 ID (DB 유저명으로 사용)
 * @param {string} droneName - 드론 이름 (전용 테이블명 파악용)
 */
async function createDroneDbUser(droneDbId, droneName) {
    const connection = await pool.getConnection();
    const sanitizedName = droneName.replace(/[^a-zA-Z0-9_]/g, '_');
    const dbName = process.env.DB_NAME || 'smoke_db';

    try {
        console.log(`👤 드론 DB 유저 생성 시작: ${droneDbId}`);

        // 1. 기존 유저가 있다면 삭제
        await connection.query(`DROP USER IF EXISTS ?@'%'`, [droneDbId]);

        // 2. 유저 생성 (비밀번호 없이)
        await connection.query(`CREATE USER ?@'%' IDENTIFIED BY ''`, [droneDbId]);

        // 3. 권한 부여
        // 3-1. drone_list 테이블: SELECT(조회), UPDATE(GPS/접속시간 갱신)
        await connection.query(`GRANT SELECT, UPDATE ON \`${dbName}\`.drone_list TO ?@'%'`, [droneDbId]);

        // 3-2. 본인 전용 로그 테이블: SELECT(조회), INSERT(로그 기록)
        await connection.query(`GRANT SELECT, INSERT ON \`${dbName}\`.\`${sanitizedName}\` TO ?@'%'`, [droneDbId]);

        // 4. 권한 적용
        await connection.query('FLUSH PRIVILEGES');

        console.log(`✅ 드론 DB 유저 생성 완료: ${droneDbId}`);

    } catch (error) {
        console.error(`❌ 드론 DB 유저 생성 실패 (${droneDbId}):`, error.message);
        // 유저 생성 실패는 치명적이지 않을 수 있으므로 에러를 던짐 (서버에서 처리)
        // 일반적으로 권한 부족이나 DB 설정 문제로 발생
        throw error;
    } finally {
        connection.release();
    }
}




/**
 * DB 연결 테스트 함수
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 데이터베이스 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    initializeDatabase,
    createDroneLogTable,
    createDroneDbUser,
    testConnection
};
