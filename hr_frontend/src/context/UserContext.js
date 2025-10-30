import React, { createContext, useState, useContext, useEffect } from 'react';
import { LeaveService } from '../services/mockLeaveService';

// Create the context
const UserContext = createContext();

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate SSO login on app load
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        // In real app, this would validate SSO token
        const response = await LeaveService.getCurrentUser();
        
        if (response.success) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, []);

  // Helper function to check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // In real app, clear SSO session
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    hasPermission,
    hasRole,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
