import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  
  const [email, setEmail] = useState('dharun@m2t-ai.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('Employee');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await login(email, password, selectedRole);
      navigate('/leave');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    let email = '';
    
    if (role === 'Employee') {
      email = 'dharun@m2t-ai.com';
    } else if (role === 'Manager') {
      email = 'manager@m2t-ai.com';
    } else if (role === 'HR') {
      email = 'hr@m2t-ai.com';
    }
    
    try {
      setIsLoading(true);
      setError('');
      await login(email, 'password123', role);
      navigate('/leave');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const boxStyle = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '420px'
  };

  const titleStyle = {
    textAlign: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  };

  const subtitleStyle = {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px'
  };

  const errorStyle = {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '12px',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: '14px'
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif'
  };

  const roleOptionsStyle = {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  };

  const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const radioInputStyle = {
    marginRight: '8px',
    cursor: 'pointer'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background 0.3s'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  const quickLoginStyle = {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee'
  };

  const quickLoginTitleStyle = {
    textAlign: 'center',
    color: '#666',
    fontSize: '12px',
    marginBottom: '10px',
    fontWeight: '600',
    textTransform: 'uppercase'
  };

  const quickButtonsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const quickButtonStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.3s',
    fontFamily: 'Arial, sans-serif'
  };

  const infoBoxStyle = {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '20px',
    fontSize: '13px'
  };

  const infoTitleStyle = {
    margin: '0 0 10px 0',
    color: '#333',
    fontWeight: '600'
  };

  const infoParagraphStyle = {
    margin: '5px 0',
    color: '#555'
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <div style={titleStyle}>HR Portal</div>
        <div style={subtitleStyle}>Leave Management System</div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              style={inputStyle}
            />
          </div>

          {/* Password Input */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              style={inputStyle}
            />
          </div>

          {/* Role Selection */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Select Role</label>
            <div style={roleOptionsStyle}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="role"
                  value="Employee"
                  checked={selectedRole === 'Employee'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                  style={radioInputStyle}
                />
                Employee
              </label>

              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="role"
                  value="Manager"
                  checked={selectedRole === 'Manager'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                  style={radioInputStyle}
                />
                Manager
              </label>

              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="role"
                  value="HR"
                  checked={selectedRole === 'HR'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                  style={radioInputStyle}
                />
                HR
              </label>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={isLoading ? disabledButtonStyle : buttonStyle}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#4CAF50';
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick Login Buttons */}
        <div style={quickLoginStyle}>
          <div style={quickLoginTitleStyle}>Quick Login for Testing:</div>
          <div style={quickButtonsContainerStyle}>
            <button
              type="button"
              onClick={() => handleQuickLogin('Employee')}
              disabled={isLoading}
              style={quickButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
            >
              👤 Employee (Dharun)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Manager')}
              disabled={isLoading}
              style={quickButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
            >
              👨‍💼 Manager (Sai Kumar)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('HR')}
              disabled={isLoading}
              style={quickButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
            >
              👩‍💼 HR (Nandini)
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div style={infoBoxStyle}>
          <div style={infoTitleStyle}>ℹ️ Demo Credentials:</div>
          <div style={infoParagraphStyle}><strong>Email:</strong> Any email works</div>
          <div style={infoParagraphStyle}><strong>Password:</strong> Any password works</div>
          <div style={infoParagraphStyle}><strong>Role:</strong> Select from above</div>
          <div style={{...infoParagraphStyle, fontSize: '11px', marginTop: '8px', color: '#666'}}>
            Mock login for development. Real auth will be added later.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
