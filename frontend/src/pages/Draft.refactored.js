import React, { useState } from 'react';
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
import TeamRoster from '../components/draft/TeamRoster';

const Draft = () => {
  const [activeTab, setActiveTab] = useState('pick'); // 'pick' or 'team'
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
    currentPick,
    currentTeam,
    timeRemaining,
    draftOrder,
    selectedPlayers,
    draftComplete,
    setDraftComplete,
    handleStartDraft,
    handleShuffleDraft,
    handleSelectPlayer,
    totalPicks
  } = useDraftState(teams);

  // Player filtering
  const {
    filteredPlayers,
    selectedPosition,
    setSelectedPosition,
    searchName,
    setSearchName
  } = usePlayerFilters(players, selectedPlayers);

  // Handlers
  const handleBackToLeague = () => {
    navigate('/league-dashboard', { state: { leagueId: leagueData?.id } });
  };

  const handlePlayerSelect = (player) => {
    if (!currentTeam || !user) return;
    if (currentTeam.user_id !== user.id.toString()) return;
    handleSelectPlayer(player, currentTeam.id);
  };

  const handleCompleteDraft = async () => {
    try {
      // Save all team rosters to the backend
      await leaguesAPI.completeDraft(leagueId, selectedPlayers);
      navigate('/league-dashboard', { state: { leagueId } });
    } catch (error) {
      console.error('Error completing draft:', error);
      alert('Failed to save draft results. Please try again.');
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <DraftHeader
        leagueData={leagueData}
        teams={teams}
        onBackToLeague={handleBackToLeague}
      />

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
            Team Rosters
          </button>
        </div>
      </div>

      {/* Draft Controls */}
      {!draftStarted && (
        <DraftControls
          draftStarted={draftStarted}
          isAdmin={isAdmin}
          onStartDraft={handleStartDraft}
          onShuffleDraft={handleShuffleDraft}
          disabled={teams.length === 0}
        />
      )}

      {/* Draft Status */}
      {draftStarted && activeTab === 'pick' && (
        <DraftStatus
          draftStarted={draftStarted}
          currentPick={currentPick}
          currentTeam={currentTeam}
          timeRemaining={timeRemaining}
          totalPicks={totalPicks}
          user={user}
        />
      )}

      {/* Pick Players Tab */}
      {activeTab === 'pick' && draftStarted && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Available Players</h2>
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
        </div>
      )}

      {/* Team Rosters Tab */}
      {activeTab === 'team' && (
        <TeamRoster teams={teams} selectedPlayers={selectedPlayers} />
      )}

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
              All teams have been drafted. You can now view the league table and manage your team.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCompleteDraft}
                style={{
                  backgroundColor: 'var(--primary-orange)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Complete Draft & Save Teams
              </button>
              <button
                onClick={() => setDraftComplete(false)}
                style={{
                  backgroundColor: 'var(--light-gray)',
                  color: 'var(--black)',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Continue Drafting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Draft;



