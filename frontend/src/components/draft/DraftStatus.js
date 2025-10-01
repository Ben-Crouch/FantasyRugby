import React from 'react';
import DraftTimer from './DraftTimer';

const DraftStatus = ({ 
  draftStarted, 
  currentPick, 
  currentTeam, 
  timeRemaining,
  totalPicks,
  user,
  selectedPlayers,
  teams
}) => {
  if (!draftStarted) {
    return (
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--dark-gray)' }}>
          Draft has not started yet
        </h2>
        <p>The league admin will start the draft when ready.</p>
      </div>
    );
  }

  const teamUserId = currentTeam?.user_id || currentTeam?.team_owner_user_id;
  const isCurrentTurn = currentTeam && user && teamUserId === user.id.toString();
  
  // Calculate current team's pick number
  const currentTeamPlayers = currentTeam ? (selectedPlayers[currentTeam.id] || []) : [];
  const currentTeamPickNumber = currentTeamPlayers.length + 1;

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ 
          margin: '0 0 0.5rem 0',
          color: 'var(--black)',
          fontSize: '1.8rem'
        }}>
          {currentTeam?.team_name} - Pick {currentTeamPickNumber} of 15
        </h2>
        <p style={{ 
          margin: 0,
          color: isCurrentTurn ? 'var(--primary-orange)' : 'var(--dark-gray)',
          fontSize: '1.2rem',
          fontWeight: isCurrentTurn ? 'bold' : 'normal'
        }}>
          {isCurrentTurn ? "It's your turn!" : `Waiting for ${currentTeam?.team_name}...`}
        </p>
      </div>
      
      <DraftTimer timeRemaining={timeRemaining} />
      
      {isCurrentTurn && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--lightest-orange)',
          borderRadius: '6px',
          textAlign: 'center',
          color: 'var(--black)',
          fontWeight: 'bold'
        }}>
          Select a player from the list below
        </div>
      )}
    </div>
  );
};

export default DraftStatus;

