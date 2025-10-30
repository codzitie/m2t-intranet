import React, { useState, useEffect } from 'react';
import { LeaveService } from '../services/mockLeaveService';

function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, requests, balances
  const [stats, setStats] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, requestsRes, balancesRes] = await Promise.all([
        LeaveService.getHRStatistics(),
        LeaveService.getAllLeaveRequests(),
        LeaveService.getAllEmployeeBalances()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (requestsRes.success) setAllRequests(requestsRes.data);
      if (balancesRes.success) setAllBalances(balancesRes.data);
    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    let filtered = [...allRequests];
    
    if (filterDepartment !== 'All') {
      filtered = filtered.filter(req => {
        // You'd need to join with employee data in real scenario
        return true; // Simplified for now
      });
    }
    
    if (filterStatus !== 'All') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }
    
    return filtered;
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On', 'Remarks'];
    const rows = getFilteredRequests().map(req => [
      req.employeeName,
      req.leaveType,
      req.startDate,
      req.endDate,
      req.days,
      req.status,
      req.appliedOn,
      req.supervisorRemarks || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const styles = {
      Approved: { backgroundColor: '#D1FAE5', color: '#065F46' },
      Pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
      Rejected: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    };

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
      }}>
        {status}
      </span>
    );
  };

  // Styles
  const containerStyle = {
    maxWidth: '1400px',
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

  const tabsStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '2px solid #e5e7eb',
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #004aad' : '3px solid transparent',
    color: isActive ? '#004aad' : '#666',
    fontSize: '16px',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    marginBottom: '-2px',
  });

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  };

  const statCardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const statLabelStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  };

  const statValueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#004aad',
  };

  const tableContainerStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    overflowX: 'auto',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle = {
    backgroundColor: '#f9fafb',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
  };

  const filterBarStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const selectStyle = {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Loading HR dashboard...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>HR Dashboard</h1>
        <p style={subtitleStyle}>Manage company-wide leave requests and employee balances</p>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'overview')}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          style={tabStyle(activeTab === 'requests')}
          onClick={() => setActiveTab('requests')}
        >
          📝 All Leave Requests
        </button>
        <button
          style={tabStyle(activeTab === 'balances')}
          onClick={() => setActiveTab('balances')}
        >
          💼 Employee Balances
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Key Stats */}
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Employees</div>
              <div style={statValueStyle}>{stats.totalEmployees}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>On Leave Today</div>
              <div style={statValueStyle}>{stats.onLeaveToday}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Pending Approvals</div>
              <div style={statValueStyle}>{stats.pendingApprovals}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Leave Requests</div>
              <div style={statValueStyle}>{stats.totalLeaveRequests}</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
            
            {/* Employees On Leave Today */}
            <div style={tableContainerStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
                🏖️ Employees On Leave Today
              </h3>
              {stats.employeesOnLeaveToday && stats.employeesOnLeaveToday.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Leave Type</th>
                      <th style={thStyle}>From - To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.employeesOnLeaveToday.map((leave) => (
                      <tr key={leave.id}>
                        <td style={tdStyle}>{leave.employeeName}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#E0F2FE',
                            color: '#0369a1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td style={tdStyle}>{leave.startDate} - {leave.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '6px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                  <p>No one is on leave today</p>
                </div>
              )}
            </div>

            {/* Pending Approvals */}
            <div style={tableContainerStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
                ⏰ Pending Approvals
              </h3>
              {stats.pendingApprovalsList && stats.pendingApprovalsList.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Leave Type</th>
                      <th style={thStyle}>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pendingApprovalsList.map((leave) => (
                      <tr key={leave.id}>
                        <td style={tdStyle}>{leave.employeeName}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div>{leave.startDate} - {leave.endDate}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '6px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                  <p>No pending approvals</p>
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {/* Filters */}
          <div style={filterBarStyle}>
            <select
              style={selectStyle}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button style={buttonStyle} onClick={exportToCSV}>
              📥 Export to CSV
            </button>
          </div>

          {/* All Requests Table */}
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Leave Type</th>
                  <th style={thStyle}>From</th>
                  <th style={thStyle}>To</th>
                  <th style={thStyle}>Days</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Applied On</th>
                  <th style={thStyle}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRequests().map((req) => (
                  <tr key={req.id}>
                    <td style={tdStyle}>{req.employeeName}</td>
                    <td style={tdStyle}>{req.leaveType}</td>
                    <td style={tdStyle}>{req.startDate}</td>
                    <td style={tdStyle}>{req.endDate}</td>
                    <td style={tdStyle}>{req.days}</td>
                    <td style={tdStyle}>{getStatusBadge(req.status)}</td>
                    <td style={tdStyle}>{req.appliedOn}</td>
                    <td style={tdStyle}>{req.supervisorRemarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'balances' && (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Casual (Used/Total)</th>
                <th style={thStyle}>Sick (Used/Total)</th>
                <th style={thStyle}>Earned (Used/Total)</th>
              </tr>
            </thead>
            <tbody>
              {allBalances.map((emp) => (
                <tr key={emp.employeeId}>
                  <td style={tdStyle}>{emp.employeeName}</td>
                  <td style={tdStyle}>{emp.email}</td>
                  <td style={tdStyle}>{emp.designation}</td>
                  <td style={tdStyle}>
                    {emp.casual.used}/{emp.casual.total} 
                    <span style={{ color: '#888', marginLeft: '8px' }}>
                      ({emp.casual.remaining} left)
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {emp.sick.used}/{emp.sick.total}
                    <span style={{ color: '#888', marginLeft: '8px' }}>
                      ({emp.sick.remaining} left)
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {emp.earned.used}/{emp.earned.total}
                    <span style={{ color: '#888', marginLeft: '8px' }}>
                      ({emp.earned.remaining} left)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
