import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  HelpCircle,
  Database,
  CloudLightning,
  AlertTriangle
} from 'lucide-react';

export default function AuthGate({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Server connectivity health check
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('devpulse_server_url') || 'http://localhost:5000/api';
  });
  const [serverConnected, setServerConnected] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);

  // Ping database server on mount
  useEffect(() => {
    async function checkServer() {
      setCheckingServer(true);
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(`${serverUrl}/status`, { signal: controller.signal });
        clearTimeout(id);
        
        if (res.ok) {
          setServerConnected(true);
        } else {
          setServerConnected(false);
        }
      } catch (err) {
        setServerConnected(false);
      } finally {
        setCheckingServer(false);
      }
    }
    checkServer();
  }, [serverUrl]);

  // Form validations
  const validateForm = () => {
    if (!email) return 'Email is required';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    
    if (!isLogin) {
      if (!username) return 'Username is required';
      if (password !== confirmPassword) return 'Passwords do not match';
    }
    return '';
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    // Connect to server auth endpoints
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { username, email, password };

    try {
      if (!serverConnected) {
        throw new Error('Database server is currently offline. Please explore using Guest Recruiter Mode or verify your local backend server is running.');
      }

      const res = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Login success
      onAuthSuccess({
        username: data.username,
        email: data.email,
        token: data.token,
        isGuest: false
      }, data.handles);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Guest Recruiter Bypass Mode
  const handleGuestExplore = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate guest log-in and preload Nishul's profiles
      onAuthSuccess({
        username: 'RecruiterGuest',
        email: 'guest@recruiter.com',
        token: 'guest_token_bypass_2026',
        isGuest: true
      }, {
        github: 'nishulmehta24',
        leetcode: 'leetcode',
        codeforces: 'tourist',
        codechef: 'admin'
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 50%, #0d0c15 0%, #07060b 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative cyber glows */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 60%)',
        top: '-10%',
        left: '-10%',
        zIndex: 0,
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.02) 0%, transparent 60%)',
        bottom: '-10%',
        right: '-10%',
        zIndex: 0,
        filter: 'blur(40px)'
      }} />

      {/* Main card */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Header Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '8px', color: '#fff' }} className="grad-text">
            DevPulse
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Unified Developer Profile Aggregator & CP Contests Gate
          </p>
        </div>

        {/* Server status alert */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          background: checkingServer 
            ? 'rgba(255,255,255,0.02)' 
            : serverConnected 
              ? 'rgba(16, 185, 129, 0.05)' 
              : 'rgba(239, 68, 68, 0.05)',
          border: `1px dashed ${
            checkingServer 
              ? 'var(--glass-border)' 
              : serverConnected 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)'
          }`,
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Database size={13} /> Status:
          </span>
          {checkingServer ? (
            <span style={{ color: 'var(--text-muted)' }}>checking connection...</span>
          ) : serverConnected ? (
            <span style={{ color: 'var(--brand-github)', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Atlas Server Online
            </span>
          ) : (
            <span style={{ color: 'var(--brand-codechef)', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚠️ Offline Mode Active
            </span>
          )}
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          padding: '4px',
          position: 'relative'
        }}>
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              background: isLogin ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              background: !isLogin ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Register
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Username (Register only) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={13} /> Username
              </label>
              <input
                type="text"
                className="glow-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                required
              />
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} /> Email Address
            </label>
            <input
              type="email"
              className="glow-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} /> Password
            </label>
            <input
              type="password"
              className="glow-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} /> Confirm Password
              </label>
              <input
                type="password"
                className="glow-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          )}

          {/* Alert Error Box */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontSize: '12px',
              lineHeight: '140%',
              animation: 'fadeIn 0.2s'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : (
              <>
                {isLogin ? 'Sign In to Dashboard' : 'Create Real Account'} <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Recruiter Guest Bypass CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px', marginTop: '4px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Recruiter checking this portfolio? Skip credentials to view live stats:
          </p>
          <button 
            onClick={handleGuestExplore}
            disabled={loading}
            className="pulse-glow-element"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--brand-github)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.05)',
              transition: 'var(--transition-fast)'
            }}
            title="Preloads Nishul's coding stats & fallbacks"
          >
            <CloudLightning size={14} /> Explore as Guest Recruiter
          </button>
        </div>

      </div>
    </div>
  );
}
