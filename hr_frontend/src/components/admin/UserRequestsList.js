import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

export default function UserRequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: '', remarks: '' });

  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Protect the route: if not authenticated, redirect to login.
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchRequests();
    // eslint-disable-next-line
  }, [statusFilter, isAuthenticated, navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/admin/user-requests?status_filter=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (err) {
      setError('Failed to fetch user requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewData.status) {
      alert('Please select approve or reject');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/admin/user-requests/${selectedRequest.id}/review`,
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Request ${reviewData.status} successfully!`);
      setReviewModal(false);
      setSelectedRequest(null);
      setReviewData({ status: '', remarks: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to review request');
    }
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setReviewModal(true);
  };

  // Styles
  const containerStyle = { maxWidth: '1200px', margin: '0 auto', padding: '24px' };
  const headerStyle = { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const titleStyle = { fontSize: '24px', fontWeight: '700', color: '#1e293b' };
  const filterStyle = { display: 'flex', gap: '8px' };
  const filterButtonStyle = (active) => ({
    padding: '8px 16px',
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    borderRadius: '8px',
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#2563eb' : '#64748b',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px'
  });

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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

  const buttonStyle = (color) => ({
    padding: '8px 16px',
    background: color === 'green' ? '#10b981' : '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px'
  });

  const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>👥 User Creation Requests</h1>
        <div style={filterStyle}>
          {['pending', 'approved', 'rejected', 'all'].map(status => (
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

      {error && <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '6px', marginBottom: '16px', color: '#991b1b' }}>{error}</div>}

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No {statusFilter !== 'all' && statusFilter} requests found
        </div>
      ) : (
        requests.map(req => (
          <div key={req.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{req.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{req.email}</p>
              </div>
              <span style={statusBadgeStyle(req.status)}>{req.status.toUpperCase()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div><strong>Role:</strong> {req.role}</div>
              <div><strong>Department:</strong> {req.department}</div>
              <div><strong>Designation:</strong> {req.designation}</div>
              <div><strong>Join Date:</strong> {req.join_date}</div>
              <div><strong>Requested By:</strong> {req.requested_by_name}</div>
              <div><strong>Requested On:</strong> {new Date(req.created_at).toLocaleDateString()}</div>
            </div>

            {req.status === 'approved' && req.approver_name && (
              <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <strong>✅ Approved by:</strong> {req.approver_name} on {new Date(req.approved_on).toLocaleString()}
              </div>
            )}

            {req.status === 'rejected' && (
              <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <strong>❌ Rejected by:</strong> {req.approver_name}<br />
                <strong>Reason:</strong> {req.rejection_remarks}
              </div>
            )}

            {req.status === 'pending' && (
              <div style={{ marginTop: '16px' }}>
                <button style={buttonStyle('green')} onClick={() => openReviewModal(req)}>Approve</button>
                <button style={buttonStyle('red')} onClick={() => openReviewModal(req)}>Reject</button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Review Modal */}
      {reviewModal && selectedRequest && (
        <div style={modalBackdropStyle} onClick={() => setReviewModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Review User Request</h2>
            <p><strong>Name:</strong> {selectedRequest.name}</p>
            <p><strong>Email:</strong> {selectedRequest.email}</p>
            <p><strong>Role:</strong> {selectedRequest.role}</p>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Decision</label>
              <select
                value={reviewData.status}
                onChange={e => setReviewData({ ...reviewData, status: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '16px' }}
              >
                <option value="">-- Select --</option>
                <option value="approved">✅ Approve</option>
                <option value="rejected">❌ Reject</option>
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Remarks (Optional)</label>
              <textarea
                value={reviewData.remarks}
                onChange={e => setReviewData({ ...reviewData, remarks: e.target.value })}
                placeholder="Add any remarks..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '80px' }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button onClick={handleReview} style={{ ...buttonStyle('green'), flex: 1 }}>Submit Review</button>
              <button onClick={() => setReviewModal(false)} style={{ ...buttonStyle('red'), flex: 1, background: '#6b7280' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
}
