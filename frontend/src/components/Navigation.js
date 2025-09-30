import React from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav style={{ 
      backgroundColor: '#1e40af', 
      padding: '10px 0',
      marginBottom: '20px'
    }}>
      <div className="container">
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link 
            to="/" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontWeight: 'bold',
              padding: '10px 15px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Teams
          </Link>
          <Link 
            to="/players" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontWeight: 'bold',
              padding: '10px 15px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Players
          </Link>
          <Link 
            to="/fantasy" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontWeight: 'bold',
              padding: '10px 15px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            My Fantasy Team
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
