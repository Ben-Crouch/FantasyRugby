import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--neutral-50)',
      borderTop: '1px solid var(--neutral-200)',
      padding: '16px 24px',
      marginTop: 'auto',
      textAlign: 'center',
      fontSize: '12px',
      color: 'var(--neutral-600)'
    }}>
      <p style={{ margin: 0 }}>
        Rugby ball icons created by{' '}
        <a 
          href="https://www.flaticon.com/free-icons/rugby-ball" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'var(--databricks-blue)', 
            textDecoration: 'none' 
          }}
        >
          juicy_fish - Flaticon
        </a>
      </p>
    </footer>
  );
};

export default Footer;
