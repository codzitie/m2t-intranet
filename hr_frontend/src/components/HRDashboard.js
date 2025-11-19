import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import * as api from '../services/api';
import { useNavigate } from 'react-router-dom';

function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [statsData, requestsData, balancesData, employeesData] = await Promise.all([
        api.getHRStatistics(),
        api.getAllLeaves(),
        api.getEmployeeBalances(),
        api.getAllEmployees()
      ]);

      setStats(statsData || {});
      setAllRequests(requestsData || []);
      setAllBalances(balancesData || []);
      setAllEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading HR data:', error);
      alert('Failed to load HR dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    let filtered = [...allRequests];
    if (filterStatus !== 'All') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }
    return filtered;
  };

  const getPendingApprovals = () => {
    return allRequests.filter(req => req.status === 'Pending');
  };

  const getAvailableApprovers = () => {
    return allEmployees.filter(emp =>
      emp.role === 'Manager' || emp.role === 'Team Lead'
    );
  };

  const openRedirectModal = (leave) => {
    setSelectedLeave(leave);
    setSelectedManagerId('');
    setShowRedirectModal(true);
  };

  const closeRedirectModal = () => {
    setShowRedirectModal(false);
    setSelectedLeave(null);
    setSelectedManagerId('');
  };

  const handleRedirectSubmit = async () => {
    if (!selectedManagerId) {
      alert('Please select a manager');
      return;
    }
    try {
      await api.redirectLeaveApproval(selectedLeave.id, selectedManagerId);
      alert('Approver updated successfully!');
      closeRedirectModal();
      loadData();
    } catch (err) {
      alert('Failed to redirect approval');
    }
  };

  const getApprovalStageBadge = (request) => {
    if (request.status === 'Pending') {
      return (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          Pending
        </span>
      );
    }
    if (request.status === 'Approved') {
      return (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          Approved
        </span>
      );
    }
    if (request.status === 'Rejected') {
      return (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          Rejected
        </span>
      );
    }
    return null;
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

  const exportToCSV = () => {
    const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On', 'Remarks'];
    const rows = getFilteredRequests().map(req => [
      req.employee_name,
      req.leave_type,
      req.start_date,
      req.end_date,
      req.days,
      req.status,
      req.applied_on,
      req.supervisor_remarks || '-'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    try {
      const filteredData = getFilteredRequests();

      if (filteredData.length === 0) {
        alert('No data to export');
        return;
      }

      const worksheetData = [
        ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On', 'Remarks'],
        ...filteredData.map(req => [
          req.employee_name,
          req.leave_type,
          req.start_date,
          req.end_date,
          req.days,
          req.status,
          req.applied_on,
          req.supervisor_remarks || '-'
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();

      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
        { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Requests');

      const fileName = `leave-requests-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Styles
  const containerStyle = { maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' };
  const headerStyle = { marginBottom: '30px' };
  const titleStyle = { fontSize: '28px', fontWeight: '600', color: '#004aad', marginBottom: '8px' };
  const subtitleStyle = { fontSize: '16px', color: '#666' };
  const tabsStyle = { display: 'flex', gap: '8px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' };
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
  const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' };
  const statCardStyle = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
  const statLabelStyle = { fontSize: '14px', color: '#666', marginBottom: '8px' };
  const statValueStyle = { fontSize: '32px', fontWeight: 'bold', color: '#004aad' };
  const tableContainerStyle = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', overflowX: 'auto' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
  const thStyle = { backgroundColor: '#f9fafb', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #e5e7eb' };
  const filterBarStyle = { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' };
  const selectStyle = { padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px' };
  const buttonStyle = { padding: '8px 16px', backgroundColor: '#004aad', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
  const buttonStyleExcel = { padding: '8px 16px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const modalTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px'
  };

  const modalLabelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '8px'
  };

  const modalSelectStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginBottom: '20px'
  };

  const modalButtonsStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  };

  const modalButtonPrimaryStyle = {
    padding: '10px 20px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  };

  const modalButtonSecondaryStyle = {
    padding: '10px 20px',
    backgroundColor: '#e5e7eb',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#666' }}>
        Loading HR dashboard...
      </div>
    );
  }

  const pendingApprovals = getPendingApprovals();
  const availableApprovers = getAvailableApprovers();

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>HR Dashboard</h1>
        <p style={subtitleStyle}>Manage company-wide leave requests and employee balances</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            fontWeight: 500,
            border: '1px solid #10B981',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#10B981',
            backgroundColor: '#F6FFFB',
          }}
          onClick={() => navigate('/leave/calendar')}
          onMouseEnter={e => e.target.style.backgroundColor = '#e7f6ee'}
          onMouseLeave={e => e.target.style.backgroundColor = '#F6FFFB'}
        >
          📆 View Leave Calendar
        </button>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button style={tabStyle(activeTab === 'requests')} onClick={() => setActiveTab('requests')}>
          📝 All Leave Requests
        </button>
        <button style={tabStyle(activeTab === 'balances')} onClick={() => setActiveTab('balances')}>
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
              <div style={statValueStyle}>{stats.total_employees || 0}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>On Leave Today</div>
              <div style={statValueStyle}>{stats.on_leave_today || 0}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Pending Approvals</div>
              <div style={statValueStyle}>{pendingApprovals.length}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Leave Requests</div>
              <div style={statValueStyle}>{allRequests.length}</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
            {/* Employees On Leave Today */}
            <div style={tableContainerStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
                🏖️ Employees On Leave Today
              </h3>
              {stats.employees_on_leave_today && stats.employees_on_leave_today.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Leave Type</th>
                      <th style={thStyle}>From - To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.employees_on_leave_today.map((leave) => (
                      <tr key={leave.id}>
                        <td style={tdStyle}>{leave.employee_name}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#E0F2FE',
                            color: '#0369a1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {leave.leave_type}
                          </span>
                        </td>
                        <td style={tdStyle}>{leave.start_date} - {leave.end_date}</td>
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
              {pendingApprovals.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Leave Type</th>
                      <th style={thStyle}>Days</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((leave) => (
                      <tr key={leave.id}>
                        <td style={tdStyle}>{leave.employee_name}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {leave.leave_type}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div>{leave.start_date} - {leave.end_date}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                          </div>
                        </td>
                        <td style={tdStyle}>{getApprovalStageBadge(leave)}</td>
                        <td style={tdStyle}>
                          <button
                            style={{
                              background: '#F59E0B',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                            onClick={() => openRedirectModal(leave)}
                          >
                            🔄 Redirect
                          </button>
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
            <button style={buttonStyleExcel} onClick={exportToExcel}>
              📊 Export to Excel
            </button>
          </div>

          {/* All Requests Table */}
          <div style={tableContainerStyle}>
            {getFilteredRequests().length > 0 ? (
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
                      <td style={tdStyle}>{req.employee_name}</td>
                      <td style={tdStyle}>{req.leave_type}</td>
                      <td style={tdStyle}>{req.start_date}</td>
                      <td style={tdStyle}>{req.end_date}</td>
                      <td style={tdStyle}>{req.days}</td>
                      <td style={tdStyle}>{getStatusBadge(req.status)}</td>
                      <td style={tdStyle}>{req.applied_on}</td>
                      <td style={tdStyle}>{req.supervisor_remarks || '-'}</td>
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
                <p>No leave requests found</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'balances' && (
        <div style={tableContainerStyle}>
          {allBalances.length > 0 ? (
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
                  <tr key={emp.employee_id}>
                    <td style={tdStyle}>{emp.employee_name}</td>
                    <td style={tdStyle}>{emp.email}</td>
                    <td style={tdStyle}>{emp.designation || '-'}</td>
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
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              color: '#666'
            }}>
              <p>No employee balance data available</p>
            </div>
          )}
        </div>
      )}

      {/* Redirect Modal */}
      {showRedirectModal && (
        <div style={modalOverlayStyle} onClick={closeRedirectModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Redirect Leave Approval</h2>
            {selectedLeave && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Employee:</strong> {selectedLeave.employee_name}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Leave Type:</strong> {selectedLeave.leave_type}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Dates:</strong> {selectedLeave.start_date} - {selectedLeave.end_date}
                </p>
              </div>
            )}
            <label style={modalLabelStyle}>
              Select New Approver (Manager/Team Lead):
            </label>
            <select
              style={modalSelectStyle}
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
            >
              <option value="">-- Select Manager/Team Lead --</option>
              {availableApprovers.map((approver) => (
                <option key={approver.id} value={approver.id}>
                  {approver.name} ({approver.role}) - {approver.email}
                </option>
              ))}
            </select>
            <div style={modalButtonsStyle}>
              <button style={modalButtonSecondaryStyle} onClick={closeRedirectModal}>
                Cancel
              </button>
              <button style={modalButtonPrimaryStyle} onClick={handleRedirectSubmit}>
                Confirm Redirect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
