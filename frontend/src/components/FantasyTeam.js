import React, { useState } from 'react';
import axios from 'axios';

function FantasyTeam({ fantasyTeams, players }) {
  const [teamName, setTeamName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [budget, setBudget] = useState(1000000);

  const handleAddPlayer = (player) => {
    if (selectedPlayers.length >= 15) {
      alert('You can only have 15 players in your team');
      return;
    }

    if (selectedPlayers.some(p => p.id === player.id)) {
      alert('Player already in team');
      return;
    }

    const totalCost = selectedPlayers.reduce((sum, p) => sum + parseFloat(p.price), 0) + parseFloat(player.price);
    if (totalCost > budget) {
      alert('Not enough budget');
      return;
    }

    setSelectedPlayers([...selectedPlayers, player]);
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    if (selectedPlayers.length !== 15) {
      alert('Please select exactly 15 players');
      return;
    }

    try {
      const teamData = {
        name: teamName,
        owner: 1, // In a real app, this would be the current user's ID
        budget: budget
      };

      const response = await axios.post('/fantasy-teams/', teamData);
      const teamId = response.data.id;

      // Add players to the team
      for (const player of selectedPlayers) {
        await axios.post('/fantasy-team-players/', {
          fantasy_team: teamId,
          player: player.id
        });
      }

      alert('Team created successfully!');
      setTeamName('');
      setSelectedPlayers([]);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const totalCost = selectedPlayers.reduce((sum, player) => sum + parseFloat(player.price), 0);
  const remainingBudget = budget - totalCost;

  return (
    <div>
      <h2>Create Fantasy Team</h2>
      
      <div className="form-group">
        <label htmlFor="teamName">Team Name:</label>
        <input
          type="text"
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
        />
      </div>

      <div className="team-card" style={{ marginBottom: '20px' }}>
        <h3>Team Summary</h3>
        <p><strong>Players:</strong> {selectedPlayers.length}/15</p>
        <p><strong>Total Cost:</strong> ${totalCost.toLocaleString()}</p>
        <p><strong>Remaining Budget:</strong> ${remainingBudget.toLocaleString()}</p>
        
        {selectedPlayers.length > 0 && (
          <div>
            <h4>Selected Players:</h4>
            <ul className="player-list">
              {selectedPlayers.map(player => (
                <li key={player.id} className="player-item">
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    <span className="player-position">{player.position} - {player.team_name}</span>
                  </div>
                  <div>
                    <span className="player-price">${player.price}</span>
                    <button 
                      onClick={() => handleRemovePlayer(player.id)}
                      style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h3>Available Players</h3>
      <div className="team-grid">
        {players.map(player => (
          <div key={player.id} className="team-card">
            <h4>{player.name}</h4>
            <p><strong>Position:</strong> {player.position}</p>
            <p><strong>Team:</strong> {player.team_name}</p>
            <p><strong>Price:</strong> ${player.price}</p>
            <p><strong>Points:</strong> {player.total_points}</p>
            <button 
              onClick={() => handleAddPlayer(player)}
              disabled={selectedPlayers.some(p => p.id === player.id)}
              className="btn"
            >
              Add to Team
            </button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button 
          onClick={handleCreateTeam}
          disabled={selectedPlayers.length !== 15 || !teamName.trim()}
          className="btn"
          style={{ fontSize: '1.2rem', padding: '15px 30px' }}
        >
          Create Team
        </button>
      </div>
    </div>
  );
}

export default FantasyTeam;
