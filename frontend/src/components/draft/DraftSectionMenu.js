import React, { useState } from 'react';

const DraftSectionMenu = ({ activeView, setActiveView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuOptions = [
    { key: 'players', label: 'Available Players' },
    { key: 'order', label: 'Draft Order' }
  ];

  const handleOptionClick = (option) => {
    setActiveView(option.key);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Burger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          outline: 'none'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--neutral-100)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <div style={{ 
          width: '18px', 
          height: '2px', 
          backgroundColor: 'var(--neutral-600)',
          borderRadius: '1px'
        }}></div>
        <div style={{ 
          width: '18px', 
          height: '2px', 
          backgroundColor: 'var(--neutral-600)',
          borderRadius: '1px'
        }}></div>
        <div style={{ 
          width: '18px', 
          height: '2px', 
          backgroundColor: 'var(--neutral-600)',
          borderRadius: '1px'
        }}></div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid var(--neutral-200)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: '200px',
          marginTop: '4px'
        }}>
                      {menuOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleOptionClick(option)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: activeView === option.key ? 'var(--databricks-light-blue)' : 'transparent',
                color: activeView === option.key ? 'var(--databricks-blue)' : 'var(--neutral-700)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeView === option.key ? '600' : '400',
                borderBottom: '1px solid var(--neutral-100)'
              }}
              onMouseEnter={(e) => {
                if (activeView !== option.key) {
                  e.target.style.backgroundColor = 'var(--neutral-50)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== option.key) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DraftSectionMenu;
