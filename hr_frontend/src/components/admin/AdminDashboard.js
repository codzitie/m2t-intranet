import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUser from './CreateUser';
import UnlockRequests from './UnlockRequests';
import UserList from './UserList';
import AutoMarkAbsent from './AutoMarkAbsent';
import UserDeletionHistory from './UserDeletionHistory'; // ✅ Import history view

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          ⚙️ Admin Dashboard
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
          Manage users, unlock requests, auto-mark absent, and view deletion history
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon="👥"
            color="#3b82f6"
          />
          <StatCard
            title="Employees"
            value={stats.total_employees}
            icon="👨‍💼"
            color="#10b981"
          />
          <StatCard
            title="Pending Unlocks"
            value={stats.pending_unlock_requests}
            icon="🔓"
            color="#f59e0b"
          />
          <StatCard
            title="Approved"
            value={stats.approved_unlock_requests}
            icon="✅"
            color="#10b981"
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        flexWrap: 'wrap',
      }}>
        <TabButton
          active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
          icon="👥"
          label="User List"
        />
        <TabButton
          active={activeTab === 'create-user'}
          onClick={() => setActiveTab('create-user')}
          icon="➕"
          label="Create User"
        />
        <TabButton
          active={activeTab === 'unlock-requests'}
          onClick={() => setActiveTab('unlock-requests')}
          icon="🔓"
          label="Unlock Requests"
        />
        <TabButton
          active={activeTab === 'auto-mark-absent'}
          onClick={() => setActiveTab('auto-mark-absent')}
          icon="❌"
          label="Auto-Mark Absent"
        />
        {/* ✅ Add Deletion History Tab */}
        <TabButton
          active={activeTab === 'deletion-history'}
          onClick={() => setActiveTab('deletion-history')}
          icon="📋"
          label="Deletion History"
        />
      </div>

      {/* Content */}
      <div>
        {activeTab === 'users' && <UserList />}
        {activeTab === 'create-user' && <CreateUser onSuccess={fetchStats} />}
        {activeTab === 'unlock-requests' && <UnlockRequests onUpdate={fetchStats} />}
        {activeTab === 'auto-mark-absent' && <AutoMarkAbsent />}
        {activeTab === 'deletion-history' && <UserDeletionHistory />} {/* ✅ history content */}
      </div>
    </div>
  );
}

// Stats Card Component (unchanged)
function StatCard({ title, value, icon, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '32px',
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Tab Button Component (unchanged)
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        border: 'none',
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : '#64748b',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
