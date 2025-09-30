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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
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
};

// Leagues API
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

  isUserLeagueAdmin: async (leagueId, userId) => {
    return apiRequest(`/admin/leagues/${leagueId}/users/${userId}/is-admin/`);
  },

  completeDraft: async (leagueId, teamRosters) => {
    return apiRequest(`/leagues/${leagueId}/complete-draft/`, {
      method: 'POST',
      body: JSON.stringify({ team_rosters: teamRosters }),
    });
  },
};

// Teams API
export const teamsAPI = {
  getTeams: async () => {
    return apiRequest('/league-teams/');
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
};

// Rugby Players API
export const rugbyPlayersAPI = {
  getPlayers: async () => {
    return apiRequest('/rugby-players/');
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
