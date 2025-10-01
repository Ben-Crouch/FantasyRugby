import React, { useState } from 'react';

const WaiverClaimModal = ({ 
  showModal, 
  playerToAdd,
  teamPlayers,
  rugbyPlayers,
  onConfirm,
  onCancel
}) => {
  const [selectedPlayerToDrop, setSelectedPlayerToDrop] = useState(null);

  if (!showModal || !playerToAdd) return null;

  const getPlayerName = (playerId) => {
    if (!rugbyPlayers) return `Player ${playerId}`;
    const player = rugbyPlayers.find(p => p.id.toString() === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

  const getPositionColor = (position) => {
    const colors = {
      'Prop': '#E74C3C',
      'Hooker': '#C0392B',
      'Lock': '#3498DB',
      'Back Row': '#2ECC71',
      'Scrum-half': '#F39C12',
      'Fly-half': '#E67E22',
      'Centre': '#1ABC9C',
      'Back Three': '#9B59B6'
    };
    return colors[position] || '#95A5A6';
  };

  const handleConfirm = () => {
    if (!selectedPlayerToDrop) {
      alert('Please select a player to drop');
      return;
    }
    onConfirm(playerToAdd, selectedPlayerToDrop);
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
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem',
          color: 'var(--primary-orange)',
          textAlign: 'center',
          fontSize: '1.5rem'
        }}>
          📋 Submit Waiver Claim
        </h3>
        
        {/* Player to Add */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            fontSize: '1rem',
            marginBottom: '0.75rem',
            color: 'var(--dark-gray)',
            fontWeight: '600'
          }}>
            Player to Add:
          </p>
          <div style={{
            padding: '1rem',
            backgroundColor: '#E8F5E9',
            borderRadius: '8px',
            border: '2px solid #2ECC71'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '1.2rem',
              marginBottom: '0.5rem'
            }}>
              ➕ {playerToAdd.name}
            </div>
            <div style={{ 
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '12px',
              backgroundColor: getPositionColor(playerToAdd.fantasy_position),
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              marginRight: '0.5rem'
            }}>
              {playerToAdd.fantasy_position}
            </div>
            <span style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
              {playerToAdd.team}
            </span>
          </div>
        </div>

        {/* Player to Drop */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            fontSize: '1rem',
            marginBottom: '0.75rem',
            color: 'var(--dark-gray)',
            fontWeight: '600'
          }}>
            Select a player to drop from your team:
          </p>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {teamPlayers && teamPlayers.length > 0 ? (
              teamPlayers.map((player) => {
                const isSelected = selectedPlayerToDrop?.id === player.id;
                const playerName = getPlayerName(player.player_id);
                const fantasyPos = player.fantasy_position || player.position;
                
                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayerToDrop(player)}
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
                      ➖ {playerName}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: 'var(--dark-gray)'
                    }}>
                      {fantasyPos} • {player.is_starting === 'true' || player.is_starting === true ? 'Starting' : 'Bench'}
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '1rem',
                        transform: 'translateY(-50%)',
                        fontSize: '1.5rem',
                        color: '#C0392B'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                No players on your team.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid var(--light-gray)',
              backgroundColor: 'white',
              color: 'var(--dark-gray)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPlayerToDrop}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: selectedPlayerToDrop ? 'var(--primary-orange)' : '#ccc',
              color: 'white',
              borderRadius: '8px',
              cursor: selectedPlayerToDrop ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {selectedPlayerToDrop ? '✅ Submit Claim' : '⚠️ Select a player to drop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaiverClaimModal;

