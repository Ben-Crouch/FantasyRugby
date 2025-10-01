import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationBar = ({ 
  leagueData, 
  isAdmin, 
  draftComplete, 
  draftStatus,
  activeTab, 
  setActiveTab, 
  onStartDraft 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ 
        padding: '0.5rem 0', 
        borderBottom: '1px solid #eee', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <span 
          onClick={() => navigate('/my-leagues')}
          style={{ 
            cursor: 'pointer', 
            color: 'var(--primary-orange)',
            textDecoration: 'underline'
          }}
        >
          My Leagues
        </span>
        <span style={{ margin: '0 0.5rem' }}>→</span>
        <span style={{ color: 'var(--black)', fontWeight: '500' }}>
          {leagueData?.name || 'Fantasy League'}
        </span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem 0'
      }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--primary-orange)' }}>
            {leagueData?.name || 'Fantasy League'}
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            {leagueData?.description || 'A competitive fantasy rugby league'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/my-leagues')}
            style={{ 
              backgroundColor: 'transparent', 
              border: '1px solid var(--primary-orange)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              color: 'var(--primary-orange)',
              cursor: 'pointer'
            }}
          >
            ← Back to My Leagues
          </button>
          {draftStatus !== 'COMPLETED' && (
            <>
              {draftStatus === 'NOT_STARTED' && isAdmin && (
                <button 
                  onClick={onStartDraft}
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: 'var(--primary-orange)', 
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🚀 Start Draft
                </button>
              )}
              {draftStatus === 'LIVE' && (
                <button 
                  onClick={onStartDraft}
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: 'var(--primary-orange)', 
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
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
        gap: '1rem', 
        borderTop: '1px solid #eee', 
        paddingTop: '1rem' 
      }}>
        <button
          onClick={() => setActiveTab('league')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            backgroundColor: activeTab === 'league' ? 'var(--primary-orange)' : 'transparent',
            color: activeTab === 'league' ? 'white' : 'var(--primary-orange)',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          League Table
        </button>
        <button
          onClick={() => setActiveTab('my-team')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            backgroundColor: activeTab === 'my-team' ? 'var(--primary-orange)' : 'transparent',
            color: activeTab === 'my-team' ? 'white' : 'var(--primary-orange)',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          My Team
        </button>
        <button
          onClick={() => setActiveTab('waivers')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            backgroundColor: activeTab === 'waivers' ? 'var(--primary-orange)' : 'transparent',
            color: activeTab === 'waivers' ? 'white' : 'var(--primary-orange)',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Waivers
        </button>
        <button
          onClick={() => setActiveTab('trade')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            backgroundColor: activeTab === 'trade' ? 'var(--primary-orange)' : 'transparent',
            color: activeTab === 'trade' ? 'white' : 'var(--primary-orange)',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Trade
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;
