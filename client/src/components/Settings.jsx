import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Code2, 
  Award, 
  Server, 
  Database,
  CloudLightning,
  RefreshCw,
  Save,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Settings({ handles, onSaveHandles, user }) {
  // Input fields state
  const [github, setGithub] = useState(handles.github || '');
  const [leetcode, setLeetcode] = useState(handles.leetcode || '');
  const [codeforces, setCodeforces] = useState(handles.codeforces || '');
  const [codechef, setCodechef] = useState(handles.codechef || '');

  // Backend Integration state
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('devpulse_server_url') || 'http://localhost:5000/api';
  });
  const [serverConnected, setServerConnected] = useState(false);
  const [checkingServer, setCheckingServer] = useState(false);

  // Success indicator
  const [successMsg, setSuccessMsg] = useState(false);

  // Health-check server on mount or serverUrl change
  useEffect(() => {
    checkServerConnection();
  }, [serverUrl]);

  const checkServerConnection = async () => {
    if (!serverUrl) {
      setServerConnected(false);
      return;
    }
    setCheckingServer(true);
    try {
      // Ping standard server health endpoint
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
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
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveHandles({ github, leetcode, codeforces, codechef });
    localStorage.setItem('devpulse_server_url', serverUrl);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleResetCache = () => {
    if (confirm('Clear local profile caches? This will re-fetch data from live APIs.')) {
      // Find all cache entries in localStorage and delete
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
      alert('Local API caches cleared successfully!');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      
      {/* 1. PROFILE HANDLES SECTION */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={18} color="var(--accent-purple)" /> Manage Platform Handles
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Input usernames to sync live stats. Clear caching to update instantly.</p>
          </div>

          {/* GitHub Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-github)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg> GitHub Handle
            </label>
            <input
              type="text"
              className="glow-input"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="e.g. torvalds"
            />
          </div>

          {/* LeetCode Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-leetcode)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code2 size={14} /> LeetCode Handle
            </label>
            <input
              type="text"
              className="glow-input"
              value={leetcode}
              onChange={(e) => setLeetcode(e.target.value)}
              placeholder="e.g. alex_mercer"
            />
          </div>

          {/* Codeforces Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-codeforces)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} /> Codeforces Handle
            </label>
            <input
              type="text"
              className="glow-input"
              value={codeforces}
              onChange={(e) => setCodeforces(e.target.value)}
              placeholder="e.g. tourist"
            />
          </div>

          {/* CodeChef Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-codechef)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} /> CodeChef Handle
            </label>
            <input
              type="text"
              className="glow-input"
              value={codechef}
              onChange={(e) => setCodechef(e.target.value)}
              placeholder="e.g. chef_alex"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Save size={16} /> Save Handles
            </button>
            
            <button
              type="button"
              onClick={handleResetCache}
              className="btn-primary"
              style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                boxShadow: 'none'
              }}
              title="Clear Local Cache"
            >
              <RefreshCw size={15} /> Clear Cache
            </button>
          </div>

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-github)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px', animation: 'fadeIn 0.2s' }}>
              <CheckCircle size={16} /> Handles and config saved! Live metrics re-loaded.
            </div>
          )}
        </div>
      </form>

      {/* 2. MERN BACKEND DB CONNECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* User Session Profile Card */}
        {user && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-purple)' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> Active Session
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Details of the currently authenticated developer session.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Username:</span>
                <strong style={{ fontSize: '13px', color: '#fff' }}>{user.username}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email:</span>
                <strong style={{ fontSize: '13px', color: '#fff' }}>{user.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sync Mode:</span>
                {user.isGuest ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--brand-github)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textTransform: 'uppercase'
                  }}>
                    Guest Recruiter
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: 'var(--accent-purple)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)'
                  }}>
                    Atlas Sync Active
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--accent-purple)" /> MERN Integration Sync
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Connect to your Express API server and sync profiles to MongoDB.</p>
          </div>

          {/* Server status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: serverConnected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', border: `1px dashed ${serverConnected ? 'rgba(16, 185, 129, 0.2)' : 'var(--glass-border)'}` }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Database size={15} /> Database Server
            </span>
            {checkingServer ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>checking...</span>
            ) : serverConnected ? (
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-github)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● Connected
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-codechef)', textTransform: 'uppercase' }}>
                Offline Fallback Active
              </span>
            )}
          </div>

          {/* Backend Connection Endpoint URL input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Express Server Base URL</label>
            <input
              type="text"
              className="glow-input"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000/api"
            />
          </div>

          {/* Explain Monorepo Sync Benefit for Hireability */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.1)', fontSize: '12px', lineHeight: '145%', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <CloudLightning size={13} /> Full-Stack Capability Demonstration
            </strong>
            When you run the Express/Node backend locally (in the <code>/server</code> directory), this dashboard pings it dynamically. If connected, it connects user sessions and enables MongoDB sync protocols, proving your database-tier capabilities to senior engineering interviewers.
          </div>

          <button
            type="button"
            onClick={checkServerConnection}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              boxShadow: 'none'
            }}
          >
            Refresh Server Connection
          </button>
        </div>

        {/* Caching & Platform tips */}
        <div className="glass-card" style={{ padding: '20px', fontSize: '12px', lineHeight: '145%', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={14} color="var(--accent-purple)" /> Developer Advice
          </h4>
          <p>
            This profile tracker implements an aggressive <strong>30-minute API Caching</strong> protocol using the browser's <code>localStorage</code>.
          </p>
          <p>
            This avoids hitting rate limits on public GitHub and Codeforces endpoints (which are highly restrictive for static clients). If you change your handle and want to inspect updates immediately, click the <strong>"Clear Cache"</strong> button.
          </p>
        </div>
      </div>

    </div>
  );
}
