import React from 'react';

const DraftHeader = ({ leagueData, teams, onBackToLeague }) => {
  return (
    <>
      {/* Navigation Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem 0'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={onBackToLeague}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              ← Back to League
            </button>
          </div>
          <div style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
            Draft for {leagueData?.name}
          </div>
        </div>
      </div>

      {/* Draft Title */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            <img 
              src="/rugby-ball.png" 
              alt="Rugby Ball" 
              style={{ 
                width: '40px', 
                height: '40px' 
              }} 
            />
            <h1 style={{ margin: 0, color: 'var(--black)', fontSize: '2.5rem' }}>
              Player Draft
            </h1>
          </div>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: 'var(--dark-gray)',
            fontSize: '1.2rem'
          }}>
            {leagueData?.name} - {teams.length} teams participating
          </p>
        </div>
      </div>
    </>
  );
};

export default DraftHeader;


