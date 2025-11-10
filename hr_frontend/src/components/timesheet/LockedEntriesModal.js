import React, { useState, useEffect } from 'react';
import timesheetService from '../../services/timesheetService';

function LockedEntriesModal({ employee, token, onClose }) {
  const [lockedEntries, setLockedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee && token) {
      fetchLockedEntries();
    }
  }, [employee, token]);

  const fetchLockedEntries = async () => {
    setLoading(true);
    setError('');
    
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      
      // Fetch all entries for the month
      const entries = await timesheetService.getEmployeeTimesheets(token, employee.id, year, month);
      
      // Filter only locked entries
      const locked = entries.filter(entry => entry.is_locked);
      
      setLockedEntries(locked);
    } catch (err) {
      console.error('Error fetching locked entries:', err);
      setError('Failed to fetch locked entries');
    } finally {
      setLoading(false);
    }
  };

  const modalBackdropStyle = {
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

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px 8px',
  };

  const entryCardStyle = {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  };

  const dateStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '8px',
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '6px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#9ca3af',
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  };

  const errorStyle = {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>🔒 Locked Entries</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              {employee.name} • {employee.email}
            </div>
          </div>
          <button style={closeButtonStyle} onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Error */}
        {error && <div style={errorStyle}>⚠️ {error}</div>}

        {/* Loading */}
        {loading && <div style={loadingStyle}>Loading locked entries...</div>}

        {/* Empty State */}
        {!loading && !error && lockedEntries.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              No Locked Entries
            </div>
            <div style={{ fontSize: '14px' }}>
              This employee has no locked timesheet entries.
            </div>
          </div>
        )}

        {/* Locked Entries List */}
        {!loading && !error && lockedEntries.length > 0 && (
          <div>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px'
            }}>
              📊 Found <strong>{lockedEntries.length}</strong> locked entries
            </div>

            {lockedEntries.map((entry) => (
              <div key={entry.id} style={entryCardStyle}>
                <div style={dateStyle}>
                  📅 {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                
                <div style={detailStyle}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: entry.status === 'filled' ? '#d1fae5' : '#fef3c7',
                    color: entry.status === 'filled' ? '#065f46' : '#92400e'
                  }}>
                    {entry.status === 'filled' ? '✅ Filled' : '⏳ Pending'}
                  </span>
                </div>

                {entry.start_time && entry.end_time && (
                  <div style={detailStyle}>
                    <strong>Hours:</strong> {entry.start_time} - {entry.end_time}{' '}
                    ({entry.hours_logged ? (entry.hours_logged / 60).toFixed(1) : 0}h)
                  </div>
                )}

                {entry.description && (
                  <div style={detailStyle}>
                    <strong>Description:</strong> {entry.description}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#92400e', marginTop: '8px' }}>
                  🔒 This entry is locked and cannot be edited
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LockedEntriesModal;
