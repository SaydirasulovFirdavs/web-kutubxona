import { useState } from 'react';
import './StarRating.css';

function StarRating({ rating, setRating, readOnly = false, size = 'md' }) {
    const [hover, setHover] = useState(0);

    const handleRating = (value) => {
        if (!readOnly && setRating) {
            setRating(value);
        }
    };

    return (
        <div className={`star-rating ${readOnly ? 'read-only' : ''} size-${size}`}>
            {[...Array(5)].map((_, index) => {
                const value = index + 1;
                return (
                    <button
                        key={index}
                        type="button"
                        className={`star-btn ${value <= (hover || rating) ? 'active' : ''}`}
                        onClick={() => handleRating(value)}
                        onMouseEnter={() => !readOnly && setHover(value)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                        disabled={readOnly}
                    >
                        <span className="star">&#9733;</span>
                    </button>
                );
            })}
        </div>
    );
}

export default StarRating;
