import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const API_URL = 'http://localhost:8000/api/auth';

export default function LoginPage() {
  const { login, isAuthenticated } = useUser();

  // Login
  const [email, setEmail] = useState('dharun@m2t-ai.com');
  const [password, setPassword] = useState('password123');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpEmail, setOtpEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPwd, setFpNewPwd] = useState('');
  const [fpConfirmPwd, setFpConfirmPwd] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [fpOtpTimer, setFpOtpTimer] = useState(300);
  const [fpCanResend, setFpCanResend] = useState(false);

  useEffect(() => {
    if (isAuthenticated) window.location = '/leave';
  }, [isAuthenticated]);

  // OTP Login timers
  const startOtpTimer = () => {
    setOtpTimer(300);
    setCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };
  // Forgot password OTP timer
  useEffect(() => {
    if (showForgot && fpStep === 2 && fpOtpTimer > 0) {
      const timer = setInterval(() => {
        setFpOtpTimer(prev => {
          if (prev <= 1) { clearInterval(timer); setFpCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showForgot, fpStep, fpOtpTimer]);

  // Login handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login-otp`, {
        email: email.trim(),
        password
      });
      if (response.data.requires_otp) {
        setOtpEmail(response.data.email);
        setShowOtpInput(true);
        setOtp(['', '', '', '', '', '']);
        setOtpTimer(300);
        setCanResend(false);
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
      await login(response.data.user, response.data.access_token);
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

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
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

  // Forgot password handlers
  const handleFpRequestOtp = async e => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');
    setFpLoading(true);
    try {
      await axios.post(`${API_URL}/forgot-password`, { email: fpEmail.trim().toLowerCase() });
      setFpStep(2);
      setFpOtpTimer(300);
      setFpCanResend(false);
      setFpOtp('');
      setFpSuccess('A reset code was sent to your email. Please check!');
    } catch (err) {
      setFpError(err.response?.data?.detail || 'Failed to send reset code');
    } finally { setFpLoading(false); }
  };

  const handleFpVerifyOtp = async e => {
    e.preventDefault();
    setFpError('');
    setFpLoading(true);
    try {
      await axios.post(`${API_URL}/verify-reset-otp`, {
        email: fpEmail.trim().toLowerCase(),
        otp: fpOtp.trim()
      });
      setFpStep(3);
      setFpSuccess('OTP verified! Please set your new password.');
    } catch (err) {
      setFpError(err.response?.data?.detail || 'Invalid OTP code');
    } finally { setFpLoading(false); }
  };

  const handleFpResetPwd = async e => {
    e.preventDefault();
    setFpError('');
    if (fpNewPwd.length < 8) { setFpError('Password must be at least 8 characters long'); return; }
    if (fpNewPwd !== fpConfirmPwd) { setFpError('Passwords do not match'); return; }
    setFpLoading(true);
    try {
      await axios.post(`${API_URL}/reset-password`, {
        email: fpEmail.trim().toLowerCase(),
        otp: fpOtp.trim(),
        new_password: fpNewPwd
      });
      setFpSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => { setShowForgot(false); setFpStep(1); }, 2000);
    } catch (err) {
      setFpError(err.response?.data?.detail || 'Failed to reset password');
    } finally { setFpLoading(false); }
  };

  // UI Rendering
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Topbar */}
      <nav style={{
        width: '100%', height: '62px',
        background: 'linear-gradient(90deg, #c75060 0%, #3580b9 100%)',
        boxShadow: '0 2px 8px rgba(60, 50, 100, 0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '38px', width: '38px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }} />
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>M2T HR Portal</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(255,255,255,0.13)', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.17)', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.95)'
        }}>
          <span style={{ width: '7px', height: '7px', background: '#5ef1f2', borderRadius: '50%', boxShadow: '0 0 8px #86b5ee' }} />
          System Online
        </div>
      </nav>

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: show image as background w/cover style, deep red+blue blend overlay */}
        <div style={{
          flex: 1.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px', minWidth: '380px',
          background: `linear-gradient(125deg, rgba(215,64,91,0.65) 0%, rgba(86,222,251,0.53) 100%), url('/image.jpg') center center/cover no-repeat`
        }}>
          <div style={{
            zIndex: 2, position: 'relative', maxWidth: '580px',
            background: 'rgba(36, 36, 80, 0.65)', padding: '54px 52px',
            borderRadius: '28px', boxShadow: '0 20px 80px rgba(60,50,100,0.30)', border: '1px solid rgba(199,80,96,0.23)', backdropFilter: 'blur(4.5px)'
          }}>
            <div style={{ fontSize: '44px', lineHeight: '1.13', color: '#fafbff', fontWeight: '900', margin: 0, letterSpacing: "-2px" }}>
              Welcome to <span style={{
                background: 'linear-gradient(120deg, #b7c5ff, #cbe3ff, #e17fa1)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>M2T HR Portal</span>
            </div>
            <div style={{ fontSize: '18px', color: '#eaddfd', marginTop: '24px', lineHeight: '1.7', fontWeight: '500' }}>
              Manage your workday with futuristic ease—mark attendance, submit timesheets, stay networked with your team.
              <br /><br /><strong style={{ color: '#f9b6d5' }}>Built for you.<span style={{ color: '#7edafd' }}> Secured for everyone.</span></strong>
            </div>
          </div>
        </div>

        {/* Right Panel - login and forgot password views */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(120deg, #e5ecfa 0%, #e1f3fe 100%)', padding: '24px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.98)', borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(62,160,251,0.13), 0 8px 24px rgba(201,209,221,0.18)',
            border: '1.5px solid #e7cfe9', padding: '48px 40px 44px 40px', minWidth: '390px', maxWidth: '450px', width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '58px', height: '58px', marginBottom: '14px', borderRadius: '13px', background: 'linear-gradient(135deg,#fad2e1,#cbe3ff)', boxShadow: '0 3px 11px #dadcff' }} />
            {!showForgot ? (
              <>
                {/* Login form or OTP */}
                {!showOtpInput ? (
                  <>
                    <div style={{ width: '100%', margin: '20px 0 0 0', fontSize: '27px', textAlign: 'center', color: '#304157', fontWeight: '900', letterSpacing: '-.5px' }}>Welcome back</div>
                    <div style={{ color: '#93afd5', marginTop: '9px', fontSize: '15px', fontWeight: '600', textAlign: 'center' }}>Sign in to your account</div>
                    {error && (
                      <div style={{
                        width: '95%', maxWidth: '340px', background: '#fedbe8', border: '1.2px solid #ddaac2',
                        color: '#ab295e', borderRadius: '12px', padding: '12px 14px', margin: '15px auto 0',
                        fontSize: '13px', fontWeight: '600'
                      }}>{error}</div>
                    )}
                    <form onSubmit={handleLogin} style={{
                      width: '100%', maxWidth: '340px', display: 'grid', gap: '16px', margin: '23px auto 0'
                    }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '800', color: '#4883c2', textTransform: 'uppercase', letterSpacing: '0.7px'}}>Email</label>
                        <input type="email" value={email}
                          onChange={e => setEmail(e.target.value)} required placeholder="you@m2t-ai.com" disabled={loading}
                          style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.3px solid #91c8f7',
                            borderRadius: '10px', background: '#ebf6fc', fontSize: '15px', outline: 'none', transition: 'all 0.2s', color: '#304157' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '800', color: '#4883c2', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Password</label>
                        <input type="password" value={password}
                          onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" disabled={loading}
                          style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.3px solid #91c8f7',
                            borderRadius: '10px', background: '#ebf6fc', fontSize: '15px', outline: 'none', transition: 'all 0.2s', color: '#304157' }}
                        />
                      </div>
                      <div style={{ width: '100%', textAlign: 'right', marginTop: '4px', marginBottom: '8px' }}>
                        <span onClick={() => setShowForgot(true)} style={{ color: '#c83e75', fontWeight: 700, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                          Forgot password?
                        </span>
                      </div>
                      <button type="submit" disabled={loading || !email || !password}
                        style={{
                          width: '100%',
                          height: '46px',
                          border: 'none',
                          borderRadius: '11px',
                          background: loading ? '#e8b7c7' : 'linear-gradient(93deg,#c9437d,#5ed2e3)',
                          color: '#fff',
                          fontWeight: '900',
                          fontSize: '16px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 8px 22px #e2e9f3',
                          marginTop: '10px',
                          opacity: loading ? 0.6 : 1
                        }}>
                        {loading ? 'Sending OTP...' : 'Sign In'}
                      </button>
                    </form>
                  </>
                ) : (
                  // OTP Verification...
                  <>
                    <div style={{
                      width: '100%', margin: '20px 0 0 0', fontSize: '27px', textAlign: 'center',
                      color: '#304157', fontWeight: '900'
                    }}>Enter Verification Code</div>
                    <div style={{
                      color: '#95b9fa', marginTop: '9px', fontSize: '15px',
                      fontWeight: '600', textAlign: 'center'
                    }}>We sent a 6-digit code to<br /><strong style={{color: "#37659d"}}>{otpEmail}</strong></div>
                    {error && (
                      <div style={{
                        width: '95%', maxWidth: '340px', background: '#fedbe8', border: '1.2px solid #ddaac2',
                        color: '#ab295e', borderRadius: '12px', padding: '12px 14px', margin: '15px auto 0',
                        fontSize: '13px', fontWeight: '600'
                      }}>{error}</div>
                    )}
                    <div style={{
                      display: 'flex', gap: '10px', justifyContent: 'center', margin: '27px 0 17px 0'
                    }}>
                      {otp.map((digit, index) => (
                        <input key={index}
                          id={`otp-${index}`} type="text" maxLength="1" value={digit}
                          onChange={e => handleOtpChange(index, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(index, e)}
                          disabled={loading}
                          autoFocus={index === 0}
                          style={{
                            width: '46px', height: '51px', textAlign: 'center', fontSize: '23px', fontWeight: '700',
                            border: '1.7px solid #c2caff', borderRadius: '9px', background: '#def4ff', color: '#b64e75',
                            outline: 'none', transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{
                      textAlign: 'center', fontSize: '14px', color: '#a4caf7', fontWeight: '600', marginTop: '6px'
                    }}>
                      {otpTimer > 0 ? <>⏱ Code expires in {formatTime(otpTimer)}</> : <span style={{ color: '#e16374' }}>⚠️ Code expired</span>}
                    </div>
                    <button onClick={handleVerifyOtp}
                      disabled={loading || otp.join('').length !== 6}
                      style={{
                        width: '100%', height: '46px', border: 'none', borderRadius: '10px',
                        background: otp.join('').length !== 6 ? '#fce3ed' : 'linear-gradient(90deg,#e17fa1,#6ef9f2)',
                        color: '#fff', fontWeight: '900', fontSize: '16px',
                        cursor: otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
                        marginTop: '9px', opacity: otp.join('').length !== 6 ? 0.6 : 1,
                        boxShadow: otp.join('').length === 6 ? '0 8px 22px #dbeefe' : 'none'
                      }}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    {canResend && (
                      <button onClick={handleResendOtp} disabled={loading} style={{
                        width: '100%', height: '44px', border: 'none', borderRadius: '10px',
                        background: 'linear-gradient(90deg, #e17fa1, #6ef9f2)', color: '#fff',
                        fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '10px'
                      }}>Resend OTP</button>
                    )}
                    <button
                      onClick={() => { setShowOtpInput(false); setOtp(['', '', '', '', '', '']); setError(''); }}
                      disabled={loading}
                      style={{
                        width: '100%', height: '42px', border: 'none', borderRadius: '10px', background: '#7db2bf',
                        color: '#fff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', marginTop: '10px'
                      }}>← Back to Login</button>
                  </>
                )}
            </>
            ) : (
              // ---- FORGOT PASSWORD 3-STEP FLOW IN-PANEL ----
              <>
                <div style={{
                  width: '100%', margin: '20px 0 0 0', fontSize: '27px',
                  textAlign: 'center', color: '#31456f', fontWeight: '900'
                }}>
                  Forgot Password
                </div>
                <div style={{ color: '#97bde2', marginTop: '7px', fontSize: '15px', fontWeight: '600', textAlign: 'center' }}>
                  {fpStep === 1 && "Enter your email to receive a reset code"}
                  {fpStep === 2 && `A 6-digit code was sent to ${fpEmail}`}
                  {fpStep === 3 && "Create your new password"}
                </div>
                {fpError && <div style={{ width: '96%', maxWidth: '340px', background: '#fedbe8', border: '1.2px solid #ddaac2', color: '#961a3e', borderRadius: '11px', padding: '12px 14px', margin: '14px auto 0', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>{fpError}</div>}
                {fpSuccess && <div style={{ width: '96%', maxWidth: '340px', background: '#d1fae5', border: '1.2px solid #6ee7b7', color: '#17675f', borderRadius: '11px', padding: '11px 13px', margin: '13px auto 0', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>{fpSuccess}</div>}
                {fpStep === 1 && (
                  <form onSubmit={handleFpRequestOtp} style={{ width: '100%' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: ".7px" }}>Email Address</label>
                    <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required disabled={fpLoading} placeholder="your@email.com"
                      style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.2px solid #b7c5ff', borderRadius: '10px', background: '#ebf6fc', fontSize: '15px', outline: 'none', marginBottom: '24px', color: "#6d4153" }} />
                    <button type="submit" disabled={fpLoading || !fpEmail}
                      style={{
                        width: '100%', height: '46px', border: 'none', borderRadius: '11px',
                        background: fpLoading ? '#e8b7c7' : 'linear-gradient(93deg,#c9437d,#5ed2e3)', color: '#fff',
                        fontWeight: '900', fontSize: '16px', cursor: fpLoading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 22px #e2e9f3', transition: 'all 0.2s'
                      }}>{fpLoading ? 'Sending...' : 'Send Reset Code'}</button>
                  </form>
                )}
                {fpStep === 2 && (
                  <form onSubmit={handleFpVerifyOtp} style={{ width: '100%' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Verification Code</label>
                    <input type="text" value={fpOtp} autoFocus onChange={e => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required disabled={fpLoading}
                      style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.2px solid #b7c5ff', borderRadius: '10px', background: '#ebf6fc', fontSize: '22px', letterSpacing: '12px', textAlign: 'center', outline: 'none', marginBottom: '24px', color: "#417ee7" }} />
                    <button type="submit" disabled={fpLoading || fpOtp.length !== 6}
                      style={{
                        width: '100%', height: '46px', border: 'none', borderRadius: '11px',
                        background: fpOtp.length !== 6 ? '#fce3ed' : 'linear-gradient(90deg,#e17fa1,#6ef9f2)',
                        color: '#fff', fontWeight: '900', fontSize: '16px', cursor: fpOtp.length !== 6 ? 'not-allowed' : 'pointer', boxShadow: fpOtp.length === 6 ? '0 8px 22px #dbeefe' : 'none', transition: 'all 0.2s'
                      }}>{fpLoading ? 'Verifying...' : 'Verify Code'}</button>
                    <div style={{ marginTop: '10px', textAlign: 'center', color: '#91aadf', fontWeight: '600', fontSize: '13.5px' }}>
                      {fpOtpTimer > 0 ? `⏱ Code expires in ${formatTime(fpOtpTimer)}` : <span style={{ color: '#e16374' }}>⚠️ Code expired</span>}
                    </div>
                    <button type="button" onClick={() => setFpStep(1)} disabled={fpLoading}
                      style={{ marginTop: '12px', background: '#6b7280', color: '#fff', fontWeight: '900', fontSize: '14px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>Back</button>
                  </form>
                )}
                {fpStep === 3 && (
                  <form onSubmit={handleFpResetPwd} style={{ width: '100%' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>New Password</label>
                    <input type="password" value={fpNewPwd} onChange={e => setFpNewPwd(e.target.value)} required disabled={fpLoading} placeholder="Enter new password"
                      style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.2px solid #b7c5ff', borderRadius: '10px', background: '#ebf6fc', fontSize: '15px', outline: 'none', marginBottom: '16px', color: "#775166" }} />
                    <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Confirm Password</label>
                    <input type="password" value={fpConfirmPwd} onChange={e => setFpConfirmPwd(e.target.value)} required disabled={fpLoading} placeholder="Confirm new password"
                      style={{ width: '100%', height: '44px', padding: '12px 14px', border: '1.2px solid #b7c5ff', borderRadius: '10px', background: '#ebf6fc', fontSize: '15px', outline: 'none', marginBottom: '24px', color: "#795162" }} />
                    <button type="submit" disabled={fpLoading}
                      style={{
                        width: '100%', height: '46px', border: 'none', borderRadius: '11px',
                        background: 'linear-gradient(90deg, #e17fa1, #6ef9f2)', color: '#fff', fontWeight: '900', fontSize: '16px',
                        cursor: fpLoading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 22px #dbeefe', transition: 'all 0.2s'
                      }}>{fpLoading ? 'Resetting...' : 'Reset Password'}</button>
                    <button type="button" onClick={() => setFpStep(1)} disabled={fpLoading}
                      style={{ marginTop: '12px', background: '#6b7280', color: '#fff', fontWeight: '900', fontSize: '14px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>Back</button>
                  </form>
                )}
                <button onClick={() => setShowForgot(false)} style={{ marginTop: '15px', color: '#c83e75', background: 'none', border: 'none', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: '15px' }}>Back to login</button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
