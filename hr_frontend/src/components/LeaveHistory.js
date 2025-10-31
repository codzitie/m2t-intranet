import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import * as api from '../services/api';

function LeaveHistory({ onClose }) {
  const { user } = useUser();
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Approved, Pending, Rejected

  useEffect(() => {
    loadLeaveHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaveHistory = async () => {
    try {
      const response = await api.getLeaveHistory();
      if (response) {
        setLeaveHistory(response || []);
      }
    } catch (error) {
      console.error('Error loading leave history:', error);
      alert('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (filter === 'All') return leaveHistory;
    return leaveHistory.filter((leave) => leave.status === filter);
  };

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block',
    };

    const statusStyles = {
      Approved: { ...baseStyle, backgroundColor: '#D1FAE5', color: '#065F46' },
      Pending: { ...baseStyle, backgroundColor: '#FEF3C7', color: '#92400E' },
      Rejected: { ...baseStyle, backgroundColor: '#FEE2E2', color: '#991B1B' },
    };

    return <span style={statusStyles[status]}>{status}</span>;
  };

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    maxWidth: '1000px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  };

  const headerStyle = {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#004aad',
    margin: 0,
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
  };

  const filterContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: isActive ? 'none' : '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#004aad' : 'white',
    color: isActive ? 'white' : '#666',
    transition: 'all 0.3s ease',
  });

  const tableContainerStyle = {
    overflowX: 'auto',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle = {
    backgroundColor: '#f9fafb',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Leave History</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Filter Buttons */}
        <div style={filterContainerStyle}>
          {['All', 'Pending', 'Approved', 'Rejected'].map((filterOption) => (
            <button
              key={filterOption}
              style={filterButtonStyle(filter === filterOption)}
              onClick={() => setFilter(filterOption)}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={emptyStateStyle}>Loading your leave history...</div>
        ) : filteredHistory.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '16px' }}>No {filter !== 'All' ? filter.toLowerCase() : ''} leave applications found</div>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Leave Type</th>
                  <th style={thStyle}>From</th>
                  <th style={thStyle}>To</th>
                  <th style={thStyle}>Days</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Applied On</th>
                  <th style={thStyle}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((leave) => (
                  <tr key={leave.id}>
                    <td style={tdStyle}>{leave.leave_type}</td>
                    <td style={tdStyle}>{leave.start_date}</td>
                    <td style={tdStyle}>{leave.end_date}</td>
                    <td style={tdStyle}>{leave.days}</td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leave.reason}
                      </div>
                    </td>
                    <td style={tdStyle}>{getStatusBadge(leave.status)}</td>
                    <td style={tdStyle}>{leave.applied_on}</td>
                    <td style={tdStyle}>
                      {leave.supervisor_remarks || (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>-</span>
                      )}
                    </td>
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

export default LeaveHistory;
