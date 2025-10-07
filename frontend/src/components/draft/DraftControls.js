import React from 'react';

const DraftControls = ({ 
  draftStarted, 
  isAdmin, 
  onStartDraft, 
  onShuffleDraft,
  onViewDraftOrder,
  disabled 
}) => {
  if (draftStarted) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Draft Controls</h2>
      {isAdmin ? (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onStartDraft}
            disabled={disabled}
            style={{
              backgroundColor: disabled ? 'var(--gray)' : 'var(--primary-orange)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1
            }}
          >
            Start Draft
          </button>
          <button
            onClick={onShuffleDraft}
            disabled={disabled}
            style={{
              backgroundColor: disabled ? 'var(--gray)' : 'var(--black)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1
            }}
          >
            Shuffle Draft Order
          </button>
          <button
            onClick={onViewDraftOrder}
            style={{
              backgroundColor: 'var(--databricks-blue)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📊 View Draft Order
          </button>
        </div>
      ) : (
        <p style={{ color: 'var(--dark-gray)', fontSize: '1.1rem' }}>
          Waiting for league admin to start the draft...
        </p>
      )}
    </div>
  );
};

export default DraftControls;


