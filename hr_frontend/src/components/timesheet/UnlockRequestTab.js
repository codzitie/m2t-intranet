import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';

function UnlockRequestTab() {
  const { user, token } = useUser();
  const [lockedEntries, setLockedEntries] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requestingFor, setRequestingFor] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user && token) {
      loadLockedEntriesAndRequests();
    }
  }, [user, token]);

  const loadLockedEntriesAndRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Get all entries for current month
      const entries = await timesheetService.getMonthTimesheets(token, year, month);
      
      // Filter locked entries (excluding approved unlocks)
      const locked = entries.filter(e => 
        e.is_locked && 
        !e.has_approved_unlock && 
        !e.is_absent &&
        new Date(e.date) < new Date() // Only past dates
      );

      setLockedEntries(locked);

      // Get existing unlock requests
      const requests = await timesheetService.getMyUnlockRequests(token);
      setUnlockRequests(requests);

    } catch (err) {
      console.error('Error loading locked entries:', err);
      setError(err?.detail || 'Failed to load locked entries');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUnlock = async (entry) => {
    if (!reason.trim()) {
      setError('Please provide a reason for unlock request');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      await timesheetService.requestUnlock(token, {
        timesheet_id: entry.id,
        date: entry.date,
        reason: reason.trim()
      });

      setSuccessMessage(`Unlock request submitted for ${formatDate(entry.date)}`);
      setRequestingFor(null);
      setReason('');

      // Reload data
      await loadLockedEntriesAndRequests();

    } catch (err) {
      console.error('Error requesting unlock:', err);
      setError(err?.detail || 'Failed to submit unlock request');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRequestStatus = (entryDate) => {
    const request = unlockRequests.find(r => r.date === entryDate);
    return request ? request.status : null;
  };

  const getRequestRemarks = (entryDate) => {
    const request = unlockRequests.find(r => r.date === entryDate);
    return request ? request.remarks : null;
  };

  // Styles
  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
  };

  const headerStyle = {
    marginBottom: '24px',
  };

  const titleStyle = {
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#666',
  };

  const alertStyle = (type) => ({
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    backgroundColor: type === 'error' ? '#FEE2E2' : '#D1FAE5',
    border: `1px solid ${type === 'error' ? '#FECACA' : '#6EE7B7'}`,
    color: type === 'error' ? '#991B1B' : '#065F46',
  });

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const dateHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const dateTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  };

  const statusBadgeStyle = (status) => {
    let bgColor, textColor;
    if (status === 'pending') {
      bgColor = '#FEF3C7';
      textColor = '#92400E';
    } else if (status === 'approved') {
      bgColor = '#D1FAE5';
      textColor = '#065F46';
    } else if (status === 'rejected') {
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
    } else {
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
    }

    return {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  };

  const requestFormStyle = {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginBottom: '12px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
  };

  const buttonStyle = (variant) => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: variant === 'primary' ? '#10B981' : '#6B7280',
    color: 'white',
  });

  const requestButtonStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #10B981',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#10B981',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  };

  const remarksStyle = {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#92400E',
  };

  // Render
  if (loading) {
    return <div style={loadingStyle}>Loading locked entries...</div>;
  }

  return (
    <div style={containerStyle}>
      {error && (
        <div style={alertStyle('error')}>
          ⚠️ {error}
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            ✖
          </button>
        </div>
      )}

      {successMessage && (
        <div style={alertStyle('success')}>
          ✅ {successMessage}
          <button
            onClick={() => setSuccessMessage('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#065F46',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            ✖
          </button>
        </div>
      )}

      <div style={headerStyle}>
        <h2 style={titleStyle}>🔒 Request Unlock for Locked Entries</h2>
        <p style={subtitleStyle}>
          Submit unlock requests for locked timesheet entries. Your supervisor or HR will review and approve.
        </p>
      </div>

      {lockedEntries.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <p style={{ fontSize: '18px', fontWeight: '500' }}>No Locked Entries</p>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
            All your timesheet entries are either filled or unlocked
          </p>
        </div>
      ) : (
        lockedEntries.map((entry) => {
          const requestStatus = getRequestStatus(entry.date);
          const remarks = getRequestRemarks(entry.date);
          const isRequesting = requestingFor?.id === entry.id;

          return (
            <div key={entry.id} style={cardStyle}>
              <div style={dateHeaderStyle}>
                <div>
                  <div style={dateTitleStyle}>📅 {formatDate(entry.date)}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Entry ID: {entry.id}
                  </div>
                </div>
                <div>
                  {requestStatus ? (
                    <span style={statusBadgeStyle(requestStatus)}>
                      {requestStatus === 'pending' && '⏳ Request Pending'}
                      {requestStatus === 'approved' && '✅ Approved'}
                      {requestStatus === 'rejected' && '❌ Rejected'}
                    </span>
                  ) : (
                    <span style={statusBadgeStyle('locked')}>🔒 Locked</span>
                  )}
                </div>
              </div>

              <div style={detailStyle}>
                <strong>Status:</strong> Entry is locked and cannot be edited
              </div>

              {entry.description && (
                <div style={detailStyle}>
                  <strong>Description:</strong> {entry.description}
                </div>
              )}

              {remarks && (
                <div style={remarksStyle}>
                  <strong>Admin Remarks:</strong> {remarks}
                </div>
              )}

              {!requestStatus && !isRequesting && (
                <button
                  style={requestButtonStyle}
                  onClick={() => setRequestingFor(entry)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#D1FAE5';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  📝 Request Unlock
                </button>
              )}

              {isRequesting && (
                <div style={requestFormStyle}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Reason for Unlock Request *
                  </label>
                  <textarea
                    style={textareaStyle}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason why this entry needs to be unlocked (e.g., forgot to fill, incorrect data entry, etc.)"
                  />
                  <div style={buttonContainerStyle}>
                    <button
                      style={buttonStyle('primary')}
                      onClick={() => handleRequestUnlock(entry)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                      }}
                    >
                      Submit Request
                    </button>
                    <button
                      style={buttonStyle('secondary')}
                      onClick={() => {
                        setRequestingFor(null);
                        setReason('');
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#4B5563';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#6B7280';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {requestStatus === 'pending' && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#92400E' }}>
                  ⏳ Waiting for approval from your supervisor or HR
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default UnlockRequestTab;
