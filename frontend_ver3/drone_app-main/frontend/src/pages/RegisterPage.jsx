import React, { useState } from 'react';
import './RegisterPage.css';

function RegisterPage({ API_BASE, onRegisterSuccess }) {
    const [droneName, setDroneName] = useState('');
    const [lat, setLat] = useState('37.5665');
    const [lon, setLon] = useState('126.9780');
    const [status, setStatus] = useState(null); // success | error | loading

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drone_name: droneName,
                    drone_lat: parseFloat(lat),
                    drone_lon: parseFloat(lon)
                })
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setDroneName('');
                // 부모 컴포넌트에 알림 (드론 목록 갱신용)
                if (onRegisterSuccess) onRegisterSuccess();
                alert(`✅ 드론 등록 완료!\nID: ${data.data.drone_db_id}`);
            } else {
                setStatus('error');
                alert(`❌ 등록 실패: ${data.message}`);
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            alert('서버 통신 오류');
        }
    };

    return (
        <div className="register-page">
            <h2>⚙️ 드론 등록 및 설정</h2>

            <div className="register-card">
                <h3>새 드론 등록</h3>
                <p className="desc">
                    드론 이름을 입력하면 자동으로 ID(GK_2025_XX)가 생성됩니다.<br />
                    이미 존재하는 이름일 경우 접속 기록만 갱신됩니다.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>드론 이름 (영어/숫자)</label>
                        <input
                            type="text"
                            value={droneName}
                            onChange={(e) => setDroneName(e.target.value)}
                            placeholder="예: drone_alpha"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>초기 위도 (Lat)</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>초기 경도 (Lon)</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={status === 'loading'}>
                        {status === 'loading' ? '처리 중...' : '등록하기'}
                    </button>
                </form>
            </div>

            <div className="info-card">
                <h3>ℹ️ 시스템 정보</h3>
                <ul>
                    <li>버전: v2.0.0 (Phase 2)</li>
                    <li>백엔드: Node.js Express</li>
                    <li>DB: MySQL (Jetson Remote)</li>
                </ul>
            </div>
        </div>
    );
}

export default RegisterPage;
