import React from 'react';

const SwapModal = ({ 
  showSwapModal, 
  swapData, 
  setSwapData,
  onConfirmSwap, 
  onCancelSwap 
}) => {
  if (!showSwapModal || !swapData) return null;

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
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '1rem',
          color: 'var(--primary-orange)'
        }}>
          Swap Players
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Moving to starting position:</strong></p>
          <div style={{
            padding: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            {swapData.playerName} ({swapData.targetPosition})
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Select a player to swap with:</strong></p>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {swapData.currentPlayers && swapData.currentPlayers.length > 0 ? (
              swapData.currentPlayers.map((currentPlayer) => (
                <div
                  key={currentPlayer.id}
                  onClick={() => {
                    setSwapData(prev => ({ ...prev, selectedCurrentPlayer: currentPlayer }));
                  }}
                  style={{
                    padding: '0.5rem',
                    margin: '0.25rem 0',
                    backgroundColor: swapData.selectedCurrentPlayer?.id === currentPlayer.id 
                      ? 'var(--primary-orange)' 
                      : '#f8f9fa',
                    color: swapData.selectedCurrentPlayer?.id === currentPlayer.id 
                      ? 'white' 
                      : 'black',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {currentPlayer.name} ({currentPlayer.fantasy_position})
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                No players available to swap with.
              </p>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={onCancelSwap}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              color: '#666',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirmSwap}
            disabled={!swapData.selectedCurrentPlayer}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              backgroundColor: swapData.selectedCurrentPlayer 
                ? 'var(--primary-orange)' 
                : '#ccc',
              color: 'white',
              borderRadius: '4px',
              cursor: swapData.selectedCurrentPlayer ? 'pointer' : 'not-allowed'
            }}
          >
            {swapData.selectedCurrentPlayer ? '✅ Confirm Swap' : '⚠️ Select a player first'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
