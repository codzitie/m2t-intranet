import React from "react";
import { Link } from "react-router-dom";

function Header() {
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
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "500",
    transition: "color 0.3s ease",
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
      </nav>
    </header>
  );
}

export default Header;
