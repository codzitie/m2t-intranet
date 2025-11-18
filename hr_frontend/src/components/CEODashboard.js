import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import * as api from '../services/api';

function CEODashboard() {
  const { user } = useUser();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'CEO') {
      loadPendingApprovals();
    }
    // eslint-disable-next-line
  }, [user]);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      // Adjusted to use single-level pending approvals endpoint
      const result = await api.getPendingL1Approvals();
      setPendingApprovals(result || []);
    } catch (error) {
      console.error('Error loading CEO approvals:', error);
      alert('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (leave) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setRemarks('');
  };

  const handleRejectClick = (leave) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setRemarks('');
  };

  const handleSubmitAction = async () => {
    if (!remarks.trim()) {
      alert('Please provide remarks');
      return;
    }
    setSubmitting(true);

    try {
      let response;
      if (actionType === 'approve') {
        response = await api.l1ApproveLeave(selectedLeave.id, remarks);
      } else {
        response = await api.l1RejectLeave(selectedLeave.id, remarks);
      }
      alert(`✅ Leave ${actionType === 'approve' ? 'APPROVED' : 'REJECTED'} successfully!`);
      setSelectedLeave(null);
      setRemarks('');
      loadPendingApprovals();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Error processing request'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // UI styles (minimal, match your other dashboards)
  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px'
  };
  const titleStyle = {
    fontSize: '28px',
    fontWeight: 600,
    color: '#004aad',
    marginBottom: 8,
  };
  const subtitleStyle = {
    fontSize: '16px',
    color: '#666',
    marginBottom: 30,
  };
  const cardStyle = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };
  const actionsStyle = { display: 'flex', gap: 12, marginTop: 12 };
  const approveBtn = { ...btnBase('#10B981'), flex: 1 };
  const rejectBtn = { ...btnBase('#EF4444'), flex: 1 };
  const badge = { display: 'inline-block', background: '#F59E0B', color: 'white', fontWeight: 600, borderRadius: 12, padding: '3px 13px', fontSize: 14, marginLeft: 8 };
  const emptyState = { textAlign: 'center', padding: '80px 0', color: '#9CA3AF', fontSize: 20 };

  function btnBase(bg) {
    return {
      padding: '10px 20px',
      backgroundColor: bg,
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      fontWeight: 500,
      fontSize: 16,
      cursor: 'pointer'
    };
  }

  if (!user || user.role !== 'CEO') {
    return (
      <div style={{ textAlign: 'center', padding: 100, color: '#dc2626', fontSize: 18 }}>
        Only CEO can view this dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100, color: '#666', fontSize: 18 }}>
        Loading pending approvals...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>CEO Final Approvals
        <span style={badge}>{pendingApprovals.length}</span>
      </h1>
      <div style={subtitleStyle}>
        All team-approved leave requests pending your final approval.
      </div>

      {pendingApprovals.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: 60, color: '#10B981' }}>🎉</div>
          <div>No pending final approvals. All caught up!</div>
        </div>
      ) : (
        pendingApprovals.map((leave) => (
          <div key={leave.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 18 }}>
              {leave.employee_name}
              <span style={{ fontSize: 13, color: '#666' }}>Applied: {leave.applied_on?.split('T')[0]}</span>
            </div>
            <div style={{ margin: '12px 0' }}>
              <b>Leave:</b> <span style={{ color: '#2866c7' }}>{leave.leave_type}</span> &nbsp;|&nbsp; <b>{leave.start_date} ➜ {leave.end_date}</b> &nbsp;|&nbsp; <b>{leave.days} day(s)</b>
            </div>
            <div style={{ fontSize: 14, margin: '6px 0', color: '#666' }}>
              <b>Reason:</b> {leave.reason}
            </div>
            <div style={{ fontSize: 14, margin: '6px 0', color: '#10B981' }}>
              <b>Approved By:</b> {leave.approved_by || 'Manager'}
            </div>
            <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 10 }}>
              {leave.supervisor_remarks ? `Remarks: ${leave.supervisor_remarks}` : ''}
            </div>
            <div style={actionsStyle}>
              <button style={approveBtn} onClick={() => handleApproveClick(leave)}>✓ Approve (Final)</button>
              <button style={rejectBtn} onClick={() => handleRejectClick(leave)}>✗ Reject</button>
            </div>
          </div>
        ))
      )}

      {selectedLeave && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => !submitting && setSelectedLeave(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              padding: 32, width: '95%', maxWidth: 440, position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: actionType === 'approve' ? "#10B981" : "#EF4444", fontWeight: 700, marginBottom: 8 }}>
              {actionType === 'approve' ? 'Final Approve' : 'Reject'} Leave
            </h2>
            <div style={{ fontWeight: 500, color: '#004aad', fontSize: 16, marginBottom: 8 }}>
              {selectedLeave.employee_name} — {selectedLeave.leave_type}
            </div>
            <div style={{ color: '#666', marginBottom: 8, fontSize: 14 }}>
              {selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days} days)
              <br />
              Approved by: {selectedLeave.approved_by || 'Manager'}
              <br />
              Remarks: <i>{selectedLeave.supervisor_remarks}</i>
            </div>
            <label style={{ fontWeight: 500, fontSize: 14 }}>Your Remarks *</label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={4}
              placeholder={actionType === 'approve'
                ? 'e.g., Approved. Proceed!'
                : 'e.g., Insufficient org headcount. Please reapply later.'}
              style={{
                width: '100%',
                marginTop: 8,
                marginBottom: 16,
                padding: 10,
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                resize: 'vertical'
              }}
              disabled={submitting}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...btnBase('white'), color: '#666', border: '1px solid #cbd5e1' }}
                type="button"
                onClick={() => setSelectedLeave(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button style={{
                ...btnBase(actionType === 'approve' ? '#10B981' : '#EF4444'),
                opacity: submitting ? 0.7 : 1
              }}
                onClick={handleSubmitAction}
                disabled={submitting}
              >
                {submitting
                  ? (actionType === 'approve' ? 'Approving...' : 'Rejecting...')
                  : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CEODashboard;
