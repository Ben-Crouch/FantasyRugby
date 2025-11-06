import React, { useState, useEffect, useCallback } from 'react';
import { leaguesAPI, teamsAPI } from '../services/api';

const Trade = ({ selectedTeam, rugbyPlayers, teamPlayers, user, leagueId, allTeams, onLoadRugbyPlayers, isActive }) => {
  const [activeTradeTab, setActiveTradeTab] = useState('propose'); // 'propose', 'received', or 'sent'
  const [selectedTradePartner, setSelectedTradePartner] = useState(null);
  const [mySelectedPlayers, setMySelectedPlayers] = useState([]);
  const [theirSelectedPlayers, setTheirSelectedPlayers] = useState([]);
  const [tradeProposals, setTradeProposals] = useState([]);
  const [partnerPlayers, setPartnerPlayers] = useState([]);
  const [loadingPartnerPlayers, setLoadingPartnerPlayers] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load rugby players when component mounts
  useEffect(() => {
    if (onLoadRugbyPlayers && rugbyPlayers.length === 0) {
      onLoadRugbyPlayers();
    }
  }, [onLoadRugbyPlayers, rugbyPlayers.length]);

  const loadTradeProposals = useCallback(async () => {
    try {
      const trades = await leaguesAPI.getTrades(leagueId);
      setTradeProposals(trades || []);
    } catch (error) {
      console.error('Error loading trade proposals:', error);
    }
  }, [leagueId]);

  useEffect(() => {
    if (leagueId && isActive) {
      loadTradeProposals();
    }
  }, [leagueId, isActive, loadTradeProposals]);

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

      // Show success modal
      setShowSuccessModal(true);

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
      <div className="card-header">
        <h3 style={{ 
          margin: 0, 
          color: 'var(--databricks-blue)',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          🔄 Trade Center
        </h3>
        <p style={{
          margin: '4px 0 0 0',
          color: 'var(--neutral-600)',
          fontSize: '14px'
        }}>
          Propose and manage player trades with other teams
        </p>
      </div>

      {/* Trade Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--neutral-200)',
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setActiveTradeTab('propose')}
          className="btn"
          style={{
            backgroundColor: activeTradeTab === 'propose' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTradeTab === 'propose' ? 'white' : 'var(--neutral-700)',
            border: activeTradeTab === 'propose' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📤 Propose Trade
        </button>
        <button
          onClick={() => setActiveTradeTab('received')}
          className="btn"
          style={{
            backgroundColor: activeTradeTab === 'received' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTradeTab === 'received' ? 'white' : 'var(--neutral-700)',
            border: activeTradeTab === 'received' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📥 Received {tradeProposals.filter(t => t.to_team_id === selectedTeam.id && t.status === 'PENDING').length > 0 && `(${tradeProposals.filter(t => t.to_team_id === selectedTeam.id && t.status === 'PENDING').length})`}
        </button>
        <button
          onClick={() => setActiveTradeTab('sent')}
          className="btn"
          style={{
            backgroundColor: activeTradeTab === 'sent' ? 'var(--databricks-blue)' : 'transparent',
            color: activeTradeTab === 'sent' ? 'white' : 'var(--neutral-700)',
            border: activeTradeTab === 'sent' ? '1px solid var(--databricks-blue)' : '1px solid var(--neutral-200)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📨 Sent {tradeProposals.filter(t => t.from_team_id === selectedTeam.id).length > 0 && `(${tradeProposals.filter(t => t.from_team_id === selectedTeam.id).length})`}
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

      {/* Sent Proposals Tab */}
      {activeTradeTab === 'sent' && (
        <div>
          {tradeProposals.filter(trade => trade.from_team_id === selectedTeam.id).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--dark-gray)'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</p>
              <p style={{ fontSize: '1.1rem' }}>No sent trade proposals</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Trade proposals you send to other teams will appear here
              </p>
            </div>
          ) : (
            <div>
              {tradeProposals
                .filter(trade => trade.from_team_id === selectedTeam.id)
                .map(trade => {
                  const toTeam = allTeams.find(t => t.id === trade.to_team_id);

                  // Parse player IDs from JSON strings
                  let offeredPlayerIds = [];
                  let requestedPlayerIds = [];
                  try {
                    offeredPlayerIds = JSON.parse(trade.players_offered || '[]');
                    requestedPlayerIds = JSON.parse(trade.players_requested || '[]');
                  } catch (e) {
                    console.error('Error parsing player IDs:', e);
                  }

                  const getStatusBadge = (status) => {
                    const styles = {
                      'PENDING': { bg: '#FFF3CD', color: '#856404', text: '⏳ Pending' },
                      'ACCEPTED': { bg: '#D4EDDA', color: '#155724', text: '✅ Accepted' },
                      'REJECTED': { bg: '#F8D7DA', color: '#721C24', text: '❌ Rejected' }
                    };
                    const style = styles[status] || styles['PENDING'];
                    return (
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '12px',
                        backgroundColor: style.bg,
                        color: style.color,
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {style.text}
                      </span>
                    );
                  };

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
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{
                          margin: 0,
                          color: 'var(--primary-orange)'
                        }}>
                          Trade Proposal to {toTeam?.team_name || 'Unknown Team'}
                        </h4>
                        {getStatusBadge(trade.status)}
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.5rem',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <strong>You Offered:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {offeredPlayerIds.map(playerId => (
                              <li key={playerId}>{getPlayerName(playerId)}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>You Requested:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {requestedPlayerIds.map(playerId => (
                              <li key={playerId}>{getPlayerName(playerId)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {trade.status === 'ACCEPTED' && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#D4EDDA',
                          borderRadius: '6px',
                          color: '#155724',
                          fontSize: '0.9rem'
                        }}>
                          ✅ This trade was accepted! Players have been swapped and added to benches.
                        </div>
                      )}

                      {trade.status === 'REJECTED' && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#F8D7DA',
                          borderRadius: '6px',
                          color: '#721C24',
                          fontSize: '0.9rem'
                        }}>
                          ❌ This trade was rejected by {toTeam?.team_name || 'the other team'}.
                        </div>
                      )}

                      {trade.status === 'PENDING' && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#FFF3CD',
                          borderRadius: '6px',
                          color: '#856404',
                          fontSize: '0.9rem'
                        }}>
                          ⏳ Waiting for {toTeam?.team_name || 'the other team'} to respond...
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: 'var(--primary-orange)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Trade Proposal Sent!
            </h3>

            <div style={{
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              <p style={{
                margin: 0,
                color: 'var(--black)',
                fontSize: '1rem'
              }}>
                Your trade proposal has been sent successfully. The other team will be notified and can review your offer.
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e67e22'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-orange)'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trade;

