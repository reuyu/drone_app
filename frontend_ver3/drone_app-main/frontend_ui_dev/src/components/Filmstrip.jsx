import React, { useEffect, useRef } from 'react';
import './Filmstrip.css';

function Filmstrip({ photos }) {
    const scrollRef = useRef(null);

    // 새 사진이 추가되면 자동으로 왼쪽 끝(최신)으로 스크롤하지 않음 (사용자 경험 고려)
    // 단, 처음 로드될 때는 맨 처음을 보여줌.

    return (
        <div className="filmstrip-container">
            <div className="filmstrip-header">
                <h3>📸 실시간 감지 갤러리</h3>
                <span className="badge">{photos.length}</span>
            </div>

            {photos.length > 0 ? (
                <div className="filmstrip-scroll" ref={scrollRef}>
                    {photos.map((photo) => (
                        <div key={photo.id} className="filmstrip-item">
                            <div className="filmstrip-image-wrapper">
                                {photo.image_path ? (
                                    <img src={photo.image_path} alt="감지 이미지" loading="lazy" />
                                ) : (
                                    <div className="no-image">No Image</div>
                                )}
                            </div>
                            <div className="filmstrip-info">
                                <span className="time">
                                    {new Date(photo.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className={`confidence ${photo.confidence >= 0.8 ? 'high' : 'med'}`}>
                                    {(photo.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="filmstrip-empty">
                    <p>접속 이후 감지된 사진이 없습니다</p>
                </div>
            )}
        </div>
    );
}

export default Filmstrip;
