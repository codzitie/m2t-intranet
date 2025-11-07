import React, { createContext, useState, useCallback } from 'react';
import timesheetService from '../services/timesheetService';

export const TimesheetContext = createContext();

export const TimesheetProvider = ({ children }) => {
  const [timesheetData, setTimesheetData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch month timesheets
  const fetchMonthTimesheets = useCallback(async (token, year, month) => {
    setLoading(true);
    setError(null);
    try {
      const data = await timesheetService.getMonthTimesheets(token, year, month);
      setTimesheetData(data);
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to fetch timesheets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async (token, year, month) => {
    setLoading(true);
    setError(null);
    try {
      const data = await timesheetService.getTimesheetStats(token, year, month);
      setStats(data);
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create timesheet
  const createTimesheet = useCallback(async (token, timesheetData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await timesheetService.createTimesheet(token, timesheetData);
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to create timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request unlock
  const requestUnlock = useCallback(async (token, requestData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await timesheetService.requestUnlock(token, requestData);
      return data;
    } catch (err) {
      setError(err.detail || 'Failed to request unlock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    timesheetData,
    stats,
    loading,
    error,
    fetchMonthTimesheets,
    fetchStats,
    createTimesheet,
    requestUnlock,
  };

  return (
    <TimesheetContext.Provider value={value}>
      {children}
    </TimesheetContext.Provider>
  );
};

export const useTimesheet = () => {
  const context = React.useContext(TimesheetContext);
  if (!context) {
    throw new Error('useTimesheet must be used within TimesheetProvider');
  }
  return context;
};
