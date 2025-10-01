import React from 'react';

const TeamRoster = ({ teams, selectedPlayers }) => {
  const getTeamPlayerCount = (teamId) => {
    return selectedPlayers[teamId]?.length || 0;
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Team Rosters</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {teams.map(team => (
          <div 
            key={team.id}
            style={{
              padding: '1.5rem',
              border: '2px solid var(--light-gray)',
              borderRadius: '8px',
              backgroundColor: 'white'
            }}
          >
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '1rem',
              color: 'var(--black)' 
            }}>
              {team.team_name}
            </h3>
            <div style={{ 
              fontSize: '0.9rem',
              color: 'var(--dark-gray)',
              marginBottom: '1rem'
            }}>
              <div>Owner: User #{team.user_id || team.team_owner_user_id}</div>
              <div style={{ 
                marginTop: '0.5rem',
                fontWeight: 'bold',
                color: 'var(--primary-orange)'
              }}>
                Players Selected: {getTeamPlayerCount(team.id)} / 15
              </div>
            </div>
            
            {selectedPlayers[team.id] && selectedPlayers[team.id].length > 0 ? (
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                borderTop: '1px solid var(--light-gray)',
                paddingTop: '1rem'
              }}>
                {selectedPlayers[team.id].map((player, index) => (
                  <div 
                    key={player.id}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      backgroundColor: player.autoPicked ? '#FFF3CD' : 'var(--lightest-gray)',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      borderLeft: player.autoPicked ? '3px solid #FFC107' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {index + 1}. {player.name} {player.autoPicked && '🤖'}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'var(--dark-gray)' 
                    }}>
                      {player.fantasy_position} - {player.team}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ 
                color: 'var(--dark-gray)',
                fontStyle: 'italic',
                fontSize: '0.9rem'
              }}>
                No players selected yet
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamRoster;

