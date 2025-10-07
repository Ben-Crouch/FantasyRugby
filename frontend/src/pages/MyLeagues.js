import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, tournamentsAPI } from '../services/api';

const MyLeagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper function to get tournament name for a league
  const getTournamentName = (league) => {
    if (!league.tournament_id || !tournaments.length) return null;
    const tournament = tournaments.find(t => t.id.toString() === league.tournament_id.toString());
    return tournament ? tournament.name : null;
  };

  const loadUserLeagues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user-specific leagues, teams, and tournaments in parallel for better performance
      const [userLeagues, userTeamsData, tournamentsData] = await Promise.all([
        leaguesAPI.getLeagues(),
        teamsAPI.getUserTeams(user?.id),
        tournamentsAPI.getTournaments()
      ]);
      
      setLeagues(userLeagues);
      setUserTeams(userTeamsData);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error loading user leagues:', error);
      setError(`Failed to load your leagues: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserLeagues();
    }
  }, [user]);

  const handleLeagueClick = (leagueId) => {
    console.log('DEBUG: Navigating to league dashboard with leagueId:', leagueId);
    // Store league ID in localStorage for persistence
    localStorage.setItem('lastSelectedLeagueId', leagueId.toString());
    // Use both state and URL params for more reliable navigation
    navigate(`/league-dashboard?leagueId=${leagueId}`, { 
      state: { leagueId: leagueId } 
    });
  };

  const getTeamInLeague = (leagueId) => {
    return userTeams.find(team => team.league_id === leagueId);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--black)' }}>
          Loading your leagues...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--black)' }}>
              My Leagues
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              color: 'var(--dark-gray)',
              fontSize: '1.1rem'
            }}>
              Leagues you have joined
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={loadUserLeagues}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--gray)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Refresh
            </button>
            <button 
              onClick={() => navigate('/league-selection')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Join New League
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏉</div>
          <h3 style={{ color: 'var(--black)', marginBottom: '1rem' }}>
            No Leagues Joined
          </h3>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            You haven't joined any leagues yet. Start by joining or creating a league!
          </p>
          <button 
            onClick={() => navigate('/league-selection')}
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
            Browse Leagues
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {leagues.map((league) => {
            const userTeam = getTeamInLeague(league.id);
            return (
              <div 
                key={league.id}
                className="card" 
                style={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '2px solid transparent'
                }}
                onClick={() => handleLeagueClick(league.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = 'var(--primary-orange)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div className="card-header">
                  <h3 className="card-title" style={{ color: 'var(--black)' }}>
                    {league.name}
                  </h3>
                </div>
                <div className="card-body">
                  <p style={{ 
                    color: 'var(--dark-gray)', 
                    marginBottom: '1rem',
                    fontSize: '0.95rem'
                  }}>
                    {(() => {
                      const tournamentName = getTournamentName(league);
                      if (tournamentName) {
                        return `A ${tournamentName} Fantasy game`;
                      }
                      return league.description || 'No description provided';
                    })()}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--black)' }}>Your Team:</strong>
                      <div style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>
                        {userTeam?.team_name || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
                        Max Teams: {league.max_teams}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--light-gray)', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--black)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Click to view league dashboard
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyLeagues;
