import React from "react";

function HomePage() {
  const containerStyle = {
    textAlign: "center",
    padding: "100px 20px",
    backgroundColor: "white",
  };

  const titleStyle = {
    fontSize: "36px",
    fontWeight: "600",
    color: "#004aad",
    marginBottom: "20px",
  };

  const subtitleStyle = {
    fontSize: "20px",
    color: "#333",
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Welcome to M2T HR Portal</h1>
      <p style={subtitleStyle}>
        Manage your attendance, leaves, and HR policies efficiently through a secure and modern intranet platform.
      </p>
    </div>
  );
}

export default HomePage;
