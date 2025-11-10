import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UnlockRequests({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/admin/unlock-requests?status_filter=${filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setRemarks('');
  };

  const handleReject = async (request) => {
    setSelectedRequest(request);
    setRemarks('');
  };

  const submitDecision = async (status) => {
    if (!remarks.trim()) {
      alert('Please provide remarks');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/timesheets/unlock-requests/${selectedRequest.id}`,
        { status, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Request ${status} successfully!`);
      setSelectedRequest(null);
      setRemarks('');
      fetchRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to process request: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '8px'
      }}>
        <FilterButton
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          label="Pending"
          count={requests.length}
        />
        <FilterButton
          active={filter === 'approved'}
          onClick={() => setFilter('approved')}
          label="Approved"
        />
        <FilterButton
          active={filter === 'rejected'}
          onClick={() => setFilter('rejected')}
          label="Rejected"
        />
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading unlock requests...
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            No {filter} requests
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            All caught up! No unlock requests to review.
          </div>
        </div>
      )}

      {/* Requests List */}
      {!loading && requests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => handleApprove(request)}
              onReject={() => handleReject(request)}
            />
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedRequest && (
        <DecisionModal
          request={selectedRequest}
          remarks={remarks}
          setRemarks={setRemarks}
          onApprove={() => submitDecision('approved')}
          onReject={() => submitDecision('rejected')}
          onClose={() => setSelectedRequest(null)}
          processing={processing}
        />
      )}
    </div>
  );
}

// Filter Button Component
function FilterButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : '#64748b',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        borderRadius: '6px',
        transition: 'all 0.2s'
      }}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}

// Request Card Component
function RequestCard({ request, onApprove, onReject }) {
  const statusColors = {
    pending: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
    approved: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    rejected: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
  };

  const colors = statusColors[request.status] || statusColors.pending;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      transition: 'box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {request.employee_name}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {request.employee_email}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text
        }}>
          {request.status.toUpperCase()}
        </span>
      </div>

      <div style={{
        background: '#f9fafb',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
          📅 <strong>Date:</strong> {new Date(request.date).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </div>
        <div style={{ fontSize: '13px', color: '#374151' }}>
          💬 <strong>Reason:</strong> {request.reason}
        </div>
      </div>

      {request.remarks && (
        <div style={{
          background: '#eff6ff',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
            Admin Remarks:
          </div>
          <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
            {request.remarks}
          </div>
        </div>
      )}

      {request.status === 'pending' && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1,
              padding: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✅ Approve
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1,
              padding: '10px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ❌ Reject
          </button>
        </div>
      )}

      {request.approved_on && (
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'right' }}>
          Processed on {new Date(request.approved_on).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Decision Modal Component
function DecisionModal({ request, remarks, setRemarks, onApprove, onReject, onClose, processing }) {
  return (
    <div style={{
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
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
          Review Unlock Request
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
            <strong>Employee:</strong> {request.employee_name}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
            <strong>Date:</strong> {new Date(request.date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <strong>Reason:</strong> {request.reason}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Admin Remarks <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter your remarks here..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onApprove}
            disabled={processing}
            style={{
              flex: 1,
              padding: '10px',
              background: processing ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : '✅ Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            style={{
              flex: 1,
              padding: '10px',
              background: processing ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : '❌ Reject'}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#64748b',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
