/**
 * Fantasy Rugby Application - Main App Component
 * 
 * This is the root component of the Fantasy Rugby application.
 * It sets up routing, authentication context, and theme management.
 * 
 * Features:
 * - React Router for client-side navigation
 * - Authentication context for user state management
 * - Theme context for UI theming
 * - Protected routes for authenticated users
 * - Public routes for login/register
 * 
 * Routes:
 * - /login - User authentication
 * - /register - User registration
 * - /league-selection - League creation and joining (protected)
 * - /league-dashboard - League management (protected)
 * - /my-leagues - User's leagues (protected)
 * - /draft - Player draft interface (protected)
 * - / - Redirects to league-selection
 * 
 * Author: Roland Crouch
 * Date: September 2025
 * Version: 1.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import LeagueSelection from './pages/LeagueSelection';
import LeagueDashboard from './pages/LeagueDashboard';
import MyLeagues from './pages/MyLeagues';
import Draft from './pages/Draft';
import './App.css';

/**
 * Main App Component
 * 
 * Renders the complete application with routing, authentication, and theming.
 * All routes are wrapped in context providers for global state management.
 * 
 * @returns {JSX.Element} The complete application component
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/league-selection" 
                  element={
                    <ProtectedRoute>
                      <LeagueSelection />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-leagues" 
                  element={
                    <ProtectedRoute>
                      <MyLeagues />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/league-dashboard" 
                  element={
                    <ProtectedRoute>
                      <LeagueDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/draft" 
                  element={
                    <ProtectedRoute>
                      <Draft />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/league-selection" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
