import React from 'react';

const WaiverSuccessModal = ({ 
  show,
  playerToAdd,
  playerToDrop,
  priority,
  onClose
}) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#E8F5E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
        </div>

        {/* Title */}
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '1rem',
          color: 'var(--primary-orange)',
          fontSize: '1.75rem'
        }}>
          Waiver Claim Submitted!
        </h2>

        {/* Message */}
        <p style={{
          color: 'var(--dark-gray)',
          marginBottom: '1.5rem',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          Your waiver claim has been successfully submitted and will be processed with other pending claims.
        </p>

        {/* Transaction Details */}
        <div style={{
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--dark-gray)',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Adding:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>➕</span>
              <span style={{
                color: '#2ECC71',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                {playerToAdd}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--dark-gray)',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Dropping:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>➖</span>
              <span style={{
                color: '#C0392B',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                {playerToDrop}
              </span>
            </div>
          </div>

        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '1rem',
            border: 'none',
            backgroundColor: 'var(--primary-orange)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#C55A11'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-orange)'}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default WaiverSuccessModal;

