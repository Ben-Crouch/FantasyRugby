import React, { useState, useEffect } from 'react';
import { tournamentsAPI } from '../services/api';

const Fixtures = ({ leagueId, user, isActive }) => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load fixtures when component becomes active
  useEffect(() => {
    if (isActive && leagueId) {
      loadFixtures();
    }
  }, [isActive, leagueId]);

  const loadFixtures = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fixturesData = await tournamentsAPI.getLeagueFixtures(leagueId);
      setFixtures(fixturesData || []);
    } catch (error) {
      console.error('Error loading fixtures:', error);
      setError('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };


  const groupFixturesByWeek = (fixtures) => {
    const grouped = {};
    fixtures.forEach(fixture => {
      const week = fixture.week_number;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(fixture);
    });
    return grouped;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
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
        <div>
          <h3 className="card-title">League Fixtures</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dark-gray)', fontSize: '0.95rem' }}>
            View all scheduled matches for this league
          </p>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading fixtures...</p>
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

        {!loading && fixtures.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--dark-gray)', marginBottom: '1rem' }}>
              No fixtures available for this league yet.
            </p>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
              Fixtures will be automatically generated when teams join the league.
            </p>
          </div>
        )}

        {!loading && fixtures.length > 0 && (
          <div>
            {Object.entries(groupFixturesByWeek(fixtures))
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([week, weekFixtures]) => (
                <div key={week} style={{ marginBottom: '2rem' }}>
                  <h4 style={{
                    color: 'var(--primary-orange)',
                    marginBottom: '1rem',
                    fontSize: '1.2rem',
                    borderBottom: '2px solid var(--light-gray)',
                    paddingBottom: '0.5rem'
                  }}>
                    Week {week}
                    {weekFixtures[0]?.is_playoff && (
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
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                  }}>
                    {weekFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid var(--light-gray)',
                          borderRadius: '8px',
                          backgroundColor: 'white'
                        }}
                      >
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--dark-gray)'
                        }}>
                          {formatDate(fixture.week_date)}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ flex: 1, textAlign: 'right', marginRight: '1rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                              {fixture.home_team_name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--dark-gray)' }}>
                              {fixture.home_team_points.toFixed(1)} pts
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-orange)'
                          }}>
                            VS
                          </div>
                          
                          <div style={{ flex: 1, textAlign: 'left', marginLeft: '1rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                              {fixture.away_team_name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--dark-gray)' }}>
                              {fixture.away_team_points.toFixed(1)} pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
