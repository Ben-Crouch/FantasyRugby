import React, { useState, useEffect } from 'react';
import { tournamentsAPI } from '../services/api';

const Matchup = ({ leagueId, user, isActive }) => {
  const [matchup, setMatchup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load matchup when component becomes active
  useEffect(() => {
    if (isActive && leagueId && user?.id) {
      loadNextMatchup();
    }
  }, [isActive, leagueId, user?.id]);

  const loadNextMatchup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const matchupData = await tournamentsAPI.getNextMatchup(leagueId, user.id);
      
      // Validate the matchup data structure
      if (matchupData && typeof matchupData === 'object') {
        // Check if it's an error message
        if (matchupData.message && !matchupData.user_team) {
          // This is likely a "no upcoming fixtures" message
          setMatchup(null);
        } else if (matchupData.user_team && matchupData.opponent_team) {
          // Valid matchup data
          setMatchup(matchupData);
        } else {
          // Invalid data structure
          console.warn('Invalid matchup data structure:', matchupData);
          setMatchup(null);
        }
      } else {
        setMatchup(null);
      }
    } catch (error) {
      console.error('Error loading matchup:', error);
      setError('Failed to load matchup data');
      setMatchup(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h3 className="card-title">Next Matchup</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dark-gray)', fontSize: '0.95rem' }}>
          Your upcoming fantasy rugby match
        </p>
      </div>

      <div style={{ padding: '1rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading matchup...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: '6px',
            color: '#C62828',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && !matchup && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--dark-gray)' }}>
              No upcoming fixtures found.
            </p>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
              Fixtures may not have been generated yet, or the season may have ended.
            </p>
          </div>
        )}

        {!loading && !error && matchup && matchup.user_team && matchup.opponent_team && (
          <div>
            {/* Match Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: 'var(--lightest-gray)',
              borderRadius: '8px'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                color: 'var(--primary-orange)',
                fontSize: '1.3rem'
              }}>
                Week {matchup.week_number || 'N/A'}
                {matchup.is_playoff && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    PLAYOFF
                  </span>
                )}
              </h4>
              <p style={{
                margin: '0',
                color: 'var(--dark-gray)',
                fontSize: '1rem'
              }}>
                {matchup.week_date ? formatDate(matchup.week_date) : 'Date TBD'}
              </p>
            </div>

            {/* Teams Display */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '2rem'
            }}>
              {/* User's Team (Left) */}
              <div style={{
                flex: 1,
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '2px solid var(--primary-orange)',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--black)',
                  marginBottom: '0.5rem'
                }}>
                  {matchup.user_team?.name || 'Your Team'}
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--primary-orange)',
                  marginBottom: '0.5rem'
                }}>
                  {(matchup.user_team?.points || 0).toFixed(1)}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--dark-gray)'
                }}>
                  {matchup.user_team?.is_home ? '🏠 Home' : '✈️ Away'}
                </div>
              </div>

              {/* VS Divider */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--primary-orange)'
                }}>
                  VS
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--dark-gray)',
                  textAlign: 'center'
                }}>
                  Fantasy Points
                </div>
              </div>

              {/* Opponent Team (Right) */}
              <div style={{
                flex: 1,
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '2px solid var(--light-gray)',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--black)',
                  marginBottom: '0.5rem'
                }}>
                  {matchup.opponent_team?.name || 'Opponent'}
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--dark-gray)',
                  marginBottom: '0.5rem'
                }}>
                  {(matchup.opponent_team?.points || 0).toFixed(1)}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--dark-gray)'
                }}>
                  {matchup.opponent_team?.is_home ? '🏠 Home' : '✈️ Away'}
                </div>
              </div>
            </div>

            {/* Match Status */}
            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#E8F5E9',
              border: '1px solid #4CAF50',
              borderRadius: '8px'
            }}>
              <p style={{
                margin: '0',
                color: '#2E7D32',
                fontSize: '0.9rem'
              }}>
                📊 Points are calculated based on your team's player performance in real matches
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matchup;
