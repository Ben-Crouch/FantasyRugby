import React from 'react';

const MyTeamView = ({ teams, selectedPlayers, user }) => {
  // Find the current user's team
  const userTeam = teams.find(team => {
    const teamUserId = team.user_id || team.team_owner_user_id;
    return teamUserId === user?.id?.toString();
  });
  
  const userSelectedPlayers = userTeam ? selectedPlayers[userTeam.id] || [] : [];
  const completionPercentage = Math.round((userSelectedPlayers.length / 15) * 100);

  // Position color mapping (same as PlayerCard)
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

  // Define the required starting positions (10 starters + 5 bench = 15 total)
  // These match the actual fantasy_position values from the database
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

  if (!userTeam) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ color: 'var(--dark-gray)' }}>You are not part of this league</h3>
      </div>
    );
  }
  
  // Create roster slots and fill them based on position matching
  const startingRoster = [];
  const benchRoster = [];
  const usedPlayerIndices = new Set();
  let slotNumber = 1;
  
  // Fill starting positions by matching player fantasy_position to slot position
  startingPositions.forEach(posGroup => {
    for (let i = 0; i < posGroup.slots; i++) {
      // Find first available player that matches this position
      let matchedPlayer = null;
      let matchedIndex = -1;
      
      for (let j = 0; j < userSelectedPlayers.length; j++) {
        if (!usedPlayerIndices.has(j) && userSelectedPlayers[j].fantasy_position === posGroup.position) {
          matchedPlayer = userSelectedPlayers[j];
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
  
  // Fill bench with remaining players
  for (let i = 0; i < benchSlots; i++) {
    let benchPlayer = null;
    
    // Find next unused player for bench
    for (let j = 0; j < userSelectedPlayers.length; j++) {
      if (!usedPlayerIndices.has(j)) {
        benchPlayer = userSelectedPlayers[j];
        usedPlayerIndices.add(j);
        break;
      }
    }
    
    benchRoster.push({
      slotNumber: slotNumber++,
      position: 'Bench',
      player: benchPlayer
    });
  }

  return (
    <>
      {/* My Team Overview */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>My Team Overview</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--lightest-orange)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--primary-orange)',
              marginBottom: '0.5rem'
            }}>
              {userSelectedPlayers.length}
            </div>
            <div style={{ color: 'var(--dark-gray)' }}>Players Selected</div>
          </div>
          <div style={{ 
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--lightest-gray)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--black)',
              marginBottom: '0.5rem'
            }}>
              {15 - userSelectedPlayers.length}
            </div>
            <div style={{ color: 'var(--dark-gray)' }}>Remaining Picks</div>
          </div>
          <div style={{ 
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--lightest-blue)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--primary-blue)',
              marginBottom: '0.5rem'
            }}>
              {completionPercentage}%
            </div>
            <div style={{ color: 'var(--dark-gray)' }}>Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ 
          width: '100%',
          height: '24px',
          backgroundColor: 'var(--light-gray)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${completionPercentage}%`,
            height: '100%',
            backgroundColor: 'var(--primary-orange)',
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 'bold'
          }}>
            {completionPercentage > 10 && `${completionPercentage}%`}
          </div>
        </div>
      </div>

      {/* Starting Lineup */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Starting Lineup ({startingRoster.filter(s => s.player).length}/{totalStartingSlots})</h2>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {startingRoster.map((slot) => (
            <div 
              key={slot.slotNumber}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                border: '2px dashed var(--light-gray)',
                borderRadius: '25px',
                backgroundColor: slot.player ? (slot.player.autoPicked ? '#FFF3CD' : 'white') : 'var(--lightest-gray)',
                borderLeft: slot.player ? (slot.player.autoPicked ? '4px solid #FFC107' : '4px solid var(--primary-orange)') : '2px dashed var(--light-gray)',
                opacity: slot.player ? 1 : 0.6,
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
              {slot.player ? (
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'var(--black)'
                    }}>
                      {slot.player.name}
                    </span>
                    {slot.player.autoPicked && (
                      <span style={{ fontSize: '1rem' }}>🤖</span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    color: 'var(--dark-gray)'
                  }}>
                    {slot.player.team}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  flex: 1,
                  fontStyle: 'italic',
                  color: 'var(--dark-gray)',
                  fontSize: '1rem'
                }}>
                  Empty slot - awaiting draft pick
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Bench ({benchRoster.filter(s => s.player).length}/{benchSlots})</h2>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {benchRoster.map((slot) => (
            <div 
              key={slot.slotNumber}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                border: '2px dashed var(--light-gray)',
                borderRadius: '25px',
                backgroundColor: slot.player ? (slot.player.autoPicked ? '#FFF3CD' : 'white') : 'var(--lightest-gray)',
                borderLeft: slot.player ? (slot.player.autoPicked ? '4px solid #FFC107' : '4px solid var(--dark-gray)') : '2px dashed var(--light-gray)',
                opacity: slot.player ? 1 : 0.6,
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
              
              {/* Player Info or Empty Slot */}
              {slot.player ? (
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'var(--black)'
                    }}>
                      {slot.player.name}
                    </span>
                    {slot.player.autoPicked && (
                      <span style={{ fontSize: '1rem' }}>🤖</span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    color: 'var(--dark-gray)'
                  }}>
                    {slot.player.team}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  flex: 1,
                  fontStyle: 'italic',
                  color: 'var(--dark-gray)',
                  fontSize: '1rem'
                }}>
                  Empty bench slot
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MyTeamView;

