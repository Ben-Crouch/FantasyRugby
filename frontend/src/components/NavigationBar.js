import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationBar = ({ 
  leagueData, 
  tournamentData,
  isAdmin, 
  draftComplete, 
  draftStatus,
  activeTab, 
  setActiveTab, 
  onStartDraft,
  onInvitePlayer,
  chatUnreadCount = 0
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 0'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: 'var(--databricks-blue)',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            {leagueData?.name || 'Fantasy League'}
          </h2>
          <p style={{ 
            margin: '4px 0 8px 0', 
            color: 'var(--neutral-600)',
            fontSize: '14px'
          }}>
            {tournamentData?.name ? `A ${tournamentData.name} Fantasy game` : (leagueData?.description || 'A Fantasy Rugby game')}
          </p>
          <button 
            onClick={() => navigate('/my-leagues')}
            className="btn btn-outline btn-small"
            style={{ fontSize: '14px' }}
          >
            ← Back to My Leagues
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isAdmin && onInvitePlayer && (
            <button 
              onClick={onInvitePlayer}
              className="btn btn-outline"
              style={{ fontSize: '14px' }}
            >
              📧 Invite Player
            </button>
          )}
          {draftStatus !== 'COMPLETED' && (
            <>
              {draftStatus === 'NOT_STARTED' && isAdmin && (
                <button 
                  onClick={onStartDraft}
                  className="btn btn-primary"
                  style={{ fontSize: '14px' }}
                >
                  🚀 Start Draft
                </button>
              )}
              {draftStatus === 'LIVE' && (
                <button 
                  onClick={onStartDraft}
                  className="btn btn-primary"
                  style={{ 
                    fontSize: '14px',
                    animation: !isAdmin ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {isAdmin ? '🎮 Go to Draft' : '🏉 Join Draft'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '12px', 
        borderTop: '1px solid var(--neutral-200)', 
        paddingTop: '16px' 
      }}>
        <button
          onClick={() => setActiveTab('league')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'league' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTab === 'league' ? 'white' : 'var(--neutral-700)',
            border: activeTab === 'league' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500',
            width: '160px'
          }}
        >
          League Table
        </button>
        <button
          onClick={() => setActiveTab('my-team')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'my-team' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTab === 'my-team' ? 'white' : 'var(--neutral-700)',
            border: activeTab === 'my-team' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500',
            width: '160px'
          }}
        >
          My Team
        </button>
        {draftComplete && (
          <button
            onClick={() => setActiveTab('waivers')}
            className="btn"
            style={{
              backgroundColor: activeTab === 'waivers' ? 'var(--databricks-blue)' : 'transparent',
              color: activeTab === 'waivers' ? 'white' : 'var(--neutral-700)',
              border: activeTab === 'waivers' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
              fontSize: '14px',
              fontWeight: '500',
              width: '160px'
            }}
          >
            Waivers
          </button>
        )}
        {draftComplete && (
          <button
            onClick={() => setActiveTab('trade')}
            className="btn"
            style={{
              backgroundColor: activeTab === 'trade' ? 'var(--databricks-blue)' : 'transparent',
              color: activeTab === 'trade' ? 'white' : 'var(--neutral-700)',
              border: activeTab === 'trade' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
              fontSize: '14px',
              fontWeight: '500',
              width: '160px'
            }}
          >
            Trade
          </button>
        )}
        {draftComplete && (
          <button
            onClick={() => setActiveTab('fixtures')}
            className="btn"
            style={{
              backgroundColor: activeTab === 'fixtures' ? 'var(--databricks-blue)' : 'transparent',
              color: activeTab === 'fixtures' ? 'white' : 'var(--neutral-700)',
              border: activeTab === 'fixtures' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
              fontSize: '14px',
              fontWeight: '500',
              width: '160px'
            }}
          >
            Fixtures
          </button>
        )}
        {draftComplete && (
          <button
            onClick={() => setActiveTab('matchup')}
            className="btn"
            style={{
              backgroundColor: activeTab === 'matchup' ? 'var(--databricks-blue)' : 'transparent',
              color: activeTab === 'matchup' ? 'white' : 'var(--neutral-700)',
              border: activeTab === 'matchup' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
              fontSize: '14px',
              fontWeight: '500',
              width: '160px'
            }}
          >
            Matchup
          </button>
        )}
        <button
          onClick={() => setActiveTab('chat')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'chat' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTab === 'chat' ? 'white' : 'var(--neutral-700)',
            border: activeTab === 'chat' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500',
            width: '160px',
            position: 'relative'
          }}
        >
          💬 Chat
          {chatUnreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ff4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                padding: '0 4px'
              }}
            >
              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;
