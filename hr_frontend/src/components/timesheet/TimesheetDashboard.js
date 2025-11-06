import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import TimesheetCalendar from './TimesheetCalendar';
import ActivityTracker from './ActivityTracker';
import ManagerTimesheetDashboard from './ManagerTimesheetDashboard';
import AdminTimesheetDashboard from './AdminTimesheetDashboard';

function TimesheetDashboard() {
  const { user } = useUser();
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
  const [absenceInfo, setAbsenceInfo] = useState(null);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  useEffect(() => {
    if (user) {
      loadTimesheetData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  const loadTimesheetData = async () => {
    try {
      setLoading(true);
      setError('');

      const today = new Date();
      const isCurrent = 
        currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() === today.getMonth();
      setIsCurrentMonth(isCurrent);

      const mockData = generateMockTimesheetData(currentMonth);
      setTimesheetData(mockData);

      calculateStats(mockData);
      calculateAbsence(mockData);
    } catch (error) {
      console.error('Error loading timesheet data:', error);
      setError('Failed to load timesheet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTimesheetData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      // ✅ UPDATED: Only Sunday (0) is weekend, not Saturday
      const isWeekend = currentDate.getDay() === 0;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isPast = currentDate < today;

      const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
      const isCurrentOrPreviousDay = isToday || (isPast && daysDiff === 1);

      const randomHours = Math.random();
      let hoursLogged = null;
      let status = 'future';
      let isLocked = false;
      let isEditable = false;

      if (isWeekend) {
        status = 'weekend';
      } else if (isPast || isToday) {
        if (daysDiff >= 2 && randomHours > 0.5) {
          status = 'locked';
          isLocked = true;
          isEditable = false;
        } else if (isCurrentOrPreviousDay) {
          if (randomHours > 0.6) {
            hoursLogged = (7 + randomHours).toFixed(1);
            status = 'filled';
            isEditable = false;
          } else {
            status = 'pending';
            isEditable = true;
          }
        } else if (daysDiff === 1 && randomHours < 0.5) {
          status = 'pending';
          isEditable = false;
        } else if (daysDiff > 1 && randomHours > 0.3) {
          hoursLogged = (7 + randomHours).toFixed(1);
          status = 'filled';
          isEditable = false;
        } else if (daysDiff > 1) {
          status = 'locked';
          isLocked = true;
          isEditable = false;
        }
      }

      data.push({
        date: currentDate,
        day: i,
        isWeekend: isWeekend,
        isToday: isToday,
        isPast: isPast,
        daysDiff: daysDiff,
        hoursLogged: hoursLogged,
        status: status,
        isEditable: isEditable,
        isLocked: isLocked,
        isAbsent: false,
      });
    }
    return data;
  };

  const calculateAbsence = (data) => {
    const lockedDays = data.filter(
      day => day.isLocked && !day.isWeekend && (day.isPast || day.isToday)
    );

    const totalLockedDays = lockedDays.length;
    let absenceCount = 0;
    let absenceDays = [];

    if (totalLockedDays >= 3) {
      absenceCount = Math.ceil(totalLockedDays / 3);
    }

    if (absenceCount > 0) {
      absenceDays = lockedDays.slice(0, absenceCount);

      const updatedData = data.map(day => {
        const isAbsentDay = absenceDays.some(
          absDay => absDay.day === day.day && absDay.status === 'locked'
        );
        return isAbsentDay ? { ...day, isAbsent: true } : day;
      });

      setTimesheetData(updatedData);

      setAbsenceInfo({
        absentDates: absenceDays.map(d => d.day),
        absenceCount: absenceCount,
        totalLockedDays: totalLockedDays,
        month: new Date(lockedDays[0].date).toLocaleString('default', { month: 'long' })
      });
    } else {
      setAbsenceInfo(null);
    }
  };

  const calculateStats = (data) => {
    let filled = 0;
    let pending = 0;
    let locked = 0;
    let absent = 0;
    let total = 0;

    data.forEach((day) => {
      if (!day.isWeekend && (day.isPast || day.isToday)) {
        total++;
        if (day.isAbsent) {
          absent++;
          locked++;
        } else if (day.isLocked) {
          locked++;
        } else if (day.hoursLogged) {
          filled++;
        } else {
          pending++;
        }
      }
    });

    setStats({
      filledDays: filled,
      pendingDays: pending,
      lockedDays: locked,
      absenceDays: absent,
      totalDays: total,
    });
  };

  const handleCalendarDataUpdate = (updatedData) => {
    setTimesheetData(updatedData);
    calculateStats(updatedData);
    calculateAbsence(updatedData);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Styles
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

  const absenceBannerStyle = {
    backgroundColor: '#DC2626',
    border: '2px solid #991B1B',
    color: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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

  // ========== RENDER BASED ON ROLE ==========

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

  // ✅ EMPLOYEE VIEW (DEFAULT)
  return (
    <div style={containerStyle}>
      {/* Error Message */}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Past Month Warning */}
      {!isCurrentMonth && (
        <div style={pastMonthWarningStyle}>
          <div style={{ fontSize: '18px' }}>⏰</div>
          <div>
            <strong>Viewing Past Month</strong> - All entries are locked. View only. Switch to current month to edit.
          </div>
        </div>
      )}

      {/* Absence Banner */}
      {absenceInfo && (
        <div style={absenceBannerStyle}>
          <div style={{ fontSize: '20px' }}>❌</div>
          <div>
            <strong>{absenceInfo.absenceCount === 1 ? '1 day' : `${absenceInfo.absenceCount} days`} marked as ABSENT:</strong> {absenceInfo.month} ({absenceInfo.absentDates.join(', ')})
            <br />
            <span style={{ fontSize: '13px', opacity: 0.9 }}>
              ({absenceInfo.totalLockedDays} total missed timesheet entries)
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Welcome, {user.name}!</h1>
        <p style={subtitleStyle}>Log your daily working hours and activities</p>
      </div>

      {/* Stats Cards */}
      <div style={statsGridStyle}>
        <div
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <div style={statLabelStyle}>Days Filled</div>
          <div style={statValueStyle}>{stats.filledDays}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            out of {stats.totalDays} working days
          </div>
        </div>

        <div
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <div style={statLabelStyle}>Pending Days</div>
          <div style={statValueStyle}>{stats.pendingDays}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {stats.pendingDays > 0 ? 'Action required' : 'All caught up'}
          </div>
        </div>

        <div
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <div style={statLabelStyle}>Locked Days</div>
          <div style={{ ...statValueStyle, color: stats.lockedDays > 0 ? '#EF4444' : '#10B981' }}>
            {stats.lockedDays}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {stats.lockedDays > 0 ? 'Request unlock' : 'No locked entries'}
          </div>
        </div>

        {stats.absenceDays > 0 && (
          <div
            style={{
              ...statCardStyle,
              backgroundColor: '#DC2626',
              borderColor: '#991B1B',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ ...statLabelStyle, color: 'white' }}>Days Marked Absent</div>
            <div style={{ ...statValueStyle, color: 'white' }}>
              {stats.absenceDays}
            </div>
            <div style={{ fontSize: '12px', color: '#fecaca', marginTop: '8px' }}>
              {absenceInfo?.absenceCount === 1 ? '1 day' : `${absenceInfo?.absenceCount} days`} marked
            </div>
          </div>
        )}
      </div>

      {/* Manager/Admin Section - Only for Manager & HR */}
      {(user.role === 'Manager' || user.role === 'HR') && (
        <>
          <div style={dividerStyle}>
            <div style={dividerLabelStyle}>
              {user.role === 'HR' ? 'HR Management' : 'Team Management'}
            </div>
          </div>

          {/* Manager Section */}
          {user.role === 'Manager' && (
            <div style={managementSectionStyle}>
              <div style={managementHeaderStyle}>
                <div>
                  <h3 style={managementTitleStyle}>👥 Team Timesheet Management</h3>
                  <p style={managementDescStyle}>View your team members' timesheets and track completion status</p>
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

          {/* HR Section */}
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

      {/* Tab Navigation */}
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

          {/* Tab Content */}
          {activeTab === 'timesheet' && (
            <div>
              {/* Month Navigation */}
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

              {/* Calendar Component */}
              <TimesheetCalendar 
                timesheetData={timesheetData} 
                isCurrentMonth={isCurrentMonth}
                onDataUpdate={handleCalendarDataUpdate}
              />
            </div>
          )}

          {activeTab === 'activities' && <ActivityTracker />}
        </>
      )}

      {/* Show Manager View */}
      {showManagerView && <ManagerTimesheetDashboard />}

      {/* Show Admin View */}
      {showAdminView && <AdminTimesheetDashboard />}
    </div>
  );
}

export default TimesheetDashboard;
