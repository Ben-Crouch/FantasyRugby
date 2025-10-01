import { useState, useEffect } from 'react';

export const usePlayerFilters = (players, selectedPlayers, currentTeamId) => {
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...players];

      // Filter out already selected players
      const allSelectedPlayerIds = Object.values(selectedPlayers)
        .flat()
        .map(p => p.id);
      
      filtered = filtered.filter(p => !allSelectedPlayerIds.includes(p.id));

      // Get current team's selected players
      const teamPlayers = currentTeamId ? (selectedPlayers[currentTeamId] || []) : [];
      
      // Define required starting positions (must be filled first)
      const startingPositions = {
        'Prop': 1,
        'Hooker': 1,
        'Lock': 1,
        'Back Row': 2,
        'Scrum-half': 1,
        'Fly-half': 1,
        'Centre': 1,
        'Back Three': 2
      };
      
      const totalStartingSlots = Object.values(startingPositions).reduce((sum, val) => sum + val, 0);
      const benchSlots = 5;
      
      // Count how many of each position the team has selected
      const positionCounts = {};
      teamPlayers.forEach(player => {
        const pos = player.fantasy_position;
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      
      // Filter out players whose positions are full (both starting and bench)
      filtered = filtered.filter(player => {
        const pos = player.fantasy_position;
        const requiredForPosition = startingPositions[pos] || 0;
        const currentCount = positionCounts[pos] || 0;
        
        // If we haven't filled the starting slots for this position, allow selection
        if (currentCount < requiredForPosition) {
          return true;
        }
        
        // Calculate how many bench slots are used
        const startingPlayerCount = Object.keys(startingPositions).reduce((sum, position) => {
          const required = startingPositions[position];
          const actual = positionCounts[position] || 0;
          return sum + Math.min(actual, required);
        }, 0);
        
        const benchPlayerCount = teamPlayers.length - startingPlayerCount;
        
        // If bench is full, don't allow any more players
        if (benchPlayerCount >= benchSlots) {
          return false;
        }
        
        // Allow selection for bench if there's space
        return true;
      });

      // Filter by fantasy position
      if (selectedPosition && selectedPosition !== 'All') {
        filtered = filtered.filter(p => p.fantasy_position === selectedPosition);
      }

      // Filter by search name
      if (searchName) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchName.toLowerCase()) ||
          p.team.toLowerCase().includes(searchName.toLowerCase())
        );
      }

      setFilteredPlayers(filtered);
    };

    applyFilters();
  }, [players, selectedPosition, searchName, selectedPlayers, currentTeamId]);

  return {
    filteredPlayers,
    selectedPosition,
    setSelectedPosition,
    searchName,
    setSearchName
  };
};

