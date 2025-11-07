import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';

function TimesheetEntryModal({ isOpen, dayData, onClose, onSave }) {
  const { token } = useUser();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [calculatedHours, setCalculatedHours] = useState('8');
  const [activityDescription, setActivityDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [morning, setMorning] = useState('');
  const [morningOutput, setMorningOutput] = useState('');
  const [afternoon, setAfternoon] = useState('');
  const [afternoonOutput, setAfternoonOutput] = useState('');

  useEffect(() => {
    if (isOpen && dayData) {
      setStartTime(dayData.startTime || '09:00');
      setEndTime(dayData.endTime || '17:00');
      setActivityDescription(dayData.description || '');
      
      if (dayData.activities && dayData.activities.length > 0) {
        const morningActivity = dayData.activities.find(a => a.slot === 'morning');
        const afternoonActivity = dayData.activities.find(a => a.slot === 'afternoon');
        
        if (morningActivity) {
          setMorning(morningActivity.description);
          setMorningOutput(morningActivity.output || '');
        }
        
        if (afternoonActivity) {
          setAfternoon(afternoonActivity.description);
          setAfternoonOutput(afternoonActivity.output || '');
        }
      }
      
      setError('');
    }
  }, [isOpen, dayData]);

  useEffect(() => {
    if (startTime && endTime) {
      const hours = calculateHours(startTime, endTime);
      setCalculatedHours(hours);
    }
  }, [startTime, endTime]);

  const calculateHours = (start, end) => {
    try {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);

      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;

      let diffMin = endTotalMin - startTotalMin;

      if (diffMin < 0) {
        diffMin += 24 * 60;
      }

      const hours = (diffMin / 60).toFixed(2);
      return hours;
    } catch {
      return '0';
    }
  };

  const validateForm = () => {
    if (!startTime.trim()) {
      return 'Please enter start time';
    }

    if (!endTime.trim()) {
      return 'Please enter end time';
    }

    if (!activityDescription.trim()) {
      return 'Please describe your daily activities';
    }

    const hours = parseFloat(calculatedHours);

    if (isNaN(hours)) {
      return 'Invalid time format';
    }

    if (hours < 7) {
      return 'Minimum 7 hours required';
    }

    if (hours > 8.5) {
      return 'Maximum 8.5 hours allowed. Please adjust your times.';
    }

    if (activityDescription.length < 10) {
      return 'Activity description must be at least 10 characters';
    }

    return '';
  };

  const handleStartTimeChange = (e) => {
    const value = e.target.value;
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
      setStartTime(value);
      setError('');
    }
  };

  const handleEndTimeChange = (e) => {
    const value = e.target.value;
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
      setEndTime(value);
      setError('');
    }
  };

  const handleActivityChange = (e) => {
    setActivityDescription(e.target.value);
    setError('');
  };

  // ✅ SAVE TO API
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ CONVERT DATE STRING TO DATE OBJECT FIRST
      const dateObj = typeof dayData.date === 'string' 
        ? new Date(dayData.date + 'T00:00:00') 
        : dayData.date;
      
      // ✅ Format date as YYYY-MM-DD
      const dateStr = dateObj.toISOString().split('T')[0];

      // ✅ Create activities
      const activities = [];
      
      if (morning) {
        activities.push({
          slot: 'morning',
          description: morning,
          output: morningOutput,
          start_time: startTime,
          end_time: '12:30'
        });
      }
      
      if (afternoon) {
        activities.push({
          slot: 'afternoon',
          description: afternoon,
          output: afternoonOutput,
          start_time: '13:30',
          end_time: endTime
        });
      }

      // ✅ Prepare API payload
      const payload = {
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        description: activityDescription,
        activities: activities
      };

      // ✅ Call API
      const response = await timesheetService.createTimesheet(token, payload);

      // ✅ Call parent callback
      onSave({
        date: dateObj,
        startTime: startTime,
        endTime: endTime,
        hours: parseFloat(calculatedHours),
        description: activityDescription,
        activities: response.activities || activities,
        ...response
      });

      onClose();
    } catch (err) {
      setError(err.detail || 'Failed to save timesheet entry. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setStartTime('09:00');
    setEndTime('17:00');
    setActivityDescription('');
    setMorning('');
    setMorningOutput('');
    setAfternoon('');
    setAfternoonOutput('');
    setError('');
    onClose();
  };

  const setQuickTimeRange = (start, end) => {
    setStartTime(start);
    setEndTime(end);
    setError('');
  };

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: isOpen ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflowY: 'auto',
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    maxWidth: '550px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    animation: 'slideIn 0.3s ease-out',
    margin: '20px auto',
  };

  const titleStyle = {
    fontSize: '22px',
    fontWeight: '600',
    color: '#004aad',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  };

  const dateDisplayStyle = {
    fontSize: '14px',
    color: '#888',
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    borderLeft: '4px solid #004aad',
  };

  const formGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  };

  const timeInputContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: error ? '2px solid #EF4444' : '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textAlign: 'center',
  };

  const inputFocusStyle = {
    outline: 'none',
    borderColor: '#004aad',
    boxShadow: '0 0 0 3px rgba(0, 74, 173, 0.1)',
  };

  const textareaStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: error ? '2px solid #EF4444' : '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  };

  const calculatedHoursStyle = {
    padding: '12px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #0284C7',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#0369a1',
  };

  const hoursValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: parseFloat(calculatedHours) > 8.5 ? '#EF4444' : '#10B981',
  };

  const errorStyle = {
    color: '#EF4444',
    fontSize: '13px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const quickTimeButtonsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  };

  const quickTimeButtonStyle = {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: '12px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: isSubmitting ? 0.6 : 1,
  };

  const saveButtonStyle = {
    flex: 1,
    padding: '12px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: isSubmitting ? 0.6 : 1,
  };

  if (!isOpen) return null;

  // ✅ SAFE DATE CONVERSION FOR DISPLAY
  const displayDate = typeof dayData?.date === 'string' 
    ? new Date(dayData.date + 'T00:00:00')
    : dayData?.date;

  return (
    <div style={overlayStyle} onClick={handleCancel}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <h2 style={titleStyle}>📅 Log Timesheet Entry</h2>
        <p style={subtitleStyle}>Record your working hours and daily activities</p>

        {/* Date Display */}
        {dayData && (
          <div style={dateDisplayStyle}>
            <strong>Date:</strong> {displayDate.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {/* Start Time & End Time */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Working Hours (24-hour format) *</label>
          <div style={timeInputContainerStyle}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Start Time
              </label>
              <input
                type="text"
                placeholder="09:00"
                value={startTime}
                onChange={handleStartTimeChange}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = error ? '#EF4444' : '#d1d5db';
                }}
                style={inputStyle}
                disabled={isSubmitting}
                maxLength="5"
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                End Time
              </label>
              <input
                type="text"
                placeholder="17:00"
                value={endTime}
                onChange={handleEndTimeChange}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = error ? '#EF4444' : '#d1d5db';
                }}
                style={inputStyle}
                disabled={isSubmitting}
                maxLength="5"
              />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', textAlign: 'center' }}>
            Format: HH:MM (e.g., 09:00, 17:30)
          </div>
        </div>

        {/* Calculated Hours Display */}
        <div style={calculatedHoursStyle}>
          <div style={{ marginBottom: '8px' }}>Total Hours: <span style={hoursValueStyle}>{calculatedHours}h</span></div>
          <div style={{ fontSize: '12px', color: '#0369a1' }}>
            {parseFloat(calculatedHours) > 8.5 && '⚠️ Exceeds 8.5 hours limit'}
            {parseFloat(calculatedHours) < 7 && '⚠️ Less than 7 hours'}
            {parseFloat(calculatedHours) >= 7 && parseFloat(calculatedHours) <= 8.5 && '✅ Valid time range'}
          </div>
        </div>

        {/* Quick Time Buttons */}
        <div style={formGroupStyle}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Quick Fill (24-hour):</label>
          <div style={quickTimeButtonsStyle}>
            <button
              style={quickTimeButtonStyle}
              onClick={() => setQuickTimeRange('09:00', '16:00')}
              disabled={isSubmitting}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = 'white')}
              title="7 hours"
            >
              09:00 - 16:00
            </button>
            <button
              style={quickTimeButtonStyle}
              onClick={() => setQuickTimeRange('09:00', '17:00')}
              disabled={isSubmitting}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = 'white')}
              title="8 hours"
            >
              09:00 - 17:00
            </button>
            <button
              style={quickTimeButtonStyle}
              onClick={() => setQuickTimeRange('09:00', '17:30')}
              disabled={isSubmitting}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = 'white')}
              title="8.5 hours"
            >
              09:00 - 17:30
            </button>
          </div>
        </div>

        {/* Activity Description */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Daily Activity Summary *</label>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
            Describe what you accomplished today (at least 10 characters)
          </p>
          <textarea
            value={activityDescription}
            onChange={handleActivityChange}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = error ? '#EF4444' : '#d1d5db';
            }}
            style={textareaStyle}
            placeholder="e.g., Attended meetings, completed project tasks, code reviews, fixed bugs, etc."
            disabled={isSubmitting}
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
            {activityDescription.length}/500 characters
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={errorStyle}>
            ⚠️ {error}
          </div>
        )}

        {/* Button Group */}
        <div style={buttonGroupStyle}>
          <button
            style={cancelButtonStyle}
            onClick={handleCancel}
            disabled={isSubmitting}
            onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = 'white')}
          >
            Cancel
          </button>
          <button
            style={saveButtonStyle}
            onClick={handleSave}
            disabled={isSubmitting}
            onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#003380')}
            onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#004aad')}
          >
            {isSubmitting ? 'Saving...' : '✓ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimesheetEntryModal;
