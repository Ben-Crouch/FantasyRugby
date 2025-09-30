import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';
import NavigationBar from '../components/NavigationBar';
import LeagueTable from '../components/LeagueTable';
import MyTeam from '../components/MyTeam';
import SwapModal from '../components/SwapModal';

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
            
            const hasPlayers = teamWithPlayers.some(hasPlayers => hasPlayers);
            console.log('DEBUG: Draft completion check - hasPlayers:', hasPlayers);
            setDraftComplete(hasPlayers);
            
            // Auto-select user's team if available
            if (user && user.id) {
              const userTeam = teamsData.find(team => team.team_owner === user.id);
              if (userTeam) {
                setSelectedTeam(userTeam);
                loadTeamPlayers(userTeam.id);
              } else {
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
        
        // Load rugby players for name mapping
        const allRugbyPlayers = await rugbyPlayersAPI.getPlayers();
        setRugbyPlayers(allRugbyPlayers);
        
      } catch (err) {
        console.error('Failed to load league dashboard data:', err);
        setError('Failed to load league data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [location.state, user]);

  const loadTeamPlayers = async (teamId) => {
    setLoadingPlayers(true);
    try {
      const players = await teamsAPI.getTeamPlayers(teamId);
      setTeamPlayers(players || []);
      setLocalTeamPlayers(players || []);
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
      // Update the bench player to starting position
      await movePlayerToStarting(swapData.player, swapData.targetPosition);
      
      // Update the starting player to bench
      await movePlayerToBench(swapData.selectedCurrentPlayer);
      
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

      <SwapModal
        showSwapModal={showSwapModal}
        swapData={swapData}
        onConfirmSwap={confirmSwap}
        onCancelSwap={cancelSwap}
      />
    </div>
  );
};

export default LeagueDashboard;
