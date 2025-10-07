import { useState, useEffect, useCallback, useRef } from 'react';

export const useDraftState = (teams, availablePlayers = []) => {
  const [draftStarted, setDraftStarted] = useState(false);
  const [draftPaused, setDraftPaused] = useState(false);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [draftOrder, setDraftOrder] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [draftComplete, setDraftComplete] = useState(false);
  const [activeUsers, setActiveUsers] = useState(new Set());
  const autoPickTimerRef = useRef(null);

  // Initialize draft order when teams change
  useEffect(() => {
    if (teams.length > 0 && draftOrder.length === 0) {
      setDraftOrder([...teams]);
      setCurrentTeam(teams[0]);
    }
  }, [teams, draftOrder.length]);

  // Check for draft completion whenever selectedPlayers changes
  useEffect(() => {
    if (!draftStarted || draftComplete || teams.length === 0) return;
    
    // Check if all teams have 15 players
    const teamStatus = teams.map(team => ({
      name: team.team_name,
      id: team.id,
      count: (selectedPlayers[team.id] || []).length
    }));
    
    console.log('📊 Team roster status:', teamStatus);
    
    const allTeamsFull = teams.every(team => {
      const teamPlayerCount = (selectedPlayers[team.id] || []).length;
      return teamPlayerCount >= 15;
    });
    
    if (allTeamsFull) {
      console.log('🏁 All teams have 15 players - Draft complete!');
      setDraftComplete(true);
    }
  }, [selectedPlayers, teams, draftStarted, draftComplete]);

  // Define handleNextPick early so it can be used in effects
  const handleNextPick = useCallback(() => {
    const totalPicks = teams.length * 15; // 15 players per team
    if (currentPick >= totalPicks) {
      console.log('🏁 Reached total picks limit');
      setDraftComplete(true);
      return;
    }

    setCurrentPick((prev) => prev + 1);
    setTimeRemaining(90);

    // Determine next team (snake draft)
    const roundNumber = Math.floor((currentPick - 1) / teams.length);
    const isReverseRound = roundNumber % 2 === 1;
    const pickInRound = (currentPick - 1) % teams.length;
    
    const nextTeamIndex = isReverseRound 
      ? teams.length - 1 - pickInRound
      : pickInRound;

    console.log(`📍 Next pick: #${currentPick + 1}, Round ${roundNumber + 1}, Pick in round: ${pickInRound + 1}, Reverse: ${isReverseRound}, Team index: ${nextTeamIndex}`);
    const teamList = draftOrder.length > 0 ? draftOrder : teams;
    setCurrentTeam(teamList[nextTeamIndex]);
  }, [currentPick, teams.length, teams, draftOrder]);

  // Auto-pick for inactive users - selects player with highest fantasy points per game
  const autoPickPlayer = useCallback(() => {
    if (!currentTeam || !availablePlayers || availablePlayers.length === 0) return null;
    
    // Filter out already selected players
    const allSelectedPlayerIds = Object.values(selectedPlayers)
      .flat()
      .map(p => p.id);
    
    const available = availablePlayers.filter(p => !allSelectedPlayerIds.includes(p.id));
    
    if (available.length === 0) return null;
    
    // Sort available players by fantasy points per game (highest first)
    const sortedByFantasyPoints = available.sort((a, b) => {
      const aPoints = a.fantasy_points_per_game || 0;
      const bPoints = b.fantasy_points_per_game || 0;
      return bPoints - aPoints; // Descending order (highest first)
    });
    
    // Pick the player with the highest fantasy points per game
    const bestPlayer = sortedByFantasyPoints[0];
    
    if (bestPlayer) {
      console.log(`🤖 AUTO-PICK: ${bestPlayer.name} (${bestPlayer.fantasy_position}) - ${bestPlayer.fantasy_points_per_game} FP/Game for ${currentTeam.team_name}`);
      return bestPlayer;
    }
    return null;
  }, [currentTeam, availablePlayers, selectedPlayers]);

  // Auto-pick immediately for inactive users when it's their turn
  useEffect(() => {
    if (!draftStarted || draftComplete || draftPaused || !currentTeam) {
      return;
    }

    const teamUserId = currentTeam?.user_id || currentTeam?.team_owner_user_id;
    const isCurrentUserTeam = activeUsers.has(teamUserId?.toString());
    const currentTeamPlayerCount = (selectedPlayers[currentTeam.id] || []).length;
    
    console.log(`👤 Current turn: ${currentTeam?.team_name}, User ID: ${teamUserId}, Is Active: ${isCurrentUserTeam}, Players: ${currentTeamPlayerCount}/15, Active Users:`, Array.from(activeUsers));
    
    // If current team already has 15 players, skip to next team
    if (currentTeamPlayerCount >= 15) {
      console.log(`⏭️ Current team ${currentTeam.team_name} is full, advancing...`);
      handleNextPick();
      return;
    }
    
    // If it's not an active user's team, auto-pick immediately
    if (currentTeam && teamUserId && !isCurrentUserTeam) {
      console.log(`🤖 Team owner not active - auto-picking for ${currentTeam.team_name} after 2 seconds...`);
      
      const autoPickTimeout = setTimeout(() => {
        const player = autoPickPlayer();
        if (player) {
          // Mark player as auto-picked
          const autoPickedPlayer = { ...player, autoPicked: true };
          
          console.log(`✅ Auto-picked ${player.name} (${player.fantasy_position}) for ${currentTeam.team_name}`);
          
          // Auto-select the player and advance draft
          setSelectedPlayers((prevSelected) => ({
            ...prevSelected,
            [currentTeam.id]: [...(prevSelected[currentTeam.id] || []), autoPickedPlayer]
          }));
          
          // Advance to next pick
          handleNextPick();
        } else {
          console.error('❌ Auto-pick failed - no player available');
        }
      }, 2000); // 2 second delay to make it visible
      
      return () => clearTimeout(autoPickTimeout);
    }
  }, [draftStarted, draftComplete, draftPaused, currentTeam, activeUsers, autoPickPlayer, selectedPlayers, handleNextPick]);

  // Timer effect for active users
  useEffect(() => {
    if (!draftStarted || draftComplete || draftPaused) {
      if (autoPickTimerRef.current) {
        clearTimeout(autoPickTimerRef.current);
      }
      return;
    }

    const teamUserId = currentTeam?.user_id || currentTeam?.team_owner_user_id;
    const isCurrentUserTeam = activeUsers.has(teamUserId?.toString());
    
    // Only run timer for active users
    if (!isCurrentUserTeam) {
      return;
    }

    console.log(`⏱️ Timer active - Your turn! Time: ${timeRemaining}s`);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          console.log(`⏰ Time expired for your pick!`);
          // Could auto-pick for user if desired, or just let them know time's up
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (autoPickTimerRef.current) {
        clearTimeout(autoPickTimerRef.current);
      }
    };
  }, [draftStarted, draftComplete, draftPaused, currentTeam, activeUsers, timeRemaining]);

  const handleStartDraft = useCallback(() => {
    if (teams.length === 0) return;
    setDraftStarted(true);
    setCurrentPick(1);
    const teamList = draftOrder.length > 0 ? draftOrder : teams;
    setCurrentTeam(teamList[0]);
    setTimeRemaining(90);
  }, [teams.length, teams, draftOrder]);

  const handleShuffleDraft = useCallback(() => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setDraftOrder(shuffled);
    setCurrentTeam(shuffled[0]);
  }, [teams]);

  const handlePauseDraft = useCallback(() => {
    setDraftPaused(true);
    console.log('⏸️ Draft paused');
  }, []);

  const handleResumeDraft = useCallback(() => {
    setDraftPaused(false);
    console.log('▶️ Draft resumed');
  }, []);

  const handleSelectPlayer = useCallback((player, teamId) => {
    setSelectedPlayers((prev) => {
      const currentTeamPlayers = prev[teamId] || [];
      
      // Don't allow selection if team already has 15 players
      if (currentTeamPlayers.length >= 15) {
        console.warn('⚠️ Team already has 15 players, cannot select more');
        return prev;
      }
      
      return {
        ...prev,
        [teamId]: [...currentTeamPlayers, player]
      };
    });
    handleNextPick();
  }, [handleNextPick]);

  // Mark user as active (they're on the draft page)
  const markUserActive = useCallback((userId) => {
    setActiveUsers((prev) => new Set(prev).add(userId.toString()));
  }, []);

  // Mark user as inactive
  const markUserInactive = useCallback((userId) => {
    setActiveUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId.toString());
      return newSet;
    });
  }, []);

  return {
    draftStarted,
    draftPaused,
    currentPick,
    currentTeam,
    timeRemaining,
    draftOrder,
    selectedPlayers,
    draftComplete,
    setDraftComplete,
    handleStartDraft,
    handleShuffleDraft,
    handlePauseDraft,
    handleResumeDraft,
    handleSelectPlayer,
    markUserActive,
    markUserInactive,
    totalPicks: teams.length * 15
  };
};

