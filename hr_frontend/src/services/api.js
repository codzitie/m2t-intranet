import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= AUTH =============
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ============= LEAVE TYPES =============
export const getLeaveTypes = async () => {
  const response = await api.get('/leave/types');
  return response.data;
};

// ============= LEAVE BALANCE =============
export const getLeaveBalance = async () => {
  const response = await api.get('/leave/balance');
  return response.data;
};

// ============= LEAVE APPLICATIONS =============
export const applyLeave = async ({ leaveTypeId, startDate, endDate, reason }) => {
  const response = await api.post('/leave/apply', {
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    reason
  });
  return response.data;
};

export const getLeaveHistory = async () => {
  const response = await api.get('/leave/history');
  return response.data;
};

// ========== CALENDAR & TEAM LEAVE ===========
// For calendar: org-wide approved leaves (for all employees)
export const getLeaveCalendar = async () => {
  const response = await api.get('/leave/calendar');
  return response.data;
};

// For managers: team members' approved leaves calendar
export const getTeamLeaves = async () => {
  const response = await api.get('/leave/team-leaves');
  return response.data;
};

// ============= APPROVALS =============
// L1 Manager approvals
export const getPendingL1Approvals = async () => {
  const response = await api.get('/approvals/pending-l1');
  return response.data;
};

export const l1ApproveLeave = async (leaveId, remarks) => {
  const response = await api.put(`/approvals/l1-approve/${leaveId}`, { remarks });
  return response.data;
};

export const l1RejectLeave = async (leaveId, remarks) => {
  const response = await api.put(`/approvals/l1-reject/${leaveId}`, { remarks });
  return response.data;
};

// Legacy endpoints for backward compatibility
export const getPendingApprovals = async () => {
  const response = await api.get('/approvals/pending');
  return response.data;
};

export const approveLeave = async (leaveId, remarks) => {
  const response = await api.put(`/approvals/approve/${leaveId}`, { remarks });
  return response.data;
};

export const rejectLeave = async (leaveId, remarks) => {
  const response = await api.put(`/approvals/reject/${leaveId}`, { remarks });
  return response.data;
};

// ============= HR DASHBOARD DATA =============
export const getHRStatistics = async () => {
  const response = await api.get('/hr/statistics');
  return response.data;
};

export const getAllLeaves = async () => {
  const response = await api.get('/hr/all-leaves');
  return response.data;
};

export const getEmployeeBalances = async () => {
  const response = await api.get('/hr/employee-balances');
  return response.data;
};

export const getAllEmployees = async () => {
  const response = await api.get('/hr/employees');
  return response.data;
};

// ============= NOTIFICATIONS =============
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// ============= REDIRECT APPROVAL =============
export const redirectLeaveApproval = async (leaveId, newManagerId) => {
  const response = await api.post('/leave/redirect', {
    leave_id: leaveId,
    new_manager_id: newManagerId
  });
  return response.data;
};

export default api;
