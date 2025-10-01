import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';

const Draft = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('pick'); // 'pick' or 'team'
  
  // Draft state
  const [draftStarted, setDraftStarted] = useState(false);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [draftOrder, setDraftOrder] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({}); // teamId -> array of players
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [draftComplete, setDraftComplete] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug logging
  console.log('Draft component - User:', user);
  console.log('Draft component - Auth Loading:', authLoading);
  console.log('Draft component - Location state:', location.state);

  useEffect(() => {
    const loadData = async () => {
      // Wait for authentication to complete
      if (authLoading) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const leagueId = location.state?.leagueId;
        
        if (!leagueId) {
          setError('No league ID provided');
          return;
        }
        
        // Fetch league data
        const leagues = await leaguesAPI.getLeagues();
        const league = leagues.find(l => l.id === leagueId);
        
        if (league) {
          setLeagueData(league);
        } else {
          setError('League not found');
          return;
        }
        
        // Fetch teams in the league
        const allTeams = await teamsAPI.getTeams();
        const teamsData = allTeams.filter(team => team.league_id === leagueId);
        setTeams(teamsData || []);
        
        // Fetch rugby players
        const playersData = await rugbyPlayersAPI.getPlayers();
        setPlayers(playersData || []);
        setFilteredPlayers(playersData || []);
        
        // Check if current user is the admin of this league
        if (league && user && user.id) {
          try {
            const adminCheck = await leaguesAPI.isUserLeagueAdmin(leagueId, user.id);
            const isAdmin = adminCheck.is_admin || false;
            setIsAdmin(isAdmin);
            
            if (!isAdmin) {
              setError('You must be the league admin to start a draft');
              return;
            }
          } catch (error) {
            console.warn('Could not check admin status:', error);
            setIsAdmin(false);
            setError('You must be the league admin to start a draft');
            return;
          }
        } else if (!user || !user.id) {
          console.warn('User not authenticated or user ID missing');
          console.warn('User object:', user);
          console.warn('User ID:', user?.id);
          setIsAdmin(false);
          setError('You must be logged in to access the draft');
          return;
        }
        
      } catch (err) {
        console.error('Error loading draft data:', err);
        setError('Failed to load draft data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state, user, authLoading]);

  // Select player function
  const selectPlayer = (player, isAutoPick = false) => {
    if (!draftStarted || !currentTeam || draftComplete) {
      console.log('Select player blocked:', { draftStarted, currentTeam: !!currentTeam, draftComplete });
      return;
    }
    
    // Check if it's the current user's turn (skip this check for auto-picks)
    if (!isAutoPick) {
      const userTeam = teams.find(team => team.team_owner_user_id === user?.id);
      if (!userTeam || currentTeam.id !== userTeam.id) {
        alert('It\'s not your turn to pick!');
        return;
      }
    }
    
    // Add player to team
    const newSelectedPlayers = { ...selectedPlayers };
    if (!newSelectedPlayers[currentTeam.id]) {
      newSelectedPlayers[currentTeam.id] = [];
    }
    newSelectedPlayers[currentTeam.id].push(player);
    setSelectedPlayers(newSelectedPlayers);
    
    // Remove player from available list
    const newAvailablePlayers = availablePlayers.filter(p => p.id !== player.id);
    setAvailablePlayers(newAvailablePlayers);
    
    // Update filtered players to remove the selected player
    const newFilteredPlayers = filteredPlayers.filter(p => p.id !== player.id);
    setFilteredPlayers(newFilteredPlayers);
    
    // Move to next pick
    nextPick();
  };

  // Auto-pick function wrapped in useCallback
  const autoPick = useCallback(() => {
    console.log('Auto-pick triggered', { currentTeam, draftComplete, availablePlayers: availablePlayers.length });
    if (!currentTeam || draftComplete) {
      console.log('Auto-pick blocked: no current team or draft complete');
      return;
    }
    
    const teamPlayers = selectedPlayers[currentTeam.id] || [];
    const neededPositions = getNeededPositions(teamPlayers);
    console.log('Team players:', teamPlayers.length, 'Needed positions:', neededPositions);
    
    // Find best available player for needed positions
    let bestPlayer = null;
    for (const position of neededPositions) {
      const positionPlayers = availablePlayers.filter(p => p.fantasy_position === position);
      if (positionPlayers.length > 0) {
        bestPlayer = positionPlayers[0]; // For now, just take first available
        console.log('Found position-specific player:', bestPlayer.name, 'for position:', position);
        break;
      }
    }
    
    // If no position-specific player found, take any available player
    if (!bestPlayer && availablePlayers.length > 0) {
      bestPlayer = availablePlayers[0];
      console.log('Using fallback player:', bestPlayer.name);
    }
    
    if (bestPlayer) {
      console.log('Auto-picking player:', bestPlayer.name);
      selectPlayer(bestPlayer, true);
    } else {
      console.log('No players available for auto-pick');
    }
  }, [currentTeam, draftComplete, availablePlayers, selectedPlayers, selectPlayer]);

  // Timer effect for draft
  useEffect(() => {
    let timer;
    if (draftStarted && !draftComplete && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (draftStarted && !draftComplete && timeRemaining === 0) {
      // Time's up - auto pick
      console.log('Timer reached 0, triggering auto-pick');
      autoPick();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [draftStarted, draftComplete, timeRemaining, autoPick]);

  // Update filtered players when available players change
  useEffect(() => {
    if (draftStarted) {
      applyFilters(selectedPosition, searchName);
    }
  }, [availablePlayers, draftStarted]);

  // Monitor draft completion - check if all teams have 15 players
  useEffect(() => {
    if (draftStarted && !draftComplete && teams.length > 0) {
      const teamStatus = teams.map(team => {
        const teamPlayers = selectedPlayers[team.id] || [];
        return {
          teamName: team.team_name,
          playerCount: teamPlayers.length,
          isComplete: teamPlayers.length >= 15
        };
      });
      
      console.log('Team completion status:', teamStatus);
      
      const allTeamsComplete = teams.every(team => {
        const teamPlayers = selectedPlayers[team.id] || [];
        return teamPlayers.length >= 15;
      });
      
      if (allTeamsComplete) {
        console.log('Draft complete! All teams have 15 players');
        setDraftComplete(true);
      }
    }
  }, [draftStarted, draftComplete, teams, selectedPlayers]);

  // Filter players by position and name
  const handlePositionFilter = (position) => {
    setSelectedPosition(position);
    applyFilters(position, searchName);
  };

  const handleNameSearch = (name) => {
    setSearchName(name);
    applyFilters(selectedPosition, name);
  };

  const handleCompleteDraft = async () => {
    try {
      setLoading(true);
      
      // Debug logging
      console.log('DEBUG: selectedPlayers:', selectedPlayers);
      console.log('DEBUG: teams:', teams);
      
      // Prepare team rosters for saving with proper starting/bench assignments
      const teamRosters = teams.map(team => {
        const userSelectedPlayers = selectedPlayers[team.id] || [];
        
        // Define required positions for starting XV
        const requiredPositions = {
          'Prop': 2,
          'Hooker': 1,
          'Lock': 2,
          'Back Row': 3,
          'Scrum-half': 1,
          'Fly-half': 1,
          'Centre': 1,
          'Back Three': 2
        };
        
        // Separate players into starting XV and bench
        const startingPlayers = [];
        const benchPlayers = [];
        
        // Assign players to starting XV first, then bench
        // First, assign players to starting positions based on requirements
        userSelectedPlayers.forEach(player => {
          const position = player.fantasy_position;
          const required = requiredPositions[position] || 0;
          const currentCount = startingPlayers.filter(p => p.fantasy_position === position).length;
          
          console.log(`DEBUG: Player ${player.name} (${position}) - required: ${required}, current: ${currentCount}`);
          
          if (currentCount < required) {
            console.log(`DEBUG: Adding ${player.name} to starting XV`);
            startingPlayers.push({ ...player, is_starting: true });
          } else {
            console.log(`DEBUG: Adding ${player.name} to bench`);
            benchPlayers.push({ ...player, is_starting: false, fantasy_position: 'Bench' });
          }
        });
        
        // If we don't have enough bench players, move some starting players to bench
        // to ensure we have exactly 5 bench players
        const totalRequiredStarting = Object.values(requiredPositions).reduce((a, b) => a + b, 0);
        const maxStartingPlayers = Math.min(totalRequiredStarting, userSelectedPlayers.length - 5);
        
        if (startingPlayers.length > maxStartingPlayers) {
          console.log(`DEBUG: Moving excess starting players to bench. Starting: ${startingPlayers.length}, Max: ${maxStartingPlayers}`);
          const excessPlayers = startingPlayers.splice(maxStartingPlayers);
          excessPlayers.forEach(player => {
            console.log(`DEBUG: Moving ${player.name} from starting to bench`);
            benchPlayers.push({ ...player, is_starting: false, fantasy_position: 'Bench' });
          });
        }
        
        console.log(`DEBUG: Team ${team.id} - Starting: ${startingPlayers.length}, Bench: ${benchPlayers.length}`);
        console.log(`DEBUG: Starting players by position:`, startingPlayers.reduce((acc, p) => {
          acc[p.fantasy_position] = (acc[p.fantasy_position] || 0) + 1;
          return acc;
        }, {}));
        console.log(`DEBUG: Total players: ${userSelectedPlayers.length}, Required: ${Object.values(requiredPositions).reduce((a, b) => a + b, 0)}`);
        
        // Combine all players with proper fields
        const allPlayers = [...startingPlayers, ...benchPlayers];
        
        return {
          team_id: team.id,
          user_id: team.team_owner_user_id,
          players: allPlayers
        };
      });
      
      console.log('DEBUG: teamRosters being sent:', teamRosters);
      
      // Call the complete draft API using the service
      const result = await leaguesAPI.completeDraft(leagueData.id, teamRosters);
      console.log('Draft completed successfully:', result);
      
      // Navigate back to league dashboard
      navigate('/league-dashboard', { 
        state: { 
          leagueId: leagueData.id,
          draftCompleted: true
        } 
      });
    } catch (err) {
      console.error('Error completing draft:', err);
      setError('Failed to complete draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (position, name) => {
    let filtered = draftStarted ? availablePlayers : players;

    // Filter by position
    if (position !== 'All') {
      filtered = filtered.filter(player => player.fantasy_position === position);
    }

    // Filter by name
    if (name.trim() !== '') {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    setFilteredPlayers(filtered);
  };

  // Get unique positions for filter dropdown
  const getUniquePositions = () => {
    const positions = [...new Set(players.map(player => player.fantasy_position))];
    return ['All', ...positions.sort()];
  };

  // Draft logic functions
  const startDraft = () => {
    if (!teams.length) return;
    
    // Create draft order (snake draft)
    const order = [];
    for (let round = 1; round <= 15; round++) {
      if (round % 2 === 1) {
        // Odd rounds: 1, 2, 3, 4, 5, 6, 7, 8
        for (let i = 0; i < teams.length; i++) {
          order.push({ round, pick: i + 1, team: teams[i] });
        }
      } else {
        // Even rounds: 8, 7, 6, 5, 4, 3, 2, 1
        for (let i = teams.length - 1; i >= 0; i--) {
          order.push({ round, pick: i + 1, team: teams[i] });
        }
      }
    }
    
    setDraftOrder(order);
    setCurrentTeam(order[0].team);
    setDraftStarted(true);
    setAvailablePlayers(players);
    setFilteredPlayers(players);
    setSelectedPlayers({});
    setTimeRemaining(90);
  };


  const nextPick = () => {
    // Check if draft is complete (all teams have 15 players) BEFORE moving to next pick
    const allTeamsComplete = teams.every(team => {
      const teamPlayers = selectedPlayers[team.id] || [];
      return teamPlayers.length >= 15;
    });
    
    if (allTeamsComplete) {
      console.log('Draft complete! All teams have 15 players');
      setDraftComplete(true);
      return; // Exit early if draft is complete
    }
    
    const nextPickIndex = currentPick;
    
    // Check if we're trying to go beyond the draft order
    if (nextPickIndex >= draftOrder.length) {
      console.log('Draft order exhausted, marking as complete');
      setDraftComplete(true);
      return;
    }
    
    setCurrentPick(currentPick + 1);
    setCurrentTeam(draftOrder[nextPickIndex].team);
    setTimeRemaining(90);
    console.log('Moving to next pick:', currentPick + 1, 'Team:', draftOrder[nextPickIndex].team.team_name);
  };


  const skipTurn = () => {
    if (!isAdmin) {
      alert('Only admins can skip turns');
      return;
    }
    
    if (!currentTeam || draftComplete) return;
    
    // Auto pick for the current team
    autoPick();
  };

  const getNeededPositions = (teamPlayers) => {
    const positionCounts = {
      'Prop': 0,
      'Hooker': 0,
      'Lock': 0,
      'Back Row': 0,
      'Scrum-half': 0,
      'Fly-half': 0,
      'Centre': 0,
      'Back Three': 0
    };
    
    teamPlayers.forEach(player => {
      positionCounts[player.fantasy_position]++;
    });
    
    const needed = [];
    if (positionCounts['Prop'] < 1) needed.push('Prop');
    if (positionCounts['Hooker'] < 1) needed.push('Hooker');
    if (positionCounts['Lock'] < 1) needed.push('Lock');
    if (positionCounts['Back Row'] < 2) needed.push('Back Row');
    if (positionCounts['Scrum-half'] < 1) needed.push('Scrum-half');
    if (positionCounts['Fly-half'] < 1) needed.push('Fly-half');
    if (positionCounts['Centre'] < 1) needed.push('Centre');
    if (positionCounts['Back Three'] < 2) needed.push('Back Three');
    
    return needed;
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--black)' }}>
          Authenticating...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--black)' }}>
          Loading draft setup...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
            Access Denied
          </h3>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            {error}
          </p>
          <button 
            onClick={() => navigate('/league-dashboard', { state: { leagueId: location.state?.leagueId } })}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Back to League Dashboard
          </button>
        </div>
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
              onClick={() => navigate('/league-dashboard', { state: { leagueId: leagueData?.id } })}
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
              ← Back to League
            </button>
          </div>
          <div style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
            Draft for {leagueData?.name}
          </div>
        </div>
      </div>

      {/* Draft Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: 'var(--black)', fontSize: '2.5rem' }}>
            🏉 Player Draft
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: 'var(--dark-gray)',
            fontSize: '1.2rem'
          }}>
            {leagueData?.name} - {teams.length} teams participating
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid var(--light-gray)',
          marginBottom: '0'
        }}>
          <button
            onClick={() => setActiveTab('pick')}
            style={{
              flex: 1,
              padding: '1rem 2rem',
              backgroundColor: activeTab === 'pick' ? 'var(--primary-orange)' : 'transparent',
              color: activeTab === 'pick' ? 'white' : 'var(--dark-gray)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === 'pick' ? '3px solid var(--dark-orange)' : '3px solid transparent'
            }}
          >
            🎯 Pick Players
          </button>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              flex: 1,
              padding: '1rem 2rem',
              backgroundColor: activeTab === 'team' ? 'var(--primary-orange)' : 'transparent',
              color: activeTab === 'team' ? 'white' : 'var(--dark-gray)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === 'team' ? '3px solid var(--dark-orange)' : '3px solid transparent'
            }}
          >
            👥 My Team
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pick' && (
        <>
          {/* Draft Status */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">Draft Status</h3>
            </div>
            <div className="card-body">
              {!draftStarted ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏉</div>
                  <h3 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
                    Ready to Start Draft
                  </h3>
                  <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
                    {teams.length} teams will draft {teams.length * 15} players total
                  </p>
                  {isAdmin && (
                    <button 
                      onClick={startDraft}
                      style={{
                        padding: '1rem 2rem',
                        backgroundColor: 'var(--primary-orange)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--dark-orange)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🚀 Start Draft
                    </button>
                  )}
                </div>
              ) : draftComplete ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                  <h3 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
                    Draft Complete!
                  </h3>
                  <p style={{ color: 'var(--dark-gray)' }}>
                    All teams have completed their rosters
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem' 
                }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                      {currentPick}
                    </div>
                    <div style={{ color: 'var(--dark-gray)' }}>Current Pick</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--black)' }}>
                      {Object.values(selectedPlayers).flat().length}
                    </div>
                    <div style={{ color: 'var(--dark-gray)' }}>Players Drafted</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--black)' }}>
                      {teams.length * 15}
                    </div>
                    <div style={{ color: 'var(--dark-gray)' }}>Total Picks</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: timeRemaining <= 10 ? 'var(--primary-orange)' : 'var(--light-gray)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: timeRemaining <= 10 ? 'white' : 'var(--black)' }}>
                      {timeRemaining}s
                    </div>
                    <div style={{ color: timeRemaining <= 10 ? 'white' : 'var(--dark-gray)' }}>Time Remaining</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Team Turn */}
          {draftStarted && !draftComplete && currentTeam && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h3 className="card-title">Current Turn</h3>
              </div>
              <div className="card-body">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--primary-orange)',
                  borderRadius: '8px',
                  color: 'white'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                      {currentTeam.team_name}
                    </h4>
                    <p style={{ margin: '0', opacity: 0.9 }}>
                      Pick #{currentPick} of {teams.length * 15}
                    </p>
                    {(() => {
                      const userTeam = teams.find(team => team.team_owner_user_id === user?.id);
                      const isUserTurn = userTeam && currentTeam && currentTeam.id === userTeam.id;
                      return (
                        <p style={{ 
                          margin: '0.5rem 0 0 0', 
                          opacity: 0.9, 
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          {isUserTurn ? '🎯 Your Turn!' : '⏳ Waiting...'}
                        </p>
                      );
                    })()}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {timeRemaining}s
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1rem' }}>
                      Time Remaining
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={skipTurn}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--black)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--dark-gray)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--black)';
                        }}
                      >
                        ⏭️ Skip Turn (Auto Pick)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Player Selection - Only show when draft has started */}
          {draftStarted && !draftComplete && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Available Players ({filteredPlayers.length})</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--dark-gray)' }}>
                        Search:
                      </label>
                      <input
                        type="text"
                        placeholder="Player name..."
                        value={searchName}
                        onChange={(e) => handleNameSearch(e.target.value)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid var(--light-gray)',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          fontSize: '0.9rem',
                          minWidth: '200px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--dark-gray)' }}>
                        Position:
                      </label>
                      <select
                        value={selectedPosition}
                        onChange={(e) => handlePositionFilter(e.target.value)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid var(--light-gray)',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          minWidth: '150px'
                        }}
                      >
                        {getUniquePositions().map(position => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            <div className="card-body">
              {draftStarted && !draftComplete ? (
                <div style={{ 
                  maxHeight: '500px',
                  overflowY: 'auto',
                  border: '1px solid var(--light-gray)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '0',
                    backgroundColor: 'var(--primary-orange)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Player</div>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Team</div>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>Fantasy Position</div>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>Actions</div>
                  </div>
                  {filteredPlayers.map((player, index) => (
                    <div 
                      key={player.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '0',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid var(--light-gray)',
                        backgroundColor: index % 2 === 0 ? 'white' : 'var(--light-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : 'var(--light-gray)';
                        e.currentTarget.style.color = 'var(--black)';
                      }}
                    >
                      <div style={{ 
                        padding: '0 1rem',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {player.name}
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        color: 'var(--dark-gray)',
                        fontSize: '0.9rem'
                      }}>
                        {player.team}
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--primary-orange)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {player.fantasy_position}
                        </span>
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        textAlign: 'center'
                      }}>
                        {(() => {
                          const userTeam = teams.find(team => team.team_owner_user_id === user?.id);
                          const isUserTurn = userTeam && currentTeam && currentTeam.id === userTeam.id;
                          const canSelect = draftStarted && isUserTurn;
                          
                          return (
                            <button 
                              onClick={() => selectPlayer(player)}
                              disabled={!canSelect}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: canSelect ? 'var(--black)' : 'var(--light-gray)',
                                color: canSelect ? 'white' : 'var(--dark-gray)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: canSelect ? 'pointer' : 'not-allowed',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                opacity: canSelect ? 1 : 0.6
                              }}
                              onMouseEnter={(e) => {
                                if (canSelect) {
                                  e.currentTarget.style.backgroundColor = 'var(--dark-gray)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (canSelect) {
                                  e.currentTarget.style.backgroundColor = 'var(--black)';
                                }
                              }}
                            >
                              {!draftStarted ? 'Draft Not Started' : !isUserTurn ? 'Not Your Turn' : 'Select'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPlayers.length > 0 ? (
                <div style={{ 
                  maxHeight: '500px',
                  overflowY: 'auto',
                  border: '1px solid var(--light-gray)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '0',
                    backgroundColor: 'var(--primary-orange)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Player</div>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Team</div>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>Fantasy Position</div>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>Actions</div>
                  </div>
                  {filteredPlayers.map((player, index) => (
                    <div 
                      key={player.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '0',
                        padding: '0.75rem 0',
                        borderBottom: '1px solid var(--light-gray)',
                        backgroundColor: index % 2 === 0 ? 'white' : 'var(--light-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : 'var(--light-gray)';
                        e.currentTarget.style.color = 'var(--black)';
                      }}
                    >
                      <div style={{ 
                        padding: '0 1rem',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {player.name}
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        color: 'var(--dark-gray)',
                        fontSize: '0.9rem'
                      }}>
                        {player.team}
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--primary-orange)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {player.fantasy_position}
                        </span>
                      </div>
                      <div style={{ 
                        padding: '0 1rem',
                        textAlign: 'center'
                      }}>
                        <button 
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--black)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--dark-gray)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--black)';
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dark-gray)' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏉</div>
                  <h3 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
                    Loading Players...
                  </h3>
                  <p>Fetching the latest player database...</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Participating Teams */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Participating Teams ({teams.length})</h3>
            </div>
            <div className="card-body">
              {teams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dark-gray)' }}>
                  <p>No teams have joined this league yet.</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {teams.map((team, index) => (
                    <div 
                      key={team.id}
                      style={{ 
                        padding: '1rem',
                        backgroundColor: 'var(--light-gray)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        color: 'var(--black)',
                        marginBottom: '0.5rem'
                      }}>
                        {team.team_name}
                      </div>
                      <div style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
                        Draft Position: {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'team' && (
        <>
          {/* My Team Overview */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">My Team Overview</h3>
            </div>
            <div className="card-body">
              {(() => {
                // Find the current user's team
                const userTeam = teams.find(team => team.team_owner_user_id === user?.id);
                const userSelectedPlayers = userTeam ? selectedPlayers[userTeam.id] || [] : [];
                const completionPercentage = Math.round((userSelectedPlayers.length / 15) * 100);
                
                return (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                        {userSelectedPlayers.length}
                      </div>
                      <div style={{ color: 'var(--dark-gray)' }}>Players Selected</div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--black)' }}>
                        10
                      </div>
                      <div style={{ color: 'var(--dark-gray)' }}>Required Positions</div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--black)' }}>
                        {Math.max(0, 15 - userSelectedPlayers.length)}
                      </div>
                      <div style={{ color: 'var(--dark-gray)' }}>Remaining Picks</div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--black)' }}>
                        {completionPercentage}%
                      </div>
                      <div style={{ color: 'var(--dark-gray)' }}>Team Complete</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* My Team Players */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">My Selected Players</h3>
            </div>
            <div className="card-body">
              {(() => {
                // Find the current user's team
                const userTeam = teams.find(team => team.team_owner_user_id === user?.id);
                const userSelectedPlayers = userTeam ? selectedPlayers[userTeam.id] || [] : [];
                
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
                
                // Assign players to starting XV first, then bench
                userSelectedPlayers.forEach(player => {
                  const position = player.fantasy_position;
                  const required = requiredPositions[position] || 0;
                  const currentCount = startingPlayers.filter(p => p.fantasy_position === position).length;
                  
                  if (currentCount < required) {
                    startingPlayers.push(player);
                  } else {
                    benchPlayers.push(player);
                  }
                });
                
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
                          const positionPlayers = startingPlayers.filter(p => p.fantasy_position === position);
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
                                  border: player ? '1px solid var(--primary-orange)' : '1px dashed var(--light-gray)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  minHeight: '50px'
                                }}>
                                  {player ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <h4 style={{ 
                                        margin: '0', 
                                        color: 'var(--black)', 
                                        fontSize: '1rem',
                                        fontWeight: 'bold'
                                      }}>
                                        {player.name}
                                      </h4>
                                      <span style={{ 
                                        color: 'var(--dark-gray)', 
                                        fontSize: '0.9rem' 
                                      }}>
                                        {player.team}
                                      </span>
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
                                padding: '0.75rem 1rem',
                                backgroundColor: player ? 'var(--light-gray)' : 'white',
                                borderRadius: '6px',
                                border: player ? '1px solid var(--primary-orange)' : '1px dashed var(--light-gray)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                minHeight: '50px'
                              }}
                            >
                              {player ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <h4 style={{ 
                                    margin: '0', 
                                    color: 'var(--black)', 
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {player.name}
                                  </h4>
                                  <span style={{ 
                                    color: 'var(--dark-gray)', 
                                    fontSize: '0.9rem' 
                                  }}>
                                    {player.team}
                                  </span>
                                  <span style={{ 
                                    color: 'var(--primary-orange)', 
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {player.fantasy_position}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ 
                                  color: 'var(--dark-gray)', 
                                  fontSize: '0.9rem',
                                  fontStyle: 'italic'
                                }}>
                                  Bench - Empty
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </>
      )}
      
      {/* Draft Completion Modal */}
      {draftComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: 'var(--black)', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              🎉 Draft Complete!
            </h2>
            <p style={{ 
              color: 'var(--dark-gray)', 
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              All teams have been drafted. You can now view the league table and manage your team.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCompleteDraft}
                style={{
                  backgroundColor: 'var(--primary-orange)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Complete Draft & Save Teams
              </button>
              <button
                onClick={() => setDraftComplete(false)}
                style={{
                  backgroundColor: 'var(--light-gray)',
                  color: 'var(--black)',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Continue Drafting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Draft;
