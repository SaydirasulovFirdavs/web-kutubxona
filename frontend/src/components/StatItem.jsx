import React, { useState, useEffect } from 'react';

const StatItem = ({ end, label, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 2000; // 2 seconds
        const increment = end / (duration / 16); // 16ms per frame (~60fps)

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end]);

    return (
        <div className="hero-stat-item">
            <div className="stat-number">
                {typeof end === 'number' && end % 1 !== 0 ? count.toFixed(1) : count}
                {suffix}
            </div>
            <div className="stat-label">{label}</div>
        </div>
    );
};

export default StatItem;
