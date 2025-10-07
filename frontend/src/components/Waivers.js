import React, { useState, useEffect } from 'react';
import WaiverClaimModal from './WaiverClaimModal';
import WaiverSuccessModal from './WaiverSuccessModal';
import WaiverOrderSidebar from './WaiverOrderSidebar';
import { leaguesAPI, teamsAPI } from '../services/api';

const Waivers = ({ selectedTeam, rugbyPlayers, teamPlayers, user, leagueId, onLoadRugbyPlayers, isActive }) => {
  const [searchName, setSearchName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [playerToAdd, setPlayerToAdd] = useState(null);
  const [waiverClaims, setWaiverClaims] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeWaiverView, setActiveWaiverView] = useState('add-drop'); // 'add-drop' or 'order'
  const [showMenu, setShowMenu] = useState(false);
  const [allLeaguePlayers, setAllLeaguePlayers] = useState([]); // All players from all teams in the league

  // Load rugby players when component mounts
  useEffect(() => {
    if (onLoadRugbyPlayers && rugbyPlayers.length === 0) {
      onLoadRugbyPlayers();
    }
  }, [onLoadRugbyPlayers, rugbyPlayers.length]);

  // Load all players from all teams in the league
  const loadAllLeaguePlayers = async () => {
    if (!leagueId || !isActive) return;
    
    try {
      // Get all teams in the league
      const teamsData = await teamsAPI.getTeamsByLeague(leagueId);
      if (!teamsData || teamsData.length === 0) {
        setAllLeaguePlayers([]);
        return;
      }

      // Get players from all teams
      const allPlayers = [];
      for (const team of teamsData) {
        try {
          const teamPlayersResponse = await teamsAPI.getTeamPlayers(team.id);
          if (teamPlayersResponse && teamPlayersResponse.players) {
            allPlayers.push(...teamPlayersResponse.players);
          }
        } catch (error) {
          console.warn(`Failed to load players for team ${team.id}:`, error);
        }
      }

      setAllLeaguePlayers(allPlayers);
    } catch (error) {
      console.error('Error loading all league players:', error);
      setAllLeaguePlayers([]);
    }
  };

  const positions = [
    'All',
    'Prop',
    'Hooker',
    'Lock',
    'Back Row',
    'Scrum-half',
    'Fly-half',
    'Centre',
    'Back Three'
  ];

  // Position color mapping
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

  // Get IDs of players already on ANY team in the league
  const allLeaguePlayerIds = allLeaguePlayers.map(p => p.player_id?.toString());

  // Filter available players
  let filteredPlayers = rugbyPlayers || [];
  
  // Exclude players already on ANY team in the league
  filteredPlayers = filteredPlayers.filter(p => !allLeaguePlayerIds.includes(p.id.toString()));
  
  if (selectedPosition !== 'All') {
    filteredPlayers = filteredPlayers.filter(p => p.fantasy_position === selectedPosition);
  }
  
  if (searchName) {
    filteredPlayers = filteredPlayers.filter(p =>
      p.name.toLowerCase().includes(searchName.toLowerCase()) ||
      p.team.toLowerCase().includes(searchName.toLowerCase())
    );
  }

  const handleAddWaiverClaim = (player) => {
    setPlayerToAdd(player);
    setShowClaimModal(true);
  };

  // Load waiver claims and teams on mount
  useEffect(() => {
    const loadData = async () => {
      if (!leagueId || !isActive) return;
      try {
        // Load waiver claims
        const claims = await leaguesAPI.getWaiverClaims(leagueId);
        setWaiverClaims(claims || []);
        
        // Load teams for waiver order
        const teamsData = await teamsAPI.getTeamsByLeague(leagueId);
        console.log('DEBUG: Waivers - loaded teams:', teamsData);
        setTeams(teamsData || []);
        
        // Load all players from all teams in the league
        await loadAllLeaguePlayers();
      } catch (error) {
        console.error('Error loading waiver data:', error);
      }
    };
    
    loadData();
  }, [leagueId, isActive]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('[data-menu-container]')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleConfirmClaim = async (playerToAdd, playerToDrop) => {
    try {
      if (!user || !user.id) {
        alert('❌ User not found. Please log in again.');
        return;
      }
      
      if (!selectedTeam || !selectedTeam.id) {
        alert('❌ Team not found. Please refresh the page.');
        return;
      }
      
      if (!leagueId) {
        alert('❌ League ID not found. Please return to the dashboard and try again.');
        return;
      }
      
      const claimData = {
        team_id: selectedTeam.id.toString(),
        user_id: user.id,
        player_to_add_id: playerToAdd.id.toString(),
        player_to_drop_id: playerToDrop.player_id.toString()
      };

      console.log('📋 Submitting waiver claim with data:', claimData);
      console.log('📍 League ID:', leagueId);
      console.log('👤 User:', user);
      console.log('🏉 Team:', selectedTeam);
      
      const result = await leaguesAPI.submitWaiverClaim(leagueId, claimData);
      
      console.log('✅ Waiver claim result:', result);
      
      if (result && result.message) {
        // Show success modal
        setSuccessData({
          playerToAdd: playerToAdd.name,
          playerToDrop: getPlayerName(playerToDrop.player_id),
          priority: result.priority
        });
        setShowSuccessModal(true);
        
        // Reload waiver claims
        const claims = await leaguesAPI.getWaiverClaims(leagueId);
        setWaiverClaims(claims || []);
      } else {
        console.error('❌ Unexpected result:', result);
        alert('❌ Failed to submit waiver claim. Please try again.');
      }
      
      setShowClaimModal(false);
      setPlayerToAdd(null);
    } catch (error) {
      console.error('❌ Error submitting waiver claim:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`❌ Failed to submit waiver claim.\n\nError: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelClaim = () => {
    setShowClaimModal(false);
    setPlayerToAdd(null);
  };

  const getPlayerName = (playerId) => {
    if (!rugbyPlayers) return `Player ${playerId}`;
    const player = rugbyPlayers.find(p => p.id.toString() === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

  if (!selectedTeam) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Waivers</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No team selected.</p>
        </div>
      </div>
    );
  }

  console.log('DEBUG: Waivers render - teams.length:', teams.length, 'activeWaiverView:', activeWaiverView);

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card" style={{ marginBottom: '2rem', position: 'relative' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                {activeWaiverView === 'add-drop' ? 'Waivers - Add/Drop Players' : 'Waiver Order'}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dark-gray)', fontSize: '0.95rem' }}>
                {activeWaiverView === 'add-drop' 
                  ? 'Browse available players and submit waiver claims'
                  : 'View the current waiver order for all teams'
                }
              </p>
            </div>
          </div>
          
          {/* Burger Menu - Top Right */}
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px',
            zIndex: 10
          }} data-menu-container>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--neutral-100)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '2px', 
                    backgroundColor: 'var(--neutral-600)',
                    borderRadius: '1px'
                  }}></div>
                  <div style={{ 
                    width: '18px', 
                    height: '2px', 
                    backgroundColor: 'var(--neutral-600)',
                    borderRadius: '1px'
                  }}></div>
                  <div style={{ 
                    width: '18px', 
                    height: '2px', 
                    backgroundColor: 'var(--neutral-600)',
                    borderRadius: '1px'
                  }}></div>
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    minWidth: '200px',
                    marginTop: '4px'
                  }}>
                    <button
                      onClick={() => {
                        setActiveWaiverView('add-drop');
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: activeWaiverView === 'add-drop' ? 'var(--databricks-light-blue)' : 'transparent',
                        color: activeWaiverView === 'add-drop' ? 'var(--databricks-blue)' : 'var(--neutral-700)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeWaiverView === 'add-drop' ? '600' : '400',
                        borderBottom: '1px solid var(--neutral-100)'
                      }}
                      onMouseEnter={(e) => {
                        if (activeWaiverView !== 'add-drop') {
                          e.target.style.backgroundColor = 'var(--neutral-50)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeWaiverView !== 'add-drop') {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      📋 Waivers - Add/Drop Players
                    </button>
                    <button
                      onClick={() => {
                        setActiveWaiverView('order');
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: activeWaiverView === 'order' ? 'var(--databricks-light-blue)' : 'transparent',
                        color: activeWaiverView === 'order' ? 'var(--databricks-blue)' : 'var(--neutral-700)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeWaiverView === 'order' ? '600' : '400'
                      }}
                      onMouseEnter={(e) => {
                        if (activeWaiverView !== 'order') {
                          e.target.style.backgroundColor = 'var(--neutral-50)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeWaiverView !== 'order') {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      📊 Waiver Order
                    </button>
                  </div>
                )}
          </div>
          
          {activeWaiverView === 'add-drop' ? (
            <div style={{ padding: '1rem' }}>
              {/* Pending Waiver Claims */}
              {waiverClaims.filter(claim => 
                claim.team_id === selectedTeam.id && claim.claim_status === 'PENDING'
              ).length > 0 && (
              <div style={{ 
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: '#FFF3CD',
                border: '2px solid #FFC107',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0',
                  color: '#856404',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⏳ Your Pending Waiver Claims
                </h4>
                {waiverClaims
                  .filter(claim => claim.team_id === selectedTeam.id && claim.claim_status === 'PENDING')
                  .map((claim, index) => {
                    const playerToAdd = rugbyPlayers.find(p => p.id.toString() === claim.player_to_add_id);
                    const playerToDrop = rugbyPlayers.find(p => p.id.toString() === claim.player_to_drop_id);
                    
                    return (
                      <div 
                        key={claim.id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          marginBottom: index < waiverClaims.filter(c => c.team_id === selectedTeam.id && c.claim_status === 'PENDING').length - 1 ? '0.5rem' : '0'
                        }}
                      >
                        <div>
                          <span style={{ color: '#2ECC71', fontWeight: 'bold' }}>➕ {playerToAdd?.name || `Player ${claim.player_to_add_id}`}</span>
                          <span style={{ margin: '0 0.75rem', color: '#666' }}>→</span>
                          <span style={{ color: '#C0392B', fontWeight: 'bold' }}>➖ {playerToDrop?.name || `Player ${claim.player_to_drop_id}`}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Filters */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap' 
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search players by name or team..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--light-gray)',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--light-gray)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {positions.map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h4 style={{ 
                color: 'var(--primary-orange)', 
                marginBottom: '1rem',
                fontSize: '1.2rem'
              }}>
                Available Players ({filteredPlayers.length})
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {filteredPlayers.slice(0, 50).map(player => (
                  <div
                    key={player.id}
                    style={{
                      padding: '1rem',
                      border: '2px solid var(--light-gray)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: 'var(--black)',
                        fontSize: '1.1rem'
                      }}>
                        {player.name}
                      </h4>
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        backgroundColor: getPositionColor(player.fantasy_position),
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                      }}>
                        {player.fantasy_position}
                      </div>
                      <p style={{ 
                        margin: '0.5rem 0 0 0', 
                        color: 'var(--dark-gray)', 
                        fontSize: '0.9rem' 
                      }}>
                        Team: {player.team}
                      </p>
                      {/* Fantasy Points Display */}
                      {player.fantasy_points_per_game !== undefined && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Fantasy Points/Game:</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                              {player.fantasy_points_per_game}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Fantasy Points/Min:</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                              {player.fantasy_points_per_minute}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Total Fantasy Points:</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                              {player.total_fantasy_points}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleAddWaiverClaim(player)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#95A5A6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    >
                      + Add Waiver Claim
                    </button>
                  </div>
                ))}
              </div>
              
              {filteredPlayers.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem',
                  color: 'var(--dark-gray)'
                }}>
                  <p>No players found matching your criteria.</p>
                </div>
              )}
            </div>
            </div>
          ) : (
            /* Waiver Order View */
            <div style={{ padding: '2rem' }}>
              <WaiverOrderSidebar
                teams={teams}
                selectedTeam={selectedTeam}
                user={user}
              />
            </div>
          )}
        </div>

        <WaiverClaimModal
          showModal={showClaimModal}
          playerToAdd={playerToAdd}
          teamPlayers={teamPlayers}
          rugbyPlayers={rugbyPlayers}
          onConfirm={handleConfirmClaim}
          onCancel={handleCancelClaim}
        />

        <WaiverSuccessModal
          show={showSuccessModal}
          playerToAdd={successData?.playerToAdd}
          playerToDrop={successData?.playerToDrop}
          priority={successData?.priority}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessData(null);
          }}
        />
      </div>
    </div>
  );
};

export default Waivers;

