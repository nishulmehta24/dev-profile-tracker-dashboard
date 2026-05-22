import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  FolderPlus, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

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

export default function Roadmap({ sheets = {}, setSheets }) {
  const [activeSheet, setActiveSheet] = useState(Object.keys(sheets)[0] || "SDE Starter Kit");
  
  // Custom form state
  const [newSheetName, setNewSheetName] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  
  const [problemTitle, setProblemTitle] = useState('');
  const [problemUrl, setProblemUrl] = useState('');
  const [problemDiff, setProblemDiff] = useState('medium');

  // Keep activeSheet in sync with keys in case activeSheet was deleted or replaced on login
  useEffect(() => {
    const keys = Object.keys(sheets);
    if (keys.length > 0 && !keys.includes(activeSheet)) {
      setActiveSheet(keys[0]);
    }
  }, [sheets, activeSheet]);

  // Calculations
  const currentProblems = sheets[activeSheet] || [];
  const completedCount = currentProblems.filter(p => p.completed).length;
  const totalCount = currentProblems.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle problem completion
  const toggleProblem = (id) => {
    setSheets(prev => {
      const updatedList = prev[activeSheet].map(p => 
        p.id === id ? { ...p, completed: !p.completed } : p
      );
      return { ...prev, [activeSheet]: updatedList };
    });
  };

  // Add new problem item
  const handleAddProblem = (e) => {
    e.preventDefault();
    if (!problemTitle) return;

    const newItem = {
      id: `${activeSheet.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      title: problemTitle,
      url: problemUrl || '#',
      difficulty: problemDiff,
      completed: false
    };

    setSheets(prev => ({
      ...prev,
      [activeSheet]: [...prev[activeSheet], newItem]
    }));

    setProblemTitle('');
    setProblemUrl('');
    setProblemDiff('medium');
  };

  // Delete problem item
  const handleDeleteProblem = (id) => {
    setSheets(prev => ({
      ...prev,
      [activeSheet]: prev[activeSheet].filter(p => p.id !== id)
    }));
  };

  // Create new custom sheet
  const handleCreateSheet = (e) => {
    e.preventDefault();
    if (!newSheetName || sheets[newSheetName]) return;

    setSheets(prev => ({
      ...prev,
      [newSheetName]: []
    }));

    setActiveSheet(newSheetName);
    setNewSheetName('');
    setShowAddSheet(false);
  };

  // Delete entire sheet
  const handleDeleteSheet = () => {
    if (confirm(`Are you sure you want to delete the entire roadmap list "${activeSheet}"?`)) {
      setSheets(prev => {
        const copy = { ...prev };
        delete copy[activeSheet];
        return copy;
      });
      const remaining = Object.keys(sheets).filter(k => k !== activeSheet);
      setActiveSheet(remaining[0] || '');
    }
  };

  const getDiffColor = (diff) => {
    if (diff === 'easy') return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (diff === 'medium') return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
  };

  // SVG Circular Progress logic
  const renderProgressCircle = () => {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            stroke="rgba(255, 255, 255, 0.04)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="var(--accent-purple)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>{percentComplete}%</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Done</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
      
      {/* 1. LEFT SIDEBAR: SHEETS MENU */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roadmaps List</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.keys(sheets).map(sheet => (
              <button
                key={sheet}
                onClick={() => setActiveSheet(sheet)}
                className={`nav-link ${activeSheet === sheet ? 'active' : ''}`}
                style={{
                  background: activeSheet === sheet ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <BookOpen size={15} style={{ color: activeSheet === sheet ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sheet}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddSheet(prev => !prev)}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--glass-border)',
              color: '#fff',
              boxShadow: 'none'
            }}
          >
            <FolderPlus size={14} /> Add Roadmap
          </button>

          {showAddSheet && (
            <form onSubmit={handleCreateSheet} style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.15s ease-out' }}>
              <input
                type="text"
                placeholder="Sheet Title..."
                className="glow-input"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '12px' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px', justifyContent: 'center' }}>
                Create
              </button>
            </form>
          )}
        </div>

        {/* Dynamic Progress circular widget */}
        {activeSheet && (
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Current Progress</h3>
            {renderProgressCircle()}
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Solved <strong style={{ color: '#fff' }}>{completedCount}</strong> of <strong style={{ color: '#fff' }}>{totalCount}</strong> problems
            </div>
          </div>
        )}
      </div>

      {/* 2. RIGHT COMPONENT: SHEET CHECKLIST */}
      {activeSheet ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header detail */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', color: '#fff' }}>{activeSheet}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track and solve problems to boost your profile score.</p>
            </div>
            {activeSheet !== "SDE Starter Kit" && activeSheet !== "LeetCode Top 75" && (
              <button
                onClick={handleDeleteSheet}
                className="btn-primary"
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: 'var(--brand-codechef)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  boxShadow: 'none'
                }}
              >
                <Trash2 size={13} /> Delete Sheet
              </button>
            )}
          </div>

          {/* Add custom problem form */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--accent-purple)" /> Add Problem to List
            </h3>
            
            <form onSubmit={handleAddProblem} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Problem title (e.g. '3Sum')"
                className="glow-input"
                value={problemTitle}
                onChange={(e) => setProblemTitle(e.target.value)}
                style={{ flex: 2, minWidth: '180px' }}
                required
              />
              <input
                type="url"
                placeholder="Link/URL (optional)"
                className="glow-input"
                value={problemUrl}
                onChange={(e) => setProblemUrl(e.target.value)}
                style={{ flex: 2, minWidth: '180px' }}
              />
              
              <select
                className="glow-input"
                value={problemDiff}
                onChange={(e) => setProblemDiff(e.target.value)}
                style={{ flex: 1, minWidth: '100px', cursor: 'pointer' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                Add
              </button>
            </form>
          </div>

          {/* Problem check items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentProblems.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p>No problems in this roadmap yet.</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Use the form above to add custom coding challenges.</p>
              </div>
            ) : (
              currentProblems.map((p) => {
                const diffColor = getDiffColor(p.difficulty);
                return (
                  <div
                    key={p.id}
                    className="glass-card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: p.completed ? 'rgba(255, 255, 255, 0.005)' : 'rgba(255, 255, 255, 0.015)',
                      opacity: p.completed ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <div 
                        onClick={() => toggleProblem(p.id)} 
                        style={{ cursor: 'pointer', color: p.completed ? 'var(--accent-purple)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {p.completed ? <CheckSquare size={20} style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.3))' }} /> : <Square size={20} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ 
                          fontSize: '15px', 
                          color: p.completed ? 'var(--text-secondary)' : '#fff', 
                          textDecoration: p.completed ? 'line-through' : 'none',
                          fontWeight: 600
                        }}>
                          {p.title}
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '9px', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            background: diffColor.bg, 
                            color: diffColor.text, 
                            fontWeight: 800,
                            textTransform: 'uppercase' 
                          }}>
                            {p.difficulty}
                          </span>
                          
                          {p.url && p.url !== '#' && (
                            <a href={p.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--accent-purple)', textDecoration: 'none' }}>
                              Practice <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProblem(p.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'var(--transition-fast)'
                      }}
                      className="delete-item-btn"
                      title="Remove problem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', gridColumn: 'span 2' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>Create or Select a Roadmap List</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Organize your competitive coding sheet paths in the left sidebar menu.</p>
        </div>
      )}

      <style>{`
        .delete-item-btn:hover { color: var(--brand-codechef) !important; background: rgba(244, 63, 94, 0.05); }
      `}</style>
    </div>
  );
}
