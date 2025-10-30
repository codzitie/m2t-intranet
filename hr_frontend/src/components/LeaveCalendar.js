import React, { useState, useEffect } from 'react';
import { LeaveService } from '../services/mockLeaveService';

function LeaveCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const loadLeaveData = async () => {
    try {
      const response = await LeaveService.getAllLeaveRequests();
      if (response.success) {
        // Filter only approved leaves
        const approvedLeaves = response.data.filter(leave => leave.status === 'Approved');
        setLeaveData(approvedLeaves);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getLeavesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveData.filter(leave => {
      return leave.startDate <= dateStr && leave.endDate >= dateStr;
    });
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const getLeaveTypeColor = (leaveType) => {
    const colors = {
      'Casual Leave': '#3B82F6',
      'Sick Leave': '#EF4444',
      'Earned Leave': '#10B981',
      'Emergency Leave': '#F59E0B'
    };
    return colors[leaveType] || '#6B7280';
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Styles
  const containerStyle = {
    maxWidth: '1400px',
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

  const calendarContainerStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const monthNavigationStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const monthTitleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  };

  const navButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  const calendarGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  };

  const dayHeaderStyle = {
    padding: '12px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
  };

  const dayStyle = (isCurrentMonth, isToday) => ({
    minHeight: '100px',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    backgroundColor: isToday ? '#E0F2FE' : (isCurrentMonth ? 'white' : '#f9fafb'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const dayNumberStyle = (isCurrentMonth) => ({
    fontSize: '14px',
    fontWeight: '600',
    color: isCurrentMonth ? '#333' : '#9CA3AF',
    marginBottom: '4px',
  });

  const leaveIndicatorStyle = (color) => ({
    fontSize: '10px',
    padding: '2px 4px',
    backgroundColor: color,
    color: 'white',
    borderRadius: '3px',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  const legendStyle = {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
    flexWrap: 'wrap',
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
  };

  const legendColorBoxStyle = (color) => ({
    width: '16px',
    height: '16px',
    backgroundColor: color,
    borderRadius: '3px',
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Loading calendar...
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push(date);
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Leave Calendar</h1>
        <p style={subtitleStyle}>View approved leaves across the organization</p>
      </div>

      {/* Calendar */}
      <div style={calendarContainerStyle}>
        {/* Month Navigation */}
        <div style={monthNavigationStyle}>
          <button style={navButtonStyle} onClick={() => changeMonth(-1)}>
            ← Previous
          </button>
          <h2 style={monthTitleStyle}>
            {monthNames[month]} {year}
          </h2>
          <button style={navButtonStyle} onClick={() => changeMonth(1)}>
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={calendarGridStyle}>
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div key={day} style={dayHeaderStyle}>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} style={{ minHeight: '100px' }} />;
            }

            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === today.toDateString();
            const leavesOnDate = getLeavesForDate(date);

            return (
              <div
                key={index}
                style={dayStyle(isCurrentMonth, isToday)}
                onMouseEnter={(e) => {
                  if (isCurrentMonth) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={dayNumberStyle(isCurrentMonth)}>
                  {date.getDate()}
                </div>
                {leavesOnDate.slice(0, 3).map((leave, idx) => (
                  <div
                    key={idx}
                    style={leaveIndicatorStyle(getLeaveTypeColor(leave.leaveType))}
                    title={`${leave.employeeName} - ${leave.leaveType}`}
                  >
                    {leave.employeeName.split(' ')[0]}
                  </div>
                ))}
                {leavesOnDate.length > 3 && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    +{leavesOnDate.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#3B82F6')} />
            <span>Casual Leave</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#EF4444')} />
            <span>Sick Leave</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#10B981')} />
            <span>Earned Leave</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendColorBoxStyle('#F59E0B')} />
            <span>Emergency Leave</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveCalendar;
