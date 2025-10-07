import React from 'react';

const PlayerCard = ({ player, onSelect, isSelected, disabled }) => {
  const getPositionColor = (position) => {
    const colors = {
      'Prop': '#E74C3C',           // Red
      'Hooker': '#C0392B',         // Dark Red
      'Lock': '#3498DB',           // Blue
      'Back Row': '#2ECC71',       // Green
      'Scrum-half': '#F39C12',     // Orange
      'Fly-half': '#E67E22',       // Dark Orange
      'Centre': '#1ABC9C',         // Teal
      'Back Three': '#9B59B6'      // Purple
    };
    return colors[position] || '#95A5A6';
  };

  return (
    <div
      onClick={() => !disabled && onSelect(player)}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        padding: '1rem',
        border: `2px solid ${isSelected ? 'var(--primary-orange)' : 'var(--light-gray)'}`,
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isSelected ? 'var(--lightest-orange)' : 'white',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--black)' }}>
            {player.name}
          </h3>
          <div style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            backgroundColor: getPositionColor(player.fantasy_position),
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {player.fantasy_position}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
            Team: {player.team}
          </p>
          {/* Fantasy Points Display */}
          {player.fantasy_points_per_game !== undefined && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Fantasy Points/Game:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                  {player.fantasy_points_per_game}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Fantasy Points/Min:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                  {player.fantasy_points_per_minute}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Total Fantasy Points:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                  {player.total_fantasy_points}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;

