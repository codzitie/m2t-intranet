import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (step === 2 && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email: email.trim().toLowerCase() });
      setSuccess(response.data.message);
      setStep(2);
      setOtpTimer(300);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/verify-reset-otp`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      setSuccess(response.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword
      });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
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
      fontFamily: 'system-ui,-apple-system,sans-serif',
      background: 'linear-gradient(120deg, #e5ecfa 0%, #e1f3fe 100%)'
    }}>
      {/* Top Bar */}
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
      </nav>
      {/* Center Card */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.98)', borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(62,160,251,0.13), 0 8px 24px rgba(201,209,221,0.18)',
          border: '1.5px solid #e7cfe9',
          padding: '48px 40px 44px 40px',
          minWidth: '370px', maxWidth: '420px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '55px', height: '55px', marginBottom: '13px', borderRadius: '13px', background: 'linear-gradient(135deg,#fad2e1,#cbe3ff)', boxShadow: '0 3px 11px #dadcff' }} />
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '27px', fontWeight: '900', color: '#31456f', letterSpacing: '-.5px' }}>
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify Code'}
              {step === 3 && 'Reset Password'}
            </div>
            <div style={{ color: '#97bde2', marginTop: '7px', fontSize: '15px', fontWeight: '600' }}>
              {step === 1 && 'Enter your email to receive a reset code'}
              {step === 2 && `A 6-digit code was sent to ${email}`}
              {step === 3 && 'Create your new password'}
            </div>
          </div>
          {error && (
            <div style={{
              width: '95%', maxWidth: '340px', background: '#fedbe8', border: '1.2px solid #ddaac2',
              color: '#961a3e', borderRadius: '11px', padding: '12px 14px', margin: '11px auto 0',
              fontSize: '13px', fontWeight: '600', textAlign: 'center'
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              width: '95%', maxWidth: '340px', background: '#d1fae5', border: '1.2px solid #6ee7b7',
              color: '#17675f', borderRadius: '11px', padding: '11px 13px', margin: '13px auto 0',
              fontSize: '13px', fontWeight: '600', textAlign: 'center'
            }}>{success}</div>
          )}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} style={{ width: '100%' }}>
              <label style={{
                fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: ".7px"
              }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px 14px',
                  border: '1.2px solid #b7c5ff',
                  borderRadius: '10px',
                  background: '#ebf6fc',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '24px',
                  color: "#6d4153"
                }}
              />
              <button
                type="submit"
                disabled={loading || !email}
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
                  transition: 'all 0.2s'
                }}
              >{loading ? 'Sending...' : 'Send Reset Code'}</button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
              <label style={{
                fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px'
              }}>Verification Code</label>
              <input
                type="text"
                value={otp}
                autoFocus
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px 14px',
                  border: '1.2px solid #b7c5ff',
                  borderRadius: '10px',
                  background: '#ebf6fc',
                  fontSize: '22px',
                  letterSpacing: '12px',
                  textAlign: 'center',
                  outline: 'none',
                  marginBottom: '24px',
                  color: "#417ee7"
                }}
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  height: '46px',
                  border: 'none',
                  borderRadius: '11px',
                  background: otp.length !== 6 ? '#fce3ed' : 'linear-gradient(90deg,#e17fa1,#6ef9f2)',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: otp.length !== 6 ? 'not-allowed' : 'pointer',
                  boxShadow: otp.length === 6 ? '0 8px 22px #dbeefe' : 'none',
                  transition: 'all 0.2s'
                }}
              >{loading ? 'Verifying...' : 'Verify Code'}</button>
              <div style={{ marginTop: '10px', textAlign: 'center', color: '#91aadf', fontWeight: '600', fontSize: '13.5px' }}>
                {otpTimer > 0 ? `⏱ Code expires in ${formatTime(otpTimer)}` : <span style={{ color: '#e16374' }}>⚠️ Code expired</span>}
              </div>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                disabled={loading}
                style={{
                  marginTop: '12px',
                  background: '#6b7280',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >Back</button>
            </form>
          )}
          {step === 3 && (
            <form onSubmit={handleResetPassword} style={{ width: '100%' }}>
              <label style={{
                fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px'
              }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px 14px',
                  border: '1.2px solid #b7c5ff',
                  borderRadius: '10px',
                  background: '#ebf6fc',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '16px',
                  color: "#775166"
                }}
              />
              <label style={{
                fontSize: '12.5px', fontWeight: '800', color: '#3171a7', textTransform: 'uppercase', display: 'block', marginBottom: '8px'
              }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px 14px',
                  border: '1.2px solid #b7c5ff',
                  borderRadius: '10px',
                  background: '#ebf6fc',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '24px',
                  color: "#795162"
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '46px',
                  border: 'none',
                  borderRadius: '11px',
                  background: 'linear-gradient(90deg, #e17fa1, #6ef9f2)',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 22px #dbeefe',
                  transition: 'all 0.2s'
                }}
              >{loading ? 'Resetting...' : 'Reset Password'}</button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                disabled={loading}
                style={{
                  marginTop: '12px',
                  background: '#6b7280',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >Back</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
