import React, { useState } from 'react';

function PlayerList({ players }) {
  const [selectedPosition, setSelectedPosition] = useState('');

  const positions = [
    { value: 'LHP', label: 'Loosehead Prop' },
    { value: 'HK', label: 'Hooker' },
    { value: 'THP', label: 'Tighthead Prop' },
    { value: 'LK', label: 'Lock' },
    { value: 'BR', label: 'Blindside Flanker' },
    { value: 'OF', label: 'Openside Flanker' },
    { value: 'N8', label: 'Number 8' },
    { value: 'SH', label: 'Scrum Half' },
    { value: 'FH', label: 'Fly Half' },
    { value: 'LW', label: 'Left Wing' },
    { value: 'IC', label: 'Inside Centre' },
    { value: 'OC', label: 'Outside Centre' },
    { value: 'RW', label: 'Right Wing' },
    { value: 'FB', label: 'Fullback' },
  ];

  const filteredPlayers = selectedPosition 
    ? players.filter(player => player.position === selectedPosition)
    : players;

  return (
    <div>
      <h2>Rugby Players</h2>
      
      <div className="form-group">
        <label htmlFor="position">Filter by Position:</label>
        <select
          id="position"
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
        >
          <option value="">All Positions</option>
          {positions.map(pos => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      <div className="team-grid">
        {filteredPlayers.map(player => (
          <div key={player.id} className="team-card">
            <h3>{player.name}</h3>
            <p><strong>Position:</strong> {player.position}</p>
            <p><strong>Team:</strong> {player.team_name}</p>
            <p><strong>Price:</strong> ${player.price}</p>
            <p><strong>Total Points:</strong> {player.total_points}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;
