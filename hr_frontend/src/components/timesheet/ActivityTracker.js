import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';

function ActivityTracker() {
  const { user, token } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    start_time: '09:00',
    end_time: '10:00',
    output: '',
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token && selectedDate) {
      fetchActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDate]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await timesheetService.getActivitiesByDate(token, selectedDate);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Editable only for today and yesterday
  const isEditableDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.toDateString() === today.toDateString() || selected.toDateString() === yesterday.toDateString();
  };

  // Prevent duplicate/overlapping time slots
  const hasOverlap = (start, end) => {
    const s1 = timeToMinutes(start);
    const e1 = timeToMinutes(end);
    for (const act of activities) {
      if (editingId && act.id === editingId) continue;
      const s2 = timeToMinutes(act.start_time);
      const e2 = timeToMinutes(act.end_time);
      // If times overlap
      if ((s1 < e2 && e1 > s2)) {
        return true;
      }
    }
    return false;
  };

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
    if (!isValidTime(formData.start_time) || !isValidTime(formData.end_time)) {
      newErrors.time = 'Please enter valid start and end times in 24-hour format (HH:MM)';
    }
    if (formData.start_time >= formData.end_time) {
      newErrors.time = 'End time must be after start time';
    }
    if (hasOverlap(formData.start_time, formData.end_time)) {
      newErrors.time = 'Activity overlaps with another entry.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate 24-hour time format: HH:MM
  const isValidTime = (time) => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  };

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
      const payload = {
        date: selectedDate,
        description: formData.description,
        output: formData.output,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };
      if (editingId) {
        await timesheetService.updateActivity(token, editingId, payload);
      } else {
        await timesheetService.createActivity(token, payload);
      }
      await fetchActivities();
      setFormData({
        description: '',
        start_time: '09:00',
        end_time: '10:00',
        output: '',
      });
      setEditingId(null);
      setErrors({});
    } catch (error) {
      console.error('Error saving activity:', error);
      setErrors({ submit: error.detail || 'Failed to save activity' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (activity) => {
    setFormData({
      description: activity.description,
      start_time: activity.start_time,
      end_time: activity.end_time,
      output: activity.output,
    });
    setEditingId(activity.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await timesheetService.deleteActivity(token, id);
        await fetchActivities();
        if (editingId === id) {
          setFormData({
            description: '',
            start_time: '09:00',
            end_time: '10:00',
            output: '',
          });
          setEditingId(null);
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      description: '',
      start_time: '09:00',
      end_time: '10:00',
      output: '',
    });
    setEditingId(null);
    setErrors({});
  };

  // Calculate total logged time for summary
  const calculateTotalActivityTime = () => {
    let totalMinutes = 0;
    activities.forEach((activity) => {
      const startMins = timeToMinutes(activity.start_time);
      const endMins = timeToMinutes(activity.end_time);
      totalMinutes += endMins - startMins;
    });
    return (totalMinutes / 60).toFixed(2);
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Formatting time for 24-hour display, removing leading zeros for aesthetics if desired
  const format24HrTime = (time) => {
    if (!time) return '';
    const [hrs, mins] = time.split(':');
    return `${hrs.padStart(2, '0')}:${mins}`;
  };

  // Styles preserved as before...

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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  };

  const thStyle = {
    border: '1px solid #d1d5db',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
  };

  const tdStyle = {
    border: '1px solid #d1d5db',
    padding: '12px',
    verticalAlign: 'top',
    fontSize: '14px',
    color: '#555',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
  };

  const editButtonStyle = {
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

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading activities...</div>
      </div>
    );
  }

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

        {/* Time Range */}
        {/* Time Range */}
<div style={formGroupStyle}>
  <label style={labelStyle}>Time Range (24-hour format: HH:MM) *</label>
  <div style={{ display: 'flex', gap: '12px' }}>
    <input
      type="text"
      value={formData.start_time}
      placeholder="09:00"
      maxLength="5"
      onChange={(e) => {
        let value = e.target.value.replace(/[^0-9:]/g, '');
        if (value.length === 2 && !value.includes(':')) {
          value = value + ':';
        }
        setFormData({ ...formData, start_time: value });
        setErrors({});
      }}
      onBlur={(e) => {
        // Auto-format on blur
        const val = e.target.value;
        if (val.length === 5 && isValidTime(val)) {
          setFormData({ ...formData, start_time: val });
        }
      }}
      style={inputStyle}
    />
    <input
      type="text"
      value={formData.end_time}
      placeholder="18:00"
      maxLength="5"
      onChange={(e) => {
        let value = e.target.value.replace(/[^0-9:]/g, '');
        if (value.length === 2 && !value.includes(':')) {
          value = value + ':';
        }
        setFormData({ ...formData, end_time: value });
        setErrors({});
      }}
      onBlur={(e) => {
        const val = e.target.value;
        if (val.length === 5 && isValidTime(val)) {
          setFormData({ ...formData, end_time: val });
        }
      }}
      style={inputStyle}
    />
  </div>
  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
    Format: HH:MM (e.g., 09:00, 14:30, 18:00)
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
      {activities.length > 0 && (
        <div style={summaryCardStyle}>
          <div style={summaryItemStyle}>
            <div style={summaryLabelStyle}>Total Activities</div>
            <div style={summaryValueStyle}>{activities.length}</div>
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

      {/* Activities Table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Start Time (24-hr)</th>
            <th style={thStyle}>End Time (24-hr)</th>
            <th style={thStyle}>Activity Description</th>
            <th style={thStyle}>Output / Deliverable</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF' }}>
                No activities logged for this day
              </td>
            </tr>
          ) : (
            activities.map(activity => (
              <tr key={activity.id}>
                <td style={tdStyle}>{format24HrTime(activity.start_time)}</td>
                <td style={tdStyle}>{format24HrTime(activity.end_time)}</td>
                <td style={tdStyle}>{activity.description}</td>
                <td style={tdStyle}>{activity.output}</td>
                <td style={tdStyle}>
                  <div style={actionButtonsStyle}>
                    <button
                      style={{ ...editButtonStyle, ...(isEditableDate() ? {} : disabledButtonStyle) }}
                      onClick={() => handleEdit(activity)}
                      disabled={!isEditableDate()}
                      title={isEditableDate() ? 'Edit activity' : 'Cannot edit past activities'}
                      onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#003380')}
                      onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#004aad')}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={{ ...deleteButtonStyle, ...(isEditableDate() ? {} : disabledButtonStyle) }}
                      onClick={() => handleDelete(activity.id)}
                      disabled={!isEditableDate()}
                      title={isEditableDate() ? 'Delete activity' : 'Cannot delete past activities'}
                      onMouseEnter={(e) => isEditableDate() && (e.target.style.backgroundColor = '#DC2626')}
                      onMouseLeave={(e) => isEditableDate() && (e.target.style.backgroundColor = '#EF4444')}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityTracker;
