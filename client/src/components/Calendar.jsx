import React, { useState, useEffect } from 'react';
import { fetchUpcomingContests } from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  Share2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

// Live ticking Countdown component
function Countdown({ startTime, duration }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState('upcoming'); // upcoming, live, finished

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      
      if (now > end) {
        setTimeLeft('Finished');
        setStatus('finished');
        clearInterval(interval);
      } else if (now >= start && now <= end) {
        setTimeLeft('LIVE NOW');
        setStatus('live');
      } else {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let str = '';
        if (days > 0) str += `${days}d `;
        str += `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        
        setTimeLeft(str);
        setStatus('upcoming');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  if (status === 'live') {
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        color: 'var(--brand-codechef)', 
        fontWeight: 700, 
        fontSize: '13px',
        animation: 'pulse-text 2s infinite'
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-codechef)' }}></span>
        LIVE NOW
        <style>{`
          @keyframes pulse-text { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `}</style>
      </span>
    );
  }

  if (status === 'finished') {
    return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Finished</span>;
  }

  return (
    <span style={{ color: 'var(--accent-purple)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Clock size={14} /> Starts in: {timeLeft}
    </span>
  );
}

export default function Calendar() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');

  useEffect(() => {
    async function loadContests() {
      setLoading(true);
      const data = await fetchUpcomingContests();
      setContests(data);
      setLoading(false);
    }
    loadContests();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(139, 92, 246, 0.2)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Syncing competitive schedules...</p>
      </div>
    );
  }

  // Google Calendar Integration Link Builder
  const getGoogleCalendarLink = (contest) => {
    const start = new Date(contest.startTime);
    const end = new Date(start.getTime() + contest.duration * 1000);
    
    const formatTime = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const text = encodeURIComponent(contest.name);
    const dates = `${formatTime(start)}/${formatTime(end)}`;
    const details = encodeURIComponent(`Coding contest hosted on ${contest.platform}. Direct link: ${contest.url}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
  };

  const getPlatformColors = (platform) => {
    switch (platform) {
      case 'codeforces': return { glow: 'rgba(59, 130, 246, 0.1)', text: 'var(--brand-codeforces)' };
      case 'leetcode': return { glow: 'rgba(245, 158, 11, 0.1)', text: 'var(--brand-leetcode)' };
      case 'codechef': return { glow: 'rgba(244, 63, 94, 0.1)', text: 'var(--brand-codechef)' };
      default: return { glow: 'rgba(16, 185, 129, 0.1)', text: 'var(--brand-github)' };
    }
  };

  // Filter logic
  const filteredContests = contests.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. FILTER HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={22} color="var(--accent-purple)" /> CP Contests Calendar
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plan, register, and sync upcoming contests directly to your calendar.</p>
        </div>

        {/* Search & Platforms filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '520px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Search contest name..."
              className="glow-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          
          <select
            className="glow-input"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            style={{ width: '140px', cursor: 'pointer' }}
          >
            <option value="all">All Platforms</option>
            <option value="codeforces">Codeforces</option>
            <option value="leetcode">LeetCode</option>
            <option value="codechef">CodeChef</option>
            <option value="atcoder">AtCoder</option>
          </select>
        </div>
      </div>

      {/* 2. CONTESTS TILES LIST */}
      {filteredContests.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>No upcoming contests match your filters.</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search queries or selecting another platform filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          {filteredContests.map((c) => {
            const colors = getPlatformColors(c.platform);
            const formattedStart = new Date(c.startTime).toLocaleString('default', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const durationMins = Math.round(c.duration / 60);
            const durationStr = durationMins >= 60 
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? (durationMins % 60) + 'm' : ''}` 
              : `${durationMins}m`;

            return (
              <div 
                key={c.id} 
                className="glass-card" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '20px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${colors.text}`
                }}
              >
                {/* Contest Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      background: colors.glow, 
                      color: colors.text, 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em' 
                    }}>
                      {c.platform}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration: {durationStr}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', color: '#fff', fontWeight: 700 }}>{c.name}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Start: <strong>{formattedStart}</strong></span>
                  </div>
                </div>

                {/* Countdown & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <Countdown startTime={c.startTime} duration={c.duration} />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={getGoogleCalendarLink(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        boxShadow: 'none'
                      }}
                      title="Add to Google Calendar"
                    >
                      <Share2 size={13} /> Sync
                    </a>
                    
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      Register <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
