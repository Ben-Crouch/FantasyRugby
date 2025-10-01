import React from 'react';

const PlayerConfirmModal = ({ player, onConfirm, onCancel }) => {
  if (!player) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        padding: '2rem',
        textAlign: 'center',
        margin: '1rem'
      }}>
        <h2 style={{ 
          color: 'var(--black)', 
          marginBottom: '1rem',
          fontSize: '1.8rem'
        }}>
          Confirm Player Selection
        </h2>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--lightest-gray)',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            margin: '0 0 0.5rem 0', 
            color: 'var(--black)',
            fontSize: '1.5rem'
          }}>
            {player.name}
          </h3>
          <p style={{ 
            margin: '0.5rem 0', 
            color: 'var(--dark-gray)',
            fontSize: '1.1rem'
          }}>
            <strong>Position:</strong> {player.fantasy_position}
          </p>
          <p style={{ 
            margin: '0.5rem 0', 
            color: 'var(--dark-gray)',
            fontSize: '1.1rem'
          }}>
            <strong>Team:</strong> {player.team}
          </p>
        </div>

        <p style={{ 
          color: 'var(--dark-gray)', 
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          Are you sure you want to select this player for your team?
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'var(--light-gray)',
              color: 'var(--black)',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E85D00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange)'}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerConfirmModal;


