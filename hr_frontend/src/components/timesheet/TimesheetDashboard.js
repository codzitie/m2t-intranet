import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';
import TimesheetCalendar from './TimesheetCalendar';
import ActivityTracker from './ActivityTracker';
import ManagerTimesheetDashboard from './ManagerTimesheetDashboard';
import AdminTimesheetDashboard from './AdminTimesheetDashboard';

function TimesheetDashboard() {
  const { user, token } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timesheet');
  const [showManagerView, setShowManagerView] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [stats, setStats] = useState({
    filledDays: 0,
    pendingDays: 0,
    lockedDays: 0,
    absenceDays: 0,
    totalDays: 0,
  });
  const [error, setError] = useState('');
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  // ============= FETCH TIMESHEET DATA FROM API =============
  useEffect(() => {
    console.log('🔍 useEffect triggered');
    console.log('User:', user);
    console.log('Token:', token ? 'EXISTS' : 'MISSING');
    
    if (user && token) {
      console.log('✅ Calling loadTimesheetData()');
      loadTimesheetData();
    } else {
      console.log('❌ User or token missing!');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, currentMonth]);

  const loadTimesheetData = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date();
      console.log('📅 Today:', today, 'ISO:', today.toISOString());
      
      const isCurrent = 
        currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() === today.getMonth();
      setIsCurrentMonth(isCurrent);

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      console.log(`📅 Fetching: /api/timesheets/month/${year}/${month}`);

      // ✅ Get timesheet entries
      const entries = await timesheetService.getMonthTimesheets(token, year, month);
      console.log('✅ Got entries from API:', entries);
      
      // ✅ DEBUG: Check what dates we got
      entries.forEach((entry, index) => {
        console.log(`📅 [${index}] Entry date: "${entry.date}" | Type: ${typeof entry.date}`);
      });
      
      // ✅ GET STATS FROM API (Backend calculates with auto-lock logic)
      const statsData = await timesheetService.getTimesheetStats(token, year, month);
      console.log('✅ Got stats from API:', statsData);

      // ✅ Format API data for frontend display only
      const formattedData = formatApiDataForFrontend(entries, currentMonth, isCurrent);
      console.log('✅ Formatted data:', formattedData);
      
      setTimesheetData(formattedData);
      
      // ✅ TRANSFORM SNAKE_CASE TO CAMELCASE
      const transformedStats = {
        filledDays: statsData.filled_days || 0,
        pendingDays: statsData.pending_days || 0,
        lockedDays: statsData.locked_days || 0,
        absenceDays: statsData.absent_days || 0,
        totalDays: statsData.total_days || 0,
      };
      console.log('✅ Transformed stats:', transformedStats);
      
      setStats(transformedStats);

    } catch (error) {
      console.error('❌ ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error detail:', error.detail);
      console.error('Full error:', error);
      
      setError(error?.detail || error?.message || 'Failed to load timesheet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ RELOAD CALLBACK FOR CALENDAR
  const reloadTimesheetData = async () => {
    console.log('🔄 Reloading timesheet data...');
    await loadTimesheetData();
  };

  // ============= FORMAT API DATA FOR FRONTEND =============
// ============= FORMAT API DATA FOR FRONTEND =============
// ============= FORMAT API DATA FOR FRONTEND =============
const formatApiDataForFrontend = (apiEntries, monthDate, isCurrentMonth) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ✅ CREATE TODAY'S DATE STRING
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // ✅ Calculate yesterday (1 day ago)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const entriesMap = {};
  if (Array.isArray(apiEntries)) {
    apiEntries.forEach(entry => {
      entriesMap[entry.date] = entry;
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    const isWeekend = currentDate.getDay() === 0;
    const isToday = dateStr === todayDateStr;
    const isYesterday = dateStr === yesterdayDateStr;
    const isPast = dateStr < todayDateStr;
    const isFuture = dateStr > todayDateStr;

    const apiEntry = entriesMap[dateStr];

    let hoursLogged = null;
    let status = 'future';
    let isLocked = false;
    let isEditable = false;
    let description = '';
    let activities = [];
    let startTime = '';
    let endTime = '';
    let isAbsent = false;

    if (isWeekend) {
      // ✅ WEEKENDS - NOT EDITABLE
      status = 'weekend';
      isLocked = false;
      isEditable = false;
    } else if (apiEntry) {
      // ✅ HAS DATA FROM API
      status = apiEntry.status;
      isLocked = apiEntry.is_locked;
      isAbsent = apiEntry.is_absent;
      hoursLogged = apiEntry.hours_logged ? (apiEntry.hours_logged / 60).toFixed(1) : null;
      description = apiEntry.description;
      activities = apiEntry.activities || [];
      startTime = apiEntry.start_time;
      endTime = apiEntry.end_time;
      isEditable = !isLocked && !isFuture;
    } else if (isFuture) {
      // ✅ FUTURE DATES - NOT EDITABLE
      status = 'future';
      isLocked = false;
      isEditable = false;
    } else if (isToday) {
      // ✅ TODAY - EDITABLE, PENDING
      status = 'pending';
      isLocked = false;
      isEditable = isCurrentMonth;
    } else if (isYesterday) {
      // ✅ YESTERDAY (1 day ago) - STILL EDITABLE, PENDING
      status = 'pending';
      isLocked = false;
      isEditable = isCurrentMonth;
    } else if (isPast && !isWeekend) {
      // ✅ OLDER THAN 1 DAY - LOCKED
      status = 'locked';
      isLocked = true;
      isEditable = false;
    }

    data.push({
      id: apiEntry?.id,
      date: currentDate,
      day: i,
      isWeekend,
      isToday,
      isPast,
      isFuture,
      hoursLogged,
      status,
      isEditable,
      isLocked,
      isAbsent,
      description,
      activities,
      startTime,
      endTime,
    });
  }

  return data;
};



  const handleCalendarDataUpdate = (updatedData) => {
    console.log('📝 Calendar data updated:', updatedData);
    setTimesheetData(updatedData);
  };

  const goToPreviousMonth = () => {
    console.log('⬅️ Going to previous month');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    console.log('➡️ Going to next month');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToCurrentMonth = () => {
    console.log('📅 Going to current month');
    setCurrentMonth(new Date());
  };

  // ============= STYLES =============
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  };

  const headerStyle = {
    marginBottom: '30px',
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '600',
    color: '#004aad',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: '#666',
  };

  const pastMonthWarningStyle = {
    backgroundColor: '#FEF3C7',
    border: '2px solid #FCD34D',
    color: '#92400E',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  };

  const statCardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const statLabelStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: '500',
  };

  const statValueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#004aad',
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: isActive ? '600' : '500',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#004aad' : '#666',
    borderBottom: isActive ? '3px solid #004aad' : 'none',
    cursor: 'pointer',
    marginBottom: '-2px',
    transition: 'all 0.3s ease',
  });

  const monthNavigationStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const monthDisplayStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  };

  const navButtonStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const errorStyle = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  };

  const managementSectionStyle = {
    backgroundColor: 'white',
    border: '2px solid #10B981',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
  };

  const managementHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const managementTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#10B981',
    marginBottom: '4px',
  };

  const managementDescStyle = {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  };

  const managementButtonStyle = (isOpen) => ({
    padding: '10px 20px',
    backgroundColor: isOpen ? 'white' : '#10B981',
    color: isOpen ? '#10B981' : 'white',
    border: isOpen ? '1px solid #10B981' : 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  });

  const loadingStyle = {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#666',
  };

  const notAuthenticatedStyle = {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#666',
  };

  const dividerStyle = {
    height: '2px',
    backgroundColor: '#e5e7eb',
    margin: '40px 0',
    position: 'relative',
  };

  const dividerLabelStyle = {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '0 16px',
    color: '#888',
    fontSize: '14px',
    fontWeight: '500',
  };

  // ========== RENDER ==========

  if (!user) {
    return (
      <div style={notAuthenticatedStyle}>
        Please log in to view your timesheet
      </div>
    );
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        Loading your timesheet...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {!isCurrentMonth && (
        <div style={pastMonthWarningStyle}>
          <div style={{ fontSize: '18px' }}>⏰</div>
          <div>
            <strong>Viewing Past Month</strong> - All entries are locked. View only. Switch to current month to edit.
          </div>
        </div>
      )}

      <div style={headerStyle}>
        <h1 style={titleStyle}>Welcome, {user.name}!</h1>
        <p style={subtitleStyle}>Log your daily working hours and activities</p>
      </div>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Days Filled</div>
          <div style={statValueStyle}>{stats.filledDays}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            out of {stats.totalDays} working days
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Pending Days</div>
          <div style={statValueStyle}>{stats.pendingDays}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {stats.pendingDays > 0 ? 'Action required' : 'All caught up'}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Locked Days</div>
          <div style={{ ...statValueStyle, color: stats.lockedDays > 0 ? '#EF4444' : '#10B981' }}>
            {stats.lockedDays}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {stats.lockedDays > 0 ? 'Request unlock' : 'No locked entries'}
          </div>
        </div>

        {stats.absenceDays > 0 && (
          <div style={{...statCardStyle, backgroundColor: '#DC2626', borderColor: '#991B1B'}}>
            <div style={{ ...statLabelStyle, color: 'white' }}>Days Marked Absent</div>
            <div style={{ ...statValueStyle, color: 'white' }}>{stats.absenceDays}</div>
          </div>
        )}
      </div>

      {(user.role === 'Manager' || user.role === 'HR') && (
        <>
          <div style={dividerStyle}>
            <div style={dividerLabelStyle}>
              {user.role === 'HR' ? 'HR Management' : 'Team Management'}
            </div>
          </div>

          {user.role === 'Manager' && (
            <div style={managementSectionStyle}>
              <div style={managementHeaderStyle}>
                <div>
                  <h3 style={managementTitleStyle}>👥 Team Timesheet Management</h3>
                  <p style={managementDescStyle}>View your team members' timesheets</p>
                </div>
                <button
                  onClick={() => setShowManagerView(!showManagerView)}
                  style={managementButtonStyle(showManagerView)}
                  onMouseEnter={(e) => {
                    if (!showManagerView) e.target.style.backgroundColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    if (!showManagerView) e.target.style.backgroundColor = '#10B981';
                  }}
                >
                  {showManagerView ? '← Back to My Dashboard' : 'View Team Management →'}
                </button>
              </div>
            </div>
          )}

          {user.role === 'HR' && (
            <div style={managementSectionStyle}>
              <div style={managementHeaderStyle}>
                <div>
                  <h3 style={managementTitleStyle}>🏢 HR Dashboard</h3>
                  <p style={managementDescStyle}>View all employee timesheets, manage approvals, and track attendance</p>
                </div>
                <button
                  onClick={() => setShowAdminView(!showAdminView)}
                  style={managementButtonStyle(showAdminView)}
                  onMouseEnter={(e) => {
                    if (!showAdminView) e.target.style.backgroundColor = '#003380';
                  }}
                  onMouseLeave={(e) => {
                    if (!showAdminView) e.target.style.backgroundColor = '#004aad';
                  }}
                >
                  {showAdminView ? '← Back to My Dashboard' : 'Open HR Dashboard →'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!showManagerView && !showAdminView && (
        <>
          <div style={tabContainerStyle}>
            <button 
              style={tabButtonStyle(activeTab === 'timesheet')} 
              onClick={() => setActiveTab('timesheet')}
            >
              📅 Timesheet
            </button>
            <button 
              style={tabButtonStyle(activeTab === 'activities')} 
              onClick={() => setActiveTab('activities')}
            >
              📝 Activities
            </button>
          </div>

          {activeTab === 'timesheet' && (
            <div>
              <div style={monthNavigationStyle}>
                <div style={monthDisplayStyle}>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    style={navButtonStyle} 
                    onClick={goToPreviousMonth}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    ← Previous
                  </button>
                  <button 
                    style={navButtonStyle} 
                    onClick={goToCurrentMonth}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    Today
                  </button>
                  <button 
                    style={navButtonStyle} 
                    onClick={goToNextMonth}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <TimesheetCalendar 
                timesheetData={timesheetData} 
                isCurrentMonth={isCurrentMonth}
                onDataUpdate={handleCalendarDataUpdate}
                onReload={reloadTimesheetData}
              />
            </div>
          )}

          {activeTab === 'activities' && <ActivityTracker />}
        </>
      )}

      {showManagerView && <ManagerTimesheetDashboard />}
      {showAdminView && <AdminTimesheetDashboard />}
    </div>
  );
}

export default TimesheetDashboard;
