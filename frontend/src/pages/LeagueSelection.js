import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, tournamentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LeagueSelection = () => {
  const [leagues, setLeagues] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    max_teams: 10,
    max_players_per_team: 15,
    is_public: true,
    tournament_id: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    leagueId: '',
    teamName: ''
  });
  const [joinErrors, setJoinErrors] = useState({});
  const [isJoining, setIsJoining] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching data...');
      const [leaguesData, tournamentsData] = await Promise.all([
        leaguesAPI.getLeagues(),
        tournamentsAPI.getTournaments()
      ]);
      
      console.log('Fetched leagues:', leaguesData);
      console.log('Fetched tournaments:', tournamentsData);
      
      if (leaguesData && Array.isArray(leaguesData)) {
        setLeagues(leaguesData);
        console.log('Leagues set successfully');
      } else {
        setError('Invalid leagues response format from server');
      }
      
      if (tournamentsData && Array.isArray(tournamentsData)) {
        setTournaments(tournamentsData);
        console.log('Tournaments set successfully');
      } else {
        console.warn('No tournaments available or invalid response format');
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateLeague = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!createFormData.name.trim()) {
      errors.name = 'League name is required';
    }
    if (!createFormData.tournament_id) {
      errors.tournament_id = 'Please select a tournament';
    }
    if (createFormData.max_teams < 2 || createFormData.max_teams > 12) {
      errors.max_teams = 'Max teams must be between 2 and 12';
    }
    if (createFormData.max_players_per_team !== 15) {
      errors.max_players_per_team = 'Each team must have exactly 15 players';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    // Check if user is authenticated
    if (!user || !user.id) {
      setCreateErrors({ general: 'You must be logged in to create a league' });
      return;
    }

    setIsCreating(true);
    setCreateErrors({});

    try {
      const newLeague = await leaguesAPI.createLeague({
        ...createFormData,
        user_id: user.id
      });
      console.log('Created league:', newLeague);
      setLeagues(prev => {
        console.log('Previous leagues:', prev);
        const updated = [newLeague, ...prev];
        console.log('Updated leagues:', updated);
        return updated;
      });
      setShowCreateForm(false);
      setCreateFormData({
        name: '',
        description: '',
        max_teams: 10,
        max_players_per_team: 15,
        is_public: true
      });
    } catch (error) {
      console.error('Error creating league:', error);
      setCreateErrors({ general: 'Failed to create league. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user || !user.id) {
      setJoinErrors({ general: 'You must be logged in to join a league' });
      return;
    }
    
    const errors = {};
    if (!joinFormData.leagueId) {
      errors.leagueId = 'Please select a league';
    }
    if (!joinFormData.teamName.trim()) {
      errors.teamName = 'Team name is required';
    }

    if (Object.keys(errors).length > 0) {
      setJoinErrors(errors);
      return;
    }

    setIsJoining(true);
    setJoinErrors({});

    try {
      console.log('DEBUG: Joining league with data:', {
        leagueId: joinFormData.leagueId,
        teamName: joinFormData.teamName,
        userId: user?.id,
        userObject: user
      });
      
      await leaguesAPI.joinLeague(joinFormData.leagueId, {
        team_name: joinFormData.teamName,
        user_id: user.id
      });
      navigate('/league-dashboard', { 
        state: { 
          leagueId: joinFormData.leagueId,
          teamName: joinFormData.teamName 
        }
      });
    } catch (error) {
      console.error('Join league error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage === 'You are already in this league') {
          setJoinErrors({ 
            general: 'You are already in this league! Check "My Leagues" to view your teams.' 
          });
        } else {
          setJoinErrors({ general: errorMessage });
        }
      } else {
        setJoinErrors({ general: 'Failed to join league. Please try again.' });
      }
    } finally {
      setIsJoining(false);
    }
  };


  if (loading) {
    return <LoadingSpinner message="Loading leagues..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
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
                height: '40px',
                objectFit: 'contain'
              }}
            />
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: 'var(--databricks-blue)',
              margin: '0'
            }}>
              Fantasy Rugby
            </h1>
          </div>
          <p style={{ 
            fontSize: '18px', 
            color: 'var(--neutral-600)', 
            margin: '0 0 24px 0',
            textAlign: 'center'
          }}>
            Join an existing league or create your own
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ padding: '48px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ 
              color: 'var(--databricks-red)', 
              margin: '0 0 16px 0',
              fontSize: '20px'
            }}>
              Error Loading Leagues
            </h3>
            <p style={{ 
              color: 'var(--neutral-600)', 
              margin: '0 0 24px 0',
              fontSize: '16px'
            }}>
              {error}
            </p>
            <button 
              onClick={fetchData}
              className="btn btn-primary"
              style={{ fontSize: '14px' }}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
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
              height: '40px',
              objectFit: 'contain'
            }}
          />
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--databricks-blue)',
            margin: '0'
          }}>
            Fantasy Rugby
          </h1>
        </div>
        <p style={{ 
          fontSize: '18px', 
          color: 'var(--neutral-600)', 
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          Join an existing league or create your own
        </p>
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => navigate('/my-leagues')}
            className="btn btn-primary"
            style={{ fontSize: '14px' }}
          >
            📋 My Leagues
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Create League Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--neutral-200)',
          padding: '16px 24px',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: 'var(--databricks-blue)',
              margin: '0',
              padding: '0',
              lineHeight: '1.2'
            }}>
              Create New League
            </h3>
            <p style={{ 
              color: 'var(--neutral-600)', 
              margin: '0',
              padding: '0',
              fontSize: '14px',
              lineHeight: '1.2'
            }}>
              Start your own fantasy rugby league
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
            style={{ fontSize: '14px' }}
          >
            {showCreateForm ? '✖️ Cancel' : '➕ Create League'}
          </button>
        </div>
        
        {showCreateForm && (
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleCreateLeague}>
                {createErrors.general && (
                  <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {createErrors.general}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">League Name</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`form-input ${createErrors.name ? 'error' : ''}`}
                    placeholder="Enter league name"
                  />
                  {createErrors.name && (
                    <div className="form-error">{createErrors.name}</div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Tournament</label>
                  <select
                    value={createFormData.tournament_id}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, tournament_id: e.target.value }))}
                    className={`form-input ${createErrors.tournament_id ? 'error' : ''}`}
                  >
                    <option value="">Select a tournament...</option>
                    {tournaments.map(tournament => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                  {createErrors.tournament_id && (
                    <div className="form-error">{createErrors.tournament_id}</div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    placeholder="Describe your league (optional)"
                    rows="3"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Max Teams</label>
                  <input
                    type="number"
                    value={createFormData.max_teams}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, max_teams: parseInt(e.target.value) }))}
                    className={`form-input ${createErrors.max_teams ? 'error' : ''}`}
                    min="2"
                    max="12"
                  />
                  {createErrors.max_teams && (
                    <div className="form-error">{createErrors.max_teams}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                  style={{ width: '100%', fontSize: '14px' }}
                >
                  {isCreating ? '⏳ Creating...' : '🚀 Create League'}
                </button>
            </form>
          </div>
        )}

        {/* Join League Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: 'var(--databricks-blue)',
              margin: '0 0 8px 0'
            }}>
              Join Existing League
            </h3>
                          <p style={{ 
                            color: 'var(--neutral-600)', 
                            margin: '0',
                            fontSize: '14px'
                          }}>
              {leagues.length === 0 ? 'No leagues available' : `${leagues.length} league${leagues.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          
          <div style={{ padding: '24px' }}>
            {leagues.length === 0 ? (
              <div className="alert alert-info" style={{ 
                textAlign: 'center',
                padding: '24px',
                backgroundColor: 'var(--databricks-light-blue)',
                border: '1px solid var(--databricks-blue)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏉</div>
                <p style={{ margin: '0', fontSize: '16px', color: 'var(--databricks-blue)' }}>
                  No leagues available. Create a new league to get started!
                </p>
              </div>
            ) : (
              <form onSubmit={handleJoinLeague}>
                {joinErrors.general && (
                  <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {joinErrors.general}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Select League</label>
                  <select
                    value={joinFormData.leagueId}
                    onChange={(e) => setJoinFormData(prev => ({ ...prev, leagueId: e.target.value }))}
                    className={`form-input ${joinErrors.leagueId ? 'error' : ''}`}
                  >
                    <option value="">Choose a league...</option>
                    {leagues.map(league => (
                      <option key={league.id} value={league.id}>
                        {league.name} ({league.is_public ? 'Public' : 'Private'}) - Max {league.max_teams} teams
                      </option>
                    ))}
                  </select>
                  {joinErrors.leagueId && (
                    <div className="form-error">{joinErrors.leagueId}</div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Your Team Name</label>
                  <input
                    type="text"
                    value={joinFormData.teamName}
                    onChange={(e) => setJoinFormData(prev => ({ ...prev, teamName: e.target.value }))}
                    className={`form-input ${joinErrors.teamName ? 'error' : ''}`}
                    placeholder="Enter your team name"
                  />
                  {joinErrors.teamName && (
                    <div className="form-error">{joinErrors.teamName}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isJoining || !joinFormData.leagueId}
                  style={{ width: '100%', fontSize: '14px' }}
                >
                  {isJoining ? '⏳ Joining...' : '🏆 Join League'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueSelection;
