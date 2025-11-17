import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Review modal state
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approved' or 'rejected'
  const [reviewRemarks, setReviewRemarks] = useState('');

  useEffect(() => {
    fetchDeletionRequests();
  }, [statusFilter]);

  const fetchDeletionRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/admin/user-deletion-requests?status_filter=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch deletion requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request, action) => {
    setReviewingRequest(request);
    setReviewAction(action);
    setReviewRemarks('');
  };

  const submitReview = async () => {
    if (reviewAction === 'rejected' && !reviewRemarks.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/admin/user-deletion-requests/${reviewingRequest.id}/review`,
        { status: reviewAction, remarks: reviewRemarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Request ${reviewAction} successfully!`);
      setReviewingRequest(null);
      setReviewAction(null);
      setReviewRemarks('');
      fetchDeletionRequests();
    } catch (error) {
      alert(error.response?.data?.detail || `Failed to ${reviewAction} request`);
    }
  };

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    background: status === 'pending' ? '#fef3c7' : status === 'approved' ? '#d1fae5' : '#fee2e2',
    color: status === 'pending' ? '#92400e' : status === 'approved' ? '#065f46' : '#991b1b'
  });

  const filterButtonStyle = (active) => ({
    padding: '8px 16px',
    border: active ? '2px solid #ef4444' : '1px solid #d1d5db',
    borderRadius: '8px',
    background: active ? '#fee2e2' : '#fff',
    color: active ? '#991b1b' : '#64748b',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px'
  });

  return (
    <div>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            🗑️ User Deletion Requests
          </h2>
          <div>
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                style={filterButtonStyle(statusFilter === status)}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No {statusFilter !== 'all' && statusFilter} deletion requests found
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map(req => (
              <div key={req.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                background: '#fafafa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {req.user_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{req.user_email}</p>
                  </div>
                  <span style={statusBadgeStyle(req.status)}>{req.status.toUpperCase()}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                  <div><strong>Requested By:</strong> {req.requested_by_name}</div>
                  <div><strong>Requested On:</strong> {new Date(req.created_at).toLocaleDateString()}</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Reason:</strong> {req.reason || 'No reason provided'}
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      onClick={() => openReviewModal(req, 'approved')}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => openReviewModal(req, 'rejected')}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {req.status === 'approved' && req.approver_name && (
                  <div style={{ marginTop: '12px', background: '#d1fae5', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>✅ Approved by:</strong> {req.approver_name} on {new Date(req.approved_on).toLocaleString()}
                  </div>
                )}

                {req.status === 'rejected' && (
                  <div style={{ marginTop: '12px', background: '#fee2e2', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>❌ Rejected by:</strong> {req.approver_name}<br />
                    <strong>Reason:</strong> {req.rejection_remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingRequest && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '450px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ 
              margin: '0 0 16px', 
              color: '#1e293b', 
              fontSize: '20px', 
              fontWeight: '700' 
            }}>
              {reviewAction === 'approved' ? '✅ Approve Deletion Request' : '❌ Reject Deletion Request'}
            </h2>
            
            <div style={{
              background: reviewAction === 'approved' ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${reviewAction === 'approved' ? '#86efac' : '#fecaca'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                User: {reviewingRequest.user_name}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>
                Email: {reviewingRequest.user_email}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                <strong>Requested by:</strong> {reviewingRequest.requested_by_name}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                {reviewAction === 'approved' ? 'Approval Remarks (Optional)' : 'Rejection Reason'} 
                {reviewAction === 'rejected' && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder={
                  reviewAction === 'approved' 
                    ? 'Enter any additional remarks (optional)...' 
                    : 'Please provide a reason for rejecting this request...'
                }
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = reviewAction === 'approved' ? '#10b981' : '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button 
                onClick={() => {
                  setReviewingRequest(null);
                  setReviewAction(null);
                  setReviewRemarks('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={submitReview}
                style={{
                  padding: '8px 16px',
                  background: reviewAction === 'approved' ? '#10b981' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {reviewAction === 'approved' ? '✅ Confirm Approval' : '❌ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
