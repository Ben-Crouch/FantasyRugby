import React from 'react';

const LeagueTable = ({ 
  teams, 
  leagueData, 
  error, 
  loading, 
  isAdmin, 
  draftComplete, 
  onStartDraft 
}) => {
  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Teams in League</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Teams in League</h3>
        </div>
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
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
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No teams have joined this league yet.</p>
          {isAdmin && !draftComplete && (
            <button 
              onClick={onStartDraft}
              className="btn btn-primary"
              style={{ 
                backgroundColor: 'var(--primary-orange)', 
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Start Draft
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
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
                    backgroundColor: 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
  );
};

export default LeagueTable;
