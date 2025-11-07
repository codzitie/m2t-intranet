import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { TimesheetProvider } from "./context/TimesheetContext";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import LeaveDashboard from "./components/LeaveDashboard";
import LeaveCalendar from "./components/LeaveCalendar";
import LoginPage from './components/LoginPage';
import RoleSwitcher from "./components/RoleSwitcher";
import TimesheetDashboard from "./components/timesheet/TimesheetDashboard";


function PlaceholderPage({ title }) {
  return (
    <div style={{ textAlign: "center", padding: "80px", fontSize: "22px" }}>
      <h2>{title}</h2>
      <p>Content for {title} will appear here soon.</p>
    </div>
  );
}


// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", fontSize: "18px", color: "#666" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function AppRoutes() {
  const { isAuthenticated } = useUser();

  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      {/* Show Header only if authenticated */}
      {isAuthenticated && <Header />}
      
      <Routes>
        {/* Login Route - Always accessible */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leave" 
          element={
            <ProtectedRoute>
              <LeaveDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leave/calendar" 
          element={
            <ProtectedRoute>
              <LeaveCalendar />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute>
              <TimesheetDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/policy" 
          element={
            <ProtectedRoute>
              <PlaceholderPage title="HR Policy Repository" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/security" 
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Security & Access" />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Role Switcher for Testing */}
      {isAuthenticated && <RoleSwitcher />}
    </div>
  );
}


function App() {
  return (
    <UserProvider>
      {/* ✅ WRAP WITH TIMESHEET PROVIDER */}
      <TimesheetProvider>
        <Router>
          <AppRoutes />
        </Router>
      </TimesheetProvider>
    </UserProvider>
  );
}


export default App;
