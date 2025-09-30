import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: 'var(--white)',
      borderBottom: '2px solid var(--primary-orange)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Logo/Title */}
      <Link 
        to="/" 
        style={{
          textDecoration: 'none',
          color: 'var(--black)',
          fontSize: '1.5rem',
          fontWeight: '900',
          fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
          textTransform: 'uppercase',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        Fantasy Rugby
      </Link>

      {/* Right side - Auth buttons or user menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-outline btn-small"
          style={{ marginRight: '1rem' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--black)', fontWeight: '500' }}>
              Welcome, {user?.username || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-small"
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-outline btn-small">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-small">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
