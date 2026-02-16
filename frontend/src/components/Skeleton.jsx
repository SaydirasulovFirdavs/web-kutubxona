import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, className = '' }) => {
    const style = {
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '8px'
    };

    return <div className={`skeleton-item ${className}`} style={style} />;
};

export default Skeleton;
