import React, { useState, useEffect } from 'react';
import TimesheetEntryModal from './TimesheetEntryModal';

function TimesheetCalendar({ timesheetData, isCurrentMonth, onDataUpdate, onReload }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [updatedData, setUpdatedData] = useState(timesheetData);

  // ✅ UPDATE LOCAL STATE WHEN PROPS CHANGE
  useEffect(() => {
    setUpdatedData(timesheetData);
  }, [timesheetData]);

  if (!timesheetData || timesheetData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No data available</div>;
  }

  // ✅ SAFE DATE CONVERSION
  const firstDateObj = typeof timesheetData[0].date === 'string'
    ? new Date(timesheetData[0].date + 'T00:00:00')
    : timesheetData[0].date;

  const startingDayOfWeek = firstDateObj.getDay();

  const emptyCells = Array(startingDayOfWeek).fill(null);
  const allCells = [...emptyCells, ...updatedData];

  // Handle modal save - update with API response
  const handleSaveEntry = async (data) => {
    console.log('Timesheet entry saved:', data);

    // ✅ SAFE DATE COMPARISON
    const savedDateObj = typeof data.date === 'string'
      ? new Date(data.date + 'T00:00:00')
      : data.date;

    const newUpdatedData = updatedData.map(day => {
      const dayDateObj = typeof day.date === 'string'
        ? new Date(day.date + 'T00:00:00')
        : day.date;

      const isSameDay = dayDateObj.toDateString() === savedDateObj.toDateString();

      if (isSameDay) {
        return {
          ...day,
          ...data,
          hoursLogged: data.hours_logged ? (data.hours_logged / 60).toFixed(1) : data.hours,
          status: data.status || 'filled',
          startTime: data.start_time || data.startTime,
          endTime: data.end_time || data.endTime,
          description: data.description,
          activities: data.activities || [],
          isLocked: data.is_locked || false,
        };
      }
      return day;
    });

    setUpdatedData(newUpdatedData);

    // ✅ NOTIFY PARENT
    if (onDataUpdate) {
      onDataUpdate(newUpdatedData);
    }

    setShowEntryModal(false);

    // ✅ RELOAD FROM API AFTER SAVE
    if (onReload) {
      await onReload();
    }
  };

  // Handle date click - WITH FUTURE DATE BLOCKING
  const handleDateClick = (dayData) => {
    console.log('🖱️ Clicked date:', dayData?.day, 'isFuture:', dayData?.isFuture, 'isEditable:', dayData?.isEditable);
    
    // ✅ Can't edit past months
    if (!isCurrentMonth) {
      console.log('❌ Past month - blocked');
      return;
    }

    // ✅ Can't click on future dates
    if (dayData && dayData.isFuture) {
      console.log('❌ Future date - blocked');
      return;
    }

    // ✅ Can't click on weekends
    if (dayData && dayData.isWeekend) {
      console.log('❌ Weekend - blocked');
      return;
    }

    // ✅ Can only click on editable dates
    if (dayData && dayData.isEditable) {
      console.log('✅ Editable - opening modal');
      setSelectedDate({
        ...dayData,
        date: dayData.date,
      });
      setShowEntryModal(true);
    } else {
      console.log('❌ Not editable - blocked');
    }
  };

  // Styles
  const calendarContainerStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    opacity: isCurrentMonth ? 1 : 0.7,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  };

  const weekdayHeaderStyle = {
    textAlign: 'center',
    fontWeight: '600',
    color: '#666',
    fontSize: '14px',
    padding: '12px 8px',
    borderBottom: '2px solid #e5e7eb',
  };

  const dayHeadersStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  };

  const getDayCellStyle = (dayData) => {
    if (!dayData) {
      return {
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        padding: '12px',
        textAlign: 'center',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #f3f4f6',
      };
    }

    let bgColor = 'white';
    let borderColor = '#e5e7eb';
    let textColor = '#333';

    // ✅ ONLY SUNDAY IS WEEKEND (day 0)
    if (dayData.isWeekend) {
      bgColor = '#f9fafb';
      textColor = '#999';
    } else if (dayData.is_absent || dayData.isAbsent) {
      bgColor = '#DC2626';
      borderColor = '#991B1B';
      textColor = 'white';
    } else if (dayData.is_locked || dayData.isLocked) {
      bgColor = '#FEE2E2';
      borderColor = '#FECACA';
    } else if (dayData.status === 'filled') {
      bgColor = '#D1FAE5';
      borderColor = '#6EE7B7';
    } else if (dayData.status === 'pending') {
      bgColor = '#FEF3C7';
      borderColor = '#FCD34D';
    } else if (dayData.isFuture) {
      // ✅ FUTURE DATES - GRAY
      bgColor = '#F3F4F6';
      textColor = '#9CA3AF';
    } else if (dayData.isToday) {
      bgColor = '#EFF6FF';
      borderColor = '#0284C7';
    }

    return {
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      padding: '12px',
      textAlign: 'center',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isCurrentMonth && dayData.isEditable && !dayData.isFuture ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      color: textColor,
      opacity: isCurrentMonth ? 1 : 0.8,
      pointerEvents: isCurrentMonth && !dayData.isFuture ? 'auto' : 'none',
    };
  };

  const dayNumberStyle = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  };

  const hoursStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#10B981',
    marginBottom: '4px',
  };

  const statusBadgeStyle = {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '500',
  };

  const getStatusBadgeStyle = (dayData) => {
    let bgColor = 'white';
    let textColor = '#666';

    const isAbsent = dayData.is_absent || dayData.isAbsent;
    const isLocked = dayData.is_locked || dayData.isLocked;

    if (isAbsent) {
      bgColor = 'rgba(255, 255, 255, 0.2)';
      textColor = 'white';
    } else if (isLocked) {
      bgColor = '#FECACA';
      textColor = '#991B1B';
    } else if (dayData.status === 'filled') {
      bgColor = '#6EE7B7';
      textColor = '#065F46';
    } else if (dayData.status === 'pending') {
      bgColor = '#FCD34D';
      textColor = '#92400E';
    } else if (dayData.isFuture) {
      bgColor = '#E5E7EB';
      textColor = '#6B7280';
    }

    return {
      ...statusBadgeStyle,
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  const getStatusText = (dayData) => {
    if (dayData.is_absent || dayData.isAbsent) return '❌ ABSENT';
    if (dayData.is_locked || dayData.isLocked) return 'Locked';
    if (dayData.status === 'filled') return 'Filled';
    if (dayData.status === 'pending') return 'Pending';
    if (dayData.isFuture) return 'Future';
    if (dayData.isToday) return 'Today';
    return 'Editable';
  };

  // ✅ GET HOURS DISPLAY VALUE
  const getHoursDisplay = (dayData) => {
    if (dayData.is_absent || dayData.isAbsent) {
      return null;
    }

    if (dayData.hours_logged) {
      return ((dayData.hours_logged / 60).toFixed(1)) + 'h';
    }

    if (dayData.hoursLogged) {
      return dayData.hoursLogged + 'h';
    }

    return null;
  };

  return (
    <>
      <div style={calendarContainerStyle}>
        {/* Weekday Headers */}
        <div style={dayHeadersStyle}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={weekdayHeaderStyle}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={gridStyle}>
          {allCells.map((dayData, index) => (
            <div
              key={index}
              style={getDayCellStyle(dayData)}
              onClick={() => handleDateClick(dayData)}
              onMouseEnter={(e) => {
                // ✅ ONLY show hover for editable, non-future dates
                if (isCurrentMonth && dayData && dayData.isEditable && !dayData.isFuture) {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (isCurrentMonth && dayData && dayData.isEditable && !dayData.isFuture) {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {dayData && (
                <>
                  <div style={dayNumberStyle}>{dayData.day}</div>
                  {getHoursDisplay(dayData) && (
                    <div style={hoursStyle}>{getHoursDisplay(dayData)}</div>
                  )}
                  <div style={getStatusBadgeStyle(dayData)}>
                    {getStatusText(dayData)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Filled (7-8.5 hours)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Locked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#DC2626', border: '1px solid #991B1B', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Sunday (Non-working)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '4px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Future</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <TimesheetEntryModal
        isOpen={showEntryModal}
        dayData={selectedDate}
        onClose={() => setShowEntryModal(false)}
        onSave={handleSaveEntry}
      />
    </>
  );
}

export default TimesheetCalendar;
