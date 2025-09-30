import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LeagueSelection = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    max_teams: 10,
    max_players_per_team: 15,
    is_public: true
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
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching leagues...');
      const data = await leaguesAPI.getLeagues();
      console.log('Fetched leagues:', data);
      
      if (data && Array.isArray(data)) {
        setLeagues(data);
        console.log('Leagues set successfully');
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setError(`Failed to load your leagues: ${error.message}`);
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <div className="alert alert-error">
            {error}
          </div>
          <button 
            onClick={fetchLeagues}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Choose Your League</h2>
              <p style={{ color: 'var(--dark-gray)', margin: 0 }}>
                Join an existing league or create your own
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={fetchLeagues}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--gray)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Refresh
              </button>
              <button
                onClick={() => navigate('/my-leagues')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--black)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                My Leagues
              </button>
            </div>
          </div>
        </div>

        {/* Create League Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Create New League</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Create League'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateLeague} style={{ marginBottom: '1rem' }}>
              {createErrors.general && (
                <div className="alert alert-error">
                  {createErrors.general}
                </div>
              )}

              <div className="form-group">
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

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  placeholder="Describe your league (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
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
              >
                {isCreating ? 'Creating...' : 'Create League'}
              </button>
            </form>
          )}
        </div>

        {/* Join League Section */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Join Existing League</h3>
          
          {leagues.length === 0 ? (
            <div className="alert alert-info">
              No leagues available. Create a new league to get started!
            </div>
          ) : (
            <form onSubmit={handleJoinLeague}>
              {joinErrors.general && (
                <div className="alert alert-error">
                  {joinErrors.general}
                </div>
              )}

              <div className="form-group">
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

              <div className="form-group">
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
                className="btn btn-primary btn-large"
                disabled={isJoining || !joinFormData.leagueId}
                style={{ width: '100%' }}
              >
                {isJoining ? 'Joining...' : 'Join League'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueSelection;
