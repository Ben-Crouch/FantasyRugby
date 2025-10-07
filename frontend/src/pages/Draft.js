import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Import custom hooks
import { useDraftData } from '../hooks/useDraftData';
import { useDraftState } from '../hooks/useDraftState';
import { usePlayerFilters } from '../hooks/usePlayerFilters';

// Import components
import DraftHeader from '../components/draft/DraftHeader';
import DraftControls from '../components/draft/DraftControls';
import DraftStatus from '../components/draft/DraftStatus';
import PlayerFilters from '../components/draft/PlayerFilters';
import PlayerList from '../components/draft/PlayerList';
import MyTeamView from '../components/draft/MyTeamView';
import PlayerConfirmModal from '../components/draft/PlayerConfirmModal';
import DraftSectionMenu from '../components/draft/DraftSectionMenu';
import DraftOrderView from '../components/draft/DraftOrderView';

const Draft = () => {
  const [activeTab, setActiveTab] = useState('pick'); // 'pick' or 'team'
  const [draftSectionView, setDraftSectionView] = useState('players'); // 'players' or 'order'
  const [showDraftOrderModal, setShowDraftOrderModal] = useState(false);
  const [selectedPlayerForConfirm, setSelectedPlayerForConfirm] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const leagueId = location.state?.leagueId;

  // Load draft data
  const { leagueData, teams, players, loading, error, isAdmin } = useDraftData(
    leagueId,
    user,
    authLoading
  );

  // Draft state management
  const {
    draftStarted,
    draftPaused,
    currentPick,
    currentTeam,
    timeRemaining,
    selectedPlayers,
    draftComplete,
    setDraftComplete,
    handleStartDraft,
    handleShuffleDraft,
    handlePauseDraft,
    handleResumeDraft,
    handleSelectPlayer,
    markUserActive,
    markUserInactive,
    totalPicks
  } = useDraftState(teams, players);

  // Player filtering
  const {
    filteredPlayers,
    selectedPosition,
    setSelectedPosition,
    searchName,
    setSearchName
  } = usePlayerFilters(players, selectedPlayers, currentTeam?.id);

  // Mark current user as active when component mounts
  useEffect(() => {
    if (user && user.id) {
      markUserActive(user.id);
      
      // Mark inactive when component unmounts
      return () => markUserInactive(user.id);
    }
  }, [user, markUserActive, markUserInactive]);

  // Check draft status and auto-start if LIVE
  useEffect(() => {
    const checkAndStartDraft = async () => {
      if (!leagueId || !leagueData) return;
      
      try {
        const statusResult = await leaguesAPI.getDraftStatus(leagueId);
        if (statusResult.draft_status === 'LIVE' && !draftStarted) {
          // Draft is live in the database but not started locally
          // Auto-start the local draft
          console.log('Draft is LIVE in database, starting locally...');
          handleStartDraft();
        }
      } catch (error) {
        console.error('Error checking draft status:', error);
      }
    };
    
    checkAndStartDraft();
  }, [leagueId, leagueData, draftStarted, handleStartDraft]);

  // Handlers
  const handleBackToLeague = () => {
    navigate('/league-dashboard', { state: { leagueId: leagueData?.id } });
  };

  const handlePlayerSelect = (player) => {
    if (!currentTeam || !user) return;
    const teamUserId = currentTeam.user_id || currentTeam.team_owner_user_id;
    if (teamUserId !== user.id.toString()) return;
    // Show confirmation modal
    setSelectedPlayerForConfirm(player);
  };

  const handleConfirmSelection = () => {
    if (selectedPlayerForConfirm && currentTeam) {
      handleSelectPlayer(selectedPlayerForConfirm, currentTeam.id);
      setSelectedPlayerForConfirm(null);
    }
  };

  const handleCancelSelection = () => {
    setSelectedPlayerForConfirm(null);
  };

  const handleViewDraftOrder = () => {
    setShowDraftOrderModal(true);
  };

  const handleCloseDraftOrderModal = () => {
    setShowDraftOrderModal(false);
  };

  const handleStartDraftWithAPI = async () => {
    try {
      // Call backend API to update draft status to LIVE
      await leaguesAPI.startDraft(leagueId, user.id);
      // Then start the draft locally
      handleStartDraft();
    } catch (error) {
      console.error('Error starting draft:', error);
      alert('Failed to start draft. Please try again.');
    }
  };

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleCompleteDraft = async () => {
    if (isSavingDraft) return; // Prevent duplicate submissions
    
    try {
      setIsSavingDraft(true);
      
      // Optimized team roster preparation
      const requiredPositions = {
        'Prop': 1, 'Hooker': 1, 'Lock': 1, 'Back Row': 2,
        'Scrum-half': 1, 'Fly-half': 1, 'Centre': 1, 'Back Three': 2
      };

      const teamRosters = teams.map(team => {
        const teamPlayers = selectedPlayers[team.id] || [];
        const positionCounts = {};
        
        // Process players more efficiently
        const processedPlayers = teamPlayers.map(player => {
          const position = player.fantasy_position;
          const currentCount = positionCounts[position] || 0;
          const required = requiredPositions[position] || 0;
          
          const isStarting = currentCount < required;
          positionCounts[position] = currentCount + 1;
          
          return {
            id: player.id,
            position: player.position,
            fantasy_position: player.fantasy_position,
            is_starting: isStarting
          };
        });
        
        return {
          team_id: team.id,
          user_id: team.team_owner_user_id || team.user_id,
          players: processedPlayers
        };
      });
      
      console.log('Saving team rosters:', teamRosters);
      
      // Save all team rosters to the backend
      await leaguesAPI.completeDraft(leagueId, teamRosters);
      navigate('/league-dashboard', { state: { leagueId } });
    } catch (error) {
      console.error('Error completing draft:', error);
      alert('Failed to save draft results. Please try again.');
      setIsSavingDraft(false);
    }
  };

  // Loading and error states
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-red)' }}>Error</h2>
          <p style={{ color: 'var(--dark-gray)', margin: '1rem 0' }}>{error}</p>
          <button
            onClick={() => navigate('/my-leagues')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Back to My Leagues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <DraftHeader
        leagueData={leagueData}
        teams={teams}
        onBackToLeague={handleBackToLeague}
      />

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Tab Navigation */}
          <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--light-gray)' }}>
          <button
            onClick={() => setActiveTab('pick')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'pick' ? 'var(--primary-orange)' : 'white',
              color: activeTab === 'pick' ? 'white' : 'var(--dark-gray)',
              border: 'none',
              borderBottom: activeTab === 'pick' ? '3px solid var(--primary-orange)' : 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            Pick Players
          </button>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'team' ? 'var(--primary-orange)' : 'white',
              color: activeTab === 'team' ? 'white' : 'var(--dark-gray)',
              border: 'none',
              borderBottom: activeTab === 'team' ? '3px solid var(--primary-orange)' : 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            My Team
          </button>
        </div>
      </div>

      {/* Draft Controls */}
      {!draftStarted && (
        <DraftControls
          draftStarted={draftStarted}
          isAdmin={isAdmin}
          onStartDraft={handleStartDraftWithAPI}
          onShuffleDraft={handleShuffleDraft}
          onViewDraftOrder={handleViewDraftOrder}
          disabled={teams.length === 0}
        />
      )}

      {/* Pause/Resume Controls */}
      {draftStarted && !draftComplete && isAdmin && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Draft Controls</h3>
          </div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            {!draftPaused ? (
              <button
                onClick={handlePauseDraft}
                style={{
                  backgroundColor: 'var(--primary-orange)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginRight: '1rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E85D00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange)'}
              >
                ⏸️ Pause Draft
              </button>
            ) : (
              <button
                onClick={handleResumeDraft}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginRight: '1rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
              >
                ▶️ Resume Draft
              </button>
            )}
            <button
              onClick={handleViewDraftOrder}
              style={{
                backgroundColor: 'var(--light-gray)',
                color: 'var(--black)',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '6px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
            >
              📋 View Draft Order
            </button>
          </div>
        </div>
      )}

      {/* Draft Status */}
      {draftStarted && activeTab === 'pick' && (
        <DraftStatus
          draftStarted={draftStarted}
          draftPaused={draftPaused}
          currentPick={currentPick}
          currentTeam={currentTeam}
          timeRemaining={timeRemaining}
          totalPicks={totalPicks}
          user={user}
          selectedPlayers={selectedPlayers}
          teams={teams}
        />
      )}

      {/* Pick Players Tab */}
      {activeTab === 'pick' && draftStarted && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ margin: 0 }}>
              {draftSectionView === 'players' ? 'Available Players' : 'Draft Order'}
            </h2>
            <DraftSectionMenu 
              activeView={draftSectionView}
              setActiveView={setDraftSectionView}
            />
          </div>
          
          {draftSectionView === 'players' ? (
            <>
              <PlayerFilters
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                searchName={searchName}
                setSearchName={setSearchName}
              />
              <PlayerList
                players={filteredPlayers}
                selectedPlayers={selectedPlayers}
                onSelectPlayer={handlePlayerSelect}
                currentTeam={currentTeam}
                user={user}
              />
            </>
          ) : (
            <DraftOrderView
              teams={teams}
              currentTeam={currentTeam}
              selectedPlayers={selectedPlayers}
              user={user}
            />
          )}
        </div>
      )}

      {/* My Team Tab */}
      {activeTab === 'team' && (
        <MyTeamView 
          teams={teams} 
          selectedPlayers={selectedPlayers}
          user={user}
        />
      )}

      {/* Player Confirmation Modal */}
      <PlayerConfirmModal
        player={selectedPlayerForConfirm}
        onConfirm={handleConfirmSelection}
        onCancel={handleCancelSelection}
      />

      {/* Draft Complete Modal */}
      {draftComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '500px', 
            padding: '2rem',
            textAlign: 'center' 
          }}>
            <h2 style={{ 
              color: 'var(--primary-orange)', 
              marginBottom: '1rem' 
            }}>
              🎉 Draft Complete!
            </h2>
            <p style={{ 
              color: 'var(--dark-gray)', 
              marginBottom: '2rem',
              fontSize: '1.1rem' 
            }}>
              All teams have been drafted. Click below to save the results and return to the league dashboard.
            </p>
            <button
              onClick={handleCompleteDraft}
              disabled={isSavingDraft}
              style={{
                backgroundColor: isSavingDraft ? 'var(--light-gray)' : 'var(--primary-orange)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: isSavingDraft ? 'not-allowed' : 'pointer',
                opacity: isSavingDraft ? 0.6 : 1,
                minWidth: '250px'
              }}
            >
              {isSavingDraft ? '💾 Saving...' : '✅ Complete & Go to Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/* Draft Order Modal */}
      {showDraftOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '900px', 
            maxHeight: '80vh',
            padding: '2rem',
            overflow: 'auto',
            margin: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>📊 Draft Order</h2>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleShuffleDraft}
                  disabled={teams.length === 0}
                  style={{
                    backgroundColor: teams.length === 0 ? 'var(--gray)' : 'var(--black)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '6px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: teams.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: teams.length === 0 ? 0.6 : 1
                  }}
                >
                  Shuffle Draft Order
                </button>
              </div>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <button
                  onClick={handleCloseDraftOrderModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: 'var(--neutral-600)',
                    padding: '0.5rem'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <DraftOrderView 
              teams={teams}
              currentTeam={currentTeam}
              selectedPlayers={selectedPlayers}
              user={user}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Draft;

