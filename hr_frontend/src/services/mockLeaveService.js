// Mock data for leave types
const mockLeaveTypes = [
  { id: 1, name: 'Casual Leave', yearlyQuota: 12, color: '#3B82F6' },
  { id: 2, name: 'Sick Leave', yearlyQuota: 6, color: '#EF4444' },
  { id: 3, name: 'Earned Leave', yearlyQuota: 15, color: '#10B981' },
  { id: 4, name: 'Emergency Leave', yearlyQuota: 3, color: '#F59E0B' }
];

// Mock user profiles for testing
const mockUsers = {
  employee: {
    id: 'user-001',
    name: 'Dharun',
    email: 'dharun@m2t-ai.com',
    role: 'Employee',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history'],
    supervisorId: 'user-supervisor-001',
    department: 'Engineering'
  },
  supervisor: {
    id: 'user-001',
    name: 'Dharun',
    email: 'dharun@m2t-ai.com',
    role: 'Supervisor',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history', 'approve_team_leaves', 'view_team'],
    supervisorId: 'user-supervisor-001',
    department: 'Engineering'
  },
  hr: {
    id: 'user-001',
    name: 'Dharun',
    email: 'dharun@m2t-ai.com',
    role: 'HR',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history', 'approve_team_leaves', 'view_team', 'manage_hr', 'manage_policies', 'view_all_leaves'],
    supervisorId: null,
    department: 'Human Resources'
  }
};

// Get initial role from localStorage or default to supervisor
const getInitialRole = () => {
  const savedRole = localStorage.getItem('testUserRole');
  return savedRole && mockUsers[savedRole] ? savedRole : 'supervisor';
};

// Current active user
let mockCurrentUser = mockUsers[getInitialRole()];

// Mock leave balance
const mockLeaveBalance = [
  { leaveTypeId: 1, leaveType: 'Casual Leave', total: 12, used: 3, remaining: 9 },
  { leaveTypeId: 2, leaveType: 'Sick Leave', total: 6, used: 1, remaining: 5 },
  { leaveTypeId: 3, leaveType: 'Earned Leave', total: 15, used: 0, remaining: 15 },
  { leaveTypeId: 4, leaveType: 'Emergency Leave', total: 3, used: 0, remaining: 3 }
];

// Mock leave history
let mockLeaveHistory = [
  // Team member leaves (for supervisor to approve)
  {
    id: 'leave-003',
    employeeId: 'user-002',
    employeeName: 'Priya Sharma',
    leaveType: 'Casual Leave',
    leaveTypeId: 1,
    startDate: '2025-11-10',
    endDate: '2025-11-12',
    days: 3,
    reason: 'Family wedding',
    status: 'Pending',
    supervisorRemarks: '',
    appliedOn: '2025-10-28',
    approvedOn: null
  },
  {
    id: 'leave-004',
    employeeId: 'user-003',
    employeeName: 'Ravi Kumar',
    leaveType: 'Sick Leave',
    leaveTypeId: 2,
    startDate: '2025-11-08',
    endDate: '2025-11-08',
    days: 1,
    reason: 'Medical appointment',
    status: 'Pending',
    supervisorRemarks: '',
    appliedOn: '2025-10-29',
    approvedOn: null
  },
  {
    id: 'leave-005',
    employeeId: 'user-004',
    employeeName: 'Anjali Mehta',
    leaveType: 'Earned Leave',
    leaveTypeId: 3,
    startDate: '2025-11-15',
    endDate: '2025-11-18',
    days: 4,
    reason: 'Personal trip',
    status: 'Pending',
    supervisorRemarks: '',
    appliedOn: '2025-10-29',
    approvedOn: null
  },
  // Dharun's own leaves
  {
    id: 'leave-001',
    employeeId: 'user-001',
    employeeName: 'Dharun',
    leaveType: 'Casual Leave',
    leaveTypeId: 1,
    startDate: '2025-10-27',
    endDate: '2025-10-29',
    days: 3,
    reason: 'Family function',
    status: 'Approved',
    supervisorRemarks: 'Approved. Enjoy!',
    appliedOn: '2025-10-20',
    approvedOn: '2025-10-21'
  },
  {
    id: 'leave-002',
    employeeId: 'user-001',
    employeeName: 'Dharun',
    leaveType: 'Sick Leave',
    leaveTypeId: 2,
    startDate: '2025-11-05',
    endDate: '2025-11-06',
    days: 2,
    reason: 'Medical checkup',
    status: 'Pending',
    supervisorRemarks: '',
    appliedOn: '2025-10-28',
    approvedOn: null
  }
];

// Mock employee data for HR dashboard
const mockEmployees = [
  {
    id: 'user-001',
    name: 'Dharun',
    email: 'dharun@m2t-ai.com',
    department: 'Engineering',
    role: 'Supervisor',
    joinDate: '2023-01-15'
  },
  {
    id: 'user-002',
    name: 'Priya Sharma',
    email: 'priya@m2t-ai.com',
    department: 'Engineering',
    role: 'Developer',
    joinDate: '2023-03-20'
  },
  {
    id: 'user-003',
    name: 'Ravi Kumar',
    email: 'ravi@m2t-ai.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    joinDate: '2023-02-10'
  },
  {
    id: 'user-004',
    name: 'Anjali Mehta',
    email: 'anjali@m2t-ai.com',
    department: 'Sales',
    role: 'Sales Executive',
    joinDate: '2023-06-05'
  },
  {
    id: 'user-005',
    name: 'Vikram Singh',
    email: 'vikram@m2t-ai.com',
    department: 'Engineering',
    role: 'Developer',
    joinDate: '2023-04-12'
  },
  {
    id: 'user-006',
    name: 'Neha Gupta',
    email: 'neha@m2t-ai.com',
    department: 'HR',
    role: 'HR Manager',
    joinDate: '2022-11-01'
  }
];

// Mock all employees' leave balances (for HR view)
const mockAllEmployeeBalances = [
  { employeeId: 'user-001', employeeName: 'Dharun', email: 'dharun@m2t-ai.com', designation: 'Supervisor', casual: { total: 12, used: 3, remaining: 9 }, sick: { total: 6, used: 1, remaining: 5 }, earned: { total: 15, used: 0, remaining: 15 } },
  { employeeId: 'user-002', employeeName: 'Priya Sharma', email: 'priya@m2t-ai.com', designation: 'Developer', casual: { total: 12, used: 2, remaining: 10 }, sick: { total: 6, used: 0, remaining: 6 }, earned: { total: 15, used: 0, remaining: 15 } },
  { employeeId: 'user-003', employeeName: 'Ravi Kumar', email: 'ravi@m2t-ai.com', designation: 'Marketing Manager', casual: { total: 12, used: 1, remaining: 11 }, sick: { total: 6, used: 1, remaining: 5 }, earned: { total: 15, used: 0, remaining: 15 } },
  { employeeId: 'user-004', employeeName: 'Anjali Mehta', email: 'anjali@m2t-ai.com', designation: 'Sales Executive', casual: { total: 12, used: 0, remaining: 12 }, sick: { total: 6, used: 0, remaining: 6 }, earned: { total: 15, used: 4, remaining: 11 } },
  { employeeId: 'user-005', employeeName: 'Vikram Singh', email: 'vikram@m2t-ai.com', designation: 'Developer', casual: { total: 12, used: 5, remaining: 7 }, sick: { total: 6, used: 2, remaining: 4 }, earned: { total: 15, used: 3, remaining: 12 } },
  { employeeId: 'user-006', employeeName: 'Neha Gupta', email: 'neha@m2t-ai.com', designation: 'HR Manager', casual: { total: 12, used: 1, remaining: 11 }, sick: { total: 6, used: 0, remaining: 6 }, earned: { total: 15, used: 2, remaining: 13 } }
];

// Helper function to simulate API delay
const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to calculate working days
const calculateWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Saturday and Sunday
      count++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  return count;
};

// Service object with all API methods
export const LeaveService = {
  // Get current user info (simulating SSO)
  getCurrentUser: async () => {
    await simulateDelay(300);
    return { success: true, data: mockCurrentUser };
  },

  // Switch user role (for testing only)
  switchUserRole: (role) => {
    if (mockUsers[role]) {
      mockCurrentUser = mockUsers[role];
      // Save to localStorage so it persists across page reloads
      localStorage.setItem('testUserRole', role);
      return { success: true, data: mockCurrentUser };
    }
    return { success: false, error: 'Invalid role' };
  },

  // Get leave types
  getLeaveTypes: async () => {
    await simulateDelay(200);
    return { success: true, data: mockLeaveTypes };
  },

  // Get leave balance for current user
  getLeaveBalance: async (userId) => {
    await simulateDelay(300);
    return { success: true, data: mockLeaveBalance };
  },

  // Apply for leave
  applyLeave: async (leaveData) => {
    await simulateDelay(800);
    
    // Simulate validation
    const leaveType = mockLeaveBalance.find(lb => lb.leaveTypeId === leaveData.leaveTypeId);
    const workingDays = calculateWorkingDays(leaveData.startDate, leaveData.endDate);
    
    if (!leaveType) {
      return { success: false, error: 'Invalid leave type' };
    }
    
    if (leaveType.remaining < workingDays) {
      return { 
        success: false, 
        error: `Insufficient balance. You have ${leaveType.remaining} days remaining, but requested ${workingDays} days.` 
      };
    }
    
    // Create new leave application
    const newLeave = {
      id: `leave-${Date.now()}`,
      employeeId: mockCurrentUser.id,
      employeeName: mockCurrentUser.name,
      leaveType: leaveType.leaveType,
      leaveTypeId: leaveData.leaveTypeId,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      days: workingDays,
      reason: leaveData.reason,
      status: 'Pending',
      supervisorRemarks: '',
      appliedOn: new Date().toISOString().split('T')[0],
      approvedOn: null
    };
    
    mockLeaveHistory.unshift(newLeave);
    
    return { 
      success: true, 
      message: 'Leave application submitted successfully',
      data: newLeave 
    };
  },

  // Get leave history
  getLeaveHistory: async (userId) => {
    await simulateDelay(400);
    return { 
      success: true, 
      data: mockLeaveHistory.filter(leave => leave.employeeId === userId) 
    };
  },

  // Get pending approvals (for supervisors)
  getPendingApprovals: async (supervisorId) => {
    await simulateDelay(400);
    // Return all pending leaves except the supervisor's own leaves
    return { 
      success: true, 
      data: mockLeaveHistory.filter(leave => 
        leave.status === 'Pending' && leave.employeeId !== mockCurrentUser.id
      ) 
    };
  },

  // Approve leave
  approveLeave: async (leaveId, remarks) => {
    await simulateDelay(600);
    
    const leave = mockLeaveHistory.find(l => l.id === leaveId);
    if (!leave) {
      return { success: false, error: 'Leave application not found' };
    }
    
    leave.status = 'Approved';
    leave.supervisorRemarks = remarks;
    leave.approvedOn = new Date().toISOString().split('T')[0];
    
    // Update balance
    const balanceEntry = mockLeaveBalance.find(lb => lb.leaveTypeId === leave.leaveTypeId);
    if (balanceEntry) {
      balanceEntry.used += leave.days;
      balanceEntry.remaining -= leave.days;
    }
    
    return { 
      success: true, 
      message: 'Leave approved successfully',
      data: leave 
    };
  },

  // Reject leave
  rejectLeave: async (leaveId, remarks) => {
    await simulateDelay(600);
    
    const leave = mockLeaveHistory.find(l => l.id === leaveId);
    if (!leave) {
      return { success: false, error: 'Leave application not found' };
    }
    
    leave.status = 'Rejected';
    leave.supervisorRemarks = remarks;
    leave.approvedOn = new Date().toISOString().split('T')[0];
    
    return { 
      success: true, 
      message: 'Leave rejected',
      data: leave 
    };
  },

  // HR Dashboard Methods

  // Get all employees (for HR)
  getAllEmployees: async () => {
    await simulateDelay(300);
    return { success: true, data: mockEmployees };
  },

  // Get all leave requests (company-wide for HR)
  getAllLeaveRequests: async () => {
    await simulateDelay(400);
    return { success: true, data: mockLeaveHistory };
  },

  // Get all employees' leave balances (for HR)
  getAllEmployeeBalances: async () => {
    await simulateDelay(400);
    return { success: true, data: mockAllEmployeeBalances };
  },

  // Get HR statistics
  // Get HR statistics
getHRStatistics: async () => {
  await simulateDelay(300);
  
  const totalEmployees = mockEmployees.length;
  const totalLeaveRequests = mockLeaveHistory.length;
  const pendingApprovals = mockLeaveHistory.filter(l => l.status === 'Pending').length;
  const approvedLeaves = mockLeaveHistory.filter(l => l.status === 'Approved').length;
  
  // Get employees on leave today
  const today = new Date().toISOString().split('T')[0];
  const employeesOnLeaveToday = mockLeaveHistory.filter(leave => {
    if (leave.status !== 'Approved') return false;
    return leave.startDate <= today && leave.endDate >= today;
  });
  
  const onLeaveToday = employeesOnLeaveToday.length;
  
  // Get pending approvals list
  const pendingApprovalsList = mockLeaveHistory.filter(l => l.status === 'Pending');
  
  // Department-wise stats
  const departmentStats = mockEmployees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = {
        department: emp.department,
        totalEmployees: 0,
        onLeaveToday: 0,
        pendingApprovals: 0
      };
    }
    acc[emp.department].totalEmployees++;
    
    // Count leaves for this department
    const deptLeaves = mockLeaveHistory.filter(l => {
      const employee = mockEmployees.find(e => e.id === l.employeeId);
      return employee && employee.department === emp.department;
    });
    
    acc[emp.department].pendingApprovals = deptLeaves.filter(l => l.status === 'Pending').length;
    
    return acc;
  }, {});
  
  return {
    success: true,
    data: {
      totalEmployees,
      totalLeaveRequests,
      pendingApprovals,
      approvedLeaves,
      onLeaveToday,
      employeesOnLeaveToday,
      pendingApprovalsList,
      departmentStats: Object.values(departmentStats)
    }
  };
}

};

export default LeaveService;
