import React from 'react';

const MyTeam = ({ 
  selectedTeam,
  teamPlayers,
  loadingPlayers,
  rugbyPlayers,
  localTeamPlayers,
  setLocalTeamPlayers,
  onMovePlayerToBench,
  onMovePlayerToStarting,
  onShowSwapModal,
  setSwapData
}) => {
  const getPlayerName = (playerId) => {
    const player = rugbyPlayers.find(p => p.id.toString() === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

  const positionMapping = {
    'Prop': 'Prop',
    'Hooker': 'Hooker', 
    'Lock': 'Lock',
    'Flanker': 'Back Row',
    'No. 8': 'Back Row',
    'Scrum-half': 'Scrum-half',
    'Fly-half': 'Fly-half',
    'Centre': 'Centre',
    'Wing': 'Back Three',
    'Fullback': 'Back Three'
  };

  const playersToUse = Array.isArray(localTeamPlayers) && localTeamPlayers.length > 0 
    ? localTeamPlayers 
    : Array.isArray(teamPlayers) 
      ? teamPlayers 
      : [];

  console.log('DEBUG: MyTeam - selectedTeam:', selectedTeam);
  console.log('DEBUG: MyTeam - teamPlayers:', teamPlayers);
  console.log('DEBUG: MyTeam - localTeamPlayers:', localTeamPlayers);
  console.log('DEBUG: MyTeam - playersToUse:', playersToUse);
  console.log('DEBUG: MyTeam - loadingPlayers:', loadingPlayers);

  if (loadingPlayers) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">My Team</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading team players...</p>
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">My Team</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No team selected.</p>
        </div>
      </div>
    );
  }

  if (!playersToUse || playersToUse.length === 0) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">My Team</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No players have been drafted for this team yet.</p>
        </div>
      </div>
    );
  }

  // Group players by fantasy position
  const positionGroups = {};
  if (Array.isArray(playersToUse)) {
    playersToUse.forEach(player => {
      const fantasyPosition = positionMapping[player.position] || player.position;
      if (!positionGroups[fantasyPosition]) {
        positionGroups[fantasyPosition] = [];
      }
      positionGroups[fantasyPosition].push(player);
    });
  }

  const startingPositions = ['Prop', 'Hooker', 'Lock', 'Back Row', 'Scrum-half', 'Fly-half', 'Centre', 'Back Three'];
  const benchPlayers = positionGroups['Bench'] || [];

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h3 className="card-title">My Team</h3>
      </div>
      
      <div style={{ padding: '1rem' }}>
        {/* Starting Team */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ 
            color: 'var(--primary-orange)', 
            marginBottom: '1rem',
            borderBottom: '2px solid var(--primary-orange)',
            paddingBottom: '0.5rem'
          }}>
            Starting Team
          </h4>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem' 
          }}>
            {playersToUse.filter(player => 
              player.is_starting === 'true' || player.is_starting === true
            ).map(player => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '2px solid #666666',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '150px' }}>
                    {getPlayerName(player.player_id)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', minWidth: '100px' }}>
                    {player.fantasy_position || positionMapping[player.position] || player.position}
                  </div>
                </div>
                <button
                  onClick={() => onMovePlayerToBench(player)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    backgroundColor: '#8B0000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Bench
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bench Players */}
        {playersToUse.filter(player => 
          player.is_starting === 'false' || player.is_starting === false
        ).length > 0 && (
          <div>
            <h4 style={{ 
              color: 'var(--primary-orange)', 
              marginBottom: '1rem',
              borderBottom: '2px solid var(--primary-orange)',
              paddingBottom: '0.5rem'
            }}>
              Bench Players
            </h4>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem' 
            }}>
              {playersToUse.filter(player => 
                player.is_starting === 'false' || player.is_starting === false
              ).map(player => (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    border: '2px solid #666666',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '150px' }}>
                      {getPlayerName(player.player_id)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', minWidth: '100px' }}>
                      {player.fantasy_position || positionMapping[player.position] || player.position}
                    </div>
                  </div>
                  <button
                    onClick={() => onMovePlayerToStarting(player, positionMapping[player.position] || player.position)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#006400',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
