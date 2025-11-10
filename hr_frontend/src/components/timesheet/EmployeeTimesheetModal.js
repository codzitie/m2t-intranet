import React, { useState, useEffect } from 'react';
import timesheetService from '../../services/timesheetService';

function EmployeeTimesheetModal({ employee, token, onClose }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee && token) {
      fetchEmployeeTimesheets();
    }
  }, [employee, token]);

  const fetchEmployeeTimesheets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      
      // Fetch all entries for the month
      const entries = await timesheetService.getEmployeeTimesheets(token, employee.id, year, month);
      
      // Filter only filled entries
      const filled = entries.filter(entry => entry.status === 'filled' && entry.hours_logged);
      
      setTimesheets(filled);
    } catch (err) {
      console.error('Error fetching employee timesheets:', err);
      setError('Failed to fetch timesheets');
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
    maxWidth: '800px',
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
    backgroundColor: '#f0fdf4',
    border: '1px solid #10b981',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  };

  const dateStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '12px',
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  };

  const descriptionBoxStyle = {
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '12px',
    fontSize: '14px',
    color: '#374151',
  };

  const activitiesContainerStyle = {
    marginTop: '12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  };

  const activityBoxStyle = {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '10px',
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
            <div style={titleStyle}>📋 Timesheet Entries</div>
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
        {loading && <div style={loadingStyle}>Loading timesheets...</div>}

        {/* Empty State */}
        {!loading && !error && timesheets.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              No Filled Timesheets
            </div>
            <div style={{ fontSize: '14px' }}>
              This employee hasn't filled any timesheets yet.
            </div>
          </div>
        )}

        {/* Timesheets List */}
        {!loading && !error && timesheets.length > 0 && (
          <div>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px'
            }}>
              📊 Found <strong>{timesheets.length}</strong> filled timesheets • Total <strong>
                {timesheets.reduce((sum, t) => sum + (t.hours_logged || 0), 0) / 60}h
              </strong>
            </div>

            {timesheets.map((entry) => (
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
                  <strong>⏰ Hours:</strong> {entry.start_time} - {entry.end_time} ({(entry.hours_logged / 60).toFixed(1)}h)
                </div>

                {entry.description && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      📝 Daily Description:
                    </div>
                    <div style={descriptionBoxStyle}>
                      {entry.description}
                    </div>
                  </div>
                )}

                {entry.activities && entry.activities.length > 0 && (
                  <div style={activitiesContainerStyle}>
                    {entry.activities.map((activity, idx) => (
                      <div key={idx} style={activityBoxStyle}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>
                          {activity.slot === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                          <strong>Task:</strong> {activity.description || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#374151' }}>
                          <strong>Output:</strong> {activity.output || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeTimesheetModal;
