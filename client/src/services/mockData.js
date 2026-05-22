// Mock data generator for rich offline developer preview (recruiters showcase)

// Helper to generate date string YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// 1. Generate Year-Long Heatmap Activity (365 days of merged developer contributions)
export const generateMockHeatmap = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Create random activity clustering (higher on weekdays, sparse on weekends)
    const dayOfWeek = date.getDay();
    let probability = 0.6; // standard probability
    if (dayOfWeek === 0 || dayOfWeek === 6) probability = 0.25; // weekend dropoff
    
    let count = 0;
    if (Math.random() < probability) {
      count = Math.floor(Math.random() * 8) + 1; // 1 to 8 contributions
      if (Math.random() < 0.15) count = Math.floor(Math.random() * 8) + 8; // high activity days (8 to 15)
    }
    
    data.push({
      date: formatDate(date),
      count: count
    });
  }
  return data;
};

// 2. Generate Platforms rating charts history
export const generateMockRatingHistory = (platform) => {
  const history = [];
  let currentRating = 1200;
  const today = new Date();
  
  const platformsMultiplier = {
    codeforces: { step: 65, variance: 90, base: 1400 },
    leetcode: { step: 40, variance: 60, base: 1550 },
    codechef: { step: 50, variance: 75, base: 1500 }
  };
  
  const config = platformsMultiplier[platform] || { step: 30, variance: 50, base: 1300 };
  currentRating = config.base;
  
  for (let i = 12; i >= 1; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    
    // Simulate natural rating shifts (overall upward trend)
    const change = Math.floor(Math.random() * config.variance) - (config.variance / 2 - config.step);
    currentRating += change;
    
    history.push({
      contestName: `Round #${12 - i + 101}`,
      date: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      rating: currentRating,
      rank: Math.floor(Math.random() * 500) + 10
    });
  }
  return history;
};

// 3. Generate Upcoming Coding Contests
export const generateMockContests = () => {
  const today = new Date();
  
  return [
    {
      id: 'cf-1',
      name: 'Codeforces Round 992 (Div. 2)',
      platform: 'codeforces',
      url: 'https://codeforces.com/contests',
      startTime: new Date(today.getTime() + 4 * 60 * 60 * 1000).toISOString(), // starts in 4 hours
      duration: 7200, // 2 hours
    },
    {
      id: 'lc-1',
      name: 'LeetCode Weekly Contest 412',
      platform: 'leetcode',
      url: 'https://leetcode.com/contest',
      startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // tomorrow
      duration: 5400, // 1.5 hours
    },
    {
      id: 'at-1',
      name: 'AtCoder Beginner Contest 364',
      platform: 'atcoder',
      url: 'https://atcoder.jp/contests',
      startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // in 2 days
      duration: 6000, // 1 hour 40 min
    },
    {
      id: 'cc-1',
      name: 'CodeChef Starters 142 (Div. 3)',
      platform: 'codechef',
      url: 'https://www.codechef.com/contests',
      startTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // in 4 days
      duration: 9000, // 2.5 hours
    },
    {
      id: 'cf-2',
      name: 'Codeforces Educational Round 172 (Div. 2)',
      platform: 'codeforces',
      url: 'https://codeforces.com/contests',
      startTime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // in 6 days
      duration: 7200,
    },
    {
      id: 'lc-2',
      name: 'LeetCode Biweekly Contest 138',
      platform: 'leetcode',
      url: 'https://leetcode.com/contest',
      startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // in 7 days
      duration: 5400,
    }
  ];
};

// 4. Generate Unified Platform Profile Stats
export const generateMockProfile = (platform, handle) => {
  const defaultHandle = handle || 'dev_pulse_coder';
  
  switch(platform) {
    case 'github':
      return {
        handle: defaultHandle,
        name: 'Nishul Mehta',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        bio: 'Full Stack Engineer | Open Source Enthusiast | Systems Architect',
        publicRepos: 32,
        followers: 184,
        starsReceived: 92,
        totalCommits: 1420,
        activeStreak: 18,
        profileUrl: `https://github.com/${defaultHandle}`
      };
      
    case 'leetcode':
      return {
        handle: defaultHandle,
        name: 'Nishul Mehta',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        rating: 1912,
        globalRank: 24901,
        solvedTotal: 612,
        solvedEasy: 220,
        solvedMedium: 310,
        solvedHard: 82,
        acceptanceRate: '56.4%',
        activeStreak: 12,
        profileUrl: `https://leetcode.com/u/${defaultHandle}`
      };
      
    case 'codeforces':
      return {
        handle: defaultHandle,
        rating: 1745,
        maxRating: 1850,
        rank: 'Expert',
        maxRank: 'Expert',
        contribution: 45,
        solvedTotal: 342,
        activeStreak: 8,
        profileUrl: `https://codeforces.com/profile/${defaultHandle}`
      };
      
    case 'codechef':
      return {
        handle: defaultHandle,
        rating: 1892,
        stars: '4 ★',
        globalRank: 1209,
        countryRank: 840,
        solvedTotal: 215,
        activeStreak: 15,
        profileUrl: `https://www.codechef.com/users/${defaultHandle}`
      };
      
    default:
      return null;
  }
};
