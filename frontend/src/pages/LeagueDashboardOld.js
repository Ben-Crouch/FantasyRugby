import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';

const LeagueDashboard = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('league'); // 'league', 'my-team'
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [rugbyPlayers, setRugbyPlayers] = useState([]);
  const [localTeamPlayers, setLocalTeamPlayers] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapData, setSwapData] = useState(null);
  const [draftComplete, setDraftComplete] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
              try {
                let leagueId = location.state?.leagueId;
                
                if (!leagueId) {
                  console.error('No league ID provided in location state');
                  // Try to get the first available league as fallback
                  const allLeagues = await leaguesAPI.getLeagues();
                  if (allLeagues && allLeagues.length > 0) {
                    leagueId = allLeagues[0].id;
                    console.log('Using fallback league ID:', leagueId);
                  } else {
                    setError('No league selected. Please go back to league selection.');
                    return;
                  }
                }
        
        // Fetch league data
        const leagues = await leaguesAPI.getLeagues();
        const league = leagues.find(l => l.id === leagueId);
        
        if (league) {
          setLeagueData(league);
        } else {
          // Fallback data if league not found
          setLeagueData({
            id: leagueId,
            name: 'Fantasy League',
            description: 'A competitive fantasy rugby league',
            max_teams: 12,
            max_players_per_team: 15,
            is_public: true
          });
        }
        
        // Fetch teams in the league
        const allTeams = await teamsAPI.getTeams();
        const teamsData = allTeams.filter(team => team.league_id === leagueId);
        setTeams(teamsData || []);
        
        // Check if draft is complete by checking if any team has players
        if (teamsData && teamsData.length > 0) {
          try {
            // Check if any team has players (indicating draft is complete)
            const teamWithPlayers = await Promise.all(
              teamsData.map(async (team) => {
                try {
                  const players = await teamsAPI.getTeamPlayers(team.id);
                  return players && players.length > 0;
                } catch (error) {
                  console.warn(`Could not fetch players for team ${team.id}:`, error);
                  return false;
                }
              })
            );
            
            // If any team has players, the draft is complete
            const hasPlayers = teamWithPlayers.some(hasPlayers => hasPlayers);
            console.log('DEBUG: Draft completion check - teamWithPlayers:', teamWithPlayers);
            console.log('DEBUG: Draft completion check - hasPlayers:', hasPlayers);
            setDraftComplete(hasPlayers);
            
            // Auto-select user's team if available
            if (user && user.id) {
              const userTeam = teamsData.find(team => team.team_owner === user.id);
              if (userTeam) {
                setSelectedTeam(userTeam);
                loadTeamPlayers(userTeam.id);
              } else {
                // If no team found, try to find by user_id field
                const userTeamByUserId = teamsData.find(team => team.team_owner_user_id === user.id);
                if (userTeamByUserId) {
                  setSelectedTeam(userTeamByUserId);
                  loadTeamPlayers(userTeamByUserId.id);
                }
              }
            }
            
          } catch (error) {
            console.warn('Could not check draft completion status:', error);
            setDraftComplete(false);
          }
        }
        
        // Check if current user is the admin of this league
        if (user && user.id) {
          try {
            console.log('Checking admin status for user:', user.id, 'league:', leagueId);
            const adminCheck = await leaguesAPI.isUserLeagueAdmin(leagueId, user.id);
            console.log('Admin check result:', adminCheck);
            setIsAdmin(adminCheck.is_admin || false);
          } catch (error) {
            console.warn('Could not check admin status:', error);
            setIsAdmin(false);
          }
        } else {
          console.log('No user found for admin check:', { user: user?.id });
          setIsAdmin(false);
        }
        
      } catch (err) {
        console.error('Error loading league data:', err);
        setError('Failed to load league data');
        
        // Fallback data
        setLeagueData({
          id: location.state?.leagueId || 1,
          name: 'Fantasy League',
          description: 'A competitive fantasy rugby league',
          max_teams: 12,
          max_players_per_team: 15,
          is_public: true
        });
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    loadRugbyPlayers();
  }, [location.state, user]);

  // Function to load rugby players data
  const loadRugbyPlayers = async () => {
    try {
      const players = await rugbyPlayersAPI.getPlayers();
      setRugbyPlayers(players || []);
    } catch (error) {
      console.error('Error loading rugby players:', error);
      setRugbyPlayers([]);
    }
  };

  // Function to get player name by ID
  const getPlayerName = (playerId) => {
    const player = rugbyPlayers.find(p => p.id === playerId.toString());
    return player ? player.name : `Player ${playerId}`;
  };

          // Function to move player to bench
          const movePlayerToBench = async (player) => {
            if (!player) return;
            
            // Check if there's a player of the same position on the bench
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
            
            const playerFantasyPosition = positionMapping[player.original_position] || player.original_position;
            const availableBenchPlayer = localTeamPlayers.find(p => 
              p.fantasy_position === 'Bench' && 
              (positionMapping[p.original_position] || p.original_position) === playerFantasyPosition &&
              p.id !== player.id
            );
            
            if (!availableBenchPlayer) {
              alert('Sorry, you do not have any players of this position to replace this player');
              return;
            }
            
            // Set up swap data for custom modal
            const newPlayerName = getPlayerName(player.player_id);
            
            setSwapData({
              newPlayer: player,
              currentPlayers: [availableBenchPlayer], // Array with single bench player
              targetPosition: playerFantasyPosition,
              newPlayerName: newPlayerName,
              selectedCurrentPlayer: availableBenchPlayer
            });
            setShowSwapModal(true);
          };

          // Function to move player to starting position
          const movePlayerToStarting = async (player, targetPosition) => {
            if (!player) return;
            
            // Get the rugby player data to check their actual position
            const rugbyPlayer = rugbyPlayers.find(p => p.id === player.player_id.toString());
            if (!rugbyPlayer) return;
            
            // Map actual positions to fantasy positions
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
            
            // Check if the player can play in the target position
            const playerFantasyPosition = positionMapping[rugbyPlayer.position];
            if (playerFantasyPosition !== targetPosition) {
              alert(`This player (${rugbyPlayer.position}) cannot play as ${targetPosition}. They can only play as ${playerFantasyPosition}.`);
              return;
            }
            
            // Check if there are players in that starting position (excluding the player being moved and other bench players)
            const currentStartingPlayers = localTeamPlayers.filter(p => {
              const pFantasyPosition = p.fantasy_position || positionMapping[p.position] || p.position;
              // Only include players who are currently in starting positions (not on bench) and not the player being moved
              const isStartingPlayer = p.is_starting !== false && p.fantasy_position !== 'Bench';
              const matchesTargetPosition = pFantasyPosition === targetPosition;
              const isNotCurrentPlayer = p.id !== player.id;
              
              console.log(`Player ${p.id}: position=${p.position}, fantasyPosition=${pFantasyPosition}, isStarting=${isStartingPlayer}, matchesTarget=${matchesTargetPosition}, notCurrent=${isNotCurrentPlayer}`);
              
              return matchesTargetPosition && isStartingPlayer && isNotCurrentPlayer;
            });
            
            if (currentStartingPlayers.length > 0) {
              // Show custom confirmation modal for swap with player selection
              const newPlayerName = getPlayerName(player.player_id);
              
              setSwapData({
                newPlayer: player,
                currentPlayers: currentStartingPlayers,
                targetPosition: targetPosition,
                newPlayerName: newPlayerName,
                selectedCurrentPlayer: null // Will be set when user selects
              });
              setShowSwapModal(true);
              return;
            } else {
              // No current player in that position, just move the player
              try {
                // Update in database
                const response = await fetch(`/api/league-teams/${selectedTeam.id}/players/${player.id}/`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({
                    fantasy_position: targetPosition,
                    is_starting: true
                  })
                });
                
                if (response.ok) {
                  // Update local state
                  setLocalTeamPlayers(prev => {
                    const updated = [...prev];
                    const playerIndex = updated.findIndex(p => p.id === player.id);
                    if (playerIndex !== -1) {
                      updated[playerIndex] = { 
                        ...updated[playerIndex], 
                        fantasy_position: targetPosition,
                        is_starting: true
                      };
                    }
                    return updated;
                  });
                } else {
                  console.error('Failed to update player position');
                }
              } catch (error) {
                console.error('Error updating player position:', error);
              }
            }
          };

          // Function to confirm swap
          const confirmSwap = async () => {
            if (!swapData || !swapData.selectedCurrentPlayer) return;
            
            try {
              // Update both players in database
              const newPlayerResponse = await fetch(`/api/league-teams/${selectedTeam.id}/players/${swapData.newPlayer.id}/`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  fantasy_position: swapData.targetPosition,
                  is_starting: true
                })
              });
              
              const currentPlayerResponse = await fetch(`/api/league-teams/${selectedTeam.id}/players/${swapData.selectedCurrentPlayer.id}/`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  fantasy_position: 'Bench',
                  is_starting: false
                })
              });
              
              if (newPlayerResponse.ok && currentPlayerResponse.ok) {
                // Update local state
                setLocalTeamPlayers(prev => {
                  const updated = [...prev];
                  
                  // Move new player to starting position
                  const newPlayerIndex = updated.findIndex(p => p.id === swapData.newPlayer.id);
                  if (newPlayerIndex !== -1) {
                    updated[newPlayerIndex] = { 
                      ...updated[newPlayerIndex], 
                      fantasy_position: swapData.targetPosition,
                      is_starting: true
                    };
                  }
                  
                  // Move selected current starting player to bench
                  const currentPlayerIndex = updated.findIndex(p => p.id === swapData.selectedCurrentPlayer.id);
                  if (currentPlayerIndex !== -1) {
                    updated[currentPlayerIndex] = { 
                      ...updated[currentPlayerIndex], 
                      fantasy_position: 'Bench',
                      is_starting: false
                    };
                  }
                  
                  return updated;
                });
              } else {
                console.error('Failed to update player positions in database');
              }
            } catch (error) {
              console.error('Error updating player positions:', error);
            }
            
            setShowSwapModal(false);
            setSwapData(null);
          };

          // Function to cancel swap
          const cancelSwap = () => {
            setShowSwapModal(false);
            setSwapData(null);
          };

  // Function to load team players
  const loadTeamPlayers = async (teamId) => {
    if (!teamId) return;
    
    setLoadingPlayers(true);
    try {
      const players = await teamsAPI.getTeamPlayers(teamId);
      console.log('DEBUG: getTeamPlayers response:', players);
      console.log('DEBUG: Raw players data:', players.players);
      
      // Log each player's data
      if (players.players) {
        players.players.forEach((player, index) => {
          console.log(`DEBUG: Player ${index}:`, {
            id: player.id,
            player_id: player.player_id,
            position: player.position,
            fantasy_position: player.fantasy_position,
            is_starting: player.is_starting
          });
        });
      }
      
      setTeamPlayers(players.players || []);
      setLocalTeamPlayers(players.players || []);
    } catch (error) {
      console.error('Error loading team players:', error);
      setTeamPlayers([]);
      setLocalTeamPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Handle team selection
  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    loadTeamPlayers(team.id);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--black)' }}>
          Loading your league dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Navigation Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem 0'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/league-selection')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Leagues
            </button>
            <button 
              onClick={() => navigate('/my-leagues')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--black)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              My Leagues
            </button>
          </div>
          <div style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
            League ID: {leagueData?.id}
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--black)' }}>
              Welcome to {leagueData?.name}!
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              color: 'var(--dark-gray)',
              fontSize: '1.1rem'
            }}>
              {leagueData?.description}
            </p>
          </div>
          {(() => {
            console.log('DEBUG: Start Draft button condition - isAdmin:', isAdmin, 'draftComplete:', draftComplete);
            return isAdmin && !draftComplete;
          })() && (
            <button 
              onClick={() => navigate('/draft', { state: { leagueId: leagueData?.id } })}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--dark-orange)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              🚀 Start Draft
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--light-gray)' }}>
          <button
            onClick={() => setActiveTab('league')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'league' ? 'var(--primary-orange)' : 'transparent',
              color: activeTab === 'league' ? 'white' : 'var(--black)',
              border: 'none',
              borderBottom: activeTab === 'league' ? '3px solid var(--dark-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            League Table
          </button>
          <button
            onClick={() => setActiveTab('my-team')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'my-team' ? 'var(--primary-orange)' : 'transparent',
              color: activeTab === 'my-team' ? 'white' : 'var(--black)',
              border: 'none',
              borderBottom: activeTab === 'my-team' ? '3px solid var(--dark-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            My Team
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'league' && (
        <>
          {/* Teams in League */}
          <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Teams in League ({teams.length}/{leagueData?.max_teams})</h3>
        </div>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        {teams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dark-gray)' }}>
            <p>No teams have joined this league yet.</p>
            <p>Be the first to create a team!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-orange)', color: 'white' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    #
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    Team Name
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    W
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    L
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    D
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    PF
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    PA
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr 
                    key={team.id || index}
                    style={{ 
                      borderBottom: '1px solid #e0e0e0',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <td style={{ 
                      padding: '1rem', 
                      fontWeight: 'bold',
                      color: 'var(--primary-orange)',
                      fontSize: '1.1rem'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      fontWeight: 'bold',
                      color: 'var(--black)',
                      fontSize: '1rem'
                    }}>
                      {team.team_name}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--dark-gray)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {team.wins || 0}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--dark-gray)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {team.losses || 0}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--dark-gray)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {team.draws || 0}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--dark-gray)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {team.points_for || 0}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--dark-gray)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {team.points_against || 0}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      color: 'var(--primary-orange)',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      {team.league_points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coming Soon Section */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
        <h2 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
          League Dashboard Coming Soon!
        </h2>
        <p style={{ 
          color: 'var(--dark-gray)', 
          fontSize: '1.1rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          We're working hard to bring you the complete fantasy rugby experience. 
          Soon you'll be able to manage your team, view league standings, and compete with other managers!
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--light-gray)', 
            borderRadius: '8px',
            border: '2px solid var(--primary-orange)'
          }}>
            <h4 style={{ color: 'var(--black)', marginBottom: '0.5rem' }}>Player Management</h4>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem', margin: 0 }}>
              Add, remove, and manage your squad
            </p>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--light-gray)', 
            borderRadius: '8px',
            border: '2px solid var(--primary-orange)'
          }}>
            <h4 style={{ color: 'var(--black)', marginBottom: '0.5rem' }}>League Standings</h4>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem', margin: 0 }}>
              Track your team's performance
            </p>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--light-gray)', 
            borderRadius: '8px',
            border: '2px solid var(--primary-orange)'
          }}>
            <h4 style={{ color: 'var(--black)', marginBottom: '0.5rem' }}>Match Results</h4>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem', margin: 0 }}>
              View live scores and statistics
            </p>
          </div>
        </div>
      </div>
      )}

      {/* My Team View */}
      {activeTab === 'my-team' && (
        <>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">My Team</h3>
          </div>
          
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dark-gray)' }}>
              <p>No teams have joined this league yet.</p>
              <p>Join a team to see your drafted players!</p>
            </div>
          ) : (
            <div>
              {/* Team Players */}
              <div>
                  
                  {loadingPlayers ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner"></div>
                      <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>
                        Loading team players...
                      </p>
                    </div>
                  ) : teamPlayers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dark-gray)' }}>
                      <p>No players have been drafted for this team yet.</p>
                      <p>Complete the draft to see the team roster!</p>
                    </div>
                  ) : (
                    <div>
                      {(() => {
                                // Define required positions and their counts
                                const requiredPositions = {
                                  'Prop': 1,
                                  'Hooker': 1,
                                  'Lock': 1,
                                  'Back Row': 2,
                                  'Scrum-half': 1,
                                  'Fly-half': 1,
                                  'Centre': 1,
                                  'Back Three': 2
                                };
                                
                                // Separate players into starting XV and bench
                                const startingPlayers = [];
                                const benchPlayers = [];
                                
                                // Map actual positions to fantasy positions
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
                                
                                // Use localTeamPlayers if available, otherwise fall back to teamPlayers
                                const playersToUse = localTeamPlayers.length > 0 ? localTeamPlayers : teamPlayers;
                                
                                console.log(`DEBUG: Total players to process: ${playersToUse.length}`);
                                console.log(`DEBUG: Players data:`, playersToUse);
                                
                                // Assign players to starting XV first, then bench based on database fields
                                playersToUse.forEach(player => {
                                  // Handle both string and boolean values from database
                                  const isStarting = player.is_starting === 'true' || player.is_starting === true;
                                  
                                  console.log(`DEBUG: Player ${player.player_id}: is_starting=${player.is_starting}, isStarting=${isStarting}`);
                                  
                                  if (isStarting) {
                                    startingPlayers.push(player);
                                  } else {
                                    benchPlayers.push(player);
                                  }
                                });
                                
                                console.log(`DEBUG: Final counts - Starting: ${startingPlayers.length}, Bench: ${benchPlayers.length}`);
                                
                                return (
                                  <div>
                                    {/* Starting Team */}
                                    <div style={{ marginBottom: '2rem' }}>
                                      <h4 style={{ 
                                        color: 'var(--black)', 
                                        marginBottom: '1rem', 
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                      }}>
                                        Starting Team
                                      </h4>
                                      <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                      }}>
                                        {Object.entries(requiredPositions).map(([position, count]) => {
                                          const positionPlayers = startingPlayers.filter(p => {
                                            const pFantasyPosition = positionMapping[p.position] || p.position;
                                            return pFantasyPosition === position;
                                          });
                                          return Array.from({ length: count }, (_, index) => {
                                            const player = positionPlayers[index];
                                            return (
                                              <div 
                                                key={`${position}-${index}`}
                                                style={{ 
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '1rem'
                                                }}
                                              >
                                                {/* Position label outside the box */}
                                                <div style={{ 
                                                  minWidth: '120px',
                                                  textAlign: 'left'
                                                }}>
                                                  <span style={{ 
                                                    color: 'var(--primary-orange)', 
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold'
                                                  }}>
                                                    {position}
                                                  </span>
                                                </div>
                                                
                                                {/* Player box */}
                                                <div style={{ 
                                                  flex: 1,
                                                  padding: '0.75rem 1rem',
                                                  backgroundColor: player ? 'var(--light-gray)' : 'white',
                                                  borderRadius: '6px',
                                                  border: player ? '1px solid #666666' : '1px dashed var(--light-gray)',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  minHeight: '50px'
                                                }}>
                                                  {player ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                                                      <div style={{ flex: 1 }}>
                                                        <h4 style={{ 
                                                          margin: '0', 
                                                          color: 'var(--black)', 
                                                          fontSize: '1rem',
                                                          fontWeight: 'bold'
                                                        }}>
                                                          {getPlayerName(player.player_id)}
                                                        </h4>
                                                        <span style={{ 
                                                          color: 'var(--dark-gray)', 
                                                          fontSize: '0.9rem' 
                                                        }}>
                                                          {rugbyPlayers.find(p => p.id === player.player_id.toString())?.team || 'N/A'}
                                                        </span>
                                                      </div>
                                                      {(() => {
                                                        console.log(`Player ${player.player_id}: is_starting=${player.is_starting}, fantasy_position=${player.fantasy_position}`);
                                                        // Handle both string and boolean values from database
                                                        const isStarting = player.is_starting === 'true' || player.is_starting === true;
                                                        return isStarting;
                                                      })() && (
                                                        <button
                                                          onClick={() => movePlayerToBench(player)}
                                                          style={{
                                                            padding: '0.4rem 1rem',
                                                            backgroundColor: '#8B0000',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '20px',
                                                            fontSize: '1rem',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            minWidth: '80px',
                                                            height: '32px'
                                                          }}
                                                          title="Move to Bench"
                                                        >
                                                          Bench
                                                        </button>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div style={{ 
                                                      color: 'var(--dark-gray)', 
                                                      fontSize: '0.9rem',
                                                      fontStyle: 'italic'
                                                    }}>
                                                      Empty
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          });
                                        }).flat()}
                                      </div>
                                    </div>

                                    {/* Bench Players */}
                                    <div>
                                      <h4 style={{ 
                                        color: 'var(--black)', 
                                        marginBottom: '1rem', 
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                      }}>
                                        Bench Players (Up to 5)
                                      </h4>
                                      <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                      }}>
                                        {Array.from({ length: 5 }, (_, index) => {
                                          const player = benchPlayers[index];
                                          return (
                                            <div 
                                              key={`bench-${index}`}
                                              style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem'
                                              }}
                                            >
                                              {/* Position label outside the box */}
                                              <div style={{ 
                                                minWidth: '120px',
                                                textAlign: 'left'
                                              }}>
                                                <span style={{ 
                                                  color: 'var(--primary-orange)', 
                                                  fontSize: '0.9rem',
                                                  fontWeight: 'bold'
                                                }}>
                                                  Bench {index + 1}
                                                </span>
                                              </div>
                                              
                                              {/* Player box */}
                                              <div style={{ 
                                                flex: 1,
                                                padding: '0.75rem 1rem',
                                                backgroundColor: player ? 'var(--light-gray)' : 'white',
                                                borderRadius: '6px',
                                                border: player ? '1px solid #666666' : '1px dashed var(--light-gray)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                minHeight: '50px'
                                              }}>
                                                {player ? (
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                                                    <div style={{ flex: 1 }}>
                                                      <h4 style={{ 
                                                        margin: '0', 
                                                        color: 'var(--black)', 
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold'
                                                      }}>
                                                        {getPlayerName(player.player_id)}
                                                      </h4>
                                                      <span style={{ 
                                                        color: 'var(--dark-gray)', 
                                                        fontSize: '0.9rem' 
                                                      }}>
                                                        {rugbyPlayers.find(p => p.id === player.player_id.toString())?.team || 'N/A'}
                                                      </span>
                                                    </div>
                                                    {(() => {
                                                      // Get the rugby player data to determine valid positions
                                                      const rugbyPlayer = rugbyPlayers.find(p => p.id === player.player_id.toString());
                                                      if (!rugbyPlayer) return null;
                                                      
                                                      // Map actual positions to fantasy positions
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
                                                      
                                                      const validFantasyPosition = positionMapping[rugbyPlayer.position];
                                                      
                                                      return (
                                                        <button
                                                          onClick={() => movePlayerToStarting(player, validFantasyPosition)}
                                                          style={{
                                                            padding: '0.4rem 1rem',
                                                            backgroundColor: '#2d5a2d',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '20px',
                                                            fontSize: '1rem',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            minWidth: '80px',
                                                            height: '32px'
                                                          }}
                                                        >
                                                          Start
                                                        </button>
                                                      );
                                                    })()}
                                                  </div>
                                                ) : (
                                                  <div style={{ 
                                                    color: 'var(--dark-gray)', 
                                                    fontSize: '0.9rem',
                                                    fontStyle: 'italic'
                                                  }}>
                                                    Empty
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
      )}

      {/* Custom Swap Confirmation Modal */}
      {showSwapModal && swapData && (
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
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '2px solid var(--primary-orange)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: 'var(--black)', 
                margin: '0 0 1rem 0',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                🔄 Swap Players?
              </h3>
              <p style={{ 
                color: 'var(--dark-gray)', 
                fontSize: '1.1rem',
                margin: '0 0 1rem 0',
                lineHeight: '1.5'
              }}>
                You're about to make a player swap:
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--light-gray)', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--primary-orange)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  color: 'var(--primary-orange)', 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  ➡️ Move to Starting {swapData.targetPosition}:
                </div>
                <div style={{ 
                  color: 'var(--black)', 
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  {swapData.newPlayerName}
                </div>
              </div>
              
              <div>
                <div style={{ 
                  color: 'var(--primary-orange)', 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  ⬅️ Choose which player to move to bench:
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {swapData.currentPlayers.map((currentPlayer, index) => (
                    <button
                      key={currentPlayer.id}
                      onClick={() => setSwapData(prev => ({ ...prev, selectedCurrentPlayer: currentPlayer }))}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: swapData.selectedCurrentPlayer?.id === currentPlayer.id ? 'var(--primary-orange)' : 'white',
                        color: swapData.selectedCurrentPlayer?.id === currentPlayer.id ? 'white' : 'var(--black)',
                        border: '2px solid var(--primary-orange)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{getPlayerName(currentPlayer.player_id)}</span>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          opacity: 0.8,
                          fontStyle: 'italic'
                        }}>
                          {rugbyPlayers.find(p => p.id === currentPlayer.player_id.toString())?.team || 'N/A'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={cancelSwap}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--light-gray)',
                  color: 'var(--black)',
                  border: '2px solid var(--dark-gray)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--dark-gray)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                  e.currentTarget.style.color = 'var(--black)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSwap}
                disabled={!swapData.selectedCurrentPlayer}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: swapData.selectedCurrentPlayer ? 'var(--primary-orange)' : 'var(--light-gray)',
                  color: swapData.selectedCurrentPlayer ? 'white' : 'var(--dark-gray)',
                  border: `2px solid ${swapData.selectedCurrentPlayer ? 'var(--primary-orange)' : 'var(--light-gray)'}`,
                  borderRadius: '6px',
                  cursor: swapData.selectedCurrentPlayer ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  opacity: swapData.selectedCurrentPlayer ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (swapData.selectedCurrentPlayer) {
                    e.currentTarget.style.backgroundColor = 'var(--dark-orange)';
                    e.currentTarget.style.borderColor = 'var(--dark-orange)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (swapData.selectedCurrentPlayer) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                    e.currentTarget.style.borderColor = 'var(--primary-orange)';
                  }
                }}
              >
                {swapData.selectedCurrentPlayer ? '✅ Confirm Swap' : '⚠️ Select a player first'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueDashboard;