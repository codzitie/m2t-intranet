import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';
import EmployeeTimesheetModal from './EmployeeTimesheetModal';

function ManagerTimesheetDashboard() {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState('today-updated');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);

  useEffect(() => {
    if (user && user.role && ['Manager', 'Team Lead', 'CEO', 'Founder', 'HR'].includes(user.role) && token) {
      fetchTeamTimesheets();
    }
  }, [user, token]);

  const fetchTeamTimesheets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const teamData = await timesheetService.getTeamTimesheets(token, year, month);
      const formattedTeam = formatTeamData(teamData);
      setTeamMembers(formattedTeam);

    } catch (err) {
      console.error('Error fetching team timesheets:', err);
      setError(err.detail || 'Failed to fetch team timesheet data');
    } finally {
      setLoading(false);
    }
  };

  const formatTeamData = (apiData) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // ✅ SKIP SUNDAY - GO TO SATURDAY
  if (yesterday.getDay() === 0) {
    yesterday.setDate(yesterday.getDate() - 1);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  return apiData.map(member => {
    const todayEntry = member.entries.find(e => e.date === todayStr);
    const yesterdayEntry = member.entries.find(e => e.date === yesterdayStr);

    const filledEntries = member.entries.filter(e => e.status === 'filled');
    const lockedEntries = member.entries.filter(e => e.is_locked);
    
    // ✅ Backend already converts to hours - NO /60 NEEDED
    const totalHours = filledEntries.reduce((sum, e) => {
      return sum + (e.hours_logged || 0);
    }, 0);

    const todayHours = todayEntry?.hours_logged || 0;

    return {
      id: member.user_id,
      name: member.name,
      email: member.email,
      designation: member.designation,
      todayStatus: todayEntry?.status || 'pending',
      yesterdayStatus: yesterdayEntry?.status || 'pending',
      yesterdayDate: yesterdayStr,
      filledDays: filledEntries.length,
      lockedDays: lockedEntries.length,
      totalHours: totalHours,
      todayHours: todayHours,
      todayTimesheet: todayEntry ? {
        date: todayEntry.date,
        startTime: todayEntry.start_time,
        endTime: todayEntry.end_time,
        hoursLogged: todayEntry.hours_logged.toFixed(1),
        description: todayEntry.description,
        activities: todayEntry.activities || []
      } : null,
    };
  });
};

  // ✅ HANDLE VIEW TIMESHEETS
  const handleViewTimesheets = (employee) => {
    setSelectedEmployee(employee);
    setShowTimesheetModal(true);
  };

  const getFilteredEmployees = () => {
    let filtered = teamMembers;

    if (searchEmployee.trim()) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    switch (activeTab) {
      case 'today-updated':
        return filtered.filter(emp => emp.todayStatus === 'filled');
      case 'today-pending':
        return filtered.filter(emp => emp.todayStatus === 'pending' && emp.todayStatus !== 'locked');
      case 'yesterday-pending':
        return filtered.filter(emp => emp.yesterdayStatus === 'pending');
      case 'all':
        return filtered;
      default:
        return filtered;
    }
  };

  const filteredEmployees = getFilteredEmployees();

  const stats = {
    updated: teamMembers.filter(e => e.todayStatus === 'filled').length,
    pending: teamMembers.filter(e => e.todayStatus === 'pending').length,
    total: teamMembers.length,
  };

  const yesterdayStats = {
    pending: teamMembers.filter(e => e.yesterdayStatus === 'pending').length,
  };

  // STYLES
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

  const searchInputStyle = {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    maxWidth: '300px',
    marginBottom: '24px',
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

  const hoursStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#10B981',
    marginBottom: '12px',
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  };

  const errorStyle = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const clickHintStyle = {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
  };

  // AUTHORIZATION CHECK
  if (!user || !['Manager', 'Team Lead', 'CEO', 'Founder', 'HR'].includes(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        ⛔ Access Denied: Only Managers and above can access this view
      </div>
    );
  }

  if (loading) {
    return <div style={loadingStyle}>Loading team timesheet data...</div>;
  }

  return (
    <div style={containerStyle}>
      {/* Error Message */}
      {error && (
        <div style={errorStyle}>
          <span>⚠️ {error}</span>
          <button 
            onClick={() => setError('')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#991B1B', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✖
          </button>
        </div>
      )}

      {/* HEADER */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          👥 Team Timesheet Dashboard
          <span style={roleStyleStyle}>{user.role}</span>
        </h2>
      </div>

      {/* STATS */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#D1FAE5')}>
          <div style={statValueStyle}>{stats.updated}</div>
          <div style={statLabelStyle}>Today Updated</div>
        </div>
        <div style={statCardStyle('#FEF3C7')}>
          <div style={statValueStyle}>{stats.pending}</div>
          <div style={statLabelStyle}>Today Pending</div>
        </div>
        <div style={statCardStyle('#EFF6FF')}>
          <div style={statValueStyle}>{stats.total}</div>
          <div style={statLabelStyle}>Team Members</div>
        </div>
        {yesterdayStats.pending > 0 && (
          <div style={statCardStyle('#FEF3C7')}>
            <div style={statValueStyle}>{yesterdayStats.pending}</div>
            <div style={statLabelStyle}>Yesterday Pending</div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={tabContainerStyle}>
        <button style={tabButtonStyle(activeTab === 'today-updated')} onClick={() => setActiveTab('today-updated')}>
          ✅ Today Updated ({stats.updated})
        </button>
        <button style={tabButtonStyle(activeTab === 'today-pending')} onClick={() => setActiveTab('today-pending')}>
          ⏳ Today Pending ({stats.pending})
        </button>
        <button style={tabButtonStyle(activeTab === 'yesterday-pending')} onClick={() => setActiveTab('yesterday-pending')}>
          ⏳ Yesterday Pending ({yesterdayStats.pending})
        </button>
        <button style={tabButtonStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          📋 All ({stats.total})
        </button>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="🔍 Search employee name or email..."
        value={searchEmployee}
        onChange={(e) => setSearchEmployee(e.target.value)}
        style={searchInputStyle}
      />

      {/* ========== TODAY UPDATED - CLICKABLE ========== */}
      {activeTab === 'today-updated' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No timesheets updated today</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div 
                key={emp.id} 
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleViewTimesheets(emp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {emp.email} • {emp.designation}
                    </div>
                  </div>
                  <span style={statusBadgeStyle('filled')}>✅ Updated</span>
                </div>
                <div style={hoursStyle}>⏰ {emp.todayHours.toFixed(1)}h today</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={detailStyle}>
                    <strong>Total Hours:</strong> {emp.totalHours.toFixed(1)}h
                  </div>
                  <div style={detailStyle}>
                    <strong>Filled Days:</strong> {emp.filledDays}
                  </div>
                  <div style={detailStyle}>
                    <strong>Locked:</strong> {emp.lockedDays}
                  </div>
                </div>
                <div style={clickHintStyle}>
                  👆 Click to view all filled timesheets with details
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== TODAY PENDING - CLICKABLE ========== */}
      {activeTab === 'today-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>All team members updated today!</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div 
                key={emp.id} 
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleViewTimesheets(emp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {emp.email} • {emp.designation}
                    </div>
                  </div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet not filled yet for today
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={detailStyle}>
                    <strong>Total Hours:</strong> {emp.totalHours.toFixed(1)}h
                  </div>
                  <div style={detailStyle}>
                    <strong>Filled Days:</strong> {emp.filledDays}
                  </div>
                  <div style={detailStyle}>
                    <strong>Locked:</strong> {emp.lockedDays}
                  </div>
                </div>
                <div style={clickHintStyle}>
                  👆 Click to view previous filled timesheets
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== YESTERDAY PENDING - CLICKABLE ========== */}
      {activeTab === 'yesterday-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending timesheets from yesterday</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div 
                key={emp.id} 
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleViewTimesheets(emp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {emp.email} • {emp.designation}
                    </div>
                  </div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                {emp.yesterdayDate && (
                  <div style={detailStyle}>
                    <strong>📅 Pending Date:</strong> {new Date(emp.yesterdayDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet not filled yet
                </div>
                <div style={clickHintStyle}>
                  👆 Click to view all filled timesheets
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== ALL - CLICKABLE ========== */}
      {activeTab === 'all' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No employees found</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div 
                key={emp.id} 
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleViewTimesheets(emp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {emp.email} • {emp.designation}
                    </div>
                  </div>
                  <span style={statusBadgeStyle(emp.todayStatus)}>
                    {emp.todayStatus === 'filled' ? '✅ Updated Today' : '⏳ Pending Today'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={detailStyle}>
                    <strong>Today:</strong> {emp.todayStatus === 'filled' ? `${emp.todayHours.toFixed(1)}h` : 'Pending'}
                  </div>
                  <div style={detailStyle}>
                    <strong>Total Hours:</strong> {emp.totalHours.toFixed(1)}h
                  </div>
                  <div style={detailStyle}>
                    <strong>Filled Days:</strong> {emp.filledDays}
                  </div>
                  <div style={detailStyle}>
                    <strong>Locked:</strong> {emp.lockedDays}
                  </div>
                </div>
                <div style={clickHintStyle}>
                  👆 Click to view detailed timesheets
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Employee Timesheet Modal */}
      {showTimesheetModal && selectedEmployee && (
        <EmployeeTimesheetModal
          employee={selectedEmployee}
          token={token}
          onClose={() => {
            setShowTimesheetModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}

export default ManagerTimesheetDashboard;
