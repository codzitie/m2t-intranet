import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get supervisor name by ID
  const getSupervisorName = (supervisorId) => {
    if (!supervisorId) return '-';
    const supervisor = users.find(u => u.id === supervisorId);
    return supervisor ? supervisor.name : 'Unknown';
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Role colors
  const getRoleColor = (role) => {
    const colors = {
      'Employee': '#3b82f6',
      'Manager': '#10b981',
      'Team Lead': '#8b5cf6',
      'HR': '#f59e0b',
      'CEO': '#ef4444',
      'Admin': '#ec4899'
    };
    return colors[role] || '#64748b';
  };

  return (
    <div>
      {/* Header with Search and Filter */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            👥 All Users ({filteredUsers.length})
          </h2>
          <button
            onClick={fetchUsers}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Search by name, email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Team Lead">Team Lead</option>
            <option value="HR">HR</option>
            <option value="CEO">CEO</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading users...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            No users found
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Try adjusting your search or filters
          </div>
        </div>
      )}

      {/* Users Table */}
      {!loading && filteredUsers.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Designation</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Reporting Manager</TableHeader>
                  <TableHeader>Join Date</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${getRoleColor(user.role)}20, ${getRoleColor(user.role)}40)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: getRoleColor(user.role)
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`mailto:${user.email}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {user.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${getRoleColor(user.role)}15`,
                        color: getRoleColor(user.role)
                      }}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.designation || '-'}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      {getSupervisorName(user.supervisor_id)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.join_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Table Header Component
function TableHeader({ children }) {
  return (
    <th style={{
      padding: '16px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '700',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {children}
    </th>
  );
}

// Table Cell Component
function TableCell({ children }) {
  return (
    <td style={{
      padding: '16px',
      fontSize: '14px',
      color: '#64748b'
    }}>
      {children}
    </td>
  );
}
