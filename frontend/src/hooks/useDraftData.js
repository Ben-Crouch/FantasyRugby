import { useState, useEffect } from 'react';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';

export const useDraftData = (leagueId, user, authLoading) => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Wait for authentication to complete
      if (authLoading) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
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
        const teamsData = await teamsAPI.getTeamsByLeague(leagueId);
        setTeams(teamsData || []);
        
            // Fetch rugby players filtered by tournament
            const tournamentId = league?.tournament_id;
            console.log('DEBUG: Fetching players for tournament:', tournamentId);
            const playersData = await rugbyPlayersAPI.getPlayers(tournamentId);
            console.log('DEBUG: Players data received:', playersData?.length, 'players');
            if (playersData && playersData.length > 0) {
              console.log('DEBUG: First player data:', playersData[0]);
            }
            setPlayers(playersData || []);
        
        // Check if current user is the admin of this league
        if (league && user && user.id) {
          try {
            const adminCheck = await leaguesAPI.isUserLeagueAdmin(leagueId, user.id);
            const isAdmin = adminCheck.is_admin || false;
            setIsAdmin(isAdmin);
            // Don't block non-admin users from accessing draft page
          } catch (error) {
            console.warn('Could not check admin status:', error);
            setIsAdmin(false);
          }
        } else if (!user || !user.id) {
          setIsAdmin(false);
          setError('You must be logged in to access the draft');
          return;
        }
      } catch (err) {
        console.error('Error loading draft data:', err);
        setError('Failed to load draft data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [leagueId, user, authLoading]);

  return { leagueData, teams, players, loading, error, isAdmin };
};

