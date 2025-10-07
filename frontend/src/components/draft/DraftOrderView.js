import React from 'react';

const DraftOrderView = ({ teams, currentTeam, selectedPlayers, user }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {teams.map((team, index) => {
        const isCurrentTurn = currentTeam?.id === team.id;
        const teamPlayers = selectedPlayers[team.id] || [];
        const playerCount = teamPlayers.length;
        const teamUserId = team.user_id || team.team_owner_user_id;
        const isUserTeam = user && teamUserId === user.id.toString();
        
        return (
          <div
            key={team.id}
            className="card"
            style={{
              border: isCurrentTurn ? '3px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
              backgroundColor: isCurrentTurn ? 'var(--neutral-50)' : 'white',
              transition: 'all 0.3s ease',
              transform: isCurrentTurn ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isCurrentTurn ? '0 4px 12px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div>
                <h3 style={{ 
                  margin: '0 0 0.25rem 0',
                  color: isCurrentTurn ? 'var(--databricks-blue)' : 'var(--black)',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  {team.team_name} {isUserTeam && '⭐'}
                </h3>
                <p style={{ 
                  margin: 0,
                  color: 'var(--neutral-600)',
                  fontSize: '0.9rem'
                }}>
                  {playerCount}/15 players selected
                </p>
              </div>
              {isCurrentTurn && (
                <div style={{
                  fontSize: '1.5rem',
                  animation: 'pulse 1.5s infinite'
                }}>
                  👉
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--neutral-200)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${(playerCount / 15) * 100}%`,
                height: '100%',
                backgroundColor: isCurrentTurn ? 'var(--databricks-blue)' : 'var(--primary-orange)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Selected Players List */}
            {teamPlayers.length > 0 ? (
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                borderTop: '1px solid var(--neutral-200)',
                paddingTop: '1rem'
              }}>
                {teamPlayers.map((player, playerIndex) => (
                  <div 
                    key={player.id}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: player.autoPicked ? '#FFF3CD' : 'var(--neutral-50)',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      borderLeft: player.autoPicked ? '3px solid #FFC107' : '3px solid var(--databricks-blue)'
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600',
                      color: 'var(--black)',
                      marginBottom: '0.25rem'
                    }}>
                      {playerIndex + 1}. {player.name} {player.autoPicked && '🤖'}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'var(--neutral-600)'
                    }}>
                      {player.fantasy_position} - {player.team}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--neutral-500)',
                fontStyle: 'italic'
              }}>
                No players selected yet
              </div>
            )}
          </div>
        );
      })}
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default DraftOrderView;
