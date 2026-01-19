import React from 'react';
import './BottomNav.css';

function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
                onClick={() => onTabChange('monitor')}
            >
                <span className="nav-icon">🏠</span>
                <span className="nav-label">모니터링</span>
            </button>

            <button
                className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => onTabChange('history')}
            >
                <span className="nav-icon">📅</span>
                <span className="nav-label">히스토리</span>
            </button>

            <button
                className={`nav-item ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => onTabChange('register')}
            >
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">설정/등록</span>
            </button>
        </nav>
    );
}

export default BottomNav;
