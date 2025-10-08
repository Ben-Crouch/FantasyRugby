/**
 * Fantasy Rugby API Service
 * 
 * This module provides a centralized API client for communicating with the Django backend.
 * It handles authentication, request formatting, and error handling for all API endpoints.
 * 
 * Features:
 * - Automatic JWT token management
 * - Centralized error handling
 * - Request/response interceptors
 * - Environment-based configuration
 * 
 * API Endpoints:
 * - Authentication: /auth/login/, /auth/register/, /auth/logout/
 * - Leagues: /user-leagues/, /user-leagues/{id}/join_league/
 * - Teams: /league-teams/
 * - Players: /rugby-players/
 * - Admin: /admin/leagues/{id}/users/{id}/is-admin/
 * 
 * Author: Roland Crouch
 * Date: September 2025
 * Version: 1.0.0
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

// Request deduplication cache
const pendingRequests = new Map();

// Response cache for GET requests
const responseCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Helper function to make API requests
 * 
 * Handles authentication headers, error responses, and token management.
 * Automatically includes JWT tokens from localStorage for authenticated requests.
 * 
 * @param {string} endpoint - API endpoint path (e.g., '/user-leagues/')
 * @param {Object} options - Request options (method, body, headers, etc.)
 * @returns {Promise<Object>} API response data
 * @throws {Error} If request fails or returns error status
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  // Create a unique key for this request
  const requestKey = `${method}_${url}_${JSON.stringify(options.body || {})}`;
  
  // For GET requests, check cache first
  if (method === 'GET') {
    const cacheKey = `${url}_${JSON.stringify(options.body || {})}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`DEBUG: Returning cached response for: ${url}`);
      return cached.data;
    }
  }
  
  // If the same request is already pending, return the existing promise
  if (pendingRequests.has(requestKey)) {
    console.log(`DEBUG: Deduplicating request to: ${url}`);
    return pendingRequests.get(requestKey);
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('access_token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Create the request promise
  const requestPromise = (async () => {
    try {
      console.log('DEBUG: Making API request to:', url);
      const response = await fetch(url, config);
      console.log('DEBUG: API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Only log non-token-expired errors to reduce noise
        if (!errorData.error || !errorData.error.includes('Token has expired')) {
          console.error('DEBUG: API error response:', errorData);
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DEBUG: API response data:', data);
      
      // Cache GET responses
      if (method === 'GET') {
        const cacheKey = `${url}_${JSON.stringify(options.body || {})}`;
        responseCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        console.log(`DEBUG: Cached response for: ${url}`);
      }
      
      return data;
    } catch (error) {
      // Only log non-token-expired errors to reduce noise
      if (!error.message || !error.message.includes('Token has expired')) {
        console.error('API request failed:', error);
      }
      throw error;
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(requestKey);
    }
  })();
  
  // Store the promise in the pending requests map
  pendingRequests.set(requestKey, requestPromise);
  
  return requestPromise;
};

// Authentication API
export const authAPI = {
  register: async (email, password, confirmPassword) => {
    return apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        confirm_password: confirmPassword 
      }),
    });
  },

  login: async (email, password) => {
    return apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  refreshToken: async (refreshToken) => {
    return apiRequest('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  verifyToken: async () => {
    return apiRequest('/auth/verify/');
  },

  logout: async () => {
    return apiRequest('/auth/logout/', {
      method: 'POST',
    });
  },

  requestPasswordReset: async (email) => {
    return apiRequest('/auth/password-reset/request/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordReset: async (token, newPassword) => {
    return apiRequest('/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ 
        token, 
        new_password: newPassword 
      }),
    });
  },
};

// Leagues API
export const tournamentsAPI = {
  getTournaments: async () => {
    return apiRequest('/tournaments/');
  },

  getTournamentAvailability: async () => {
    return apiRequest('/tournament-availability/');
  },

  getLeagueFixtures: async (leagueId) => {
    return apiRequest(`/league-fixtures/?league_id=${leagueId}`);
  },

  getNextMatchup: async (leagueId, userId) => {
    return apiRequest(`/next-matchup/?league_id=${leagueId}&user_id=${userId}`);
  },
};

export const leaguesAPI = {
  getLeagues: async () => {
    return apiRequest('/user-leagues/');
  },

  createLeague: async (leagueData) => {
    return apiRequest('/user-leagues/', {
      method: 'POST',
      body: JSON.stringify(leagueData),
    });
  },

  getLeague: async (leagueId) => {
    return apiRequest(`/user-leagues/${leagueId}/`);
  },

  joinLeague: async (leagueId, teamData) => {
    return apiRequest(`/user-leagues/${leagueId}/join_league/`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  inviteToLeague: async (leagueId, inviteData) => {
    return apiRequest(`/user-leagues/${leagueId}/invite/`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  isUserLeagueAdmin: async (leagueId, userId) => {
    return apiRequest(`/admin/leagues/${leagueId}/users/${userId}/is-admin/`);
  },

  completeDraft: async (leagueId, teamRosters) => {
    return apiRequest(`/leagues/${leagueId}/complete-draft/`, {
      method: 'POST',
      body: JSON.stringify({ team_rosters: teamRosters }),
    });
  },

  startDraft: async (leagueId, userId) => {
    return apiRequest(`/leagues/${leagueId}/start-draft/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  getDraftStatus: async (leagueId) => {
    return apiRequest(`/leagues/${leagueId}/draft-status/`);
  },

  submitWaiverClaim: async (leagueId, claimData) => {
    return apiRequest(`/leagues/${leagueId}/waiver-claims/`, {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  getWaiverClaims: async (leagueId) => {
    return apiRequest(`/leagues/${leagueId}/waiver-claims/`);
  },

  getTrades: async (leagueId) => {
    return apiRequest(`/leagues/${leagueId}/trades/`);
  },

  proposeTrade: async (leagueId, tradeData) => {
    return apiRequest(`/leagues/${leagueId}/trades/`, {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  },

  respondToTrade: async (tradeId, action) => {
    return apiRequest(`/trades/${tradeId}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

// Teams API
export const teamsAPI = {
  getTeams: async () => {
    return apiRequest('/league-teams/');
  },

  getTeamsByLeague: async (leagueId) => {
    return apiRequest(`/league-teams/?league_id=${leagueId}`);
  },

  getUserTeams: async (userId) => {
    return apiRequest(`/league-teams/?user_id=${userId}`);
  },

  createTeam: async (teamData) => {
    return apiRequest('/league-teams/', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  getTeam: async (teamId) => {
    return apiRequest(`/league-teams/${teamId}/`);
  },

  addPlayer: async (teamId, playerData) => {
    return apiRequest(`/league-teams/${teamId}/add_player/`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  removePlayer: async (teamId, playerData) => {
    return apiRequest(`/league-teams/${teamId}/remove_player/`, {
      method: 'DELETE',
      body: JSON.stringify(playerData),
    });
  },

  getTeamPlayers: async (teamId) => {
    return apiRequest(`/league-teams/${teamId}/players/`);
  },

  updatePlayerPosition: async (teamId, playerId, positionData) => {
    return apiRequest(`/league-teams/${teamId}/players/${playerId}/`, {
      method: 'PUT',
      body: JSON.stringify(positionData),
    });
  },
};

// Rugby Players API
export const rugbyPlayersAPI = {
  getPlayers: async (tournamentId = null) => {
    const url = tournamentId ? `/rugby-players/?tournament_id=${tournamentId}` : '/rugby-players/';
    return apiRequest(url);
  },

  getPlayer: async (playerId) => {
    return apiRequest(`/rugby-players/${playerId}/`);
  },
};

// Team Statistics API
export const statisticsAPI = {
  getTeamStatistics: async () => {
    return apiRequest('/team-statistics/');
  },

  createTeamStatistics: async (statsData) => {
    return apiRequest('/team-statistics/', {
      method: 'POST',
      body: JSON.stringify(statsData),
    });
  },

  updateTeamStatistics: async (teamId, statsData) => {
    return apiRequest(`/team-statistics/${teamId}/`, {
      method: 'PUT',
      body: JSON.stringify(statsData),
    });
  },
};

// Admin API
export const adminAPI = {
  removeTeamFromLeague: async (leagueId, teamId) => {
    return apiRequest(`/admin/leagues/${leagueId}/teams/${teamId}/remove/`, {
      method: 'DELETE',
    });
  },

  getLeagueAdmin: async (leagueId) => {
    return apiRequest(`/admin/leagues/${leagueId}/admin-info/`);
  },

  isUserLeagueAdmin: async (leagueId, userId) => {
    return apiRequest(`/admin/leagues/${leagueId}/users/${userId}/is-admin/`);
  },
};
