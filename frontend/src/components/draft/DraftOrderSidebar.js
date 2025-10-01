import React from 'react';

const DraftOrderSidebar = ({ teams, currentTeam, selectedPlayers, user }) => {
  return (
    <div className="card" style={{ 
      position: 'sticky',
      top: '2rem',
      maxHeight: 'calc(100vh - 4rem)',
      overflowY: 'auto'
    }}>
      <h3 style={{ 
        marginBottom: '1rem',
        color: 'var(--black)',
        borderBottom: '2px solid var(--light-gray)',
        paddingBottom: '0.75rem'
      }}>
        Draft Order
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {teams.map((team, index) => {
          const isCurrentTurn = currentTeam?.id === team.id;
          const teamPlayers = selectedPlayers[team.id] || [];
          const playerCount = teamPlayers.length;
          const teamUserId = team.user_id || team.team_owner_user_id;
          const isUserTeam = user && teamUserId === user.id.toString();
          
          return (
            <div
              key={team.id}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: isCurrentTurn ? 'var(--primary-orange)' : 'white',
                border: isCurrentTurn ? '3px solid var(--dark-orange)' : '2px solid var(--light-gray)',
                transition: 'all 0.3s ease',
                boxShadow: isCurrentTurn ? '0 4px 12px rgba(211, 84, 0, 0.3)' : 'none',
                transform: isCurrentTurn ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: isCurrentTurn ? 'white' : 'var(--black)',
                    marginBottom: '0.25rem'
                  }}>
                    {team.team_name} {isUserTeam && '⭐'}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem',
                    color: isCurrentTurn ? 'rgba(255,255,255,0.9)' : 'var(--dark-gray)'
                  }}>
                    {playerCount}/15 players
                  </div>
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
                height: '6px',
                backgroundColor: isCurrentTurn ? 'rgba(255,255,255,0.3)' : 'var(--light-gray)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}>
                <div style={{
                  width: `${(playerCount / 15) * 100}%`,
                  height: '100%',
                  backgroundColor: isCurrentTurn ? 'white' : 'var(--primary-orange)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
      
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

export default DraftOrderSidebar;

