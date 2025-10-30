import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { LeaveService } from '../services/mockLeaveService';

function SupervisorDashboard({ onApprovalComplete }) {
  const { user } = useUser();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const response = await LeaveService.getPendingApprovals(user.id);
      if (response.success) {
        setPendingApprovals(response.data);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (leave) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setRemarks('');
    setShowApprovalModal(true);
  };

  const handleRejectClick = (leave) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setRemarks('');
    setShowApprovalModal(true);
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
        response = await LeaveService.approveLeave(selectedLeave.id, remarks);
      } else {
        response = await LeaveService.rejectLeave(selectedLeave.id, remarks);
      }

      if (response.success) {
  alert(`✅ Leave ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
  setShowApprovalModal(false);
  setSelectedLeave(null);
  setRemarks('');
  loadPendingApprovals(); // Reload the list
  if (onApprovalComplete) {
    onApprovalComplete(); // Notify parent to refresh count
  }
} else {
  alert('❌ ' + response.error);
}

    } catch (error) {
      alert('❌ Error processing request');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
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

  const badgeStyle = {
    display: 'inline-block',
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    marginLeft: '12px',
  };

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const employeeNameStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  };

  const leaveTypeStyle = {
    fontSize: '14px',
    color: '#666',
  };

  const leaveDetailsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  };

  const detailItemStyle = {
    fontSize: '14px',
  };

  const detailLabelStyle = {
    color: '#888',
    marginBottom: '4px',
  };

  const detailValueStyle = {
    color: '#333',
    fontWeight: '500',
  };

  const reasonStyle = {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#555',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
  };

  const approveButtonStyle = {
    flex: 1,
    padding: '10px 20px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const rejectButtonStyle = {
    flex: 1,
    padding: '10px 20px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  // Modal styles
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
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  };

  const modalTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: actionType === 'approve' ? '#10B981' : '#EF4444',
    marginBottom: '20px',
  };

  const textareaStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
  };

  const modalButtonGroupStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  };

  const submitButtonStyle = {
    flex: 1,
    padding: '12px',
    backgroundColor: actionType === 'approve' ? '#10B981' : '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
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
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Loading pending approvals...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          Team Leave Approvals
          {pendingApprovals.length > 0 && (
            <span style={badgeStyle}>{pendingApprovals.length}</span>
          )}
        </h1>
        <p style={subtitleStyle}>Review and approve leave requests from your team members</p>
      </div>

      {/* Pending Approvals List */}
      {pendingApprovals.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <p style={{ fontSize: '18px', fontWeight: '500' }}>All caught up!</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>No pending leave approvals at the moment</p>
        </div>
      ) : (
        pendingApprovals.map((leave) => (
          <div key={leave.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <div style={employeeNameStyle}>{leave.employeeName}</div>
                <div style={leaveTypeStyle}>{leave.leaveType}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Applied on {leave.appliedOn}
              </div>
            </div>

            <div style={leaveDetailsStyle}>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>From Date</div>
                <div style={detailValueStyle}>{leave.startDate}</div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>To Date</div>
                <div style={detailValueStyle}>{leave.endDate}</div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>Duration</div>
                <div style={detailValueStyle}>{leave.days} {leave.days === 1 ? 'day' : 'days'}</div>
              </div>
            </div>

            <div style={reasonStyle}>
              <strong>Reason:</strong> {leave.reason}
            </div>

            <div style={buttonGroupStyle}>
              <button
                style={approveButtonStyle}
                onClick={() => handleApproveClick(leave)}
              >
                ✓ Approve
              </button>
              <button
                style={rejectButtonStyle}
                onClick={() => handleRejectClick(leave)}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedLeave && (
        <div style={overlayStyle} onClick={() => !submitting && setShowApprovalModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>
              {actionType === 'approve' ? '✓ Approve Leave' : '✗ Reject Leave'}
            </h2>
            
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              <strong>{selectedLeave.employeeName}</strong> - {selectedLeave.leaveType}<br />
              {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.days} days)
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Add Remarks *
            </label>
            <textarea
              style={textareaStyle}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={actionType === 'approve' ? 'e.g., Approved. Enjoy your leave!' : 'e.g., Please reschedule due to team commitments'}
            />

            <div style={modalButtonGroupStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                style={submitButtonStyle}
                onClick={handleSubmitAction}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorDashboard;
