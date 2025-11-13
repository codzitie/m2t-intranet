import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import timesheetService from '../../services/timesheetService';
import axios from 'axios';
import * as XLSX from 'xlsx';


function PayrollExport() {
  const { token, user } = useUser();
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2025-11-30');
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);


  // ✅ FETCH ALL USERS FIRST (to get user IDs)
  useEffect(() => {
    if (user && user.role === 'HR' && token) {
      fetchAllUsers();
    }
  }, [token, user]);


  // ✅ FETCH ALL USERS TO GET USER IDs
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data);
      fetchEmployeeTimesheets(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch user list');
    }
  };


  // ✅ FETCH ALL EMPLOYEE TIMESHEETS
  const fetchEmployeeTimesheets = async (usersList) => {
    setLoading(true);
    setError('');
    
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;


      const hrDashboard = await timesheetService.getHRDashboard(token);
      const monthSummary = hrDashboard.month_summary || {};
      
      const employeeList = [];
      
      for (const employeeName in monthSummary) {
        const empData = monthSummary[employeeName];
        const userRecord = usersList.find(u => u.name === employeeName);
        
        if (userRecord) {
          employeeList.push({
            id: userRecord.id,
            name: employeeName,
            email: userRecord.email,
            totalHours: empData.total_hours,
            filledDays: empData.filled,
            pendingDays: empData.pending || 0,
            lockedDays: empData.locked || 0,
            workingDays: empData.filled + (empData.pending || 0) + (empData.locked || 0)
          });
        }
      }


      setPayrollData(employeeList);


    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err.detail || 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };


  // ✅ FETCH SPECIFIC EMPLOYEE TIMESHEETS
  const fetchEmployeeDetailedTimesheets = async (employeeId, year, month) => {
    try {
      console.log(`Fetching timesheets for employee ${employeeId}, ${year}-${month}`);
      const entries = await timesheetService.getEmployeeTimesheets(token, employeeId, year, month);
      console.log(`Fetched ${entries.length} entries`, entries);
      return entries;
    } catch (err) {
      console.error('Error fetching employee detailed timesheets:', err);
      return [];
    }
  };


  // ✅ EXPORT ALL AS EXCEL WITH MULTIPLE SHEETS (SIMPLIFIED OVERVIEW)
  const exportAllExcel = async () => {
    setLoading(true);
    
    try {
      const year = parseInt(startDate.split('-')[0]);
      const month = parseInt(startDate.split('-')[1]);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // ============================================
      // SHEET 1: OVERVIEW SUMMARY (SIMPLIFIED)
      // ============================================
      const summaryData = [
        ['PAYROLL OVERVIEW SUMMARY'],
        ['Period', `${startDate} to ${endDate}`],
        ['Generated On', new Date().toLocaleString()],
        [''],
        ['Employee Name', 'Email', 'Total Hours', 'Filled Days', 'Pending Days', 'Locked Days']
      ];

      // Add each employee summary
      for (const emp of payrollData) {
        summaryData.push([
          emp.name,
          emp.email,
          emp.totalHours.toFixed(1),
          emp.filledDays,
          emp.pendingDays,
          emp.lockedDays
        ]);
      }

      // Add totals row
      summaryData.push(['']);
      summaryData.push([
        'TOTALS',
        '',
        payrollData.reduce((sum, emp) => sum + emp.totalHours, 0).toFixed(1),
        payrollData.reduce((sum, emp) => sum + emp.filledDays, 0),
        payrollData.reduce((sum, emp) => sum + emp.pendingDays, 0),
        payrollData.reduce((sum, emp) => sum + emp.lockedDays, 0)
      ]);

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 25 }, // Employee Name
        { wch: 30 }, // Email
        { wch: 12 }, // Total Hours
        { wch: 12 }, // Filled Days
        { wch: 13 }, // Pending Days
        { wch: 12 }  // Locked Days
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Overview Summary');

      // ============================================
      // INDIVIDUAL EMPLOYEE SHEETS
      // ============================================
      for (const emp of payrollData) {
        try {
          const timesheets = await fetchEmployeeDetailedTimesheets(emp.id, year, month);

          // Create employee sheet data
          const employeeData = [
            [`${emp.name} - Detailed Timesheet`],
            ['Email', emp.email],
            ['Period', `${startDate} to ${endDate}`],
            ['Total Hours', `${emp.totalHours.toFixed(1)}h`],
            ['Filled Days', `${emp.filledDays}/${emp.workingDays}`],
            ['Locked Days', emp.lockedDays],
            [''],
            ['Date', 'Start Time', 'End Time', 'Hours Logged', 'Status', 'Is Locked', 'Daily Description', 'Morning Activities', 'Morning Output', 'Afternoon Activities', 'Afternoon Output']
          ];

          if (timesheets.length === 0) {
            employeeData.push(['-', '-', '-', 0, 'No Data', 'No', '-', '-', '-', '-', '-']);
          } else {
            timesheets.forEach(ts => {
              const morningActivity = ts.activities?.find(a => a.slot === 'morning');
              const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

              employeeData.push([
                ts.date,
                ts.start_time || '-',
                ts.end_time || '-',
                ts.hours_logged ? (ts.hours_logged / 60).toFixed(1) : 0,
                ts.status,
                ts.is_locked ? 'Yes' : 'No',
                ts.description || '-',
                morningActivity?.description || '-',
                morningActivity?.output || '-',
                afternoonActivity?.description || '-',
                afternoonActivity?.output || '-'
              ]);
            });

            // Add summary for this employee
            const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours_logged || 0), 0) / 60;
            const filledDays = timesheets.filter(ts => ts.status === 'filled').length;
            const workingDays = timesheets.filter(ts => ts.status !== 'weekend').length;
            const lockedDays = timesheets.filter(ts => ts.is_locked).length;

            employeeData.push(['']);
            employeeData.push(['Summary', '', '', '', '', '', '', '', '', '', '']);
            employeeData.push(['Total Hours', totalHours.toFixed(1) + 'h']);
            employeeData.push(['Filled Days', `${filledDays}/${workingDays}`]);
            employeeData.push(['Locked Days', lockedDays]);
          }

          const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
          
          // Set column widths for employee sheet
          employeeSheet['!cols'] = [
            { wch: 12 }, // Date
            { wch: 12 }, // Start Time
            { wch: 12 }, // End Time
            { wch: 13 }, // Hours Logged
            { wch: 10 }, // Status
            { wch: 10 }, // Is Locked
            { wch: 30 }, // Daily Description
            { wch: 30 }, // Morning Activities
            { wch: 30 }, // Morning Output
            { wch: 30 }, // Afternoon Activities
            { wch: 30 }  // Afternoon Output
          ];

          // Sanitize sheet name (max 31 chars, no special chars)
          let sheetName = emp.name.substring(0, 28);
          sheetName = sheetName.replace(/[:\\/?*\[\]]/g, '');
          
          XLSX.utils.book_append_sheet(workbook, employeeSheet, sheetName);
          
        } catch (err) {
          console.error(`Error creating sheet for ${emp.name}:`, err);
        }
      }

      // Write the Excel file
      const fileName = `payroll_detailed_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`✅ Excel export completed! ${payrollData.length} employee sheets created.`);

    } catch (err) {
      setError('Failed to export Excel: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ✅ EXPORT ALL AS CSV WITH STRUCTURED SECTIONS (SIMILAR TO EXCEL)
  const exportAllCSV = async () => {
    setLoading(true);
    
    try {
      const year = parseInt(startDate.split('-')[0]);
      const month = parseInt(startDate.split('-')[1]);

      let csvContent = '';

      // ============================================
      // SECTION 1: OVERVIEW SUMMARY
      // ============================================
      csvContent += '==========================================\n';
      csvContent += 'PAYROLL OVERVIEW SUMMARY\n';
      csvContent += '==========================================\n';
      csvContent += `Period,${startDate} to ${endDate}\n`;
      csvContent += `Generated On,${new Date().toLocaleString()}\n`;
      csvContent += '\n';
      
      // Summary table headers
      csvContent += 'Employee Name,Email,Total Hours,Filled Days,Pending Days,Locked Days\n';
      
      // Add each employee summary
      for (const emp of payrollData) {
        csvContent += `"${emp.name}","${emp.email}",${emp.totalHours.toFixed(1)},${emp.filledDays},${emp.pendingDays},${emp.lockedDays}\n`;
      }
      
      // Add totals
      csvContent += '\n';
      csvContent += `TOTALS,"",${payrollData.reduce((sum, emp) => sum + emp.totalHours, 0).toFixed(1)},${payrollData.reduce((sum, emp) => sum + emp.filledDays, 0)},${payrollData.reduce((sum, emp) => sum + emp.pendingDays, 0)},${payrollData.reduce((sum, emp) => sum + emp.lockedDays, 0)}\n`;
      csvContent += '\n\n';

      // ============================================
      // SECTION 2: INDIVIDUAL EMPLOYEE DETAILS
      // ============================================
      for (const emp of payrollData) {
        try {
          const timesheets = await fetchEmployeeDetailedTimesheets(emp.id, year, month);

          csvContent += '==========================================\n';
          csvContent += `${emp.name.toUpperCase()} - DETAILED TIMESHEET\n`;
          csvContent += '==========================================\n';
          csvContent += `Email,${emp.email}\n`;
          csvContent += `Period,${startDate} to ${endDate}\n`;
          csvContent += `Total Hours,${emp.totalHours.toFixed(1)}h\n`;
          csvContent += `Filled Days,${emp.filledDays}/${emp.workingDays}\n`;
          csvContent += `Locked Days,${emp.lockedDays}\n`;
          csvContent += '\n';

          // Detailed timesheet headers
          csvContent += 'Date,Start Time,End Time,Hours Logged,Status,Is Locked,Daily Description,Morning Activities,Morning Output,Afternoon Activities,Afternoon Output\n';

          if (timesheets.length === 0) {
            csvContent += '"-","-","-","0","No Data","No","-","-","-","-","-"\n';
          } else {
            timesheets.forEach(ts => {
              const morningActivity = ts.activities?.find(a => a.slot === 'morning');
              const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

              const row = [
                ts.date,
                ts.start_time || '-',
                ts.end_time || '-',
                ts.hours_logged ? (ts.hours_logged / 60).toFixed(1) : 0,
                ts.status,
                ts.is_locked ? 'Yes' : 'No',
                ts.description || '-',
                morningActivity?.description || '-',
                morningActivity?.output || '-',
                afternoonActivity?.description || '-',
                afternoonActivity?.output || '-'
              ];

              csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            // Add employee summary
            const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours_logged || 0), 0) / 60;
            const filledDays = timesheets.filter(ts => ts.status === 'filled').length;
            const workingDays = timesheets.filter(ts => ts.status !== 'weekend').length;
            const lockedDays = timesheets.filter(ts => ts.is_locked).length;

            csvContent += '\n';
            csvContent += 'SUMMARY\n';
            csvContent += `Total Hours,${totalHours.toFixed(1)}h\n`;
            csvContent += `Filled Days,${filledDays}/${workingDays}\n`;
            csvContent += `Locked Days,${lockedDays}\n`;
          }

          csvContent += '\n\n';

        } catch (err) {
          console.error(`Error fetching details for ${emp.name}:`, err);
          csvContent += `Error fetching data for ${emp.name}\n\n\n`;
        }
      }

      downloadCSV(csvContent, `payroll_detailed_${startDate}_to_${endDate}.csv`);
      alert(`✅ CSV export completed! Overview summary and ${payrollData.length} employee sections included.`);

    } catch (err) {
      setError('Failed to export CSV: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ✅ EXPORT INDIVIDUAL EMPLOYEE AS CSV
  const exportIndividualCSV = async (employee) => {
    setLoading(true);
    
    try {
      const year = parseInt(startDate.split('-')[0]);
      const month = parseInt(startDate.split('-')[1]);
      
      console.log(`Exporting for employee:`, employee);
      
      const timesheets = await fetchEmployeeDetailedTimesheets(employee.id, year, month);

      console.log(`Fetched ${timesheets.length} timesheets for ${employee.name}`);

      if (timesheets.length === 0) {
        setError(`No timesheet data found for ${employee.name} in ${year}-${month}`);
        setLoading(false);
        return;
      }

      const headers = [
        'Date',
        'Start Time',
        'End Time',
        'Hours Logged',
        'Status',
        'Is Locked',
        'Daily Description',
        'Morning Activities',
        'Morning Output',
        'Afternoon Activities',
        'Afternoon Output'
      ];

      const rows = timesheets.map(ts => {
        const morningActivity = ts.activities?.find(a => a.slot === 'morning');
        const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

        return [
          ts.date,
          ts.start_time || '-',
          ts.end_time || '-',
          ts.hours_logged ? (ts.hours_logged / 60).toFixed(1) : 0,
          ts.status,
          ts.is_locked ? 'Yes' : 'No',
          ts.description || '-',
          morningActivity?.description || '-',
          morningActivity?.output || '-',
          afternoonActivity?.description || '-',
          afternoonActivity?.output || '-'
        ];
      });

      const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours_logged || 0), 0) / 60;
      const filledDays = timesheets.filter(ts => ts.status === 'filled').length;
      const workingDays = timesheets.filter(ts => ts.status !== 'weekend').length;
      const lockedDays = timesheets.filter(ts => ts.is_locked).length;

      const csvContent = [
        `Employee: ${employee.name}`,
        `Email: ${employee.email}`,
        `Period: ${startDate} to ${endDate}`,
        `Total Hours: ${totalHours.toFixed(1)}`,
        `Filled Days: ${filledDays}/${workingDays}`,
        `Locked Days: ${lockedDays}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      downloadCSV(csvContent, `${employee.name}_detailed_${year}_${month}.csv`);

    } catch (err) {
      setError(`Failed to export ${employee.name}'s CSV: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ✅ EXPORT INDIVIDUAL EMPLOYEE AS EXCEL
  const exportIndividualExcel = async (employee) => {
    setLoading(true);
    
    try {
      const year = parseInt(startDate.split('-')[0]);
      const month = parseInt(startDate.split('-')[1]);
      
      const timesheets = await fetchEmployeeDetailedTimesheets(employee.id, year, month);

      if (timesheets.length === 0) {
        setError(`No timesheet data found for ${employee.name} in ${year}-${month}`);
        setLoading(false);
        return;
      }

      // Create employee sheet data
      const employeeData = [
        [`${employee.name} - Detailed Timesheet`],
        ['Email', employee.email],
        ['Period', `${startDate} to ${endDate}`],
        ['Total Hours', `${employee.totalHours.toFixed(1)}h`],
        ['Filled Days', `${employee.filledDays}/${employee.workingDays}`],
        ['Locked Days', employee.lockedDays],
        [''],
        ['Date', 'Start Time', 'End Time', 'Hours Logged', 'Status', 'Is Locked', 'Daily Description', 'Morning Activities', 'Morning Output', 'Afternoon Activities', 'Afternoon Output']
      ];

      timesheets.forEach(ts => {
        const morningActivity = ts.activities?.find(a => a.slot === 'morning');
        const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

        employeeData.push([
          ts.date,
          ts.start_time || '-',
          ts.end_time || '-',
          ts.hours_logged ? (ts.hours_logged / 60).toFixed(1) : 0,
          ts.status,
          ts.is_locked ? 'Yes' : 'No',
          ts.description || '-',
          morningActivity?.description || '-',
          morningActivity?.output || '-',
          afternoonActivity?.description || '-',
          afternoonActivity?.output || '-'
        ]);
      });

      // Add summary
      const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hours_logged || 0), 0) / 60;
      const filledDays = timesheets.filter(ts => ts.status === 'filled').length;
      const workingDays = timesheets.filter(ts => ts.status !== 'weekend').length;
      const lockedDays = timesheets.filter(ts => ts.is_locked).length;

      employeeData.push(['']);
      employeeData.push(['Summary', '', '', '', '', '', '', '', '', '', '']);
      employeeData.push(['Total Hours', totalHours.toFixed(1) + 'h']);
      employeeData.push(['Filled Days', `${filledDays}/${workingDays}`]);
      employeeData.push(['Locked Days', lockedDays]);

      const worksheet = XLSX.utils.aoa_to_sheet(employeeData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 13 }, { wch: 10 },
        { wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, employee.name.substring(0, 31));

      const fileName = `${employee.name}_detailed_${year}_${month}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      setError(`Failed to export ${employee.name}'s Excel: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Helper function to download CSV
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  // Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };


  const searchContainerStyle = {
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  };


  const datePickerStyle = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  };


  const exportButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.3s ease',
  };

  const exportButtonExcelStyle = {
    padding: '10px 20px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.3s ease',
  };


  const payrollSummaryStyle = {
    backgroundColor: '#f0fdf4',
    border: '2px solid #10B981',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  };


  const payrollStatsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  };


  const payrollStatStyle = {
    textAlign: 'center',
  };


  const payrollStatValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: '4px',
  };


  const payrollStatLabelStyle = {
    fontSize: '12px',
    color: '#666',
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


  const detailStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  };


  const errorStyle = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };


  const loadingStyle = {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '8px',
  };

  const individualButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#004aad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  const individualButtonExcelStyle = {
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };


  // ✅ AUTHORIZATION CHECK
  if (!user || user.role !== 'HR') {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        ⛔ Access Denied: Only HR can access payroll data
      </div>
    );
  }


  if (loading) {
    return <div style={loadingStyle}>Loading payroll data...</div>;
  }


  return (
    <div style={containerStyle}>
      {/* Error Message */}
      {error && (
        <div style={errorStyle}>
          <span>⚠️ {error}</span>
          <button 
            onClick={() => setError('')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#991B1B', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✖
          </button>
        </div>
      )}


      {/* Date Range Picker */}
      <div style={searchContainerStyle}>
        <div>
          <label style={{ fontSize: '14px', color: '#666', marginBottom: '6px', display: 'block' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={datePickerStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '14px', color: '#666', marginBottom: '6px', display: 'block' }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={datePickerStyle}
          />
        </div>
        <button
          onClick={exportAllCSV}
          style={exportButtonStyle}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#10B981')}
        >
          {loading ? '⏳ Exporting...' : '📥 Export All as CSV'}
        </button>
        <button
          onClick={exportAllExcel}
          style={exportButtonExcelStyle}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#047857')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
        >
          {loading ? '⏳ Exporting...' : '📊 Export All as Excel (Multi-Sheet)'}
        </button>
      </div>


      {/* Payroll Summary */}
      <div style={payrollSummaryStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#10B981', marginBottom: '12px' }}>
          📊 Payroll Summary ({startDate} to {endDate})
        </h3>
        <div style={payrollStatsGridStyle}>
          <div style={payrollStatStyle}>
            <div style={payrollStatValueStyle}>
              {payrollData.reduce((sum, emp) => sum + emp.totalHours, 0).toFixed(1)}h
            </div>
            <div style={payrollStatLabelStyle}>Total Hours</div>
          </div>
          <div style={payrollStatStyle}>
            <div style={payrollStatValueStyle}>
              {payrollData.filter(emp => emp.filledDays === emp.workingDays).length}
            </div>
            <div style={payrollStatLabelStyle}>Complete</div>
          </div>
          <div style={payrollStatStyle}>
            <div style={payrollStatValueStyle}>
              {payrollData.filter(emp => emp.filledDays < emp.workingDays).length}
            </div>
            <div style={payrollStatLabelStyle}>Incomplete</div>
          </div>
          <div style={payrollStatStyle}>
            <div style={payrollStatValueStyle}>
              {payrollData.reduce((sum, emp) => sum + emp.lockedDays, 0)}
            </div>
            <div style={payrollStatLabelStyle}>Locked Days</div>
          </div>
        </div>
      </div>


      {/* Employee List */}
      {payrollData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No employee data available for the selected period
        </div>
      ) : (
        payrollData.map((emp, idx) => (
          <div key={idx} style={cardStyle}>
            <div style={employeeHeaderStyle}>
              <div>
                <div style={employeeNameStyle}>{emp.name}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  {emp.email} • {emp.filledDays}/{emp.workingDays} days filled • {emp.totalHours.toFixed(1)}h total
                </div>
              </div>
              <div style={buttonGroupStyle}>
                <button
                  onClick={() => exportIndividualCSV(emp)}
                  style={individualButtonStyle}
                  disabled={loading}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#003380')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#004aad')}
                >
                  📥 CSV
                </button>
                <button
                  onClick={() => exportIndividualExcel(emp)}
                  style={individualButtonExcelStyle}
                  disabled={loading}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#047857')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
                >
                  📊 Excel
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
  );
}


export default PayrollExport;
