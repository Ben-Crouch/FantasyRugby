/**
 * Enhanced League Dashboard Component
 * 
 * This component provides a comprehensive league management interface with three main tabs:
 * - League Table: Shows team standings and statistics
 * - Fixtures: Displays upcoming matches (placeholder for future implementation)
 * - My Team: Shows the user's drafted team with player details
 * 
 * Features:
 * - Tab-based navigation
 * - Team standings and statistics
 * - Draft completion tracking
 * - Player management interface
 * - Admin controls for league management
 * 
 * Author: Roland Crouch
 * Date: September 2025
 * Version: 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaguesAPI, teamsAPI, rugbyPlayersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LeagueDashboard = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [myTeamPlayers, setMyTeamPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('league-table');
  const [draftComplete, setDraftComplete] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const leagueId = location.state?.leagueId || 1;
        
        // Fetch league data
        const leagues = await leaguesAPI.getLeagues();
        const league = leagues.find(l => l.id === leagueId);
        
        if (league) {
          setLeagueData(league);
        } else {
          setLeagueData({
            id: leagueId,
            name: 'Fantasy League',
            description: 'A competitive fantasy rugby league',
            max_teams: 12,
            max_players_per_team: 15,
            is_public: true
          });
        }
        
        // Fetch teams in the league
        const allTeams = await teamsAPI.getTeams();
        const teamsData = allTeams.filter(team => team.league_id === leagueId);
        setTeams(teamsData || []);
        
        // Find user's team in this league
        if (user && user.id) {
          const userTeam = teamsData.find(team => team.user_id === user.id);
          if (userTeam) {
            setMyTeam(userTeam);
            // Load team players (this would be from a team_players table in a real implementation)
            // For now, we'll simulate this
            setMyTeamPlayers([]);
          }
        }
        
        // Fetch all players for reference
        const playersData = await rugbyPlayersAPI.getPlayers();
        setAllPlayers(playersData || []);
        
        // Check if current user is the admin of this league
        if (league && user && user.id) {
          try {
            const adminCheck = await leaguesAPI.isUserLeagueAdmin(leagueId, user.id);
            setIsAdmin(adminCheck.is_admin || false);
          } catch (error) {
            console.warn('Could not check admin status:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        
        // Check if draft is complete (simplified logic)
        setDraftComplete(teamsData.length > 0);
        
      } catch (err) {
        console.error('Error loading league data:', err);
        setError('Failed to load league data');
        
        // Fallback data
        setLeagueData({
          id: location.state?.leagueId || 1,
          name: 'Fantasy League',
          description: 'A competitive fantasy rugby league',
          max_teams: 12,
          max_players_per_team: 15,
          is_public: true
        });
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state, user]);

  const handleStartDraft = () => {
    navigate('/draft', { state: { leagueId: leagueData.id } });
  };

  const handleBackToLeagues = () => {
    navigate('/league-selection');
  };

  const renderLeagueTable = () => {
    if (!teams.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No teams in this league yet.</p>
          {isAdmin && (
            <button
              onClick={handleStartDraft}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Draft
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">League Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Position</th>
                <th className="px-4 py-2 text-left">Team Name</th>
                <th className="px-4 py-2 text-left">Manager</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Wins</th>
                <th className="px-4 py-2 text-left">Losses</th>
                <th className="px-4 py-2 text-left">Draws</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-semibold">{index + 1}</td>
                  <td className="px-4 py-2">
                    <span className="font-medium">{team.team_name}</span>
                    {myTeam && myTeam.id === team.id && (
                      <span className="ml-2 text-blue-600 text-sm">(Your Team)</span>
                    )}
                  </td>
                  <td className="px-4 py-2">Manager {team.user_id}</td>
                  <td className="px-4 py-2 font-semibold">0</td>
                  <td className="px-4 py-2">0</td>
                  <td className="px-4 py-2">0</td>
                  <td className="px-4 py-2">0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isAdmin && !draftComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={handleStartDraft}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Draft
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFixtures = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Fixtures</h3>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Fixtures will be available once the season starts.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Coming Soon:</strong> Match scheduling, results tracking, and live updates will be available in future updates.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMyTeam = () => {
    if (!myTeam) {
      return (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">My Team</h3>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You are not part of this league.</p>
            <button
              onClick={() => navigate('/league-selection')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Join a League
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">My Team: {myTeam.team_name}</h3>
        
        {!draftComplete ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">The draft has not started yet.</p>
            {isAdmin && (
              <button
                onClick={handleStartDraft}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Start Draft
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2">Team Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-xl font-semibold">{myTeamPlayers.length}/15</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Points</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Wins</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Losses</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-4">Squad</h4>
              {myTeamPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No players drafted yet.</p>
                  {isAdmin && (
                    <button
                      onClick={handleStartDraft}
                      className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Start Draft
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeamPlayers.map((player, index) => (
                    <div key={player.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h5 className="font-medium">{player.name}</h5>
                      <p className="text-sm text-gray-600">{player.position}</p>
                      <p className="text-sm text-gray-500">{player.team}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 text-center mt-4">{error}</div>
        <button
          onClick={handleBackToLeagues}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Leagues
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{leagueData?.name}</h1>
            <p className="text-gray-600 mt-2">{leagueData?.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              <span>Teams: {teams.length}/{leagueData?.max_teams}</span>
              <span className="ml-4">Players per team: {leagueData?.max_players_per_team}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleBackToLeagues}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Leagues
            </button>
            {isAdmin && !draftComplete && (
              <button
                onClick={handleStartDraft}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Start Draft
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('league-table')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'league-table'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              League Table
            </button>
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fixtures'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fixtures
            </button>
            <button
              onClick={() => setActiveTab('my-team')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Team
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'league-table' && renderLeagueTable()}
        {activeTab === 'fixtures' && renderFixtures()}
        {activeTab === 'my-team' && renderMyTeam()}
      </div>
    </div>
  );
};

export default LeagueDashboard;