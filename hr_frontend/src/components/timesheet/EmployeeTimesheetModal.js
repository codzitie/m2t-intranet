import React, { useState, useEffect } from 'react';
import timesheetService from '../../services/timesheetService';

// Utility for 24-hour format
function format24HrTime(time) {
  if (!time) return '';
  const [hrs, mins] = time.split(':');
  return `${hrs.padStart(2, '0')}:${mins}`;
}

function EmployeeTimesheetModal({ employee, token, onClose }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    if (employee && token) {
      fetchEmployeeTimesheets();
    }
    // eslint-disable-next-line
  }, [employee, token]);

  const fetchEmployeeTimesheets = async () => {
    setLoading(true);
    setError('');
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const entries = await timesheetService.getEmployeeTimesheets(token, employee.id, year, month);
      const filled = entries.filter(entry => entry.status === 'filled' && entry.hours_logged);
      setTimesheets(filled);
    } catch (err) {
      console.error('Error fetching employee timesheets:', err);
      setError('Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const modalBackdropStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '20px',
    maxWidth: '1200px',
    minWidth: '400px',
    width: '98vw',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 24px 34px 0 rgba(55,65,81,.10), 0 1.5px 8px 0 rgba(30,41,59,.06)',
    padding: '0 0 36px 0',
    position: 'relative',
  };

  const modalHeaderStyle = {
    padding: '32px 48px 18px 48px',
    borderBottom: '2px solid #eef2f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f9fafb',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const titleStyle = {
    fontWeight: 700,
    fontSize: '26px',
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: 0.2,
  };

  const closeButtonStyle = {
    fontSize: '24px',
    background: '#e5e7eb',
    border: 'none',
    color: '#334155',
    cursor: 'pointer',
    marginLeft: '22px',
    padding: '8px 18px',
    borderRadius: '10px',
    transition: 'background 0.18s',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(30,41,59,.05)',
  };

  const employeeInfoStyle = {
    fontWeight: 500,
    fontSize: '15px',
    color: '#64748b',
    marginTop: '3px',
    marginLeft: '2px',
  };

  const statsRowStyle = {
    display: 'flex',
    gap: '48px',
    margin: '0 0 24px 0',
    color: '#334155',
    fontWeight: 500,
    fontSize: '17px',
  };

  const datesGridStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '26px',
    margin: '36px 48px 0 48px',
  };

  const timesheetCardStyle = (expanded) => ({
    background: '#fff',
    border: expanded ? '2.2px solid #2563eb' : '1.5px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px 32px 16px 32px',
    transition: 'border 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    boxShadow: expanded ? '0 8px 26px #f0f5ff' : '0 2px 12px #f9fafb33',
    position: 'relative',
    outline: expanded ? '2px solid #2563eb44' : 'none',
    marginBottom: 0
  });

  const dateTextStyle = {
    fontWeight: 600,
    fontSize: '18px',
    color: '#2563eb',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    letterSpacing: '0.3px'
  };

  const hoursBlockStyle = {
    fontWeight: 600,
    color: '#334155',
    background: '#f1f5f9',
    borderRadius: '6px',
    padding: '4px 13px',
    fontSize: '15px',
    marginLeft: '19px'
  };

  const descriptionTitleStyle = {
    fontSize: '15px',
    color: '#22292f',
    fontWeight: 500,
    marginTop: '9px'
  };

  const descriptionBoxStyle = {
    border: '1.2px solid #e0e7ef',
    background: '#f8fafc',
    borderRadius: '7.5px',
    padding: '9px 17px',
    fontSize: '15px',
    color: '#334155',
    marginTop: '2px'
  };

  const activitiesButtonStyle = (expanded) => ({
    display: 'inline-block',
    color: '#fff',
    background: expanded ? 'linear-gradient(90deg,#2563eb 80%,#38bdf8)' : 'linear-gradient(90deg,#0ea5e9 20%,#2563eb)',
    padding: '6px 26px',
    borderRadius: '7px',
    fontWeight: 600,
    fontSize: '15px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '22px',
    marginBottom: '4px',
    letterSpacing: '0.3px',
    boxShadow: expanded ? '0 2px 15px #e0eaff' : '0 1px 6px #f0f9ff'
  });

  const activitiesSectionStyle = (expanded) => ({
    animation: expanded ? 'fadeIn 0.22s' : 'none',
    background: '#fafdff',
    border: '1px solid #e0e7ef',
    borderRadius: '9px',
    boxShadow: expanded ? '0 8px 34px #e7eafc77' : 'none',
    padding: '18px 9px 12px 9px',
    marginTop: '10px'
  });

  const activitiesTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '2px',
    borderRadius: '9px',
    overflow: 'hidden'
  };

  const thStyle = {
    border: '1px solid #e5e7eb',
    padding: '9px',
    background: '#f3f4f6',
    textAlign: 'left',
    fontWeight: 600,
    color: '#2563eb',
    fontSize: '14px'
  };

  const tdStyle = {
    border: '1px solid #e5e7eb',
    padding: '9px',
    fontSize: '15px',
    color: '#22292f'
  };

  const loadingStyle = {
    textAlign: 'center', padding: '40px', color: '#666', fontSize: '17px'
  };
  const errorStyle = {
    background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b',
    padding: '14px', borderRadius: '8px', margin: '38px 40px 0 40px', fontSize: '16px'
  };

  const emptyStateStyle = {
    textAlign: 'center', padding: '52px 10px', color: '#94a3b8', fontSize: '17px'
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes fadeIn {
            from { opacity:0 }
            to { opacity:1 }
          }
        `}</style>
        {/* Modal Top Header */}
        <div style={modalHeaderStyle}>
          <div>
            <div style={titleStyle}>Employee Timesheets</div>
            <div style={employeeInfoStyle}>{employee.name} • {employee.email}</div>
          </div>
          <button style={closeButtonStyle} onClick={onClose} title="Close">&times;</button>
        </div>

        {/* Error/Loading States */}
        {error && <div style={errorStyle}>⚠️ {error}</div>}
        {loading && <div style={loadingStyle}>Loading timesheets...</div>}

        {/* Stats Row */}
        {!loading && !error && timesheets.length > 0 && (
          <div style={{ ...statsRowStyle, margin: '28px 48px 11px 48px' }}>
            <span>
              <span style={{ color: '#2563eb' }}>Timesheets: </span>
              <b>{timesheets.length}</b>
            </span>
            <span>
              <span style={{ color: '#e11d48' }}>Total Hours: </span>
              <b>{(timesheets.reduce((sum, t) => sum + (t.hours_logged || 0), 0) / 60).toFixed(2)}h</b>
            </span>
          </div>
        )}

        {/* Timesheets Card List */}
        <div style={datesGridStyle}>
          {!loading && !error && timesheets.length === 0 && (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '50px', marginBottom: '8px' }}>📝</div>
              No filled timesheets for this employee.
            </div>
          )}

          {timesheets.map((entry, idx) => {
            const expanded = expandedDate === entry.date;
            return (
              <div key={entry.id} style={timesheetCardStyle(expanded)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <span style={dateTextStyle}>
                    <span role="img" aria-label="calendar">📅</span>
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                  <span style={hoursBlockStyle}>
                    {format24HrTime(entry.start_time)} - {format24HrTime(entry.end_time)} &nbsp;
                    ({(entry.hours_logged / 60).toFixed(1)}h)
                  </span>
                </div>
                {/* Description */}
                {entry.description && (
                  <>
                    <div style={descriptionTitleStyle}>Daily Description:</div>
                    <div style={descriptionBoxStyle}>{entry.description}</div>
                  </>
                )}
                {/* Activities Expand Button */}
                <button
                  style={activitiesButtonStyle(expanded)}
                  onClick={e => { e.stopPropagation(); setExpandedDate(expanded ? null : entry.date); }}
                  title={expanded ? "Hide Activities" : "Show Activities"}
                >
                  {expanded ? 'Hide Activities' : 'Show Activities'}
                </button>
                {/* Expanded: Activity Table */}
                {expanded && (
                  <div style={activitiesSectionStyle(expanded)}>
                    {(entry.activities && entry.activities.length > 0) ? (
                      <table style={activitiesTableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Start Time</th>
                            <th style={thStyle}>End Time</th>
                            <th style={thStyle}>Activity Description</th>
                            <th style={thStyle}>Output / Deliverable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.activities.map((act, aidx) => (
                            <tr key={aidx}>
                              <td style={tdStyle}>{format24HrTime(act.start_time)}</td>
                              <td style={tdStyle}>{format24HrTime(act.end_time)}</td>
                              <td style={tdStyle}>{act.description}</td>
                              <td style={tdStyle}>{act.output}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize:'15px',color:'#6366f1',padding:'10px 2px',textAlign:'center'}}>No activities logged for this day.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EmployeeTimesheetModal;
