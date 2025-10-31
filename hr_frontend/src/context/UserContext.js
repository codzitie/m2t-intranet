import React, { createContext, useState, useEffect, useContext } from 'react';
import { mockLogin, logout as apiLogout, getCurrentUser } from '../services/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Mock login function
  const login = async (email, password, role) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call mock login from api.js
      const response = await mockLogin(email, role);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      apiLogout();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    hasPermission
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// ============= CUSTOM HOOK =============

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
