import React, { useEffect } from 'react';

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
  setSwapData,
  onLoadRugbyPlayers,
  onLoadTeamPlayers
}) => {
  // Load rugby players and team players when component mounts
  useEffect(() => {
    if (onLoadRugbyPlayers && rugbyPlayers.length === 0) {
      onLoadRugbyPlayers();
    }
    if (onLoadTeamPlayers && selectedTeam && teamPlayers.length === 0) {
      onLoadTeamPlayers(selectedTeam.id);
    }
  }, [onLoadRugbyPlayers, rugbyPlayers.length, onLoadTeamPlayers, selectedTeam, teamPlayers.length]);

  const getPlayerName = (playerId) => {
    if (!playerId) return 'Unknown Player';
    const player = rugbyPlayers.find(p => p.id && p.id.toString() === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

  const getPlayerTeam = (playerId) => {
    if (!playerId) return '';
    const player = rugbyPlayers.find(p => p.id && p.id.toString() === playerId.toString());
    return player ? player.team : '';
  };

  const getPlayerStats = (playerId) => {
    if (!playerId) return { ppg: null, ppm: null };
    const player = rugbyPlayers.find(p => p.id && p.id.toString() === playerId.toString());
    return {
      ppg: player?.ppg || player?.PPG || null,
      ppm: player?.ppm || player?.PPM || null
    };
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

  // Define the required starting positions (10 starters + 5 bench = 15 total)
  const startingPositions = [
    { position: 'Prop', slots: 1 },
    { position: 'Hooker', slots: 1 },
    { position: 'Lock', slots: 1 },
    { position: 'Back Row', slots: 2 },
    { position: 'Scrum-half', slots: 1 },
    { position: 'Fly-half', slots: 1 },
    { position: 'Centre', slots: 1 },
    { position: 'Back Three', slots: 2 }
  ];
  
  const benchSlots = 5;
  const totalStartingSlots = startingPositions.reduce((sum, p) => sum + p.slots, 0);

  // Create roster slots and fill them based on position matching
  const startingRoster = [];
  const benchRoster = [];
  const usedPlayerIndices = new Set();
  let slotNumber = 1;
  
  // Fill starting positions by matching player fantasy_position to slot position
  startingPositions.forEach(posGroup => {
    for (let i = 0; i < posGroup.slots; i++) {
      // Find first available player that matches this position and is starting
      let matchedPlayer = null;
      let matchedIndex = -1;
      
      for (let j = 0; j < playersToUse.length; j++) {
        const player = playersToUse[j];
        const playerFantasyPos = player.fantasy_position || positionMapping[player.position] || player.position;
        const isStarting = player.is_starting === 'true' || player.is_starting === true;
        
        if (!usedPlayerIndices.has(j) && 
            playerFantasyPos === posGroup.position && 
            isStarting && 
            player.fantasy_position !== 'Bench') {
          matchedPlayer = player;
          matchedIndex = j;
          break;
        }
      }
      
      if (matchedPlayer) {
        usedPlayerIndices.add(matchedIndex);
      }
      
      startingRoster.push({
        slotNumber: slotNumber++,
        position: posGroup.position,
        player: matchedPlayer
      });
    }
  });
  
  // Fill bench positions
  for (let i = 0; i < benchSlots; i++) {
    let matchedPlayer = null;
    let matchedIndex = -1;
    
    for (let j = 0; j < playersToUse.length; j++) {
      const player = playersToUse[j];
      const isBench = (player.is_starting === 'false' || player.is_starting === false);
      
      if (!usedPlayerIndices.has(j) && isBench) {
        matchedPlayer = player;
        matchedIndex = j;
        break;
      }
    }
    
    if (matchedPlayer) {
      usedPlayerIndices.add(matchedIndex);
    }
    
    benchRoster.push({
      slotNumber: slotNumber++,
      position: 'Bench',
      player: matchedPlayer
    });
  }

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
            {startingRoster.map((slot) => (
              <div
                key={`starting-${slot.slotNumber}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  border: slot.player ? '2px solid var(--light-gray)' : '2px dashed var(--light-gray)',
                  borderRadius: '25px',
                  backgroundColor: slot.player ? 'white' : 'var(--lightest-gray)',
                  borderLeft: slot.player ? '4px solid var(--primary-orange)' : '4px dashed var(--light-gray)',
                  transition: 'all 0.2s',
                  minHeight: '60px',
                  opacity: slot.player ? 1 : 0.6
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
                    backgroundColor: getPositionColor(slot.position),
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {slot.position}
                  </div>
                </div>
                
                {/* Player Info or Empty Slot */}
                <div style={{ flex: 1 }}>
                  {slot.player ? (
                    <>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: 'var(--black)',
                        marginBottom: '0.25rem'
                      }}>
                        {getPlayerName(slot.player.id)}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--dark-gray)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span>{getPlayerTeam(slot.player.id)}</span>
                        {(() => {
                          const stats = getPlayerStats(slot.player.id);
                          return (stats.ppg !== null || stats.ppm !== null) && (
                            <span style={{
                              display: 'flex',
                              gap: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {stats.ppg !== null && (
                                <span style={{ color: 'var(--primary-orange)' }}>
                                  PPG: {typeof stats.ppg === 'number' ? stats.ppg.toFixed(1) : stats.ppg}
                                </span>
                              )}
                              {stats.ppm !== null && (
                                <span style={{ color: 'var(--primary-orange)' }}>
                                  PPM: {typeof stats.ppm === 'number' ? stats.ppm.toFixed(1) : stats.ppm}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--dark-gray)',
                      fontStyle: 'italic'
                    }}>
                      Empty slot
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                {slot.player && (
                  <button
                    onClick={() => {
                      console.log('DEBUG: Bench button clicked for player:', slot.player);
                      onMovePlayerToBench(slot.player);
                    }}
                    style={{
                      padding: '0.4rem 0.9rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#E57373',
                      color: 'white',
                      border: 'none',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Move to
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bench Players */}
        <div>
          <h4 style={{ 
            color: 'var(--primary-orange)', 
            marginBottom: '1rem',
            borderBottom: '2px solid var(--primary-orange)',
            paddingBottom: '0.5rem'
          }}>
            Bench Players ({benchRoster.filter(s => s.player).length}/{benchSlots})
          </h4>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem' 
          }}>
            {benchRoster.map((slot) => (
              <div
                key={`bench-${slot.slotNumber}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  border: slot.player ? '2px solid var(--light-gray)' : '2px dashed var(--light-gray)',
                  borderRadius: '25px',
                  backgroundColor: slot.player ? 'white' : 'var(--lightest-gray)',
                  borderLeft: slot.player ? '4px solid var(--dark-gray)' : '4px dashed var(--light-gray)',
                  transition: 'all 0.2s',
                  minHeight: '60px',
                  opacity: slot.player ? 1 : 0.6
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
                
                {/* Player Info or Empty Slot */}
                <div style={{ flex: 1 }}>
                  {slot.player ? (
                    <>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: 'var(--black)',
                        marginBottom: '0.25rem'
                      }}>
                        {getPlayerName(slot.player.id)}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--dark-gray)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span>{getPlayerTeam(slot.player.id)} • {slot.player.fantasy_position || positionMapping[slot.player.position] || slot.player.position}</span>
                        {(() => {
                          const stats = getPlayerStats(slot.player.id);
                          return (stats.ppg !== null || stats.ppm !== null) && (
                            <span style={{
                              display: 'flex',
                              gap: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {stats.ppg !== null && (
                                <span style={{ color: 'var(--primary-orange)' }}>
                                  PPG: {typeof stats.ppg === 'number' ? stats.ppg.toFixed(1) : stats.ppg}
                                </span>
                              )}
                              {stats.ppm !== null && (
                                <span style={{ color: 'var(--primary-orange)' }}>
                                  PPM: {typeof stats.ppm === 'number' ? stats.ppm.toFixed(1) : stats.ppm}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--dark-gray)',
                      fontStyle: 'italic'
                    }}>
                      Empty slot
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                {slot.player && (
                  <button
                    onClick={() => {
                      console.log('DEBUG: Start button clicked for player:', slot.player);
                      const fantasyPos = slot.player.fantasy_position || positionMapping[slot.player.position] || slot.player.position;
                      console.log('DEBUG: Calculated fantasy position:', fantasyPos);
                      onMovePlayerToStarting(slot.player, fantasyPos);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#81C784',
                      color: 'white',
                      border: 'none',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Move to
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;
