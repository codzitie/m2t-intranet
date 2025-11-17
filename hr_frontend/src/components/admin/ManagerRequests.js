import React, { useState } from 'react';
import UserRequestsList from './UserRequestsList';
import UserDeletionRequests from './UserDeletionRequests';

export default function ManagerRequests() {
  const [activeTab, setActiveTab] = useState('creation');

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px 24px',
    background: isActive ? 'linear-gradient(135deg, #10b981, #059669)' : '#f3f4f6',
    color: isActive ? 'white' : '#64748b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }}>
          👥 Manager Requests
        </h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
          Manage user creation and deletion requests
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        background: '#fff',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <button
          style={tabButtonStyle(activeTab === 'creation')}
          onClick={() => setActiveTab('creation')}
          onMouseEnter={(e) => {
            if (activeTab !== 'creation') {
              e.target.style.background = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'creation') {
              e.target.style.background = '#f3f4f6';
            }
          }}
        >
          ➕ User Creation Requests
        </button>
        <button
          style={tabButtonStyle(activeTab === 'deletion')}
          onClick={() => setActiveTab('deletion')}
          onMouseEnter={(e) => {
            if (activeTab !== 'deletion') {
              e.target.style.background = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'deletion') {
              e.target.style.background = '#f3f4f6';
            }
          }}
        >
          🗑️ User Deletion Requests
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'creation' && <UserRequestsList />}
        {activeTab === 'deletion' && <UserDeletionRequests />}
      </div>
    </div>
  );
}
