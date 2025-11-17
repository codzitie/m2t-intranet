import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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

  // Supervisor roles eligible for dropdown
  const supervisorRoles = ["Manager", "Team Lead", "CEO"];
  const eligibleSupervisors = users.filter(u => supervisorRoles.includes(u.role));

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

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // Open edit modal and setup form data
  const openEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      designation: user.designation || '',
      supervisor_id: user.supervisor_id || '',
      join_date: user.join_date || ''
    });
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Submit user update
  const submitEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/admin/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert('Failed to update user');
    }
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
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                    <TableCell>{getSupervisorName(user.supervisor_id)}</TableCell>
                    <TableCell>{new Date(user.join_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell>
                      <button onClick={() => openEditUser(user)} style={{
                        marginRight: '10px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}>
                        Edit
                      </button>
                      <button onClick={() => deleteUser(user.id)} style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}>
                        Delete
                      </button>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2>Edit User</h2>
            <FormField label="Name" name="name" type="text" value={editFormData.name} onChange={handleEditChange} required />
            <FormField label="Email" name="email" type="email" value={editFormData.email} onChange={handleEditChange} required />
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Role <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="role"
                value={editFormData.role}
                onChange={handleEditChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff'
                }}
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Team Lead">Team Lead</option>
                <option value="HR">HR</option>
                <option value="CEO">CEO</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <FormField label="Department" name="department" type="text" value={editFormData.department} onChange={handleEditChange} required />
            <FormField label="Designation" name="designation" type="text" value={editFormData.designation} onChange={handleEditChange} required />

            {/* Supervisor Dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Supervisor <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="supervisor_id"
                value={editFormData.supervisor_id}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff'
                }}
              >
                <option value="">-- No Supervisor --</option>
                {eligibleSupervisors.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.role} - {sup.designation || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <FormField label="Join Date" name="join_date" type="date" value={editFormData.join_date} onChange={handleEditChange} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button onClick={() => setEditingUser(null)} style={{
                padding: '8px 14px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={submitEdit} style={{
                padding: '8px 14px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>Save</button>
            </div>
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

function FormField({ label, name, type, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          transition: 'border 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
    </div>
  );
}
