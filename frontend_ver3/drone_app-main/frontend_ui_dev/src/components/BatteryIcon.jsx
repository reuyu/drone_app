import React from 'react';
import './BatteryIcon.css';

function BatteryIcon({ percentage = 0, size = 20 }) {
  const getBatteryColor = (percent) => {
    if (percent > 50) return '#34C759'; // 초록색
    if (percent > 20) return '#FF9500'; // 주황색
    return '#FF3B30'; // 빨간색
  };

  const color = getBatteryColor(percentage);
  const fillWidth = Math.max(0, Math.min(100, percentage));
  const width = size;
  const height = size * 0.5;

  return (
    <div className="battery-icon-container" style={{ width, height, position: 'relative' }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* 배터리 외곽 */}
        <rect
          x="2"
          y="2"
          width="18"
          height="8"
          rx="1"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {/* 배터리 극 */}
        <rect
          x="20"
          y="4"
          width="2"
          height="4"
          rx="0.5"
          fill={color}
        />
      </svg>
      {/* 배터리 충전량 */}
      <div
        className="battery-fill"
        style={{
          position: 'absolute',
          left: '3px',
          top: '3px',
          width: `${(fillWidth / 100) * 18}px`,
          height: '6px',
          backgroundColor: color,
          borderRadius: '0.5px',
          opacity: 0.8,
          zIndex: 0,
        }}
      />
    </div>
  );
}

export default BatteryIcon;

