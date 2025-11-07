import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';

function ManagerTimesheetDashboard() {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState('today-updated');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    return apiData.map(member => {
      const todayEntry = member.entries.find(e => e.date === todayStr);
      const yesterdayEntry = member.entries.find(e => e.date === yesterdayStr);

      return {
        id: member.user_id,
        name: member.name,
        email: member.email,
        designation: member.designation,
        todayStatus: todayEntry?.status || 'pending',
        yesterdayStatus: yesterdayEntry?.status || 'pending',
        todayTimesheet: todayEntry ? {
          date: todayEntry.date,
          startTime: todayEntry.start_time,
          endTime: todayEntry.end_time,
          hoursLogged: todayEntry.hours_logged ? (todayEntry.hours_logged).toFixed(1) : 0,
          activities: todayEntry.activities || []
        } : null,
      };
    });
  };

  const getFilteredEmployees = () => {
    let filtered = teamMembers;

    if (searchEmployee.trim()) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    switch (activeTab) {
      case 'today-updated':
        return filtered.filter(emp => emp.todayStatus === 'filled');
      case 'today-pending':
        return filtered.filter(emp => emp.todayStatus === 'pending' && emp.todayStatus !== 'locked');
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

  const stats = {
    updated: teamMembers.filter(e => e.todayStatus === 'filled').length,
    pending: teamMembers.filter(e => e.todayStatus === 'pending').length,
    locked: teamMembers.filter(e => e.todayStatus === 'locked').length,
    total: teamMembers.length,
  };

  const yesterdayStats = {
    pending: teamMembers.filter(e => e.yesterdayStatus === 'pending').length,
  };

  // ✅ ACTIVITY DISPLAY COMPONENT
  const ActivityDisplay = ({ activities }) => {
    if (!activities || activities.length === 0) {
      return null;
    }

    const morningActivities = activities.filter(a => a.slot === 'morning');
    const afternoonActivities = activities.filter(a => a.slot === 'afternoon');

    if (morningActivities.length === 0 && afternoonActivities.length === 0) {
      return null;
    }

    return (
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        padding: '16px',
        marginTop: '16px',
      }}>
        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
          📝 Activities:
        </div>

        {morningActivities.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
              🌅 Morning
            </div>
            {morningActivities.map((activity, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  🕐 {activity.start_time} - {activity.end_time}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                  {activity.description}
                </div>
                {activity.output && (
                  <div style={{ fontSize: '12px', color: '#555', backgroundColor: '#f3f4f6', padding: '6px 8px', borderRadius: '4px' }}>
                    Output: {activity.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {afternoonActivities.length > 0 && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
              🌄 Afternoon
            </div>
            {afternoonActivities.map((activity, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  🕐 {activity.start_time} - {activity.end_time}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                  {activity.description}
                </div>
                {activity.output && (
                  <div style={{ fontSize: '12px', color: '#555', backgroundColor: '#f3f4f6', padding: '6px 8px', borderRadius: '4px' }}>
                    Output: {activity.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // STYLES
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
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

  const employeeInfoStyle = {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
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

  if (error) {
    return <div style={errorStyle}>⚠️ {error}</div>;
  }

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          👨‍💼 Team Timesheet Manager
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
        <div style={statCardStyle('#FEE2E2')}>
          <div style={statValueStyle}>{stats.locked}</div>
          <div style={statLabelStyle}>Locked</div>
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
        <button style={tabButtonStyle(activeTab === 'locked')} onClick={() => setActiveTab('locked')}>
          🔒 Locked ({stats.locked})
        </button>
        <button style={tabButtonStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          📋 All ({stats.total})
        </button>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="🔍 Search employee name..."
        value={searchEmployee}
        onChange={(e) => setSearchEmployee(e.target.value)}
        style={searchInputStyle}
      />

      {/* ========== TODAY UPDATED ========== */}
      {activeTab === 'today-updated' && (
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
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={employeeInfoStyle}>{emp.email} • {emp.designation}</div>
                  </div>
                  <span style={statusBadgeStyle('filled')}>✅ Updated</span>
                </div>
                {emp.todayTimesheet && (
                  <>
                    <div style={hoursStyle}>
                      ⏰ {emp.todayTimesheet.hoursLogged}h ({emp.todayTimesheet.startTime} - {emp.todayTimesheet.endTime})
                    </div>
                    <ActivityDisplay activities={emp.todayTimesheet.activities} />
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== TODAY PENDING ========== */}
      {activeTab === 'today-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>All team members updated today!</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={employeeInfoStyle}>{emp.email} • {emp.designation}</div>
                  </div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet not filled yet
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== YESTERDAY PENDING ========== */}
      {activeTab === 'yesterday-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending timesheets from yesterday</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={employeeInfoStyle}>{emp.email} • {emp.designation}</div>
                  </div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet for yesterday not filled yet
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== LOCKED ========== */}
      {activeTab === 'locked' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No locked timesheets</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={employeeInfoStyle}>{emp.email} • {emp.designation}</div>
                  </div>
                  <span style={statusBadgeStyle('locked')}>🔒 Locked</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet is locked (older than 1 day)
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== ALL ========== */}
      {activeTab === 'all' && (
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
                  <div>
                    <div style={employeeNameStyle}>{emp.name}</div>
                    <div style={employeeInfoStyle}>{emp.email} • {emp.designation}</div>
                  </div>
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
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#10B981' }}>
                    ⏰ {emp.todayTimesheet.hoursLogged}h
                  </div>
                )}
                {emp.todayTimesheet && emp.todayTimesheet.activities && emp.todayTimesheet.activities.length > 0 && (
                  <ActivityDisplay activities={emp.todayTimesheet.activities} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ManagerTimesheetDashboard;
