import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const timesheetService = {
  // ============= CREATE/UPDATE TIMESHEET =============
  
  createTimesheet: async (token, timesheetData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timesheets/`,
        timesheetData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET MONTH TIMESHEETS =============
  
  getMonthTimesheets: async (token, year, month) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/month/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET TIMESHEET STATS =============
  
  getTimesheetStats: async (token, year, month) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/stats/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET EMPLOYEE TIMESHEETS (Manager/HR) =============
  
  getEmployeeTimesheets: async (token, employeeId, year, month) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/employee/${employeeId}/month/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET TEAM TIMESHEETS (Manager Only) =============
  
  getTeamTimesheets: async (token, year, month) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/team/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= ✅ GET TODAY STATUS FOR ALL EMPLOYEES (HR Only) =============
  
  getTodayStatusAllEmployees: async (token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/hr/today-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= REQUEST UNLOCK =============
  
  requestUnlock: async (token, requestData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timesheets/unlock-request`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET PENDING UNLOCK REQUESTS (HR) =============
  
  getPendingUnlockRequests: async (token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/unlock-requests/pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= APPROVE/REJECT UNLOCK =============
  
  approveUnlockRequest: async (token, requestId, approvalData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/timesheets/unlock-requests/${requestId}`,
        approvalData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= GET HR DASHBOARD =============
  
  getHRDashboard: async (token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/hr/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ============= ACTIVITY TRACKER APIs =============

  createActivity: async (token, activityData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timesheets/activities`,
        activityData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getActivitiesByDate: async (token, date) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timesheets/activities/${date}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateActivity: async (token, activityId, activityData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/timesheets/activities/${activityId}`,
        activityData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteActivity: async (token, activityId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/timesheets/activities/${activityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default timesheetService;
