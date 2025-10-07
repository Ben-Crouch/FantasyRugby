import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          // Verify token is still valid
          const response = await authAPI.verifyToken(storedToken);
          if (response && response.success && response.user) {
            setUser(response.user);
            setToken(storedToken);
          } else {
            // Token is invalid, try to refresh it
            try {
              const newToken = await refreshToken();
              if (newToken) {
                // Token refreshed successfully, verify it
                const verifyResponse = await authAPI.verifyToken(newToken);
                if (verifyResponse && verifyResponse.success && verifyResponse.user) {
                  setUser(verifyResponse.user);
                  setToken(newToken);
                } else {
                  // Refresh token is also invalid, clear everything
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                }
              }
            } catch (refreshError) {
              // Refresh failed, clear all tokens
              console.log('Token refresh failed, clearing tokens');
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
          }
        }
      } catch (error) {
        // Only log non-token-expired errors to reduce noise
        if (!error.message || !error.message.includes('Token has expired')) {
          console.error('Auth initialization error:', error);
        }
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        const { access_token, refresh_token, user: userData } = response;
        
        // Store tokens securely
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        setUser(userData);
        setToken(access_token);
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, confirmPassword) => {
    try {
      setLoading(true);
      const response = await authAPI.register(email, password, confirmPassword);
      
      if (response.success) {
        return { success: true, message: 'Registration successful! Please log in.' };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setToken(null);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshTokenValue);
      
      if (response.success) {
        const { access_token } = response;
        localStorage.setItem('access_token', access_token);
        setToken(access_token);
        return access_token;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens and logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setToken(null);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
