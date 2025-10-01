import React from 'react';

const PlayerFilters = ({ 
  selectedPosition, 
  setSelectedPosition, 
  searchName, 
  setSearchName 
}) => {
  const positions = [
    'All',
    'Prop',
    'Hooker',
    'Lock',
    'Back Row',
    'Scrum-half',
    'Fly-half',
    'Centre',
    'Back Three'
  ];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '1rem',
      flexWrap: 'wrap' 
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          placeholder="Search players..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--light-gray)',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--light-gray)',
            borderRadius: '6px',
            fontSize: '1rem',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          {positions.map(position => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PlayerFilters;

