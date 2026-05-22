import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Roadmap from './components/Roadmap';
import Settings from './components/Settings';
import AuthGate from './components/AuthGate';
import { syncUserDashboardToServer, fetchUserDashboardFromServer } from './services/api';
import { 
  Terminal, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Settings as SettingsIcon,
  Flame,
  Zap,
  LogOut
} from 'lucide-react';

const DEFAULT_HANDLES = {
  github: 'nishulmehta24',
  leetcode: 'leetcode',
  codeforces: 'tourist',
  codechef: 'admin'
};

const INITIAL_SHEETS = {
  "SDE Starter Kit": [
    { id: 'sde-1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'easy', completed: true },
    { id: 'sde-2', title: 'Valid Parentheses', url: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'easy', completed: true },
    { id: 'sde-3', title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'medium', completed: false },
    { id: 'sde-4', title: 'Reverse Linked List', url: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'easy', completed: false },
    { id: 'sde-5', title: 'Kth Largest Element in an Array', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'medium', completed: false },
    { id: 'sde-6', title: 'Longest Palindromic Substring', url: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'hard', completed: false }
  ],
  "LeetCode Top 75": [
    { id: 'lc75-1', title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', completed: false },
    { id: 'lc75-2', title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'easy', completed: true },
    { id: 'lc75-3', title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'medium', completed: false }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Track logged in user session (local storage persistence)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devpulse_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [handles, setHandles] = useState(() => {
    const saved = localStorage.getItem('devpulse_handles');
    return saved ? JSON.parse(saved) : DEFAULT_HANDLES;
  });

  const [sheets, setSheets] = useState(() => {
    const saved = localStorage.getItem('devpulse_sheets');
    return saved ? JSON.parse(saved) : INITIAL_SHEETS;
  });

  // Cursor glowing coordinates for ambient background glow following mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Automated Synchronization with MongoDB Atlas on modifications (for real authenticated accounts)
  useEffect(() => {
    localStorage.setItem('devpulse_handles', JSON.stringify(handles));
    if (user && !user.isGuest && user.token) {
      syncUserDashboardToServer(user.token, { handles });
    }
  }, [handles, user]);

  useEffect(() => {
    localStorage.setItem('devpulse_sheets', JSON.stringify(sheets));
    if (user && !user.isGuest && user.token) {
      syncUserDashboardToServer(user.token, { sheets });
    }
  }, [sheets, user]);

  const handleSaveHandles = (newHandles) => {
    setHandles(newHandles);
  };

  const handleAuthSuccess = async (userData, userHandles) => {
    setUser(userData);
    localStorage.setItem('devpulse_user', JSON.stringify(userData));

    if (userHandles) {
      setHandles(userHandles);
      localStorage.setItem('devpulse_handles', JSON.stringify(userHandles));
    }

    // Sync database data on successful login
    if (!userData.isGuest && userData.token) {
      try {
        const serverData = await fetchUserDashboardFromServer(userData.token);
        if (serverData && serverData.success) {
          if (serverData.handles) {
            setHandles(serverData.handles);
            localStorage.setItem('devpulse_handles', JSON.stringify(serverData.handles));
          }
          if (serverData.sheets && Object.keys(serverData.sheets).length > 0) {
            setSheets(serverData.sheets);
            localStorage.setItem('devpulse_sheets', JSON.stringify(serverData.sheets));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data from MongoDB Atlas server:", err);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of DevPulse?')) {
      setUser(null);
      localStorage.removeItem('devpulse_user');
      setHandles(DEFAULT_HANDLES);
      setSheets(INITIAL_SHEETS);
      localStorage.removeItem('devpulse_handles');
      localStorage.removeItem('devpulse_sheets');
      
      // Flush API cache keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
      
      setActiveTab('dashboard');
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard handles={handles} />;
      case 'calendar':
        return <Calendar />;
      case 'roadmap':
        return <Roadmap sheets={sheets} setSheets={setSheets} />;
      case 'settings':
        return <Settings handles={handles} onSaveHandles={handleSaveHandles} user={user} />;
      default:
        return <Dashboard handles={handles} />;
    }
  };

  // Auth Gate rendering (Gate overlay for unauthenticated users)
  if (!user) {
    return <AuthGate onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Ambient follow-cursor glow light */}
      <div style={{
        position: 'fixed',
        left: mousePos.x,
        top: mousePos.y,
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'blur(30px)',
        transition: 'left 0.1s ease-out, top 0.1s ease-out'
      }} />

      {/* 1. LEFT SIDEBAR */}
      <aside className="glass-container" style={{
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '30px 24px',
        borderRight: '1px solid var(--glass-border)',
        zIndex: 10,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        boxShadow: 'none'
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
            }} className="pulse-glow-element">
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }} className="grad-text">
                DevPulse
              </h1>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Profile Dashboard
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <Terminal size={18} /> Dashboard
            </button>
            
            <button 
              onClick={() => setActiveTab('calendar')} 
              className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
              style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <CalendarIcon size={18} /> Contest Calendar
            </button>
            
            <button 
              onClick={() => setActiveTab('roadmap')} 
              className={`nav-link ${activeTab === 'roadmap' ? 'active' : ''}`}
              style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <CheckSquare size={18} /> Roadmap checklist
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <SettingsIcon size={18} /> Settings & Backend
            </button>
          </nav>
        </div>

        {/* Sign Out Button & Developed by Nishul Credits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Project Owner
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Nishul Mehta</strong>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER PANEL */}
      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '40px 48px',
        minHeight: '100vh',
        zIndex: 5,
        position: 'relative',
        width: 'calc(100% - 260px)'
      }}>
        {renderActiveTab()}
      </main>

    </div>
  );
}
