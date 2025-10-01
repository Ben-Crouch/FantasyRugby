import React from 'react';
import PlayerCard from './PlayerCard';

const PlayerList = ({ 
  players, 
  selectedPlayers, 
  onSelectPlayer, 
  currentTeam,
  user 
}) => {
  const isPlayerSelected = (playerId) => {
    return Object.values(selectedPlayers).some(teamPlayers => 
      teamPlayers.some(p => p.id === playerId)
    );
  };

  const canSelectPlayer = () => {
    if (!currentTeam || !user) return false;
    const teamUserId = currentTeam.user_id || currentTeam.team_owner_user_id;
    return teamUserId === user.id.toString();
  };

  if (players.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        color: 'var(--dark-gray)' 
      }}>
        <p style={{ fontSize: '1.2rem' }}>No players found matching your search.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1rem'
    }}>
      {players.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          onSelect={onSelectPlayer}
          isSelected={isPlayerSelected(player.id)}
          disabled={!canSelectPlayer() || isPlayerSelected(player.id)}
        />
      ))}
    </div>
  );
};

export default PlayerList;

