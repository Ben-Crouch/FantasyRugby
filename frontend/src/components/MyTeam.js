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

  const getPlayerTeam = (playerId) => {
    const player = rugbyPlayers.find(p => p.id.toString() === playerId.toString());
    return player ? player.team : '';
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

  // Position color mapping (same as draft)
  const getPositionColor = (position) => {
    const colors = {
      'Prop': '#E74C3C',           // Red
      'Hooker': '#C0392B',         // Dark Red
      'Lock': '#3498DB',           // Blue
      'Back Row': '#2ECC71',       // Green
      'Scrum-half': '#F39C12',     // Orange
      'Fly-half': '#E67E22',       // Dark Orange
      'Centre': '#1ABC9C',         // Teal
      'Back Three': '#9B59B6'      // Purple
    };
    return colors[position] || '#95A5A6';
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

  // Get starting players sorted by position order
  const startingPlayers = playersToUse.filter(player => 
    player.is_starting === 'true' || player.is_starting === true
  );
  
  // Sort starting players by position order
  const sortedStartingPlayers = [...startingPlayers].sort((a, b) => {
    const posA = a.fantasy_position || positionMapping[a.position] || a.position;
    const posB = b.fantasy_position || positionMapping[b.position] || b.position;
    const indexA = startingPositions.indexOf(posA);
    const indexB = startingPositions.indexOf(posB);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

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
            {sortedStartingPlayers.map(player => {
              const fantasyPos = player.fantasy_position || positionMapping[player.position] || player.position;
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1.5rem',
                    border: '2px solid var(--light-gray)',
                    borderRadius: '25px',
                    backgroundColor: 'white',
                    borderLeft: '4px solid var(--primary-orange)',
                    transition: 'all 0.2s',
                    minHeight: '60px'
                  }}
                >
                  {/* Position Pill */}
                  <div style={{ 
                    minWidth: '120px',
                    marginRight: '1rem'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '15px',
                      backgroundColor: getPositionColor(fantasyPos),
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      {fantasyPos}
                    </div>
                  </div>
                  
                  {/* Player Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'var(--black)',
                      marginBottom: '0.25rem'
                    }}>
                      {getPlayerName(player.player_id)}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: 'var(--dark-gray)'
                    }}>
                      {getPlayerTeam(player.player_id)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onMovePlayerToBench(player)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#C0392B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Bench
                  </button>
                </div>
              );
            })}
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
              ).map(player => {
                const fantasyPos = player.fantasy_position || positionMapping[player.position] || player.position;
                return (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1.5rem',
                      border: '2px solid var(--light-gray)',
                      borderRadius: '25px',
                      backgroundColor: 'white',
                      borderLeft: '4px solid var(--dark-gray)',
                      transition: 'all 0.2s',
                      minHeight: '60px'
                    }}
                  >
                    {/* Position Pill */}
                    <div style={{ 
                      minWidth: '120px',
                      marginRight: '1rem'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '15px',
                        backgroundColor: '#95A5A6',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        Bench
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: 'var(--black)',
                        marginBottom: '0.25rem'
                      }}>
                        {getPlayerName(player.player_id)}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: 'var(--dark-gray)'
                      }}>
                        {getPlayerTeam(player.player_id)} • {fantasyPos}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onMovePlayerToStarting(player, positionMapping[player.position] || player.position)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        backgroundColor: '#2ECC71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Start
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
