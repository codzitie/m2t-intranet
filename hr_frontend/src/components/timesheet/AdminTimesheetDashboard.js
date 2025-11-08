import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';
import PayrollExport from './PayrollExport';


function AdminTimesheetDashboard({ onBack }) {
  const { user, token } = useUser();
  const [activeAdminTab, setActiveAdminTab] = useState('today-updated');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // ✅ FETCH DATA FROM API ON MOUNT
  useEffect(() => {
    if (user && (user.role === 'HR' || user.role === 'CEO') && token) {
      fetchHRDashboardData();
    }
  }, [user, token]);


  // ✅ FETCH HR DASHBOARD DATA
  // ✅ FETCH HR DASHBOARD DATA
const fetchHRDashboardData = async () => {
  setLoading(true);
  setError('');
  
  try {
    // ✅ Get today's status for all employees
    const todayStatus = await timesheetService.getTodayStatusAllEmployees(token);
    
    // ✅ Get HR Dashboard for monthly stats
    const hrDashboard = await timesheetService.getHRDashboard(token);
    
    // ✅ Get pending unlock requests
    const unlocks = await timesheetService.getPendingUnlockRequests(token);

    // Format employee data
    const employees = formatEmployeeData(todayStatus, hrDashboard);
    setAllEmployees(employees);
    setUnlockRequests(unlocks || []);

  } catch (err) {
    console.error('Error fetching HR dashboard data:', err);
    setError(err.detail || 'Failed to fetch dashboard data');
  } finally {
    setLoading(false);
  }
};

// ✅ FORMAT HR DASHBOARD DATA FOR DISPLAY
const formatEmployeeData = (todayStatus, hrDashboard) => {
  const monthSummary = hrDashboard.month_summary || {};

  return todayStatus.map((employee, index) => {
    const monthData = monthSummary[employee.name] || { 
      filled: 0, 
      pending: 0, 
      locked: 0, 
      total_hours: 0 
    };
    
    return {
      id: employee.user_id,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      // ✅ NOW CORRECTLY SHOWS TODAY'S STATUS
      todayStatus: employee.today_status,
      yesterdayStatus: employee.yesterday_status,
      todayHours: employee.today_hours || 0,
      totalHours: monthData.total_hours || 0,
      filledDays: monthData.filled || 0,
      pendingDays: monthData.pending || 0,
      lockedDays: monthData.locked || 0,
      isLockedToday: employee.is_locked_today,
    };
  });
};



  // ✅ APPROVE UNLOCK REQUEST
  const handleApproveUnlock = async (requestId) => {
    try {
      await timesheetService.approveUnlockRequest(token, requestId, {
        status: 'approved',
        remarks: 'Approved by HR'
      });

      // Remove from list
      setUnlockRequests(prev => prev.filter(r => r.id !== requestId));
      alert('Unlock approved successfully!');
    } catch (err) {
      setError(err.detail || 'Failed to approve unlock');
    }
  };


  // ✅ REJECT UNLOCK REQUEST
  const handleRejectUnlock = async (requestId) => {
    try {
      await timesheetService.approveUnlockRequest(token, requestId, {
        status: 'rejected',
        remarks: 'Rejected by HR'
      });

      // Remove from list
      setUnlockRequests(prev => prev.filter(r => r.id !== requestId));
      alert('Unlock rejected successfully!');
    } catch (err) {
      setError(err.detail || 'Failed to reject unlock');
    }
  };


  // Get filtered employees based on active tab
  const getFilteredEmployees = () => {
    let filtered = allEmployees;

    // Apply search
    if (searchEmployee.trim()) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    // Apply status filter based on active tab
    switch (activeAdminTab) {
      case 'today-updated':
        return filtered.filter(emp => emp.todayStatus === 'filled');
      case 'yesterday-pending':
        return filtered.filter(emp => emp.yesterdayStatus === 'pending');
      case 'locked':
        return filtered.filter(emp => emp.lockedDays > 0);
      case 'all':
        return filtered;
      default:
        return filtered;
    }
  };


  const filteredEmployees = getFilteredEmployees();

  // Stats
  const stats = {
    updated: allEmployees.filter(e => e.todayStatus === 'filled').length,
    pending: allEmployees.filter(e => e.todayStatus === 'pending').length,
    locked: allEmployees.filter(e => e.lockedDays > 0).length,
    total: allEmployees.length,
  };

  const yesterdayStats = {
    pending: allEmployees.filter(e => e.yesterdayStatus === 'pending').length,
  };


  // Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#10B981',
  };

  const roleStyleStyle = {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '12px',
  };

  const backButtonStyle = {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#10B981',
    border: '1px solid #10B981',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  };

  const statCardStyle = (bgColor) => ({
    backgroundColor: 'white',
    border: `2px solid ${bgColor}`,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  });

  const statValueStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
  };

  const statLabelStyle = {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#10B981' : '#666',
    borderBottom: isActive ? '3px solid #10B981' : 'none',
    cursor: 'pointer',
    marginBottom: '-2px',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  });

  const searchContainerStyle = {
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
  };

  const searchInputStyle = {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    maxWidth: '300px',
  };

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const employeeHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const employeeNameStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  };

  const statusBadgeStyle = (status) => {
    let bgColor, textColor;
    if (status === 'filled') {
      bgColor = '#D1FAE5';
      textColor = '#065F46';
    } else if (status === 'pending') {
      bgColor = '#FEF3C7';
      textColor = '#92400E';
    } else if (status === 'locked') {
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
    }
    return {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  };

  const hoursStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#10B981',
    marginBottom: '12px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9CA3AF',
  };

  const actionButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.3s ease',
  };

  const rejectButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  };

  const errorStyle = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  };


  // ✅ AUTHORIZATION CHECK
  if (!user || (user.role !== 'HR' && user.role !== 'CEO')) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        ⛔ Access Denied: Only HR and CEO can access this view
      </div>
    );
  }

  if (loading) {
    return <div style={loadingStyle}>Loading dashboard data...</div>;
  }


  return (
    <div style={containerStyle}>
      {/* Error Message */}
      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          👔 Admin Dashboard
          <span style={roleStyleStyle}>
            {user.role === 'HR' ? '👩‍💼 HR' : '👑 CEO'}
          </span>
        </h2>
        <button
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdf4'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          ← Back to My Dashboard
        </button>
      </div>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#D1FAE5')}>
          <div style={statValueStyle}>{stats.updated}</div>
          <div style={statLabelStyle}>Today Updated</div>
        </div>
        <div style={statCardStyle('#FEF3C7')}>
          <div style={statValueStyle}>{stats.pending}</div>
          <div style={statLabelStyle}>Today Pending</div>
        </div>
        <div style={statCardStyle('#FEE2E2')}>
          <div style={statValueStyle}>{stats.locked}</div>
          <div style={statLabelStyle}>Locked</div>
        </div>
        <div style={statCardStyle('#EFF6FF')}>
          <div style={statValueStyle}>{stats.total}</div>
          <div style={statLabelStyle}>Total Employees</div>
        </div>
        {yesterdayStats.pending > 0 && (
          <div style={statCardStyle('#FEF3C7')}>
            <div style={statValueStyle}>{yesterdayStats.pending}</div>
            <div style={statLabelStyle}>Yesterday Pending</div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={tabContainerStyle}>
        <button
          style={tabButtonStyle(activeAdminTab === 'today-updated')}
          onClick={() => setActiveAdminTab('today-updated')}
        >
          ✅ Today Updated ({stats.updated})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'yesterday-pending')}
          onClick={() => setActiveAdminTab('yesterday-pending')}
        >
          ⏳ Yesterday Pending ({yesterdayStats.pending})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'locked')}
          onClick={() => setActiveAdminTab('locked')}
        >
          🔒 Locked ({stats.locked})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'all')}
          onClick={() => setActiveAdminTab('all')}
        >
          📋 All ({stats.total})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'unlock-requests')}
          onClick={() => setActiveAdminTab('unlock-requests')}
        >
          🔓 Unlock Requests ({unlockRequests.length})
        </button>
        <button
          style={tabButtonStyle(activeAdminTab === 'payroll-export')}
          onClick={() => setActiveAdminTab('payroll-export')}
        >
          📥 Payroll Export
        </button>
      </div>

      {/* Search Bar */}
      {(activeAdminTab === 'today-updated' || activeAdminTab === 'yesterday-pending' || activeAdminTab === 'locked' || activeAdminTab === 'all') && (
        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder="🔍 Search employee name..."
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      )}

      {/* ========== CONTENT TABS ========== */}

      {/* Today Updated Tab */}
      {activeAdminTab === 'today-updated' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No timesheets updated today</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('filled')}>✅ Updated</span>
                </div>
                <div style={hoursStyle}>⏰ {emp.todayHours.toFixed(1)}h</div>
                <div style={detailStyle}>
                  <strong>Filled Days:</strong> {emp.filledDays}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Yesterday Pending Tab */}
      {activeAdminTab === 'yesterday-pending' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending timesheets from yesterday</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('pending')}>⏳ Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>Status:</strong> Timesheet for yesterday not filled yet
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Locked Tab */}
      {activeAdminTab === 'locked' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No locked timesheets</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle('locked')}>🔒 Locked</span>
                </div>
                <div style={detailStyle}>
                  <strong>Locked Days:</strong> {emp.lockedDays}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Tab */}
      {activeAdminTab === 'all' && (
        <div>
          {filteredEmployees.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No employees found</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{emp.name}</div>
                  <span style={statusBadgeStyle(emp.todayStatus)}>
                    {emp.todayStatus === 'filled' && '✅ Updated'}
                    {emp.todayStatus === 'pending' && '⏳ Pending'}
                    {emp.lockedDays > 0 && '🔒 Locked'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div style={detailStyle}>
                    <strong>Total Hours:</strong> {emp.totalHours.toFixed(1)}h
                  </div>
                  <div style={detailStyle}>
                    <strong>Filled:</strong> {emp.filledDays} days
                  </div>
                  <div style={detailStyle}>
                    <strong>Pending:</strong> {emp.pendingDays} days
                  </div>
                  <div style={detailStyle}>
                    <strong>Locked:</strong> {emp.lockedDays} days
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Unlock Requests Tab */}
      {activeAdminTab === 'unlock-requests' && (
        <div>
          {unlockRequests.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No pending unlock requests</p>
            </div>
          ) : (
            unlockRequests.map((request) => (
              <div key={request.id} style={cardStyle}>
                <div style={employeeHeaderStyle}>
                  <div style={employeeNameStyle}>{request.employee_name}</div>
                  <span style={statusBadgeStyle('pending')}>Pending</span>
                </div>
                <div style={detailStyle}>
                  <strong>📅 Date to unlock:</strong> {request.date}
                </div>
                <div style={detailStyle}>
                  <strong>📝 Reason:</strong> {request.reason}
                </div>
                <div style={detailStyle}>
                  <strong>⏰ Requested on:</strong> {request.requested_on}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button
                    style={actionButtonStyle}
                    onClick={() => handleApproveUnlock(request.id)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                  >
                    ✓ Approve
                  </button>
                  <button
                    style={rejectButtonStyle}
                    onClick={() => handleRejectUnlock(request.id)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payroll Export Tab */}
      {activeAdminTab === 'payroll-export' && (
        <PayrollExport />
      )}
    </div>
  );
}


export default AdminTimesheetDashboard;
