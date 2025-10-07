import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--neutral-200)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo and Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--databricks-blue)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <img 
              src="/rugby-ball.png" 
              alt="Rugby Ball" 
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain'
              }}
            />
          </div>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--databricks-blue)',
              margin: 0,
              lineHeight: 1
            }}>
              Fantasy Rugby
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--databricks-blue)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--databricks-dark-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--databricks-blue)'}
            >
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-small"
              style={{ fontSize: '14px' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline btn-small"
              style={{ fontSize: '14px' }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-small"
              style={{ fontSize: '14px' }}
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
