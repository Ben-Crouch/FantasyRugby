import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';
import NavigationBar from '../components/NavigationBar';
import LeagueTable from '../components/LeagueTable';
import MyTeam from '../components/MyTeam';
import SwapModal from '../components/SwapModal';
import Waivers from '../components/Waivers';

const LeagueDashboard = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('league');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [rugbyPlayers, setRugbyPlayers] = useState([]);
  const [localTeamPlayers, setLocalTeamPlayers] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapData, setSwapData] = useState(null);
  const [draftComplete, setDraftComplete] = useState(false);
  const [draftStatus, setDraftStatus] = useState('NOT_STARTED');

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('DEBUG: location.state:', location.state);
        console.log('DEBUG: location.pathname:', location.pathname);
        console.log('DEBUG: location.search:', location.search);
        
        let leagueId = location.state?.leagueId;
        console.log('DEBUG: leagueId from location.state:', leagueId);
        
        // Also try to get league ID from URL params if available
        if (!leagueId) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlLeagueId = urlParams.get('leagueId');
          if (urlLeagueId) {
            leagueId = parseInt(urlLeagueId);
            console.log('Using league ID from URL params:', leagueId);
          }
        }
        
        // If still no league ID, try to get it from localStorage as a fallback
        if (!leagueId) {
          const storedLeagueId = localStorage.getItem('lastSelectedLeagueId');
          if (storedLeagueId) {
            leagueId = parseInt(storedLeagueId);
            console.log('Using league ID from localStorage:', leagueId);
          }
        }
        
        if (!leagueId) {
          console.log('No league ID provided, using fallback');
          setLoading(true); // Show loading while finding fallback league
          const allLeagues = await leaguesAPI.getLeagues();
          if (allLeagues && allLeagues.length > 0) {
            // Try to find a league where the user is actually a member
            const userLeagues = allLeagues.filter(league => 
              league.teams && league.teams.some(team => 
                team.team_owner === user?.id || team.team_owner_user_id === user?.id
              )
            );
            
            if (userLeagues.length > 0) {
              leagueId = userLeagues[0].id;
              console.log('Using fallback league ID where user is a member:', leagueId);
            } else {
              // Fallback to any league with teams
              const leaguesWithTeams = allLeagues.filter(league => league.teams && league.teams.length > 0);
              if (leaguesWithTeams.length > 0) {
                leagueId = leaguesWithTeams[0].id;
                console.log('Using fallback league ID with teams:', leagueId);
              } else {
                leagueId = allLeagues[0].id;
                console.log('Using fallback league ID (first available):', leagueId);
              }
            }
          } else {
            console.log('No leagues available, redirecting to league selection');
            navigate('/league-selection');
            return;
          }
        }
        
        // Store the league ID in localStorage for future use
        if (leagueId) {
          localStorage.setItem('lastSelectedLeagueId', leagueId.toString());
          console.log('Stored league ID in localStorage:', leagueId);
        }
        
        // Fetch league data
        console.log('DEBUG: Fetching leagues for leagueId:', leagueId);
        const leagues = await leaguesAPI.getLeagues();
        console.log('DEBUG: All leagues:', leagues);
        console.log('DEBUG: Leagues API response type:', typeof leagues, 'is array:', Array.isArray(leagues));
        const league = leagues.find(l => l.id === leagueId);
        console.log('DEBUG: Found league:', league);
        
        if (league) {
          setLeagueData(league);
        } else {
          console.log('DEBUG: League not found, using fallback data');
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
        console.log('DEBUG: Fetching teams for leagueId:', leagueId);
        const allTeams = await teamsAPI.getTeams();
        console.log('DEBUG: All teams:', allTeams);
        console.log('DEBUG: Teams API response type:', typeof allTeams, 'is array:', Array.isArray(allTeams));
        const teamsData = allTeams.filter(team => team.league_id === leagueId);
        console.log('DEBUG: Teams for this league:', teamsData);
        setTeams(teamsData || []);
        
        // Check if draft is complete by checking if any team has players
        if (teamsData && teamsData.length > 0) {
          try {
            const teamWithPlayers = await Promise.all(
              teamsData.map(async (team) => {
                try {
                  const response = await teamsAPI.getTeamPlayers(team.id);
                  const players = response?.players || [];
                  console.log(`DEBUG: Team ${team.id} has ${players.length} players`);
                  return players.length > 0;
                } catch (error) {
                  console.warn(`Could not fetch players for team ${team.id}:`, error);
                  return false;
                }
              })
            );
            
            const hasPlayers = teamWithPlayers.some(hasPlayers => hasPlayers);
            console.log('DEBUG: Draft completion check - teamWithPlayers:', teamWithPlayers);
            console.log('DEBUG: Draft completion check - hasPlayers:', hasPlayers);
            setDraftComplete(hasPlayers);
            console.log('DEBUG: Draft completion check - setDraftComplete to:', hasPlayers);
            
            // Auto-select user's team if available
            if (user && user.id) {
              console.log('DEBUG: Looking for user team - user.id:', user.id);
              console.log('DEBUG: Available teams:', teamsData);
              const userTeam = teamsData.find(team => team.team_owner === user.id);
              console.log('DEBUG: Found userTeam by team_owner:', userTeam);
              if (userTeam) {
                setSelectedTeam(userTeam);
                loadTeamPlayers(userTeam.id);
              } else {
                const userTeamByUserId = teamsData.find(team => team.team_owner_user_id === user.id);
                console.log('DEBUG: Found userTeam by team_owner_user_id:', userTeamByUserId);
                if (userTeamByUserId) {
                  setSelectedTeam(userTeamByUserId);
                  loadTeamPlayers(userTeamByUserId.id);
                } else {
                  console.log('DEBUG: No team found for user');
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
        
        // Load rugby players for name mapping
        const allRugbyPlayers = await rugbyPlayersAPI.getPlayers();
        setRugbyPlayers(allRugbyPlayers);
        
        // Load draft status
        try {
          const statusResult = await leaguesAPI.getDraftStatus(leagueId);
          setDraftStatus(statusResult.draft_status || 'NOT_STARTED');
          setDraftComplete(statusResult.draft_status === 'COMPLETED');
        } catch (error) {
          console.warn('Could not load draft status:', error);
          setDraftStatus('NOT_STARTED');
        }
        
      } catch (err) {
        console.error('Failed to load league dashboard data:', err);
        console.error('Error details:', err.message, err.stack);
        setError(`Failed to load league data: ${err.message}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [location.state, user]);

  const loadTeamPlayers = async (teamId) => {
    console.log('DEBUG: loadTeamPlayers called with teamId:', teamId);
    setLoadingPlayers(true);
    try {
      const response = await teamsAPI.getTeamPlayers(teamId);
      console.log('DEBUG: loadTeamPlayers - API response:', response);
      const players = response?.players || [];
      console.log('DEBUG: loadTeamPlayers - extracted players:', players);
      console.log('DEBUG: loadTeamPlayers - players type:', typeof players, 'is array:', Array.isArray(players));
      setTeamPlayers(players);
      setLocalTeamPlayers(players);
    } catch (error) {
      console.error('Failed to load team players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleStartDraft = () => {
    navigate('/draft', { 
      state: { 
        leagueId: leagueData?.id,
        teams: teams 
      } 
    });
  };

  const movePlayerToBench = async (player) => {
    try {
      const response = await fetch(`/api/league-teams/${selectedTeam.id}/players/${player.id}/`, {
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

      if (response.ok) {
        // Update local state
        setLocalTeamPlayers(prev => 
          prev.map(p => 
            p.id === player.id 
              ? { ...p, fantasy_position: 'Bench', is_starting: false }
              : p
          )
        );
      } else {
        console.error('Failed to move player to bench');
      }
    } catch (error) {
      console.error('Error moving player to bench:', error);
    }
  };

  const movePlayerToStarting = async (player, targetPosition) => {
    if (!player) return;
    
    // Get the rugby player data to check their actual position
    const rugbyPlayer = rugbyPlayers.find(p => p.id.toString() === player.player_id.toString());
    if (!rugbyPlayer) {
      console.error('Rugby player not found');
      return;
    }
    
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
    const playerFantasyPosition = rugbyPlayer.fantasy_position || positionMapping[rugbyPlayer.position];
    if (playerFantasyPosition !== targetPosition) {
      alert(`This player (${playerFantasyPosition}) cannot play as ${targetPosition}.`);
      return;
    }
    
    // Check if there are already players in that starting position
    const currentStartingPlayers = localTeamPlayers.filter(p => {
      const pFantasyPosition = p.fantasy_position || positionMapping[p.position] || p.position;
      const isStartingPlayer = (p.is_starting === 'true' || p.is_starting === true) && p.fantasy_position !== 'Bench';
      const matchesTargetPosition = pFantasyPosition === targetPosition;
      const isNotCurrentPlayer = p.id !== player.id;
      
      return matchesTargetPosition && isStartingPlayer && isNotCurrentPlayer;
    });
    
    if (currentStartingPlayers.length > 0) {
      // Show swap modal
      const getPlayerName = (playerId) => {
        const p = rugbyPlayers.find(rp => rp.id.toString() === playerId.toString());
        return p ? p.name : `Player ${playerId}`;
      };
      
      setSwapData({
        player: player,
        currentPlayers: currentStartingPlayers,
        targetPosition: targetPosition,
        newPlayerName: getPlayerName(player.player_id),
        selectedCurrentPlayer: null
      });
      setShowSwapModal(true);
      return;
    }
    
    // No current player in that position, just move the player
    try {
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
        setLocalTeamPlayers(prev => 
          prev.map(p => 
            p.id === player.id 
              ? { ...p, fantasy_position: targetPosition, is_starting: true }
              : p
          )
        );
      } else {
        console.error('Failed to move player to starting position');
      }
    } catch (error) {
      console.error('Error moving player to starting position:', error);
    }
  };

  const confirmSwap = async () => {
    if (!swapData || !swapData.selectedCurrentPlayer) return;

    try {
      // Update the bench player to starting position (bypass the check)
      const benchToStartingResponse = await fetch(`/api/league-teams/${selectedTeam.id}/players/${swapData.player.id}/`, {
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
      
      // Update the starting player to bench
      const startingToBenchResponse = await fetch(`/api/league-teams/${selectedTeam.id}/players/${swapData.selectedCurrentPlayer.id}/`, {
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

      if (benchToStartingResponse.ok && startingToBenchResponse.ok) {
        // Update local state for both players
        setLocalTeamPlayers(prev => 
          prev.map(p => {
            if (p.id === swapData.player.id) {
              return { ...p, fantasy_position: swapData.targetPosition, is_starting: true };
            }
            if (p.id === swapData.selectedCurrentPlayer.id) {
              return { ...p, fantasy_position: 'Bench', is_starting: false };
            }
            return p;
          })
        );
      } else {
        console.error('Failed to swap players');
      }
      
      setShowSwapModal(false);
      setSwapData(null);
    } catch (error) {
      console.error('Error confirming swap:', error);
    }
  };

  const cancelSwap = () => {
    setShowSwapModal(false);
    setSwapData(null);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Loading league dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !leagueData) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card">
          <div className="alert alert-error">
            <h3>Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/leagues')}
              className="btn btn-primary"
            >
              Back to Leagues
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <NavigationBar
        leagueData={leagueData}
        isAdmin={isAdmin}
        draftComplete={draftComplete}
        draftStatus={draftStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStartDraft={handleStartDraft}
      />

      {activeTab === 'league' && (
        <LeagueTable
          teams={teams}
          leagueData={leagueData}
          error={error}
          loading={loading}
          isAdmin={isAdmin}
          draftComplete={draftComplete}
          onStartDraft={handleStartDraft}
        />
      )}

      {activeTab === 'my-team' && (
        <MyTeam
          selectedTeam={selectedTeam}
          teamPlayers={teamPlayers}
          loadingPlayers={loadingPlayers}
          rugbyPlayers={rugbyPlayers}
          localTeamPlayers={localTeamPlayers}
          setLocalTeamPlayers={setLocalTeamPlayers}
          onMovePlayerToBench={movePlayerToBench}
          onMovePlayerToStarting={movePlayerToStarting}
          onShowSwapModal={setShowSwapModal}
          setSwapData={setSwapData}
        />
      )}

      {activeTab === 'waivers' && (
        <Waivers
          selectedTeam={selectedTeam}
          rugbyPlayers={rugbyPlayers}
          teamPlayers={localTeamPlayers.length > 0 ? localTeamPlayers : teamPlayers}
          user={user}
        />
      )}

      <SwapModal
        showSwapModal={showSwapModal}
        swapData={swapData}
        setSwapData={setSwapData}
        onConfirmSwap={confirmSwap}
        onCancelSwap={cancelSwap}
        rugbyPlayers={rugbyPlayers}
      />
    </div>
  );
};

export default LeagueDashboard;
