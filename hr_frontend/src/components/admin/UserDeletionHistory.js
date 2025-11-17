import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDeletionHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDeletionHistory();
  }, [statusFilter]);

  const fetchDeletionHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/admin/user-deletion-requests?status_filter=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch deletion history:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    background: status === 'pending' ? '#fef3c7' : status === 'approved' ? '#d1fae5' : '#fee2e2',
    color: status === 'pending' ? '#92400e' : status === 'approved' ? '#065f46' : '#991b1b'
  });

  const filterButtonStyle = (active) => ({
    padding: '8px 16px',
    border: active ? '2px solid #3b82f6' : '1px solid #d1d5db',
    borderRadius: '8px',
    background: active ? '#dbeafe' : '#fff',
    color: active ? '#1e40af' : '#64748b',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px'
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            📋 User Deletion History
          </h2>
          <div>
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                style={filterButtonStyle(statusFilter === status)}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading history...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No {statusFilter !== 'all' && statusFilter} deletion requests found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Requested By</TableHeader>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Reviewed By</TableHeader>
                  <TableHeader>Date</TableHeader>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <TableCell>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {req.user_name}
                      </div>
                    </TableCell>
                    <TableCell>{req.user_email}</TableCell>
                    <TableCell>
                      <div style={{ fontSize: '13px' }}>
                        {req.requested_by_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '13px'
                      }}>
                        {req.reason || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={statusBadgeStyle(req.status)}>
                        {req.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.approver_name ? (
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>
                            {req.approver_name}
                          </div>
                          {req.approved_on && (
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {new Date(req.approved_on).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '13px' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Table Header Component
function TableHeader({ children }) {
  return (
    <th style={{
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '12px',
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
      padding: '12px 16px',
      fontSize: '14px',
      color: '#64748b'
    }}>
      {children}
    </td>
  );
}
