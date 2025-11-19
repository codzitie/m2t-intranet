import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import * as api from '../services/api';
import ApplyLeaveForm from './ApplyLeaveForm';
import LeaveHistory from './LeaveHistory';
import SupervisorDashboard from './SupervisorDashboard';
import HRDashboard from './HRDashboard';
import CEODashboard from './CEODashboard';

function LeaveDashboard() {
  const { user } = useUser();
  const isHRAdmin = user.role === "HR" && user.email === "hrexample123@gmail.com";
  const navigate = useNavigate();
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showLeaveHistory, setShowLeaveHistory] = useState(false);
  const [showSupervisorView, setShowSupervisorView] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [error, setError] = useState('');

  // Use safe default for permissions
  const permissions = user?.permissions || [];

  useEffect(() => {
    if (user) {
      loadLeaveBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadLeaveBalance = async () => {
    try {
      setLoading(true);
      setError('');

      const requests = [
        api.getLeaveBalance(),
        api.getLeaveHistory(),
      ];

      if (permissions.includes('approve_team_leaves')) {
        requests.push(api.getPendingL1Approvals());
      }

      const responses = await Promise.all(requests);

      setLeaveBalance(responses[0] || []);
      setRecentLeaves((responses[1] || []).slice(0, 3));

      if (responses[2]) {
        setPendingApprovalsCount(responses[2].length);
      } else {
        setPendingApprovalsCount(0);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      setError('Failed to load leave data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block',
    };

    const statusStyles = {
      Approved: { ...baseStyle, backgroundColor: '#D1FAE5', color: '#065F46' },
      Pending: { ...baseStyle, backgroundColor: '#FEF3C7', color: '#92400E' },
      Rejected: { ...baseStyle, backgroundColor: '#FEE2E2', color: '#991B1B' },
    };

    return <span style={statusStyles[status]}>{status}</span>;
  };
  
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Please log in to view your leave information
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Loading your leave information...
      </div>
    );
  }
  if (isHRAdmin) {
    return <HRDashboard />;
  }
  // Show CEO Dashboard if user is CEO
  if (user.role === 'CEO') {
  return (
    <>
      {/* CEO - See full HR dashboard */}
      <HRDashboard />
      {/* CEO - See their own approval queue as a manager */}
      <div style={{ marginTop: 64 }}>
        <SupervisorDashboard onApprovalComplete={loadLeaveBalance} />
      </div>
    </>
  );
}


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Header Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#004aad', marginBottom: '8px' }}>
          Welcome, {user.name}!
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Manage your leave applications and view your balance
        </p>
      </div>

      {/* Leave Balance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {leaveBalance.map((leave) => (
          <div
            key={leave.leave_type_id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px', fontWeight: '500' }}>
              {leave.leave_type}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#004aad', marginBottom: '8px' }}>
              {leave.remaining}
            </div>
            <div style={{ fontSize: '14px', color: '#888' }}>
              Available • Used: {leave.used}/{leave.total}
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                marginTop: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(leave.used / leave.total) * 100}%`,
                  height: '100%',
                  backgroundColor:
                    leave.used / leave.total > 0.7
                      ? '#EF4444'
                      : leave.used / leave.total > 0.5
                      ? '#F59E0B'
                      : '#10B981',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}
      >
        <button
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: '#004aad',
            color: 'white',
          }}
          onClick={() => setShowApplyForm(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#003380';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#004aad';
          }}
        >
          + Apply for Leave
        </button>

        <button
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            border: '1px solid #004aad',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: 'white',
            color: '#004aad',
          }}
          onClick={() => setShowLeaveHistory(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f0f4ff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
          }}
        >
          View Leave History
        </button>

        {/* Calendar button now visible to all users */}
        <button
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            border: '1px solid #10B981',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#10B981',
            backgroundColor: 'white',
          }}
          onClick={() => navigate('/leave/calendar')}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f0fdf4';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
          }}
        >
          📆 View Leave Calendar
        </button>
      </div>

      {(permissions.includes('approve_team_leaves') || permissions.includes('manage_hr')) && (
        <>
          <div
            style={{
              height: '2px',
              backgroundColor: '#e5e7eb',
              margin: '40px 0',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '0 16px',
                color: '#888',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {permissions.includes('manage_hr') ? 'HR Management' : 'Team Management'}
            </div>
          </div>

          {permissions.includes('manage_hr') && (
            <div
              style={{
                backgroundColor: 'white',
                border: '2px solid #10B981',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#10B981',
                      marginBottom: '4px',
                    }}
                  >
                    👔 HR Dashboard
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    View company-wide analytics, all leave requests, and employee balances
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (showSupervisorView) {
                      loadLeaveBalance();
                    }
                    setShowSupervisorView(!showSupervisorView);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: showSupervisorView ? 'white' : '#10B981',
                    color: showSupervisorView ? '#10B981' : 'white',
                    border: showSupervisorView ? '1px solid #10B981' : 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {showSupervisorView ? '← Back to My Dashboard' : 'Open HR Dashboard →'}
                </button>
              </div>
            </div>
          )}

          {permissions.includes('approve_team_leaves') && !permissions.includes('manage_hr') && (
            <div
              style={{
                backgroundColor: 'white',
                border: '2px solid #004aad',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '40px',
                boxShadow: '0 2px 8px rgba(0,74,173,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#004aad',
                      marginBottom: '4px',
                    }}
                  >
                    Pending Team Approvals
                    {pendingApprovalsCount > 0 && (
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          marginLeft: '12px',
                        }}
                      >
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Review and approve leave requests from your team
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (showSupervisorView) {
                      loadLeaveBalance();
                    }
                    setShowSupervisorView(!showSupervisorView);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: showSupervisorView ? 'white' : '#004aad',
                    color: showSupervisorView ? '#004aad' : 'white',
                    border: showSupervisorView ? '1px solid #004aad' : 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {showSupervisorView ? '← Back to My Dashboard' : 'View Team Approvals →'}
                </button>

                {pendingApprovalsCount === 0 && !showSupervisorView && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '6px',
                      color: '#0369a1',
                    }}
                  >
                    ✅ All caught up! No pending approvals at the moment.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showSupervisorView ? (
        permissions.includes('manage_hr') ? (
          <HRDashboard />
        ) : (
          <SupervisorDashboard onApprovalComplete={loadLeaveBalance} />
        )
      ) : (
        <>
          {/* Recent Activity Section */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '40px',
            }}
          >
            <h3 style={{ fontSize: '20px', color: '#004aad', fontWeight: '600', marginBottom: '20px' }}>
              Recent Activity
            </h3>
            {recentLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <p style={{ fontSize: '16px' }}>No leave applications yet</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Apply for Leave" to get started</p>
              </div>
            ) : (
              <>
                {recentLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#333',
                          marginBottom: '4px',
                        }}
                      >
                        {leave.leave_type} • {leave.days} {leave.days === 1 ? 'day' : 'days'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {leave.start_date} to {leave.end_date}
                      </div>
                    </div>
                    <div>{getStatusBadge(leave.status)}</div>
                  </div>
                ))}

                {recentLeaves.length >= 3 && (
                  <button
                    onClick={() => setShowLeaveHistory(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '12px',
                      backgroundColor: 'transparent',
                      color: '#004aad',
                      border: '1px dashed #004aad',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    View All Leave History →
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {showApplyForm && <ApplyLeaveForm onClose={() => setShowApplyForm(false)} onSuccess={loadLeaveBalance} />}

      {showLeaveHistory && <LeaveHistory onClose={() => setShowLeaveHistory(false)} />}
    </div>
  );
}

export default LeaveDashboard;
