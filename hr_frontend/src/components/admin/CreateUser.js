import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreateUser({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Employee',
    department: '',
    designation: '',
    supervisor_id: '',
    join_date: new Date().toISOString().split('T')[0]
  });
  
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User requests state
  const [userRequests, setUserRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSupervisors();
    fetchUserRequests();
  }, []);

  useEffect(() => {
    fetchUserRequests();
  }, [statusFilter]);

  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/admin/supervisors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupervisors(response.data);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
    }
  };

  const fetchUserRequests = async () => {
    setRequestsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/admin/user-requests?status_filter=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch user requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:8000/api/admin/user-requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`✅ User creation request for "${formData.name}" submitted successfully! Awaiting manager approval.`);
      
      // Reset form
      setFormData({
        email: '',
        name: '',
        role: 'Employee',
        department: '',
        designation: '',
        supervisor_id: '',
        join_date: new Date().toISOString().split('T')[0]
      });

      // Refresh requests list
      fetchUserRequests();

      // Callback to refresh stats
      if (onSuccess) onSuccess();

    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to submit user creation request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
    borderRadius: '8px',
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#2563eb' : '#64748b',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px'
  });

  return (
    <div>
      {/* CREATE USER FORM */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '700px',
        marginBottom: '32px'
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
          👤 Create New User Request
        </h2>

        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          color: '#92400e',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong>Approval Required:</strong> This user creation request will be sent to a manager for approval. Once approved, a secure password will be auto-generated and emailed to the user.
          </div>
        </div>

        {success && (
          <div style={{
            background: '#d1fae5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>❌</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@m2t-ai.com"
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Team Lead">Team Lead</option>
              <option value="HR">HR</option>
              <option value="CEO">CEO</option>
            </select>
          </div>

          <FormField
            label="Department"
            name="department"
            type="text"
            value={formData.department}
            onChange={handleChange}
            placeholder="Engineering"
            required
          />

          <FormField
            label="Designation"
            name="designation"
            type="text"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Software Developer"
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Supervisor (Manager/Team Lead)
            </label>
            <select
              name="supervisor_id"
              value={formData.supervisor_id}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="">-- Select Supervisor (Optional) --</option>
              {supervisors.map(sup => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.role} - {sup.designation})
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="Join Date"
            name="join_date"
            type="date"
            value={formData.join_date}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #1e40af)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Submitting Request...' : '📨 Submit User Request'}
          </button>
        </form>
      </div>

      {/* USER REQUESTS STATUS SECTION */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '1200px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            📋 User Creation Requests Status
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

        {requestsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading requests...</div>
        ) : userRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No {statusFilter !== 'all' && statusFilter} requests found
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {userRequests.map(req => (
              <div key={req.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                background: '#fafafa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{req.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{req.email}</p>
                  </div>
                  <span style={statusBadgeStyle(req.status)}>{req.status.toUpperCase()}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Role:</strong> {req.role}</div>
                  <div><strong>Department:</strong> {req.department}</div>
                  <div><strong>Designation:</strong> {req.designation}</div>
                  <div><strong>Join Date:</strong> {req.join_date}</div>
                  <div><strong>Requested By:</strong> {req.requested_by_name}</div>
                  <div><strong>Requested On:</strong> {new Date(req.created_at).toLocaleDateString()}</div>
                </div>

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
    </div>
  );
}

function FormField({ label, name, type, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          transition: 'border 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
    </div>
  );
}
