import React, { useState } from 'react';

function PayrollExport() {
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2025-11-30');

  // Mock employees with detailed timesheets including DESCRIPTION entered while filling
  const [allEmployees] = useState([
    {
      id: 101,
      name: 'Rajesh Kumar',
      monthlyTimesheets: [
        { 
          date: '2025-11-01', 
          hours: 8, 
          status: 'filled',
          startTime: '09:00',
          endTime: '17:00',
          description: 'Sprint planning, API development, code review',
          activities: [
            { slot: 'morning', description: 'Sprint planning meeting', output: 'Defined user stories for Q4' },
            { slot: 'afternoon', description: 'Backend API development', output: 'Created 3 REST endpoints' }
          ]
        },
        { date: '2025-11-02', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-03', hours: 0, status: 'weekend', description: '', activities: [] },
        { 
          date: '2025-11-04', 
          hours: 8.5, 
          status: 'filled',
          startTime: '09:30',
          endTime: '18:00',
          description: 'Code review and bug fixes for payment module',
          activities: [
            { slot: 'morning', description: 'Code review', output: 'Reviewed 5 pull requests' },
            { slot: 'afternoon', description: 'Bug fixes', output: 'Fixed 4 critical bugs in payment module' }
          ]
        },
        { 
          date: '2025-11-05', 
          hours: 8.5, 
          status: 'filled',
          startTime: '09:30',
          endTime: '18:00',
          description: 'Frontend UI development and bug fixes',
          activities: [
            { slot: 'morning', description: 'Frontend development', output: 'Completed login page UI' },
            { slot: 'afternoon', description: 'Bug fixes', output: 'Fixed 4 critical bugs' }
          ]
        },
      ],
    },
    {
      id: 102,
      name: 'Priya Singh',
      monthlyTimesheets: [
        { 
          date: '2025-11-01', 
          hours: 8, 
          status: 'filled',
          startTime: '09:00',
          endTime: '17:00',
          description: 'Client meeting and API documentation update',
          activities: [
            { slot: 'morning', description: 'Client meeting', output: 'Gathered requirements for new feature' },
            { slot: 'afternoon', description: 'Documentation', output: 'Updated API documentation' }
          ]
        },
        { date: '2025-11-02', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-03', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-04', hours: 0, status: 'pending', description: '', activities: [] },
        { 
          date: '2025-11-05', 
          hours: 8.5, 
          status: 'filled',
          startTime: '09:00',
          endTime: '17:30',
          description: 'Code review and PR feedback',
          activities: [
            { slot: 'morning', description: 'Code review', output: 'Reviewed 3 PRs' }
          ]
        },
      ],
    },
    {
      id: 103,
      name: 'Amit Patel',
      monthlyTimesheets: [
        { 
          date: '2025-11-01', 
          hours: 8, 
          status: 'filled',
          startTime: '10:00',
          endTime: '18:00',
          description: 'Database optimization and unit testing',
          activities: [
            { slot: 'morning', description: 'Database optimization', output: 'Reduced query time by 40%' },
            { slot: 'afternoon', description: 'Unit testing', output: 'Wrote 15 test cases' }
          ]
        },
        { date: '2025-11-02', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-03', hours: 0, status: 'weekend', description: '', activities: [] },
        { 
          date: '2025-11-04', 
          hours: 8, 
          status: 'filled',
          startTime: '10:00',
          endTime: '18:00',
          description: 'API load testing with concurrent users',
          activities: [
            { slot: 'morning', description: 'Performance testing', output: 'Load tested API with 1000 concurrent users' }
          ]
        },
        { date: '2025-11-05', hours: 0, status: 'pending', description: '', activities: [] },
      ],
    },
    {
      id: 104,
      name: 'Dharun',
      monthlyTimesheets: [
        { 
          date: '2025-11-01', 
          hours: 8, 
          status: 'filled',
          startTime: '09:00',
          endTime: '17:00',
          description: 'User authentication feature development',
          activities: [
            { slot: 'morning', description: 'Feature development', output: 'Implemented user authentication' }
          ]
        },
        { date: '2025-11-02', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-03', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-04', hours: 0, status: 'locked', description: '', activities: [] },
        { date: '2025-11-05', hours: 0, status: 'locked', description: '', activities: [] },
      ],
    },
    {
      id: 105,
      name: 'Aakriti',
      monthlyTimesheets: [
        { 
          date: '2025-11-01', 
          hours: 8, 
          status: 'filled',
          startTime: '10:00',
          endTime: '18:00',
          description: 'UI/UX design mockups and navbar implementation',
          activities: [
            { slot: 'morning', description: 'UI/UX design', output: 'Created mockups for dashboard' },
            { slot: 'afternoon', description: 'Frontend implementation', output: 'Built responsive navbar' }
          ]
        },
        { date: '2025-11-02', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-03', hours: 0, status: 'weekend', description: '', activities: [] },
        { date: '2025-11-04', hours: 0, status: 'locked', description: '', activities: [] },
        { 
          date: '2025-11-05', 
          hours: 8.5, 
          status: 'filled',
          startTime: '10:00',
          endTime: '18:30',
          description: 'Dashboard component refinement and testing',
          activities: []
        },
      ],
    },
  ]);

  // Get payroll data for selected date range
  const getPayrollData = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return allEmployees.map(emp => {
      const timesheetsInRange = emp.monthlyTimesheets.filter(ts => {
        const tsDate = new Date(ts.date);
        return tsDate >= start && tsDate <= end;
      });

      const totalHours = timesheetsInRange.reduce((sum, ts) => sum + ts.hours, 0);
      const workingDays = timesheetsInRange.filter(ts => ts.status !== 'weekend').length;
      const filledDays = timesheetsInRange.filter(ts => ts.status === 'filled').length;
      const pendingDays = timesheetsInRange.filter(ts => ts.status === 'pending').length;
      const lockedDays = timesheetsInRange.filter(ts => ts.status === 'locked').length;

      return {
        ...emp,
        totalHours,
        workingDays,
        filledDays,
        pendingDays,
        lockedDays,
        timesheetsInRange,
      };
    });
  };

  const payrollData = getPayrollData();

  // ✅ UPDATED: Export all employees as CSV with DESCRIPTION field
  const exportAllCSV = () => {
    const headers = [
      'Employee Name',
      'Date',
      'Start Time',
      'End Time',
      'Hours Logged',
      'Status',
      'Daily Description',
      'Morning Activities',
      'Morning Output',
      'Afternoon Activities',
      'Afternoon Output'
    ];

    const rows = [];
    payrollData.forEach(emp => {
      emp.timesheetsInRange.forEach(ts => {
        const morningActivity = ts.activities?.find(a => a.slot === 'morning');
        const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

        rows.push([
          emp.name,
          ts.date,
          ts.startTime || '-',
          ts.endTime || '-',
          ts.hours,
          ts.status,
          ts.description || '-',
          morningActivity?.description || '-',
          morningActivity?.output || '-',
          afternoonActivity?.description || '-',
          afternoonActivity?.output || '-'
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, `payroll_detailed_${startDate}_to_${endDate}.csv`);
  };

  // ✅ UPDATED: Export individual employee as CSV with DESCRIPTION field
  const exportIndividualCSV = (employee) => {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Hours Logged',
      'Status',
      'Daily Description',
      'Morning Activities',
      'Morning Output',
      'Afternoon Activities',
      'Afternoon Output'
    ];

    const rows = employee.timesheetsInRange.map(ts => {
      const morningActivity = ts.activities?.find(a => a.slot === 'morning');
      const afternoonActivity = ts.activities?.find(a => a.slot === 'afternoon');

      return [
        ts.date,
        ts.startTime || '-',
        ts.endTime || '-',
        ts.hours,
        ts.status,
        ts.description || '-',
        morningActivity?.description || '-',
        morningActivity?.output || '-',
        afternoonActivity?.description || '-',
        afternoonActivity?.output || '-'
      ];
    });

    const csvContent = [
      `Employee: ${employee.name}`,
      `Period: ${startDate} to ${endDate}`,
      `Total Hours: ${employee.totalHours}`,
      `Filled Days: ${employee.filledDays}/${employee.workingDays}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, `${employee.name}_detailed_${startDate}_to_${endDate}.csv`);
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
    cursor: 'pointer',
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

  const descriptionBoxStyle = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#1e40af',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
        >
          📥 Export All as CSV (Detailed)
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
              {payrollData.reduce((sum, emp) => sum + emp.totalHours, 0)}h
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
      {payrollData.map((emp) => (
        <div key={emp.id} style={cardStyle}>
          <div style={employeeHeaderStyle}>
            <div>
              <div style={employeeNameStyle}>{emp.name}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                {emp.filledDays}/{emp.workingDays} days filled • {emp.totalHours} hours total
              </div>
            </div>
            <button
              onClick={() => exportIndividualCSV(emp)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#004aad',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#003380'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#004aad'}
            >
              📥 Export Detailed
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={detailStyle}>
              <strong>Total Hours:</strong> {emp.totalHours}h
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

          {/* Show daily descriptions */}
          <div style={descriptionBoxStyle}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e3a8a' }}>
              📋 Daily Work Summary:
            </div>
            {emp.timesheetsInRange
              .filter(ts => ts.status === 'filled' && ts.description)
              .map((ts, idx) => (
                <div key={idx} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #dbeafe' }}>
                  <div style={{ fontWeight: '600', fontSize: '12px' }}>
                    {ts.date} ({ts.hours}h)
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#1e40af' }}>
                    {ts.description}
                  </div>
                </div>
              ))}
            {emp.timesheetsInRange.filter(ts => ts.status === 'filled' && ts.description).length === 0 && (
              <div style={{ fontSize: '12px', color: '#666' }}>No description entries</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PayrollExport;
