import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8000/api';

// Pre-generated tokens for mock login
const MOCK_TOKENS = {
  dharun: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3OWIzYzIxOS03YzA4LTQyNjItYmNjYS1lNjU1YzBjZmEyZDYiLCJleHAiOjE3NjI1OTY1MjB9.GjpnFybqeSEKKaSAAMI2wj0WTdpE4hgNkPu0EEawCY8',
  sai_kumar: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDQ3N2IzZi1jYTY4LTQzMzItYjFjNy01ZWM2ZDAwMmUzODkiLCJleHAiOjE3NjI1OTY1MjB9.jJEb9vrhUnZhFg6CDObphO_TzuQ4v0r6bBBnUBasNhg',
  pragati: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZTc0MDI0ZS1mYjE0LTQ5NTAtYmMyMS04ZmY4ODA2NDU5ZjAiLCJleHAiOjE3NjI1OTY1MjB9.pa7KZTetkleCwenpiVkwDf1e_0NNwsJOO69SnWViNEY',
  nandini: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMjA0NzliYS03MzI1LTQ3NWEtYTM3Yy0xM2E5NWQyZWZhY2IiLCJleHAiOjE3NjI1OTY1MjB9.Sdf61ySS7Yh-ShqQ1WMAZaw8K15gpuT11wDxLh8nxCw',
};

// Mock user data
const MOCK_USERS = {
  dharun: {
    id: 'dharun-123',
    email: 'dharun@m2t-ai.com',
    name: 'Dharun',
    role: 'Employee',
    designation: 'Software Developer',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history']
  },
  sai_kumar: {
    id: 'sai_kumar-123',
    email: 'manager@m2t-ai.com',
    name: 'Sai Kumar',
    role: 'Manager',
    designation: 'Engineering Manager',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history', 'approve_team_leaves', 'view_team']
  },
  pragati: {
    id: 'pragati-123',
    email: 'pragati@m2t-ai.com',
    name: 'Pragati',
    role: 'Manager',
    designation: 'Manager',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history', 'approve_team_leaves', 'view_team']
  },
  nandini: {
    id: 'nandini-123',
    email: 'hr@m2t-ai.com',
    name: 'Nandini',
    role: 'HR',
    designation: 'HR Manager',
    permissions: ['apply_leave', 'view_own_balance', 'view_own_history', 'approve_team_leaves', 'view_team', 'manage_hr', 'manage_policies', 'view_all_leaves']
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============= AUTHENTICATION =============

export const mockLogin = async (email, role) => {
  // Find user by role
  let userKey = null;
  
  if (role === 'Employee') {
    userKey = 'dharun';
  } else if (role === 'Manager') {
    // Support both Sai Kumar and Pragati as managers
    if (email && email.includes('pragati')) {
      userKey = 'pragati';
    } else {
      userKey = 'sai_kumar';
    }
  } else if (role === 'HR') {
    userKey = 'nandini';
  }
  
  if (!userKey) {
    throw new Error('Invalid role');
  }
  
  const token = MOCK_TOKENS[userKey];
  const user = MOCK_USERS[userKey];
  
  // Store in localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Return response format matching real login
  return {
    access_token: token,
    token_type: 'bearer',
    user: user
  };
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ============= LEAVE TYPES =============

export const getLeaveTypes = async () => {
  try {
    const response = await api.get('/leave/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching leave types:', error);
    throw error;
  }
};

// ============= LEAVE BALANCE =============

export const getLeaveBalance = async () => {
  try {
    const response = await api.get('/leave/balance');
    return response.data;
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    throw error;
  }
};

// ============= LEAVE APPLICATIONS =============

export const applyLeave = async (data) => {
  try {
    const response = await api.post('/leave/apply', {
      leave_type_id: data.leaveTypeId,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason
    });
    return response.data;
  } catch (error) {
    console.error('Error applying leave:', error);
    throw error;
  }
};

export const getLeaveHistory = async () => {
  try {
    const response = await api.get('/leave/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching leave history:', error);
    throw error;
  }
};

// ============= APPROVALS =============

export const getPendingApprovals = async () => {
  try {
    const response = await api.get('/approvals/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

export const approveLeave = async (leaveId, remarks) => {
  try {
    const response = await api.put(`/approvals/approve/${leaveId}`, {
      remarks: remarks
    });
    return response.data;
  } catch (error) {
    console.error('Error approving leave:', error);
    throw error;
  }
};

export const rejectLeave = async (leaveId, remarks) => {
  try {
    const response = await api.put(`/approvals/reject/${leaveId}`, {
      remarks: remarks
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting leave:', error);
    throw error;
  }
};

// ============= NOTIFICATIONS =============

export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// ============= HR DASHBOARD =============

export const getHRStatistics = async () => {
  try {
    const response = await api.get('/hr/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching HR statistics:', error);
    throw error;
  }
};

export const getAllLeaves = async () => {
  try {
    const response = await api.get('/hr/all-leaves');
    return response.data;
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    throw error;
  }
};

export const getEmployeeBalances = async () => {
  try {
    const response = await api.get('/hr/employee-balances');
    return response.data;
  } catch (error) {
    console.error('Error fetching employee balances:', error);
    throw error;
  }
};

export const getAllEmployees = async () => {
  try {
    const response = await api.get('/hr/employees');
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export default api;
