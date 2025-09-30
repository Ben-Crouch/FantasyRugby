import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p style={{ marginLeft: '1rem', color: 'var(--black)' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
