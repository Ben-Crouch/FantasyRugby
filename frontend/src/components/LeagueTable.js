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
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Teams in League</h3>
        </div>
        <div style={{ 
          padding: '48px 24px', 
          textAlign: 'center',
          color: 'var(--neutral-600)'
        }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Teams in League</h3>
        </div>
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {teams.length === 0 ? (
        <div style={{ 
          padding: '48px 24px', 
          textAlign: 'center',
          color: 'var(--neutral-600)'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '24px' }}>No teams have joined this league yet.</p>
          {isAdmin && !draftComplete && (
            <button 
              onClick={onStartDraft}
              className="btn btn-primary"
              style={{ fontSize: '14px' }}
            >
              Start Draft
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto', 
          borderRadius: '8px', 
          border: '1px solid var(--neutral-200)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)'
                }}>
                  Team Name
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
                }}>
                  W
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
                }}>
                  L
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
                }}>
                  D
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
                }}>
                  PF
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
                }}>
                  PA
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--neutral-700)',
                  backgroundColor: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  width: '80px'
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
                    borderBottom: '1px solid var(--neutral-100)',
                    backgroundColor: 'var(--white)',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--white)'}
                >
                  <td style={{ 
                    padding: '12px 16px',
                    fontWeight: '600',
                    color: 'var(--neutral-900)',
                    fontSize: '14px'
                  }}>
                    {team.team_name}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--neutral-700)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {team.wins || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--neutral-700)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {team.losses || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--neutral-700)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {team.draws || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--neutral-700)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {team.points_for || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--neutral-700)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {team.points_against || 0}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: 'var(--databricks-blue)',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    backgroundColor: index < 3 ? 'var(--databricks-light-blue)' : 'transparent'
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
