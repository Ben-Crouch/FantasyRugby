import React from 'react';

const SwapModal = ({ 
  showSwapModal, 
  swapData, 
  setSwapData,
  onConfirmSwap, 
  onCancelSwap,
  rugbyPlayers 
}) => {
  if (!showSwapModal || !swapData) return null;

  const getPlayerName = (playerId) => {
    if (!rugbyPlayers) return `Player ${playerId}`;
    const player = rugbyPlayers.find(p => p.id.toString() === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

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
          marginBottom: '1.5rem',
          color: 'var(--primary-orange)',
          textAlign: 'center'
        }}>
          🔄 Swap Players
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            fontSize: '1rem',
            marginBottom: '0.75rem',
            color: 'var(--dark-gray)',
            fontWeight: '600'
          }}>
            Move to Starting:
          </p>
          <div style={{
            padding: '1rem',
            backgroundColor: '#E8F5E9',
            borderRadius: '8px',
            border: '2px solid #2ECC71',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            ⬆️ {swapData.newPlayerName || swapData.playerName} 
            <span style={{ 
              color: 'var(--dark-gray)', 
              fontSize: '0.9rem',
              fontWeight: 'normal',
              marginLeft: '0.5rem'
            }}>
              ({swapData.targetPosition})
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            fontSize: '1rem',
            marginBottom: '0.75rem',
            color: 'var(--dark-gray)',
            fontWeight: '600'
          }}>
            Select which player to move to Bench:
          </p>
          <div style={{ 
            maxHeight: '250px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {swapData.currentPlayers && swapData.currentPlayers.length > 0 ? (
              swapData.currentPlayers.map((currentPlayer) => {
                const isSelected = swapData.selectedCurrentPlayer?.id === currentPlayer.id;
                return (
                  <div
                    key={currentPlayer.id}
                    onClick={() => {
                      setSwapData(prev => ({ ...prev, selectedCurrentPlayer: currentPlayer }));
                    }}
                    style={{
                      padding: '1rem',
                      backgroundColor: isSelected ? '#FFEBEE' : 'white',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #C0392B' : '2px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      marginBottom: '0.25rem',
                      color: isSelected ? '#C0392B' : 'var(--black)'
                    }}>
                      ⬇️ {getPlayerName(currentPlayer.player_id) || currentPlayer.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: 'var(--dark-gray)'
                    }}>
                      Currently: {currentPlayer.fantasy_position}
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '1rem',
                        transform: 'translateY(-50%)',
                        fontSize: '1.5rem'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
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
