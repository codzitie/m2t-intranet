import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import * as api from '../services/api';

function ApplyLeaveForm({ onClose, onSuccess }) {
  const { user } = useUser();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      const [types, balance] = await Promise.all([
        api.getLeaveTypes(),
        api.getLeaveBalance(),
      ]);

      setLeaveTypes(types || []);
      setLeaveBalance(balance || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load leave types and balance');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveTypeId) {
      newErrors.leaveTypeId = 'Please select a leave type';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for leave';
    }
    if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.applyLeave({
        leaveTypeId: parseInt(formData.leaveTypeId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });

      alert('✅ Leave application submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Error submitting leave application'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getBalanceInfo = () => {
    if (!formData.leaveTypeId) return null;
    return leaveBalance.find((lb) => lb.leave_type_id === parseInt(formData.leaveTypeId));
  };

  const balanceInfo = getBalanceInfo();

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  };

  const headerStyle = {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#004aad',
    margin: 0,
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
  };

  const formGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#EF4444',
  };

  const errorTextStyle = {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '4px',
  };

  const balanceInfoStyle = {
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0369a1',
    marginTop: '8px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  const submitButtonStyle = {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Apply for Leave</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Leave Type */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Leave Type *</label>
            <select
              name="leaveTypeId"
              value={formData.leaveTypeId}
              onChange={handleChange}
              style={errors.leaveTypeId ? errorInputStyle : inputStyle}
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.leaveTypeId && <div style={errorTextStyle}>{errors.leaveTypeId}</div>}
            {balanceInfo && (
              <div style={balanceInfoStyle}>
                Available: {balanceInfo.remaining} days | Used: {balanceInfo.used}/{balanceInfo.total}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>From Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              style={errors.startDate ? errorInputStyle : inputStyle}
            />
            {errors.startDate && <div style={errorTextStyle}>{errors.startDate}</div>}
          </div>

          {/* End Date */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>To Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              style={errors.endDate ? errorInputStyle : inputStyle}
            />
            {errors.endDate && <div style={errorTextStyle}>{errors.endDate}</div>}
          </div>

          {/* Reason */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Reason for Leave *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Please provide a detailed reason for your leave request..."
              rows="4"
              style={errors.reason ? errorInputStyle : inputStyle}
            />
            {errors.reason && <div style={errorTextStyle}>{errors.reason}</div>}
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {formData.reason.length} characters (minimum 10)
            </div>
          </div>

          {/* Buttons */}
          <div style={buttonGroupStyle}>
            <button type="button" style={cancelButtonStyle} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={submitButtonStyle} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeaveForm;
