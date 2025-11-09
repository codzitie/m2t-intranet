import React, { createContext, useState, useEffect, useContext } from 'react';
import { logout as apiLogout, getCurrentUser } from '../services/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // ✅ NEW: OTP-based login function
  const login = async (userData, accessToken) => {
    try {
      setLoading(true);
      setError(null);
      
      // Store in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setToken(accessToken);
      setIsAuthenticated(true);
      
      return { user: userData, access_token: accessToken };
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
      setToken(null);
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
    token,
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

// Custom Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
