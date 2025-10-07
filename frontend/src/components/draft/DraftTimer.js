import React from 'react';

const DraftTimer = ({ timeRemaining, draftPaused }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  if (draftPaused) {
    return (
      <div style={{ 
        textAlign: 'center',
        padding: '1rem',
        backgroundColor: '#6c757d',
        color: 'white',
        borderRadius: '8px',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        ⏸️ Draft Paused
      </div>
    );
  }
  
  return (
    <div style={{ 
      textAlign: 'center',
      padding: '1rem',
      backgroundColor: timeRemaining < 30 ? 'var(--primary-red)' : 'var(--primary-orange)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '1.5rem',
      fontWeight: 'bold'
    }}>
      Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default DraftTimer;


