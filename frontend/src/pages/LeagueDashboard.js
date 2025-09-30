import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI } from '../services/api';

const LeagueDashboard = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const leagueId = location.state?.leagueId || 1;
        
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
        
        // Check if current user is the admin of this league
        if (league && user && user.id) {
          try {
            const adminCheck = await leaguesAPI.isUserLeagueAdmin(leagueId, user.id);
            setIsAdmin(adminCheck.is_admin || false);
          } catch (error) {
            console.warn('Could not check admin status:', error);
            setIsAdmin(false);
          }
        } else {
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
  }, [location.state]);

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
          {isAdmin && (
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
    </div>
  );
};

export default LeagueDashboard;
