import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";

function PlaceholderPage({ title }) {
  return (
    <div style={{ textAlign: "center", padding: "80px", fontSize: "22px" }}>
      <h2>{title}</h2>
      <p>Content for {title} will appear here soon.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/attendance" element={<PlaceholderPage title="Attendance & Daily Timesheet System" />} />
          <Route path="/leave" element={<PlaceholderPage title="Leave Application & Approval System" />} />
          <Route path="/policy" element={<PlaceholderPage title="HR Policy Repository" />} />
          <Route path="/security" element={<PlaceholderPage title="Security & Access" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
