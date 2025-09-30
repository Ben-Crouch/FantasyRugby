import React from 'react';

function TeamList({ teams }) {
  return (
    <div>
      <h2>Rugby Teams</h2>
      <div className="team-grid">
        {teams.map(team => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>
            <p><strong>Country:</strong> {team.country}</p>
            {team.logo && (
              <img 
                src={team.logo} 
                alt={`${team.name} logo`} 
                style={{ maxWidth: '100px', height: 'auto' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamList;
