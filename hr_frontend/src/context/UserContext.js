import React, { createContext, useState, useEffect, useContext } from 'react';
import { logout as apiLogout, getCurrentUser } from '../services/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user asynchronously on mount by calling backend getCurrentUser()
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const currentUser = await getCurrentUser();
          if (currentUser && currentUser.id) {
            setUser(currentUser);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Could not get user details, reset auth
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Failed to load user data');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Login function stores user and token
const login = async (userData, accessToken) => {
  try {
    console.log("Login userData:", userData); // Add log here to inspect
    setLoading(true);
    setError(null);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
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

  // Logout clears state and localStorage
  const logout = () => {
    try {
      apiLogout();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Check if user has specific permission
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

// Custom hook for consuming user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
