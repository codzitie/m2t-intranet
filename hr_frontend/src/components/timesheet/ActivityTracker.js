import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';


function ActivityTracker() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      slot: 'morning',
      description: 'Attended project kickoff call',
      start_time: '10:00',
      end_time: '11:00',
      output: 'Created meeting notes and action items list',
    },
    {
      id: 2,
      date: new Date().toISOString().split('T')[0],
      slot: 'afternoon',
      description: 'Analyzed competitor data',
      start_time: '14:00',
      end_time: '15:30',
      output: 'Prepared competitor analysis document',
    },
  ]);

  const [formData, setFormData] = useState({
    slot: 'morning',
    description: '',
    start_time: '09:30',
    end_time: '10:00',
    output: '',
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Time slot definitions
  const TIME_SLOTS = {
    morning: {
      label: '🌅 Morning (9:30 AM - 1:00 PM)',
      startTime: '09:30',
      endTime: '13:00',
      color: '#FEF3C7',
      borderColor: '#FCD34D',
    },
    afternoon: {
      label: '🌄 Afternoon (2:00 PM - 6:30 PM)',
      startTime: '14:00',
      endTime: '18:30',
      color: '#DBEAFE',
      borderColor: '#0284C7',
    },
  };

  // ✅ TODAY AND YESTERDAY CAN EDIT - OTHERS READ ONLY
  const isEditableDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    return selected.toDateString() === today.toDateString() || 
           selected.toDateString() === yesterday.toDateString();
  };

  // Get activity status
  const getActivityStatus = (activityDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const actDate = new Date(activityDate);
    actDate.setHours(0, 0, 0, 0);

    if (actDate.toDateString() === today.toDateString()) {
      return { 
        label: '✏️ Editable', 
        color: '#D1FAE5',
        borderColor: '#6EE7B7',
      };
    }

    if (actDate.toDateString() === yesterday.toDateString()) {
      return { 
        label: '✏️ Editable', 
        color: '#D1FAE5',
        borderColor: '#6EE7B7',
      };
    }

    return { 
      label: '🔒 View Only', 
      color: '#FEE2E2',
      borderColor: '#FECACA',
    };
  };

  // Get activities for selected date
  const getTodaysActivities = () => {
    return activities.filter(a => new Date(a.date).toDateString() === new Date(selectedDate).toDateString());
  };

  // Get activities by slot
  const getActivitiesBySlot = (slot) => {
    return getTodaysActivities().filter(a => a.slot === slot);
  };

  // Calculate total activity time
  const calculateTotalActivityTime = () => {
    const todaysActivities = getTodaysActivities();
    let totalMinutes = 0;

    todaysActivities.forEach(activity => {
      const startMins = timeToMinutes(activity.start_time);
      const endMins = timeToMinutes(activity.end_time);
      totalMinutes += (endMins - startMins);
    });

    return (totalMinutes / 60).toFixed(2);
  };

  // Convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
  };

  // Check if time is within slot
  const isTimeInSlot = (slot, startTime, endTime) => {
    const slotStart = timeToMinutes(TIME_SLOTS[slot].startTime);
    const slotEnd = timeToMinutes(TIME_SLOTS[slot].endTime);
    const actStart = timeToMinutes(startTime);
    const actEnd = timeToMinutes(endTime);

    return actStart >= slotStart && actEnd <= slotEnd && actStart < actEnd;
  };

  // ✅ VALIDATE FORM
  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Activity description is required';
    }

    if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    if (!formData.output.trim()) {
      newErrors.output = 'Output is required';
    }

    if (!isTimeInSlot(formData.slot, formData.start_time, formData.end_time)) {
      const slot = TIME_SLOTS[formData.slot];
      newErrors.time = `Time must be within ${slot.label}`;
    }

    if (formData.start_time >= formData.end_time) {
      newErrors.time = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ HANDLE ADD/UPDATE
  const handleSaveActivity = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isEditableDate()) {
      alert('Cannot add activities for past dates. Only today and yesterday are allowed.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing activity
        setActivities(prev =>
          prev.map(a =>
            a.id === editingId
              ? { ...a, ...formData, date: selectedDate }
              : a
          )
        );
      } else {
        // Add new activity
        const newActivity = {
          id: Date.now(),
          date: selectedDate,
          ...formData,
        };
        setActivities(prev => [newActivity, ...prev]);
      }

      // Reset form
      setFormData({
        slot: 'morning',
        description: '',
        start_time: '09:30',
        end_time: '10:00',
        output: '',
      });
      setEditingId(null);
      setErrors({});
    } catch (error) {
      console.error('Error saving activity:', error);
      setErrors({ submit: 'Failed to save activity' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (activity) => {
    setFormData({
      slot: activity.slot,
      description: activity.description,
      start_time: activity.start_time,
      end_time: activity.end_time,
      output: activity.output,
    });
    setEditingId(activity.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      setActivities(prev => prev.filter(a => a.id !== id));
      if (editingId === id) {
        setFormData({
          slot: 'morning',
          description: '',
          start_time: '09:30',
          end_time: '10:00',
          output: '',
        });
        setEditingId(null);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      slot: 'morning',
      description: '',
      start_time: '09:30',
      end_time: '10:00',
      output: '',
    });
    setEditingId(null);
    setErrors({});
  };

  // Styles
  const containerStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#004aad',
  };

  const dateInputStyle = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  };

  const formContainerStyle = {
    backgroundColor: isEditableDate() ? '#f9fafb' : '#f3f4f6',
    border: isEditableDate() ? '2px solid #e5e7eb' : '2px solid #d1d5db',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    opacity: isEditableDate() ? 1 : 0.5,
    pointerEvents: isEditableDate() ? 'auto' : 'none',
  };

  const formTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
  };

  const formGroupStyle = {
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: errors.slot ? '2px solid #EF4444' : '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: errors.time || errors.description ? '2px solid #EF4444' : '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: errors.output ? '2px solid #EF4444' : '1px solid #d1d5db',
    borderRadius: '6px',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const timeGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  };

  const slotInfoStyle = {
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '12px',
  };

  const errorMessageStyle = {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
  };

  const saveButtonStyle = {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
    transition: 'all 0.3s ease',
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const summaryCardStyle = {
    backgroundColor: '#EFF6FF',
    border: '2px solid #0284C7',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  };

  const summaryItemStyle = {
    textAlign: 'center',
  };

  const summaryLabelStyle = {
    fontSize: '12px',
    color: '#0369a1',
    marginBottom: '4px',
    fontWeight: '500',
  };

  const summaryValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#004aad',
  };

  const slotContainerStyle = {
    marginBottom: '24px',
  };

  const slotHeaderStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  };

  const activityCardStyle = (status) => ({
    backgroundColor: status.color,
    border: `2px solid ${status.borderColor}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
  });

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: status.color,
    border: `1px solid ${status.borderColor}`,
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '12px',
  });

  const activityTimeStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '8px',
  };

  const activityDescriptionStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  };

  const activityOutputStyle = {
    fontSize: '13px',
    color: '#555',
    marginBottom: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: '8px',
    borderRadius: '4px',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const editButtonStyle = {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const deleteButtonStyle = {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const disabledButtonStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#9CA3AF',
  };

  const lockedMessageStyle = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>📝 Activity Tracker</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={dateInputStyle}
        />
      </div>

      {/* Lock Status Message */}
      {!isEditableDate() && (
        <div style={lockedMessageStyle}>
          🔒 <strong>View Only</strong> - This date is locked. You can only view activities. Add/Edit is allowed only for today and yesterday.
        </div>
      )}

      {/* Form */}
      <div style={formContainerStyle}>
        <h3 style={formTitleStyle}>
          {editingId ? '✏️ Edit Activity' : '➕ Add New Activity'}
        </h3>

        {/* Slot Selection */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Select Time Slot *</label>
          <select
            value={formData.slot}
            onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
            style={selectStyle}
          >
            {Object.entries(TIME_SLOTS).map(([key, slot]) => (
              <option key={key} value={key}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        {/* Slot Info */}
        <div
          style={{
            ...slotInfoStyle,
            backgroundColor: TIME_SLOTS[formData.slot].color,
            borderLeft: `4px solid ${TIME_SLOTS[formData.slot].borderColor}`,
          }}
        >
          {TIME_SLOTS[formData.slot].label}
        </div>

        {/* Time Range */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Time Range *</label>
          <div style={timeGridStyle}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => {
                  setFormData({ ...formData, start_time: e.target.value });
                  setErrors({});
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => {
                  setFormData({ ...formData, end_time: e.target.value });
                  setErrors({});
                }}
                style={inputStyle}
              />
            </div>
          </div>
          {errors.time && (
            <div style={errorMessageStyle}>
              ⚠️ {errors.time}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Activity Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setErrors({});
            }}
            style={inputStyle}
            placeholder="e.g., Attended team meeting, Code review, Bug fix, etc."
          />
          {errors.description && (
            <div style={errorMessageStyle}>
              ⚠️ {errors.description}
            </div>
          )}
        </div>

        {/* Output */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Output / Deliverable *</label>
          <textarea
            value={formData.output}
            onChange={(e) => {
              setFormData({ ...formData, output: e.target.value });
              setErrors({});
            }}
            style={textareaStyle}
            placeholder="Describe the output or type 'No Output' if there was no deliverable"
          />
          {errors.output && (
            <div style={errorMessageStyle}>
              ⚠️ {errors.output}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={buttonGroupStyle}>
          <button
            style={saveButtonStyle}
            onClick={handleSaveActivity}
            disabled={submitting}
            onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#003380')}
            onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#004aad')}
          >
            {submitting ? 'Saving...' : editingId ? '✓ Update' : '✓ Add'}
          </button>
          {editingId && (
            <button
              style={cancelButtonStyle}
              onClick={handleCancel}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
          )}
        </div>

        {errors.submit && (
          <div style={errorMessageStyle}>
            ⚠️ {errors.submit}
          </div>
        )}
      </div>

      {/* Summary Card */}
      {getTodaysActivities().length > 0 && (
        <div style={summaryCardStyle}>
          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>Total Activities</div>
            <div style={summaryValueStyle}>{getTodaysActivities().length}</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>Total Time Logged</div>
            <div style={summaryValueStyle}>{calculateTotalActivityTime()}h</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>Status</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: isEditableDate() ? '#10B981' : '#EF4444' }}>
              {isEditableDate() ? '✏️ Editable' : '🔒 View Only'}
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div>
        {getTodaysActivities().length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
            <p>No activities logged for this day</p>
          </div>
        ) : (
          <>
            {/* Morning Slot */}
            <div style={slotContainerStyle}>
              <div style={slotHeaderStyle}>
                🌅 Morning Activities ({getActivitiesBySlot('morning').length})
              </div>
              {getActivitiesBySlot('morning').length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>
                  No activities in morning slot
                </div>
              ) : (
                getActivitiesBySlot('morning').map(activity => {
                  const status = getActivityStatus(activity.date);
                  return (
                    <div
                      key={activity.id}
                      style={activityCardStyle(status)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={statusBadgeStyle(status)}>
                        {status.label}
                      </div>
                      <div style={activityTimeStyle}>
                        🕐 {activity.start_time} - {activity.end_time}
                      </div>
                      <div style={activityDescriptionStyle}>
                        {activity.description}
                      </div>
                      <div style={activityOutputStyle}>
                        <strong>Output:</strong> {activity.output}
                      </div>
                      <div style={actionButtonsStyle}>
                        <button
                          style={{
                            ...editButtonStyle,
                            ...(isEditableDate() ? {} : disabledButtonStyle)
                          }}
                          onClick={() => handleEdit(activity)}
                          disabled={!isEditableDate()}
                          title={isEditableDate() ? 'Edit activity' : 'Cannot edit past activities'}
                          onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#003380')}
                          onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#004aad')}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={{
                            ...deleteButtonStyle,
                            ...(isEditableDate() ? {} : disabledButtonStyle)
                          }}
                          onClick={() => handleDelete(activity.id)}
                          disabled={!isEditableDate()}
                          title={isEditableDate() ? 'Delete activity' : 'Cannot delete past activities'}
                          onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#DC2626')}
                          onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#EF4444')}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Afternoon Slot */}
            <div style={slotContainerStyle}>
              <div style={slotHeaderStyle}>
                🌄 Afternoon Activities ({getActivitiesBySlot('afternoon').length})
              </div>
              {getActivitiesBySlot('afternoon').length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>
                  No activities in afternoon slot
                </div>
              ) : (
                getActivitiesBySlot('afternoon').map(activity => {
                  const status = getActivityStatus(activity.date);
                  return (
                    <div
                      key={activity.id}
                      style={activityCardStyle(status)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={statusBadgeStyle(status)}>
                        {status.label}
                      </div>
                      <div style={activityTimeStyle}>
                        🕐 {activity.start_time} - {activity.end_time}
                      </div>
                      <div style={activityDescriptionStyle}>
                        {activity.description}
                      </div>
                      <div style={activityOutputStyle}>
                        <strong>Output:</strong> {activity.output}
                      </div>
                      <div style={actionButtonsStyle}>
                        <button
                          style={{
                            ...editButtonStyle,
                            ...(isEditableDate() ? {} : disabledButtonStyle)
                          }}
                          onClick={() => handleEdit(activity)}
                          disabled={!isEditableDate()}
                          title={isEditableDate() ? 'Edit activity' : 'Cannot edit past activities'}
                          onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#003380')}
                          onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#004aad')}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={{
                            ...deleteButtonStyle,
                            ...(isEditableDate() ? {} : disabledButtonStyle)
                          }}
                          onClick={() => handleDelete(activity.id)}
                          disabled={!isEditableDate()}
                          title={isEditableDate() ? 'Delete activity' : 'Cannot delete past activities'}
                          onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#DC2626')}
                          onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#EF4444')}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivityTracker;
