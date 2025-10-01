import React from 'react';

const WaiverOrderSidebar = ({ teams, selectedTeam, user }) => {
  // Get unique teams per user (some users might have multiple teams)
  // Group by user and take the team with the best waiver order for each user
  const userTeamsMap = new Map();
  
  teams.forEach(team => {
    const userId = team.team_owner_user_id || team.team_owner;
    if (!userTeamsMap.has(userId) || 
        (team.waiver_order && team.waiver_order < (userTeamsMap.get(userId).waiver_order || 999))) {
      userTeamsMap.set(userId, team);
    }
  });
  
  // Convert map to array and sort by waiver_order
  const uniqueTeams = Array.from(userTeamsMap.values()).sort((a, b) => {
    const orderA = a.waiver_order || 999;
    const orderB = b.waiver_order || 999;
    return orderA - orderB;
  });

  return (
    <div className="card" style={{ position: 'sticky', top: '2rem' }}>
      <h3 style={{ 
        marginBottom: '1.5rem', 
        color: 'var(--black)',
        fontSize: '1.25rem',
        fontWeight: 'bold'
      }}>
        Waiver Order
      </h3>
      
      <p style={{
        fontSize: '0.85rem',
        color: 'var(--dark-gray)',
        marginBottom: '1.5rem',
        lineHeight: '1.4'
      }}>
        Lower priority = first pick on waivers
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {uniqueTeams.map((team, index) => {
          const isMyTeam = user && (
            team.team_owner_user_id === user.id || 
            team.team_owner === user.id
          );
          const waiverOrder = team.waiver_order || '?';

          return (
            <div
              key={team.id}
              style={{
                padding: '1rem',
                border: `2px solid ${isMyTeam ? 'var(--primary-orange)' : 'var(--light-gray)'}`,
                borderRadius: '8px',
                backgroundColor: isMyTeam ? '#FFF5EE' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isMyTeam ? 'var(--primary-orange)' : '#E0E0E0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}>
                  {waiverOrder}
                </div>
                
                <div style={{ flex: 1, marginLeft: '0.75rem' }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: isMyTeam ? 'var(--primary-orange)' : 'var(--black)',
                    marginBottom: '0.25rem'
                  }}>
                    {team.team_name} {isMyTeam && '⭐'}
                  </div>
                  
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--dark-gray)'
                  }}>
                    {waiverOrder === 1 ? '🏆 Top Priority' : 
                     waiverOrder === 2 ? '2nd Priority' :
                     waiverOrder === 3 ? '3rd Priority' :
                     `${waiverOrder}th Priority`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#F5F5F5',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: 'var(--dark-gray)',
        lineHeight: '1.5'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--black)' }}>
          ℹ️ How It Works:
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>Teams with lower numbers get first pick</li>
          <li>Don't make a claim? Keep your priority! ⭐</li>
          <li>Successful claims move you to the back</li>
        </ul>
      </div>
    </div>
  );
};

export default WaiverOrderSidebar;

