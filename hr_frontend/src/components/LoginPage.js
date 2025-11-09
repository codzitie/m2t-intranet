import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const API_URL = 'http://localhost:8000/api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
  
  const [email, setEmail] = useState('dharun@m2t-ai.com');
  const [password, setPassword] = useState('password123');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpEmail, setOtpEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/leave', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login-otp`, {
        email: email.trim(),
        password: password
      });
      if (response.data.requires_otp) {
        setOtpEmail(response.data.email);
        setShowOtpInput(true);
        startOtpTimer();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email: otpEmail,
        otp: otpCode
      });
      
      // ✅ Use context login
      await login(response.data.user, response.data.access_token);
      
      // Navigate will happen automatically via useEffect
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/resend-otp`, { email: otpEmail });
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(300);
      setCanResend(false);
      startOtpTimer();
      document.getElementById('otp-0')?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startOtpTimer = () => {
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Topbar */}
      <nav style={{
        width: '100%',
        height: '62px',
        background: 'linear-gradient(90deg, #2563eb 60%, #6366f1 100%)',
        boxShadow: '0 2px 8px rgba(30, 91, 184, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/logo192.png" alt="Logo" style={{
            height: '38px',
            width: '38px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }} />
          <span style={{
            fontSize: '18px',
            fontWeight: '900',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>M2T HR Portal</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: '12px',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.95)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            background: '#4ade80',
            borderRadius: '50%',
            boxShadow: '0 0 8px #4ade80'
          }} />
          System Online
        </div>
      </nav>

      {/* Main Layout */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{
          flex: 1.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #1a2951 0%, #1f3a5f 50%, #0f2744 100%)',
          position: 'relative',
          padding: '24px',
          minWidth: '380px'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(ellipse 80% 60% at 25% 20%, #6366f1 0%, transparent 85%),
              radial-gradient(ellipse 60% 50% at 85% 75%, #38bdf8 0%, transparent 75%)
            `,
            opacity: 0.15
          }} />
          <div style={{
            zIndex: 2,
            position: 'relative',
            maxWidth: '580px',
            background: 'rgba(16, 24, 37, 0.82)',
            padding: '56px 52px',
            borderRadius: '32px',
            boxShadow: '0 20px 80px rgba(0,0,0,0.35)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{
              fontSize: '48px',
              lineHeight: '1.1',
              color: '#fff',
              fontWeight: '900',
              margin: 0
            }}>
              Welcome to <span style={{
                background: 'linear-gradient(120deg, #a5b4fc, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>M2T HR Portal</span>
            </div>
            <div style={{
              fontSize: '18px',
              color: '#e0e7ffb7',
              marginTop: '24px',
              lineHeight: '1.7',
              fontWeight: '500'
            }}>
              Manage your workday with ease—mark attendance, submit timesheets, stay connected with your team.
              <br /><br />
              <strong style={{ color: '#a5b4fc' }}>Built for you. Secured for everyone.</strong>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f5f7fb 0%, #f0f3ff 100%)',
          padding: '24px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.94)',
            borderRadius: '28px',
            boxShadow: '0 20px 60px rgba(37,99,235,0.18), 0 8px 24px rgba(30,41,59,0.08)',
            border: '1.5px solid rgba(224,231,246,0.8)',
            padding: '56px 52px 48px 52px',
            minWidth: '380px',
            maxWidth: '480px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img src="/logo192.png" alt="Logo" style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(37,99,235,0.2)',
              background: 'linear-gradient(135deg, #f0f4ff, #f5f7fb)'
            }} />

            {!showOtpInput ? (
              <>
                <div style={{
                  width: '100%',
                  margin: '26px 0 0 0',
                  fontSize: '28px',
                  textAlign: 'center',
                  color: '#101825',
                  fontWeight: '900'
                }}>Welcome back</div>
                <div style={{
                  color: '#94a3b8',
                  marginTop: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>Sign in to your account</div>

                {error && (
                  <div style={{
                    width: '96%',
                    maxWidth: '360px',
                    background: '#fef2f2',
                    border: '1.2px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    margin: '16px auto 0',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>{error}</div>
                )}

                <form onSubmit={handleLogin} style={{
                  width: '100%',
                  maxWidth: '360px',
                  display: 'grid',
                  gap: '16px',
                  margin: '28px auto 0'
                }}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#334155',
                      textTransform: 'uppercase'
                    }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@m2t-ai.com"
                      disabled={loading}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '12px 14px',
                        border: '1.2px solid #dedfea',
                        borderRadius: '12px',
                        background: '#f8f9fc',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#dedfea';
                        e.target.style.background = '#f8f9fc';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#334155',
                      textTransform: 'uppercase'
                    }}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      disabled={loading}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '12px 14px',
                        border: '1.2px solid #dedfea',
                        borderRadius: '12px',
                        background: '#f8f9fc',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#dedfea';
                        e.target.style.background = '#f8f9fc';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    style={{
                      width: '100%',
                      height: '48px',
                      border: 'none',
                      borderRadius: '12px',
                      background: loading ? '#a5b4fc' : 'linear-gradient(90deg, #2563eb, #6366f1)',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 12px 32px rgba(37,99,235,0.28)',
                      transition: 'all 0.2s',
                      marginTop: '10px',
                      opacity: loading ? 0.55 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                  >
                    {loading ? 'Sending OTP...' : 'Sign In'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{
                  width: '100%',
                  margin: '26px 0 0 0',
                  fontSize: '28px',
                  textAlign: 'center',
                  color: '#101825',
                  fontWeight: '900'
                }}>Enter Verification Code</div>
                <div style={{
                  color: '#94a3b8',
                  marginTop: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  We sent a 6-digit code to<br />
                  <strong>{otpEmail}</strong>
                </div>

                {error && (
                  <div style={{
                    width: '96%',
                    maxWidth: '360px',
                    background: '#fef2f2',
                    border: '1.2px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    margin: '16px auto 0',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>{error}</div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  margin: '28px 0 16px 0'
                }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      autoFocus={index === 0}
                      style={{
                        width: '50px',
                        height: '56px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: '700',
                        border: '2px solid #dedfea',
                        borderRadius: '12px',
                        background: '#f8f9fc',
                        color: '#101825',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#dedfea';
                        e.target.style.background = '#f8f9fc';
                        e.target.style.boxShadow = 'none';
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  ))}
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  marginTop: '12px'
                }}>
                  {otpTimer > 0 ? (
                    <>⏱ Code expires in {formatTime(otpTimer)}</>
                  ) : (
                    <span style={{ color: '#ef4444' }}>⚠️ Code expired</span>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  style={{
                    width: '100%',
                    height: '48px',
                    border: 'none',
                    borderRadius: '12px',
                    background: otp.join('').length !== 6 ? '#a5b4fc' : 'linear-gradient(90deg, #2563eb, #6366f1)',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
                    marginTop: '10px',
                    opacity: otp.join('').length !== 6 ? 0.55 : 1,
                    boxShadow: otp.join('').length === 6 ? '0 12px 32px rgba(37,99,235,0.28)' : 'none'
                  }}
                  onMouseEnter={(e) => otp.join('').length === 6 && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => otp.join('').length === 6 && (e.target.style.transform = 'translateY(0)')}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                {canResend && (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '48px',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(90deg, #2563eb, #6366f1)',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    Resend OTP
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    border: 'none',
                    borderRadius: '12px',
                    background: '#6b7280',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  ← Back to Login
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
