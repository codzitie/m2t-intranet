import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import PayrollExport from './PayrollExport';

function AdminTimesheetDashboard({ onBack }) {
  const { user } = useUser();
  const [activeAdminTab, setActiveAdminTab] = useState('today-updated');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Mock all employees data with their timesheet status
  const [allEmployees] = useState([
    {
      id: 101,
      name: 'Rajesh Kumar',
      reportsTo: 5,
      todayStatus: 'filled',
      yesterdayStatus: 'filled',
      todayTimesheet: {
        date: '2025-11-05',
        startTime: '09:30',
        endTime: '18:00',
        hoursLogged: 8.5,
        activities: [
          {
            id: 1,
            slot: 'morning',
            description: 'Frontend development',
            startTime: '10:00',
            endTime: '12:30',
            output: 'Completed login page UI',
          },
          {
            id: 2,
            slot: 'afternoon',
            description: 'Bug fixes',
            startTime: '14:00',
            endTime: '17:00',
            output: 'Fixed 4 critical bugs',
          },
        ],
      },
    },
    {
      id: 102,
      name: 'Priya Singh',
      reportsTo: 5,
      todayStatus: 'filled',
      yesterdayStatus: 'pending',
      todayTimesheet: {
        date: '2025-11-05',
        startTime: '09:00',
        endTime: '17:30',
        hoursLogged: 8.5,
        activities: [
          {
            id: 1,
            slot: 'morning',
            description: 'Code review',
            startTime: '09:30',
            endTime: '11:00',
            output: 'Reviewed 3 PRs',
          },
        ],
      },
    },
    {
      id: 103,
      name: 'Amit Patel',
      reportsTo: 6,
      todayStatus: 'pending',
      yesterdayStatus: 'filled',
      todayTimesheet: null,
    },
    {
      id: 104,
      name: 'Dharun',
      reportsTo: 5,
      todayStatus: 'locked',
      yesterdayStatus: 'locked',
      todayTimesheet: null,
    },
    {
      id: 105,
      name: 'Aakriti',
      reportsTo: 6,
      todayStatus: 'filled',
      yesterdayStatus: 'locked',
      todayTimesheet: {
        date: '2025-11-05',
        startTime: '10:00',
        endTime: '18:30',
        hoursLogged: 8.5,
        activities: [],
      },
    },
  ]);

  const [unlockRequests] = useState([
    {
      id: 1,
      employeeName: 'Dharun',
      employeeId: 104,
      date: '2025-11-03',
      reason: 'Was on leave, forgot to fill timesheet',
      requestedOn: '2025-11-05',
      status: 'pending',
    },
    {
      id: 2,
      employeeName: 'Aakriti',
      employeeId: 105,
      date: '2025-11-01',
      reason: 'System was down that day',
      requestedOn: '2025-11-04',
      status: 'pending',
    },
  ]);

  // Get filtered employees based on active tab
  const getFilteredEmployees = () => {
    let filtered = allEmployees;

    // Apply role-based filtering
    if (user.role === 'Manager') {
      filtered = filtered.filter(emp => emp.reportsTo === user.id);
    }

    // Apply search
    if (searchEmployee.trim()) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    // Apply status filter based on active tab
    switch (activeAdminTab) {
      case 'today-updated':
        return filtered.filter(emp => emp.todayStatus === 'filled');
      case 'yesterday-pending':
        return filtered.filter(emp => emp.yesterdayStatus === 'pending');
      case 'locked':
        return filtered.filter(emp => emp.todayStatus === 'locked');
      case 'all':
        return filtered;
      default:
        return filtered;
    }
  };

  const filteredEmployees = getFilteredEmployees();

  // Count stats
  const getTodayStats = () => {
    const allEmps = user.role === 'Manager' ? allEmployees.filter(e => e.reportsTo === user.id) : allEmployees;
    return {
      updated: allEmps.filter(e => e.todayStatus === 'filled').length,
      pending: allEmps.filter(e => e.todayStatus === 'pending').length,
      locked: allEmps.filter(e => e.todayStatus === 'locked').length,
      total: allEmps.length,
    };
  };

  const yesterdayStats = {
    pending: (user.role === 'Manager' ? allEmployees.filter(e => e.reportsTo === user.id) : allEmployees)
      .filter(e => e.yesterdayStatus === 'pending').length,
  };

  const stats = getTodayStats();

  // Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#10B981',
  };

  const roleStyleStyle = {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '12px',
  };

  const backButtonStyle = {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#10B981',
    border: '1px solid #10B981',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  };

  const statCardStyle = (bgColor) => ({
    backgroundColor: 'white',
    border: `2px solid ${bgColor}`,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  });

  const statValueStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
  };

  const statLabelStyle = {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#10B981' : '#666',
    borderBottom: isActive ? '3px solid #10B981' : 'none',
    cursor: 'pointer',
    marginBottom: '-2px',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  });

  const searchContainerStyle = {
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
  };

  const searchInputStyle = {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    maxWidth: '300px',
  };

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const employeeHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const employeeNameStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  };

  const statusBadgeStyle = (status) => {
    let bgColor, textColor;
    if (status === 'filled') {
      bgColor = '#D1FAE5';
      textColor = '#065F46';
    } else if (status === 'pending') {
      bgColor = '#FEF3C7';
      textColor = '#92400E';
    } else if (status === 'locked') {
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
    }
    return {
      display: 'inline-block',
      padding: '6px 12px',
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
    marginBottom: '12px',
  };

  const hoursStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#10B981',
    marginBottom: '12px',
  };

  const activitiesContainerStyle = {
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    padding: '16px',
    marginTop: '16px',
  };

  const activitySlotStyle = {
    marginBottom: '16px',
  };

  const activitySlotTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  };

  const activityItemStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
  };

  const activityTimeStyle = {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
  };

  const activityDescStyle = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  };

  const activityOutputStyle = {
    fontSize: '12px',
    color: '#555',
    backgroundColor: '#f3f4f6',
    padding: '6px 8px',
    borderRadius: '4px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  const viewButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '12px',
  };

  // ========== RENDER ==========

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          👔 Admin Dashboard
          <span style={roleStyleStyle}>
            {user.role === 'Manager' ? '👨‍💼 Manager' : user.role === 'HR' ? '👩‍💼 HR' : '👑 CEO'}
          </span>
        </h2>
        <button
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdf4'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          ← Back to My Dashboard
        </button>
      </div>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#D1FAE5')}>
          <div style={statValueStyle}>{stats.updated}</div>
          <div style={statLabelStyle}>Today Updated</div>
        </div>
        <div style={statCardStyle('#FEF3C7')}>
          <div style={statValueStyle}>{stats.pending}</div>
          <div style={statLabelStyle}>Today Pending</div>
        </div>
        <div style={statCardStyle('#FEE2E2')}>
          <div style={statValueStyle}>{stats.locked}</div>
          <div style={statLabelStyle}>Locked</div>
        </div>
        <div style={statCardStyle('#EFF6FF')}>
          <div style={statValueStyle}>{stats.total}</div>
          <div style={statLabelStyle}>Total Employees</div>
        </div>
        {yesterdayStats.pending > 0 && (
          <div style={statCardStyle('#FEF3C7')}>
            <div style={statValueStyle}>{yesterdayStats.pending}</div>
            <div style={statLabelStyle}>Yesterday Pending</div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={tabContainerStyle}>
        <button
          style={tabButtonStyle(activeAdminTab === 'today-updated')}
          onClick={() => setActiveAdminTab('today-updated')}
        >
          ✅ Today Updated ({stats.updated})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'yesterday-pending')}
          onClick={() => setActiveAdminTab('yesterday-pending')}
        >
          ⏳ Yesterday Pending ({yesterdayStats.pending})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'locked')}
          onClick={() => setActiveAdminTab('locked')}
        >
          🔒 Locked ({stats.locked})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'all')}
          onClick={() => setActiveAdminTab('all')}
        >
          📋 All ({stats.total})
        </button>
        {(user.role === 'HR' || user.role === 'ceo') && (
          <>
            <button
              style={tabButtonStyle(activeAdminTab === 'unlock-requests')}
              onClick={() => setActiveAdminTab('unlock-requests')}
            >
              🔓 Unlock Requests ({unlockRequests.length})
            </button>
            <button
              style={tabButtonStyle(activeAdminTab === 'payroll-export')}
              onClick={() => setActiveAdminTab('payroll-export')}
            >
              📥 Payroll Export
            </button>
          </>
        )}
      </div>

      {/* Search Bar */}
      {(activeAdminTab === 'today-updated' || activeAdminTab === 'yesterday-pending' || activeAdminTab === 'locked' || activeAdminTab === 'all') && (
        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder="🔍 Search employee name..."
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      )}

      {/* ========== CONTENT TABS ========== */}

      {/* Today Updated Tab */}
      {activeAdminTab === 'today-updated' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No timesheets updated today</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('filled')}>✅ Updated</span>
                </div>
                {emp.todayTimesheet && (
                  <>
                    <div style={hoursStyle}>⏰ {emp.todayTimesheet.hoursLogged}h ({emp.todayTimesheet.startTime} - {emp.todayTimesheet.endTime})</div>
                    {emp.todayTimesheet.activities.length > 0 && (
                      <div style={activitiesContainerStyle}>
                        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          📝 Activities:
                        </div>
                        {emp.todayTimesheet.activities
                          .filter(a => a.slot === 'morning')
                          .length > 0 && (
                          <div style={activitySlotStyle}>
                            <div style={activitySlotTitleStyle}>🌅 Morning</div>
                            {emp.todayTimesheet.activities
                              .filter(a => a.slot === 'morning')
                              .map(activity => (
                                <div key={activity.id} style={activityItemStyle}>
                                  <div style={activityTimeStyle}>🕐 {activity.startTime} - {activity.endTime}</div>
                                  <div style={activityDescStyle}>{activity.description}</div>
                                  <div style={activityOutputStyle}>Output: {activity.output}</div>
                                </div>
                              ))}
                          </div>
                        )}
                        {emp.todayTimesheet.activities
                          .filter(a => a.slot === 'afternoon')
                          .length > 0 && (
                          <div style={activitySlotStyle}>
                            <div style={activitySlotTitleStyle}>🌄 Afternoon</div>
                            {emp.todayTimesheet.activities
                              .filter(a => a.slot === 'afternoon')
                              .map(activity => (
                                <div key={activity.id} style={activityItemStyle}>
                                  <div style={activityTimeStyle}>🕐 {activity.startTime} - {activity.endTime}</div>
                                  <div style={activityDescStyle}>{activity.description}</div>
                                  <div style={activityOutputStyle}>Output: {activity.output}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Yesterday Pending Tab */}
      {activeAdminTab === 'yesterday-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending timesheets from yesterday</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>All employees have filled their timesheets!</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet for yesterday (Nov 4) not filled yet
                </div>
                <div style={detailStyle}>
                  <strong>Action Required:</strong> Employee needs to fill yesterday's timesheet
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Locked Tab */}
      {activeAdminTab === 'locked' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No locked timesheets</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>All timesheets are accessible</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('locked')}>🔒 Locked</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet is locked (2+ days old with no entry)
                </div>
                <div style={detailStyle}>
                  <strong>Action:</strong> Employee can request unlock via email to HR
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Tab */}
      {activeAdminTab === 'all' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No employees found</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle(emp.todayStatus)}>
                    {emp.todayStatus === 'filled' && '✅ Updated'}
                    {emp.todayStatus === 'pending' && '⏳ Pending'}
                    {emp.todayStatus === 'locked' && '🔒 Locked'}
                  </span>
                </div>
                <div style={detailStyle}>
                  <strong>Today:</strong> {emp.todayStatus === 'filled' ? 'Updated' : emp.todayStatus === 'pending' ? 'Pending' : 'Locked'}
                </div>
                <div style={detailStyle}>
                  <strong>Yesterday:</strong> {emp.yesterdayStatus === 'filled' ? 'Updated' : emp.yesterdayStatus === 'pending' ? 'Pending' : 'Locked'}
                </div>
                {emp.todayTimesheet && emp.todayTimesheet.hoursLogged && (
                  <div style={hoursStyle}>⏰ {emp.todayTimesheet.hoursLogged}h</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Unlock Requests Tab (HR & CEO only) */}
      {activeAdminTab === 'unlock-requests' && (user.role === 'HR' || user.role === 'ceo') && (
        <div>
          {unlockRequests.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending requests</p>
            </div>
          ) : (
            unlockRequests.map((request) => (
              <div key={request.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{request.employeeName}</div>
                  <span style={statusBadgeStyle('pending')}>Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>📅 Date to unlock:</strong> {request.date}
                </div>
                <div style={detailStyle}>
                  <strong>Reason:</strong> {request.reason}
                </div>
                <button
                  style={{
                    ...viewButtonStyle,
                    backgroundColor: '#10B981',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                >
                  ✓ Approve Unlock
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== PAYROLL EXPORT TAB (HR & CEO only) ========== */}
      {activeAdminTab === 'payroll-export' && (user.role === 'HR' || user.role === 'ceo') && (
        <PayrollExport />
      )}
    </div>
  );
}

export default AdminTimesheetDashboard;
