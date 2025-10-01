import React, { useState, useEffect, useCallback } from 'react';
import { leaguesAPI, teamsAPI } from '../services/api';

const Trade = ({ selectedTeam, rugbyPlayers, teamPlayers, user, leagueId, allTeams }) => {
  const [activeTradeTab, setActiveTradeTab] = useState('propose'); // 'propose' or 'received'
  const [selectedTradePartner, setSelectedTradePartner] = useState(null);
  const [mySelectedPlayers, setMySelectedPlayers] = useState([]);
  const [theirSelectedPlayers, setTheirSelectedPlayers] = useState([]);
  const [tradeProposals, setTradeProposals] = useState([]);
  const [partnerPlayers, setPartnerPlayers] = useState([]);
  const [loadingPartnerPlayers, setLoadingPartnerPlayers] = useState(false);

  const loadTradeProposals = useCallback(async () => {
    try {
      const trades = await leaguesAPI.getTrades(leagueId);
      setTradeProposals(trades || []);
    } catch (error) {
      console.error('Error loading trade proposals:', error);
    }
  }, [leagueId]);

  useEffect(() => {
    if (leagueId) {
      loadTradeProposals();
    }
  }, [leagueId, loadTradeProposals]);

  // Load partner's players when a trade partner is selected
  useEffect(() => {
    const loadPartnerPlayers = async () => {
      if (selectedTradePartner) {
        setLoadingPartnerPlayers(true);
        try {
          const response = await teamsAPI.getTeamPlayers(selectedTradePartner.id);
          setPartnerPlayers(response?.players || []);
        } catch (error) {
          console.error('Error loading partner players:', error);
          setPartnerPlayers([]);
        } finally {
          setLoadingPartnerPlayers(false);
        }
      } else {
        setPartnerPlayers([]);
      }
    };

    loadPartnerPlayers();
  }, [selectedTradePartner]);

  const getPlayerName = (playerId) => {
    const player = rugbyPlayers.find(p => p.id.toString() === playerId?.toString());
    return player ? player.name : `Player ${playerId}`;
  };

  const getPlayerTeam = (playerId) => {
    const player = rugbyPlayers.find(p => p.id.toString() === playerId?.toString());
    return player ? player.team : '';
  };

  const getPlayerPosition = (playerId) => {
    const player = rugbyPlayers.find(p => p.id.toString() === playerId?.toString());
    return player ? player.fantasy_position : '';
  };

  const handleSelectMyPlayer = (player) => {
    if (mySelectedPlayers.find(p => p.id === player.id)) {
      setMySelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    } else {
      setMySelectedPlayers(prev => [...prev, player]);
    }
  };

  const handleSelectTheirPlayer = (player) => {
    if (theirSelectedPlayers.find(p => p.id === player.id)) {
      setTheirSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    } else {
      setTheirSelectedPlayers(prev => [...prev, player]);
    }
  };

  const handleProposeTrade = async () => {
    if (!selectedTradePartner || mySelectedPlayers.length === 0 || theirSelectedPlayers.length === 0) {
      alert('Please select a trade partner and players from both teams');
      return;
    }

    try {
      // Get the partner team's user_id
      const partnerTeam = allTeams.find(t => t.id === selectedTradePartner.id);
      const partnerUserId = partnerTeam?.team_owner_user_id || partnerTeam?.team_owner;

      const tradeData = {
        from_team_id: selectedTeam.id,
        to_team_id: selectedTradePartner.id,
        from_user_id: user.id,
        to_user_id: partnerUserId,
        from_players: mySelectedPlayers.map(p => p.id),
        to_players: theirSelectedPlayers.map(p => p.id)
      };

      await leaguesAPI.proposeTrade(leagueId, tradeData);
      
      alert('✅ Trade proposal sent successfully!');
      
      // Reset selections
      setMySelectedPlayers([]);
      setTheirSelectedPlayers([]);
      setSelectedTradePartner(null);
      
      // Reload trade proposals
      loadTradeProposals();
    } catch (error) {
      console.error('Error proposing trade:', error);
      alert('❌ Failed to send trade proposal. Please try again.');
    }
  };

  const getPositionColor = (position) => {
    const colorMap = {
      'Prop': '#8B4513',
      'Hooker': '#D2691E',
      'Lock': '#4169E1',
      'Back Row': '#32CD32',
      'Scrum-half': '#FFD700',
      'Fly-half': '#FF8C00',
      'Centre': '#9370DB',
      'Back Three': '#DC143C'
    };
    return colorMap[position] || '#999';
  };

  if (!selectedTeam) {
    return (
      <div className="card">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--dark-gray)' }}>
            ❌ No team selected. Please select a team to manage trades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-orange)' }}>
        🔄 Trade Center
      </h3>

      {/* Trade Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid var(--light-gray)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTradeTab('propose')}
          style={{
            padding: '0.5rem 1.5rem',
            border: 'none',
            backgroundColor: activeTradeTab === 'propose' ? 'var(--primary-orange)' : 'transparent',
            color: activeTradeTab === 'propose' ? 'white' : 'var(--dark-gray)',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: activeTradeTab === 'propose' ? 'bold' : 'normal'
          }}
        >
          📤 Propose Trade
        </button>
        <button
          onClick={() => setActiveTradeTab('received')}
          style={{
            padding: '0.5rem 1.5rem',
            border: 'none',
            backgroundColor: activeTradeTab === 'received' ? 'var(--primary-orange)' : 'transparent',
            color: activeTradeTab === 'received' ? 'white' : 'var(--dark-gray)',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: activeTradeTab === 'received' ? 'bold' : 'normal'
          }}
        >
          📥 Received Proposals {tradeProposals.length > 0 && `(${tradeProposals.length})`}
        </button>
      </div>

      {/* Propose Trade Tab */}
      {activeTradeTab === 'propose' && (
        <div>
          {/* Trade Partner Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--black)' }}>
              Select Trade Partner
            </h4>
            <select
              value={selectedTradePartner?.id || ''}
              onChange={(e) => {
                const team = allTeams.find(t => t.id.toString() === e.target.value);
                setSelectedTradePartner(team);
                setTheirSelectedPlayers([]);
                setPartnerPlayers([]);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--light-gray)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">-- Select a team --</option>
              {allTeams
                .filter(team => team.id !== selectedTeam.id)
                .map(team => (
                  <option key={team.id} value={team.id}>
                    {team.team_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Trade Setup */}
          {selectedTradePartner && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto 1fr', 
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* My Players */}
              <div>
                <h4 style={{ 
                  marginBottom: '1rem', 
                  color: 'var(--primary-orange)',
                  textAlign: 'center'
                }}>
                  Your Team: {selectedTeam.team_name}
                </h4>
                <div style={{ 
                  border: '2px solid var(--primary-orange)', 
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#FFF8F0',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {teamPlayers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--dark-gray)' }}>
                      No players on your team yet
                    </p>
                  ) : (
                    teamPlayers.map(player => {
                      const isSelected = mySelectedPlayers.find(p => p.id === player.id);
                      const playerName = getPlayerName(player.player_id);
                      const playerTeam = getPlayerTeam(player.player_id);
                      const playerPosition = getPlayerPosition(player.player_id);
                      
                      return (
                        <div
                          key={player.id}
                          onClick={() => handleSelectMyPlayer(player)}
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            backgroundColor: isSelected ? 'var(--primary-orange)' : 'white',
                            color: isSelected ? 'white' : 'var(--black)',
                            border: `2px solid ${isSelected ? 'var(--primary-orange)' : 'var(--light-gray)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem'
                          }}>
                            {isSelected && <span>✓</span>}
                            <span style={{ fontWeight: 'bold' }}>{playerName}</span>
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem',
                            opacity: isSelected ? 0.9 : 0.7
                          }}>
                            {playerTeam} • {playerPosition}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Trade Arrow */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                ⇄
              </div>

              {/* Their Players */}
              <div>
                <h4 style={{ 
                  marginBottom: '1rem', 
                  color: '#2ECC71',
                  textAlign: 'center'
                }}>
                  Their Team: {selectedTradePartner.team_name}
                </h4>
                <div style={{ 
                  border: '2px solid #2ECC71', 
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#F0FFF4',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {loadingPartnerPlayers ? (
                    <p style={{ textAlign: 'center', color: 'var(--dark-gray)' }}>
                      Loading players...
                    </p>
                  ) : partnerPlayers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--dark-gray)' }}>
                      No players on this team yet
                    </p>
                  ) : (
                    partnerPlayers.map(player => {
                      const isSelected = theirSelectedPlayers.find(p => p.id === player.id);
                      const playerName = getPlayerName(player.player_id);
                      const playerTeam = getPlayerTeam(player.player_id);
                      const playerPosition = getPlayerPosition(player.player_id);
                      
                      return (
                        <div
                          key={player.id}
                          onClick={() => handleSelectTheirPlayer(player)}
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            backgroundColor: isSelected ? '#2ECC71' : 'white',
                            color: isSelected ? 'white' : 'var(--black)',
                            border: `2px solid ${isSelected ? '#2ECC71' : 'var(--light-gray)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem'
                          }}>
                            {isSelected && <span>✓</span>}
                            <span style={{ fontWeight: 'bold' }}>{playerName}</span>
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem',
                            opacity: isSelected ? 0.9 : 0.7
                          }}>
                            {playerTeam} • {playerPosition}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trade Summary */}
          {(mySelectedPlayers.length > 0 || theirSelectedPlayers.length > 0) && (
            <div style={{ 
              backgroundColor: '#FFF3CD', 
              border: '2px solid #FFC107',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ marginTop: 0, color: '#856404' }}>Trade Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <strong>You Send ({mySelectedPlayers.length}):</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {mySelectedPlayers.map(p => (
                      <li key={p.id}>{getPlayerName(p.player_id)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>You Receive ({theirSelectedPlayers.length}):</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {theirSelectedPlayers.map(p => (
                      <li key={p.id}>{getPlayerName(p.player_id)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Propose Button */}
          <button
            onClick={handleProposeTrade}
            disabled={!selectedTradePartner || mySelectedPlayers.length === 0 || theirSelectedPlayers.length === 0}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: (!selectedTradePartner || mySelectedPlayers.length === 0 || theirSelectedPlayers.length === 0) 
                ? 'var(--light-gray)' 
                : 'var(--primary-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: (!selectedTradePartner || mySelectedPlayers.length === 0 || theirSelectedPlayers.length === 0) 
                ? 'not-allowed' 
                : 'pointer',
              opacity: (!selectedTradePartner || mySelectedPlayers.length === 0 || theirSelectedPlayers.length === 0) ? 0.5 : 1
            }}
          >
            📤 Propose Trade
          </button>
        </div>
      )}

      {/* Received Proposals Tab */}
      {activeTradeTab === 'received' && (
        <div>
          {tradeProposals.filter(trade => 
            trade.to_team_id === selectedTeam.id && trade.status === 'PENDING'
          ).length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--dark-gray)'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</p>
              <p style={{ fontSize: '1.1rem' }}>No pending trade proposals</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Trade proposals from other teams will appear here
              </p>
            </div>
          ) : (
            <div>
              {tradeProposals
                .filter(trade => trade.to_team_id === selectedTeam.id && trade.status === 'PENDING')
                .map(trade => {
                  const fromTeam = allTeams.find(t => t.id === trade.from_team_id);
                  const fromPlayers = trade.players?.filter(p => p.from_team) || [];
                  const toPlayers = trade.players?.filter(p => !p.from_team) || [];

                  return (
                    <div
                      key={trade.id}
                      style={{
                        border: '2px solid var(--primary-orange)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <h4 style={{ 
                        margin: '0 0 1rem 0',
                        color: 'var(--primary-orange)'
                      }}>
                        Trade Proposal from {fromTeam?.team_name || 'Unknown Team'}
                      </h4>
                      
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div>
                          <strong>You Receive:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {fromPlayers.map(p => (
                              <li key={p.id}>{getPlayerName(p.team_player_id)}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>You Send:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {toPlayers.map(p => (
                              <li key={p.id}>{getPlayerName(p.team_player_id)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={async () => {
                            try {
                              await leaguesAPI.respondToTrade(trade.id, 'ACCEPT');
                              alert('✅ Trade accepted!');
                              loadTradeProposals();
                            } catch (error) {
                              console.error('Error accepting trade:', error);
                              alert('❌ Failed to accept trade');
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#2ECC71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ Accept Trade
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await leaguesAPI.respondToTrade(trade.id, 'REJECT');
                              alert('Trade rejected');
                              loadTradeProposals();
                            } catch (error) {
                              console.error('Error rejecting trade:', error);
                              alert('❌ Failed to reject trade');
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#C0392B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Reject Trade
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trade;

