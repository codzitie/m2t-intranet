import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Import useUser hook
import Notifications from './Notifications';

function Header() {
  const { user, isAuthenticated, logout } = useUser(); // Get user info

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    backgroundColor: "#004aad",
    color: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const navStyle = {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "500",
    transition: "color 0.3s ease",
  };

  const userInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  };

  const userNameStyle = {
    fontSize: "14px",
    fontWeight: "400",
  };

  const logoutButtonStyle = {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid white",
    padding: "6px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  };

  return (
    <header style={headerStyle}>
      <h1 style={{ margin: 0 }}>M2T HR Portal</h1>
      <nav style={navStyle}>
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/attendance" style={linkStyle}>Attendance & Daily Timesheet</Link>
        <Link to="/leave" style={linkStyle}>Leave Application & Approval</Link>
        <Link to="/policy" style={linkStyle}>HR Policy Repository</Link>
        <Link to="/security" style={linkStyle}>Security & Access</Link>
        
        {/* User Info Section */}
        {isAuthenticated && user && (
          <div style={userInfoStyle}>
            <Notifications />
            <span style={userNameStyle}>
              👤 {user.name} ({user.role})
            </span>
            <button 
              style={logoutButtonStyle}
              onClick={logout}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#004aad";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "white";
              }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
