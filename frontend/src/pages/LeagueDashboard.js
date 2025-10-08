import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI, tournamentsAPI } from '../services/api';
import NavigationBar from '../components/NavigationBar';
import LeagueTable from '../components/LeagueTable';
import MyTeam from '../components/MyTeam';
import SwapModal from '../components/SwapModal';
import Waivers from '../components/Waivers';
import Trade from '../components/Trade';
import Chat from '../components/Chat';
import Fixtures from '../components/Fixtures';
import Matchup from '../components/Matchup';

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalData, setInfoModalData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [inviteData, setInviteData] = useState({
    invitee_email: '',
    invitee_name: '',
    inviter_name: '',
    inviter_email: ''
  });
  const [inviteErrors, setInviteErrors] = useState({});
  const [isInviting, setIsInviting] = useState(false);
  const [draftComplete, setDraftComplete] = useState(false);
  const [draftStatus, setDraftStatus] = useState('NOT_STARTED');
  const [loadingRugbyPlayers, setLoadingRugbyPlayers] = useState(false);
  const [tournamentData, setTournamentData] = useState(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const hasLoadedData = useRef(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Load tournament data
  const loadTournamentData = async () => {
    if (!leagueData?.tournament_id || tournamentData) return;
    
    try {
      const tournaments = await tournamentsAPI.getTournaments();
      const tournament = tournaments.find(t => t.id && t.id.toString() === leagueData.tournament_id.toString());
      setTournamentData(tournament);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  // Lazy load rugby players when needed
  const loadRugbyPlayers = async () => {
    if (rugbyPlayers.length > 0 || loadingRugbyPlayers) return;
    
    setLoadingRugbyPlayers(true);
    try {
      const tournamentId = leagueData?.tournament_id;
      const allRugbyPlayers = await rugbyPlayersAPI.getPlayers(tournamentId);
      setRugbyPlayers(allRugbyPlayers);
    } catch (error) {
      console.error('Error loading rugby players:', error);
    } finally {
      setLoadingRugbyPlayers(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Prevent duplicate loading
      if (hasLoadedData.current) return;
      hasLoadedData.current = true;
      
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
        
        // Fetch league data first (single API call)
        console.log('DEBUG: Fetching leagues');
        const leagues = await leaguesAPI.getLeagues();
        console.log('DEBUG: All leagues:', leagues);
        console.log('DEBUG: Leagues API response type:', typeof leagues, 'is array:', Array.isArray(leagues));
        
        if (!leagueId) {
          console.log('No league ID provided, using fallback');
          setLoading(true); // Show loading while finding fallback league
          if (leagues && leagues.length > 0) {
            // Try to find a league where the user is actually a member
            const userLeagues = leagues.filter(league => 
              league.teams && league.teams.some(team => 
                team.team_owner === user?.id || team.team_owner_user_id === user?.id
              )
            );
            
            if (userLeagues.length > 0) {
              leagueId = userLeagues[0].id;
              console.log('Using fallback league ID where user is a member:', leagueId);
            } else {
              // Fallback to any league with teams
              const leaguesWithTeams = leagues.filter(league => league.teams && league.teams.length > 0);
              if (leaguesWithTeams.length > 0) {
                leagueId = leaguesWithTeams[0].id;
                console.log('Using fallback league ID with teams:', leagueId);
              } else {
                leagueId = leagues[0].id;
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
        
        // Find the specific league
        console.log('DEBUG: Finding league for leagueId:', leagueId);
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
        
        // Fetch teams in the league - use efficient API call
        console.log('DEBUG: Fetching teams for leagueId:', leagueId);
        const teamsData = await teamsAPI.getTeamsByLeague(leagueId);
        console.log('DEBUG: Teams for this league:', teamsData);
        setTeams(teamsData || []);
        
        // Skip the expensive draft completion check - we'll rely on draft status API instead
        console.log('DEBUG: Skipping expensive draft completion check');
        setDraftComplete(false); // Will be updated by draft status API call
        
        // Auto-select user's team if available
        if (user && user.id) {
          console.log('DEBUG: Looking for user team - user.id:', user.id);
          console.log('DEBUG: Available teams:', teamsData);
          const userTeam = teamsData.find(team => team.team_owner === user.id);
          console.log('DEBUG: Found userTeam by team_owner:', userTeam);
          if (userTeam) {
            setSelectedTeam(userTeam);
            // Don't load team players immediately - let components load them when needed
          } else {
            const userTeamByUserId = teamsData.find(team => team.team_owner_user_id === user.id);
            console.log('DEBUG: Found userTeam by team_owner_user_id:', userTeamByUserId);
            if (userTeamByUserId) {
              setSelectedTeam(userTeamByUserId);
              // Don't load team players immediately - let components load them when needed
            } else {
              console.log('DEBUG: No team found for user');
            }
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
        
        // Load rugby players for name mapping - only load when needed
        // This will be loaded lazily when components actually need it
        setRugbyPlayers([]);
        
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
  }, [location.state?.leagueId]);

  // Load tournament data when leagueData changes
  useEffect(() => {
    if (leagueData?.tournament_id) {
      loadTournamentData();
    }
  }, [leagueData?.tournament_id]);

  // Redirect from post-draft tabs if draft is not complete
  useEffect(() => {
    const postDraftTabs = ['waivers', 'trade', 'fixtures', 'matchup'];
    if (postDraftTabs.includes(activeTab) && !draftComplete) {
      setActiveTab('league');
    }
  }, [activeTab, draftComplete]);

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

  // Helper function to get player name from rugby players data
  const getPlayerName = (playerId) => {
    console.log('DEBUG: getPlayerName called with playerId:', playerId, 'rugbyPlayers length:', rugbyPlayers.length);
    if (!playerId) return 'Unknown Player';
    const player = rugbyPlayers.find(p => p.id && p.id.toString() === playerId.toString());
    console.log('DEBUG: Found player:', player);
    return player ? player.name : `Player ${playerId}`;
  };

  const handleStartDraft = () => {
    navigate('/draft', { 
      state: { 
        leagueId: leagueData?.id,
        teams: teams 
      } 
    });
  };

  const handleChatUnreadCountChange = (count) => {
    setChatUnreadCount(count);
  };

  const movePlayerToBench = async (player) => {
    console.log('DEBUG: movePlayerToBench called with player:', player);
    if (!player) return;
    
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
    
    // Get the player's fantasy position from team player data
    const playerFantasyPosition = player.fantasy_position || positionMapping[player.position] || player.position;
    
    // Check if there are bench players in the same position that could be swapped
    const currentBenchPlayers = localTeamPlayers.filter(p => {
      const pFantasyPosition = p.fantasy_position || positionMapping[p.position] || p.position;
      const isBenchPlayer = (p.is_starting === 'false' || p.is_starting === false);
      const matchesPlayerPosition = pFantasyPosition === playerFantasyPosition;
      const isNotCurrentPlayer = p.id !== player.id;
      
      return matchesPlayerPosition && isBenchPlayer && isNotCurrentPlayer;
    });
    
    console.log('DEBUG: Bench players check:', {
      playerFantasyPosition,
      currentBenchPlayers: currentBenchPlayers.length,
      currentBenchPlayersList: currentBenchPlayers.map(p => ({ id: p.id, name: getPlayerName(p.id), fantasy_position: p.fantasy_position, is_starting: p.is_starting }))
    });
    
    if (currentBenchPlayers.length > 0) {
      console.log('DEBUG: Showing swap modal for bench players');
      // Show swap modal
      setSwapData({
        player: player,
        currentPlayers: currentBenchPlayers,
        targetPosition: 'Bench',
        newPlayerName: getPlayerName(player.id),
        selectedCurrentPlayer: null
      });
      setShowSwapModal(true);
      return;
    }
    
    console.log('DEBUG: No conflicting bench players, showing info modal');
    // No bench players in same position, show informational modal
    setInfoModalData({
      title: 'Cannot Move to Bench',
      message: `There are no other ${playerFantasyPosition} players on the bench to swap with. This player cannot be moved to the bench without a swap.`,
      playerName: getPlayerName(player.id),
      playerPosition: playerFantasyPosition
    });
    setShowInfoModal(true);
    return;
  };

  const movePlayerToStarting = async (player, targetPosition) => {
    console.log('DEBUG: movePlayerToStarting called with player:', player, 'targetPosition:', targetPosition);
    if (!player) return;
    
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
    
    // Use the team player's position data instead of rugby player data
    const playerFantasyPosition = player.fantasy_position || positionMapping[player.position] || player.position;
    
    if (playerFantasyPosition !== targetPosition) {
      alert(`This player (${playerFantasyPosition}) cannot play as ${targetPosition}.`);
      return;
    }
    
    // Define position capacities (how many players can play in each position)
    const positionCapacities = {
      'Prop': 1,
      'Hooker': 1,
      'Lock': 1,
      'Back Row': 2,
      'Scrum-half': 1,
      'Fly-half': 1,
      'Centre': 1,
      'Back Three': 2
    };
    
    // Check how many players are currently in that starting position
    const currentStartingPlayers = localTeamPlayers.filter(p => {
      const pFantasyPosition = p.fantasy_position || positionMapping[p.position] || p.position;
      const isStartingPlayer = (p.is_starting === 'true' || p.is_starting === true) && p.fantasy_position !== 'Bench';
      const matchesTargetPosition = pFantasyPosition === targetPosition;
      const isNotCurrentPlayer = p.id !== player.id;
      
      return matchesTargetPosition && isStartingPlayer && isNotCurrentPlayer;
    });
    
    const positionCapacity = positionCapacities[targetPosition] || 1;
    const isPositionFull = currentStartingPlayers.length >= positionCapacity;
    
    console.log('DEBUG: Position capacity check:', {
      targetPosition,
      positionCapacity,
      currentStartingPlayers: currentStartingPlayers.length,
      isPositionFull,
      currentStartingPlayersList: currentStartingPlayers.map(p => ({ id: p.id, name: getPlayerName(p.id), fantasy_position: p.fantasy_position, is_starting: p.is_starting }))
    });
    
    // Always show swap modal for starting positions to let user choose which player to replace
    console.log('DEBUG: Showing swap modal for starting position');
    setSwapData({
      player: player,
      currentPlayers: currentStartingPlayers,
      targetPosition: targetPosition,
      newPlayerName: getPlayerName(player.id),
      selectedCurrentPlayer: null
    });
    setShowSwapModal(true);
    return;
  };

  const confirmSwap = async () => {
    if (!swapData || !swapData.selectedCurrentPlayer) return;

    try {
      // Determine the swap direction based on targetPosition
      const isMovingToBench = swapData.targetPosition === 'Bench';
      
      // Update the first player (the one being moved)
      const firstPlayerResponse = await teamsAPI.updatePlayerPosition(selectedTeam.id, swapData.player.id, {
        fantasy_position: swapData.targetPosition,
        is_starting: !isMovingToBench
      });
      
      // Update the second player (the one being swapped out)
      const secondPlayerResponse = await teamsAPI.updatePlayerPosition(selectedTeam.id, swapData.selectedCurrentPlayer.id, {
        fantasy_position: isMovingToBench ? swapData.selectedCurrentPlayer.fantasy_position : 'Bench',
        is_starting: isMovingToBench
      });

      if (firstPlayerResponse && secondPlayerResponse) {
        // Update local state for both players
        setLocalTeamPlayers(prev => 
          prev.map(p => {
            if (p.id === swapData.player.id) {
              return { ...p, fantasy_position: swapData.targetPosition, is_starting: !isMovingToBench };
            }
            if (p.id === swapData.selectedCurrentPlayer.id) {
              return { 
                ...p, 
                fantasy_position: isMovingToBench ? swapData.selectedCurrentPlayer.fantasy_position : 'Bench', 
                is_starting: isMovingToBench 
              };
            }
            return p;
          })
        );
        console.log(`✅ Successfully swapped players`);
      } else {
        console.error('Failed to swap players');
        alert('Failed to swap players. Please try again.');
      }
      
      setShowSwapModal(false);
      setSwapData(null);
    } catch (error) {
      console.error('Error confirming swap:', error);
      
      // Check if it's a timeout error
      if (error.message && error.message.includes('timeout')) {
        alert('The swap request is taking longer than expected. This might be due to network issues. Please try again in a moment.');
      } else if (error.message && error.message.includes('Databricks API request failed')) {
        alert('There was a problem connecting to the database. Please try again in a moment.');
      } else {
        alert('An error occurred while swapping players. Please try again.');
      }
    }
  };

  const cancelSwap = () => {
    setShowSwapModal(false);
    setSwapData(null);
  };

  const handleInvitePlayer = () => {
    setShowInviteModal(true);
    // Pre-fill inviter info from user data
    setInviteData(prev => ({
      ...prev,
      inviter_name: user?.username || user?.email || 'League Admin',
      inviter_email: user?.email || ''
    }));
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!inviteData.invitee_email.trim()) {
      errors.invitee_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteData.invitee_email)) {
      errors.invitee_email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setInviteErrors(errors);
      return;
    }

    setIsInviting(true);
    setInviteErrors({});

    try {
      // Auto-populate inviter fields from user data
      const invitePayload = {
        ...inviteData,
        inviter_name: user?.username || user?.email || 'League Admin',
        inviter_email: user?.email || ''
      };
      
      const response = await leaguesAPI.inviteToLeague(leagueData.id, invitePayload);
      
      // Show success modal with league code
      setShowInviteModal(false);
      setInviteSuccessData({
        leagueCode: response?.league_code || '',
        inviteeEmail: invitePayload.invitee_email
      });
      setShowInviteSuccessModal(true);
      setInviteData({
        invitee_email: '',
        invitee_name: '',
        inviter_name: user?.username || user?.email || 'League Admin',
        inviter_email: user?.email || ''
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setInviteErrors({ general: error.response.data.error });
      } else {
        setInviteErrors({ general: 'Failed to send invitation. Please try again.' });
      }
    } finally {
      setIsInviting(false);
    }
  };

  const cancelInvite = () => {
    setShowInviteModal(false);
    setInviteData({
      invitee_email: '',
      invitee_name: '',
      inviter_name: user?.username || user?.email || 'League Admin',
      inviter_email: user?.email || ''
    });
    setInviteErrors({});
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
        tournamentData={tournamentData}
        isAdmin={isAdmin}
        draftComplete={draftComplete}
        draftStatus={draftStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStartDraft={handleStartDraft}
        onInvitePlayer={handleInvitePlayer}
        chatUnreadCount={chatUnreadCount}
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
          onLoadRugbyPlayers={loadRugbyPlayers}
          onLoadTeamPlayers={loadTeamPlayers}
        />
      )}

      {activeTab === 'waivers' && draftComplete && (
        <Waivers
          selectedTeam={selectedTeam}
          rugbyPlayers={rugbyPlayers}
          teamPlayers={localTeamPlayers.length > 0 ? localTeamPlayers : teamPlayers}
          user={user}
          leagueId={leagueData?.id}
          onLoadRugbyPlayers={loadRugbyPlayers}
          isActive={activeTab === 'waivers'}
        />
      )}

      {activeTab === 'trade' && draftComplete && (
        <Trade
          selectedTeam={selectedTeam}
          rugbyPlayers={rugbyPlayers}
          teamPlayers={localTeamPlayers.length > 0 ? localTeamPlayers : teamPlayers}
          user={user}
          leagueId={leagueData?.id}
          allTeams={teams}
          onLoadRugbyPlayers={loadRugbyPlayers}
          isActive={activeTab === 'trade'}
        />
      )}

      {activeTab === 'fixtures' && draftComplete && (
        <Fixtures
          leagueId={leagueData?.id}
          user={user}
          isActive={activeTab === 'fixtures'}
        />
      )}

      {activeTab === 'matchup' && draftComplete && (
        <Matchup
          leagueId={leagueData?.id}
          user={user}
          isActive={activeTab === 'matchup'}
        />
      )}

      {activeTab === 'chat' && (
        <Chat
          leagueId={leagueData?.id}
          isActive={activeTab === 'chat'}
          onUnreadCountChange={handleChatUnreadCountChange}
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

      {/* Informational Modal */}
      {showInfoModal && infoModalData && (
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
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: 'var(--primary-orange)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {infoModalData.title}
            </h3>
            
            <div style={{
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              <p style={{
                margin: '0 0 1rem 0',
                color: 'var(--black)',
                fontSize: '1rem'
              }}>
                <strong>{infoModalData.playerName}</strong> ({infoModalData.playerPosition})
              </p>
              
              <p style={{
                margin: 0,
                color: 'var(--dark-gray)',
                fontSize: '0.95rem'
              }}>
                {infoModalData.message}
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setShowInfoModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e67e22'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-orange)'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Success Modal */}
      {showInviteSuccessModal && inviteSuccessData && (
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
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--databricks-blue)' }}>
              🎉 Invitation Processed!
            </h3>
            
            <p style={{ margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
              Your invitation has been processed. Share this league code with your friend:
            </p>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '2px solid var(--primary-orange)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--dark-gray)',
                marginBottom: '0.5rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                League Code
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'var(--primary-orange)',
                letterSpacing: '4px',
                fontFamily: 'monospace'
              }}>
                {inviteSuccessData.leagueCode}
              </div>
            </div>
            
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '14px', 
              color: 'var(--dark-gray)',
              lineHeight: '1.5'
            }}>
              You can share this code manually with <strong>{inviteSuccessData.inviteeEmail}</strong> via text, email, or any other method.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInviteSuccessModal(false)}
                className="btn btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--databricks-blue)' }}>
              📧 Invite Player to League
            </h3>
            
            {inviteErrors.general && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {inviteErrors.general}
              </div>
            )}

            <form onSubmit={handleInviteSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Friend's Email</label>
                <input
                  type="email"
                  value={inviteData.invitee_email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, invitee_email: e.target.value }))}
                  className={`form-input ${inviteErrors.invitee_email ? 'error' : ''}`}
                  placeholder="friend@example.com"
                />
                {inviteErrors.invitee_email && (
                  <div className="form-error">{inviteErrors.invitee_email}</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={cancelInvite}
                  className="btn btn-outline"
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isInviting}
                >
                  {isInviting ? '⏳ Sending...' : '📧 Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueDashboard;
