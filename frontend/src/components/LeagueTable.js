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
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Owner</th>
                <th>Players</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <strong>{team.team_name}</strong>
                  </td>
                  <td>
                    {team.team_owner_name || `User ${team.team_owner}`}
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {team.player_count || 0} players
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${team.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {team.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${team.team_name} from this league?`)) {
                            // Handle team removal
                            console.log('Remove team:', team.id);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  )}
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
