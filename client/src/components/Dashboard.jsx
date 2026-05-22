import React, { useState, useEffect } from 'react';
import { 
  fetchGithubProfile, 
  fetchCodeforcesProfile, 
  fetchLeetcodeProfile,
  fetchCodechefProfile,
  fetchRealHeatmap
} from '../services/api';
import { generateMockHeatmap, generateMockRatingHistory } from '../services/mockData';
import { 
  Code2, 
  Award, 
  Zap, 
  GitCommit, 
  Flame, 
  ChevronRight, 
  ExternalLink,
  Info
} from 'lucide-react';

export default function Dashboard({ handles }) {
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState([]);
  const [activeChartTab, setActiveChartTab] = useState('codeforces');
  const [ratingHistory, setRatingHistory] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Fetch all user profiles
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const data = {};
      
      data.github = await fetchGithubProfile(handles.github);
      data.codeforces = await fetchCodeforcesProfile(handles.codeforces);
      data.leetcode = await fetchLeetcodeProfile(handles.leetcode);
      
      // CodeChef via backend proxy (real data with fallback)
      data.codechef = await fetchCodechefProfile(handles.codechef);

      setProfiles(data);

      // Fetch real heatmap from GitHub events + LeetCode calendar
      const realHeatmap = await fetchRealHeatmap(handles.github, handles.leetcode);
      const hasRealActivity = realHeatmap.some(d => d.count > 0);
      setHeatmap(hasRealActivity ? realHeatmap : generateMockHeatmap());
      
      const activeProfile = data[activeChartTab];
      if (activeProfile && Array.isArray(activeProfile.contestHistory) && activeProfile.contestHistory.length > 0) {
        setRatingHistory(activeProfile.contestHistory);
      } else {
        setRatingHistory(generateMockRatingHistory(activeChartTab));
      }
      
      setLoading(false);
    }
    
    loadDashboardData();
  }, [handles.github, handles.leetcode, handles.codeforces, handles.codechef]);

  // Load rating history when chart platform changes or profiles are updated
  useEffect(() => {
    const activeProfile = profiles[activeChartTab];
    if (activeProfile && Array.isArray(activeProfile.contestHistory) && activeProfile.contestHistory.length > 0) {
      setRatingHistory(activeProfile.contestHistory);
    } else {
      setRatingHistory(generateMockRatingHistory(activeChartTab));
    }
    setSelectedPoint(null);
  }, [activeChartTab, profiles]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(139, 92, 246, 0.2)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Assembling developer metrics...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Calculate aggregates
  const totalSolved = (profiles.leetcode?.solvedTotal || 0) + 
                      (profiles.codeforces?.solvedTotal || 0) + 
                      (profiles.codechef?.solvedTotal || 0);
  const maxRating = Math.max(
    profiles.codeforces?.rating || 0,
    profiles.leetcode?.rating || 0,
    profiles.codechef?.rating || 0
  );
  const totalCommits = profiles.github?.totalCommits || 0;
  const bestStreak = Math.max(
    profiles.github?.activeStreak || 0,
    profiles.leetcode?.activeStreak || 0,
    profiles.codeforces?.activeStreak || 0,
    profiles.codechef?.activeStreak || 0
  );

  // SVG Heatmap Grid parameters
  const renderHeatmap = () => {
    if (!heatmap.length) return null;
    
    // Group heatmap into 53 weeks (columns) x 7 days (rows)
    const weeks = [];
    let currentWeek = [];
    
    heatmap.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === heatmap.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const getGlowClass = (count) => {
      if (count === 0) return 'rgba(255, 255, 255, 0.03)';
      if (count <= 2) return 'rgba(139, 92, 246, 0.25)';
      if (count <= 5) return 'rgba(139, 92, 246, 0.5)';
      if (count <= 8) return 'rgba(139, 92, 246, 0.75)';
      return '#8b5cf6'; // highest activity
    };

    return (
      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '3px', minWidth: '720px' }}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: getGlowClass(day.count),
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    border: '1px solid rgba(255, 255, 255, 0.02)'
                  }}
                  title={`${day.count} active contributions on ${day.date}`}
                  className="heatmap-cell"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Custom Interactive SVG Line Chart builder
  const renderRatingChart = () => {
    if (!ratingHistory.length) return null;

    const width = 800;
    const height = 260;
    const padding = 45;

    // Synthesize starting baseline for 1-contest profiles to render a beautiful slope line
    let displayHistory = [...ratingHistory];
    if (displayHistory.length === 1) {
      const platformBaseRating = activeChartTab === 'leetcode' ? 1500 : 1200;
      displayHistory.unshift({
        contestName: 'Initial Rating',
        date: 'Start',
        rating: platformBaseRating,
        rank: '-'
      });
    }

    const ratings = displayHistory.map(d => d.rating);
    const minRating = Math.min(...ratings) - 80;
    const maxRatingVal = Math.max(...ratings) + 80;

    const divisorX = displayHistory.length > 1 ? displayHistory.length - 1 : 1;
    const getX = (index) => padding + (index / divisorX) * (width - padding * 2);

    const ratingDiff = maxRatingVal - minRating;
    const getY = (rating) => {
      if (ratingDiff === 0) return height / 2;
      return height - padding - ((rating - minRating) / ratingDiff) * (height - padding * 2);
    };

    // Build the SVG Path string
    let pathData = '';
    displayHistory.forEach((point, idx) => {
      const x = getX(idx);
      const y = getY(point.rating);
      if (idx === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        // Curve calculation (smooth cubic bezier approximation)
        const prevX = getX(idx - 1);
        const prevY = getY(displayHistory[idx - 1].rating);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) / 2;
        const cpY2 = y;
        pathData += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });

    // Build area fill path
    const fillPathData = `${pathData} L ${getX(displayHistory.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    const getPlatformColor = () => {
      if (activeChartTab === 'leetcode') return 'var(--brand-leetcode)';
      if (activeChartTab === 'codeforces') return 'var(--brand-codeforces)';
      return 'var(--brand-codechef)';
    };

    const getPlatformGlow = () => {
      if (activeChartTab === 'leetcode') return 'rgba(245, 158, 11, 0.15)';
      if (activeChartTab === 'codeforces') return 'rgba(59, 130, 246, 0.15)';
      return 'rgba(244, 63, 94, 0.15)';
    };

    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getPlatformColor()} stopOpacity="0.3" />
              <stop offset="100%" stopColor={getPlatformColor()} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yVal = minRating + ratio * (maxRatingVal - minRating);
            const yPos = getY(yVal);
            return (
              <g key={idx}>
                <line 
                  x1={padding} 
                  y1={yPos} 
                  x2={width - padding} 
                  y2={yPos} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text 
                  x={padding - 8} 
                  y={yPos + 4} 
                  fill="var(--text-muted)" 
                  fontSize="11" 
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {displayHistory.map((point, idx) => {
            if (idx % 2 !== 0 && displayHistory.length > 5) return null; // alternate to avoid overcrowding on long lists
            return (
              <text 
                key={idx}
                x={getX(idx)} 
                y={height - padding + 20} 
                fill="var(--text-muted)" 
                fontSize="11" 
                textAnchor="middle"
                fontFamily="var(--font-sans)"
              >
                {point.date}
              </text>
            );
          })}

          {/* Area fill under curve */}
          <path d={fillPathData} fill="url(#chartGradient)" />

          {/* Curve Line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke={getPlatformColor()} 
            strokeWidth="3.5" 
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0px 4px 10px ${getPlatformGlow()})` }}
          />

          {/* Interactive dots */}
          {displayHistory.map((point, idx) => {
            const x = getX(idx);
            const y = getY(point.rating);
            const isSelected = selectedPoint && selectedPoint.index === idx;

            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={isSelected ? 7 : 4}
                fill={isSelected ? '#ffffff' : getPlatformColor()}
                stroke={isSelected ? getPlatformColor() : '#0a0a0f'}
                strokeWidth={isSelected ? 3 : 1.5}
                style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                onMouseEnter={() => setSelectedPoint({ ...point, index: idx, x, y })}
                onClick={() => setSelectedPoint({ ...point, index: idx, x, y })}
              />
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {selectedPoint && (
          <div style={{
            position: 'absolute',
            left: `${(selectedPoint.x / width) * 100}%`,
            top: `${(selectedPoint.y / height) * 100 - 85}%`,
            transform: 'translateX(-50%)',
            background: 'var(--bg-tertiary)',
            border: `1.5px solid ${getPlatformColor()}`,
            padding: '8px 12px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10,
            pointerEvents: 'none',
            minWidth: '140px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedPoint.contestName}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {selectedPoint.rating}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>Rating</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Rank: <span style={{ color: getPlatformColor(), fontWeight: 700 }}>#{selectedPoint.rank}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeProfile = profiles[activeChartTab];
  const isRealData = activeProfile && 
                     Array.isArray(activeProfile.contestHistory) && 
                     activeProfile.contestHistory.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. AGGREGATED STATS PANEL */}
      <div className="glass-container" style={{ borderRadius: '20px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
        <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', marginBottom: '8px' }}>
            <Award size={20} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Rating</p>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{maxRating || 'N/A'}</h3>
        </div>
        <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-leetcode)', marginBottom: '8px' }}>
            <Code2 size={20} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problems Solved</p>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{totalSolved}</h3>
        </div>
        <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-github)', marginBottom: '8px' }}>
            <GitCommit size={20} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GitHub Commits</p>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{totalCommits || 'N/A'}</h3>
        </div>
        <div style={{ padding: '8px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--brand-codechef)', marginBottom: '8px' }}>
            <Flame size={20} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Streak</p>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{bestStreak} Days</h3>
        </div>
      </div>

      {/* 2. PLATFORMS DETAILED TILES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={18} color="var(--accent-purple)" /> Platforms Overview</h2>
        
        <div className="dashboard-grid">
          {/* GitHub Card */}
          <div className="glass-card card-github" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--brand-github)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                </div>
                <a href={profiles.github?.profileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }} className="platform-link-icon">
                  <ExternalLink size={16} />
                </a>
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '4px' }}>GitHub</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>@{profiles.github?.handle}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>
                {profiles.github?.bio}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Repos</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.github?.publicRepos || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Followers</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.github?.followers || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Stars</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.github?.starsReceived || 0}</strong>
              </div>
            </div>
          </div>

          {/* LeetCode Card */}
          <div className="glass-card card-leetcode" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--brand-leetcode)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={22} />
                </div>
                <a href={profiles.leetcode?.profileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <ExternalLink size={16} />
                </a>
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '4px' }}>LeetCode</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>@{profiles.leetcode?.handle}</p>
              
              {/* LeetCode stats breakdown */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.8)' }} title={`Easy: ${profiles.leetcode?.solvedEasy}`} />
                <div style={{ flex: 1.5, height: '4px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.8)' }} title={`Medium: ${profiles.leetcode?.solvedMedium}`} />
                <div style={{ flex: 0.5, height: '4px', borderRadius: '2px', background: 'rgba(244, 63, 94, 0.8)' }} title={`Hard: ${profiles.leetcode?.solvedHard}`} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Acceptance: <span style={{ color: 'var(--brand-leetcode)', fontWeight: 600 }}>{profiles.leetcode?.acceptanceRate || '0%'}</span>
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Solved</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.leetcode?.solvedTotal || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Rank</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>#{profiles.leetcode?.globalRank?.toLocaleString() || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Rating</span>
                <strong style={{ fontSize: '15px', color: 'var(--brand-leetcode)', fontFamily: 'var(--font-mono)' }}>{profiles.leetcode?.rating || 0}</strong>
              </div>
            </div>
          </div>

          {/* Codeforces Card */}
          <div className="glass-card card-codeforces" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-codeforces)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} />
                </div>
                <a href={profiles.codeforces?.profileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <ExternalLink size={16} />
                </a>
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '4px' }}>Codeforces</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>@{profiles.codeforces?.handle}</p>
              
              <div style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '11px', color: 'var(--brand-codeforces)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profiles.codeforces?.rank || 'Unrated'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Solved</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.codeforces?.solvedTotal || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Rating</span>
                <strong style={{ fontSize: '15px', color: 'var(--brand-codeforces)', fontFamily: 'var(--font-mono)' }}>{profiles.codeforces?.rating || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Contrib</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.codeforces?.contribution || 0}</strong>
              </div>
            </div>
          </div>

          {/* CodeChef Card */}
          <div className="glass-card card-codechef" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--brand-codechef)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} />
                </div>
                <a href={profiles.codechef?.profileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <ExternalLink size={16} />
                </a>
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '4px' }}>CodeChef</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>@{profiles.codechef?.handle}</p>
              
              <div style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '11px', color: 'var(--brand-codechef)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profiles.codechef?.stars || 'N/A'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Solved</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{profiles.codechef?.solvedTotal || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Rating</span>
                <strong style={{ fontSize: '15px', color: 'var(--brand-codechef)', fontFamily: 'var(--font-mono)' }}>{profiles.codechef?.rating || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Global Rank</span>
                <strong style={{ fontSize: '15px', color: '#fff', fontFamily: 'var(--font-mono)' }}>#{profiles.codechef?.globalRank?.toLocaleString() || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MERGED CONTRIBUTIONS HEATMAP */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '4px' }}>Unified Coding Streak Calendar</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aggregates commits on GitHub and submissions on LeetCode/Codeforces over the past year.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', alignItems: 'center' }}>
            <span>Less</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '1.5px', background: 'rgba(255,255,255,0.03)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '1.5px', background: 'rgba(139, 92, 246, 0.3)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '1.5px', background: 'rgba(139, 92, 246, 0.6)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '1.5px', background: 'rgba(139, 92, 246, 0.9)' }}></div>
            <span>More</span>
          </div>
        </div>
        {renderHeatmap()}
      </div>

      {/* 4. RATING DEVELOPMENT ANALYTICS (SVG CHART) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>Rating Analytics Timeline</h3>
              {isRealData ? (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  color: '#34d399', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                  Live Data
                </span>
              ) : (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  background: 'rgba(139, 92, 246, 0.15)', 
                  border: '1px solid rgba(139, 92, 246, 0.3)', 
                  color: '#a78bfa', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }}></span>
                  Demo Simulator
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
              Track rating velocity and growth trends from official contests.
            </p>
          </div>
          <div className="glass-container" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px' }}>
            {['codeforces', 'leetcode', 'codechef'].map(plat => (
              <button
                key={plat}
                onClick={() => setActiveChartTab(plat)}
                style={{
                  background: activeChartTab === plat ? 'var(--bg-tertiary)' : 'transparent',
                  border: 'none',
                  color: activeChartTab === plat ? '#fff' : 'var(--text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                {plat === 'codeforces' ? 'Codeforces' : plat === 'leetcode' ? 'LeetCode' : 'CodeChef'}
              </button>
            ))}
          </div>
        </div>
        {renderRatingChart()}
      </div>

    </div>
  );
}
