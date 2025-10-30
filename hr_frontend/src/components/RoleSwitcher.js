import React, { useState } from 'react';
import { LeaveService } from '../services/mockLeaveService';

function RoleSwitcher() {
  const [showSwitcher, setShowSwitcher] = useState(false);

  const switchRole = (role) => {
    LeaveService.switchUserRole(role);
    setShowSwitcher(false);
    // Reload the page to apply new role
    window.location.reload();
  };

  const containerStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 2000,
  };

  const toggleButtonStyle = {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '56px',
    height: '56px',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  };

  const menuStyle = {
    position: 'absolute',
    bottom: '70px',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    padding: '12px',
    minWidth: '200px',
  };

  const menuHeaderStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '8px',
  };

  const roleButtonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={containerStyle}>
      <button
        style={toggleButtonStyle}
        onClick={() => setShowSwitcher(!showSwitcher)}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        👤
      </button>

      {showSwitcher && (
        <div style={menuStyle}>
          <div style={menuHeaderStyle}>🧪 Test as User Role:</div>

          <button
            style={roleButtonStyle}
            onClick={() => switchRole('employee')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#004aad';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <span style={{ fontSize: '20px' }}>👨‍💼</span>
            <div>
              <div style={{ fontWeight: '600', color: '#333' }}>Employee</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Apply & view own leaves
              </div>
            </div>
          </button>

          <button
            style={roleButtonStyle}
            onClick={() => switchRole('supervisor')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#004aad';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <span style={{ fontSize: '20px' }}>👨‍✈️</span>
            <div>
              <div style={{ fontWeight: '600', color: '#333' }}>Supervisor</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Approve team leaves
              </div>
            </div>
          </button>

          <button
            style={roleButtonStyle}
            onClick={() => switchRole('hr')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#004aad';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <span style={{ fontSize: '20px' }}>👔</span>
            <div>
              <div style={{ fontWeight: '600', color: '#333' }}>HR / Admin</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Full access & reports
              </div>
            </div>
          </button>

          <div style={{ 
            fontSize: '11px', 
            color: '#9CA3AF', 
            padding: '8px 12px', 
            marginTop: '8px',
            borderTop: '1px solid #e5e7eb'
          }}>
            ⚠️ Page will reload on switch
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;
