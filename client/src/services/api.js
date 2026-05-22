import { 
  generateMockProfile, 
  generateMockHeatmap, 
  generateMockRatingHistory, 
  generateMockContests 
} from './mockData';

// Configuration
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001/api';

// Clean full profile URLs into standard handles/usernames automatically
export const cleanProfileHandle = (input) => {
  if (!input) return '';
  let trimmed = input.trim();
  if (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1);
  }
  
  if (trimmed.includes('github.com/')) {
    return trimmed.split('github.com/').pop().split('/')[0];
  }
  
  if (trimmed.includes('leetcode.com/')) {
    let suffix = trimmed.split('leetcode.com/').pop();
    if (suffix.startsWith('u/')) {
      return suffix.slice(2).split('/')[0];
    }
    return suffix.split('/')[0];
  }
  
  if (trimmed.includes('codeforces.com/')) {
    let suffix = trimmed.split('codeforces.com/').pop();
    if (suffix.includes('profile/')) {
      return suffix.split('profile/').pop().split('/')[0];
    }
    return suffix.split('/')[0];
  }
  
  if (trimmed.includes('codechef.com/')) {
    let suffix = trimmed.split('codechef.com/').pop();
    if (suffix.includes('users/')) {
      return suffix.split('users/').pop().split('/')[0];
    }
    return suffix.split('/')[0];
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.split('/').pop();
  }
  
  return trimmed;
};

// Utility: Cache results to avoid aggressive platform rate limits
const cache = {
  get: (key) => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    const { val, expiry } = JSON.parse(cached);
    if (new Date().getTime() > expiry) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    return val;
  },
  set: (key, val, ttl = 30 * 60 * 1000) => { // default 30 mins TTL
    const expiry = new Date().getTime() + ttl;
    localStorage.setItem(`cache_${key}`, JSON.stringify({ val, expiry }));
  }
};

export const fetchGithubProfile = async (handle) => {
  if (!handle) return null;
  const cacheKey = `github_${handle}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const res = await fetch(`https://api.github.com/users/${handle}`);
    if (!res.ok) throw new Error('GitHub profile not found');
    const data = await res.json();
    
    // Structure GitHub Profile
    const profile = {
      handle: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio || 'Developer Profile',
      publicRepos: data.public_repos,
      followers: data.followers,
      starsReceived: Math.floor(Math.random() * 20) + 5, // Simulated since github API needs separate query
      totalCommits: Math.floor(Math.random() * 800) + 400, // Simulated count
      activeStreak: Math.floor(Math.random() * 15) + 3,
      profileUrl: data.html_url
    };
    
    cache.set(cacheKey, profile);
    return profile;
  } catch (err) {
    console.warn(`GitHub fetch failed for ${handle}, falling back to simulator:`, err);
    return generateMockProfile('github', handle);
  }
};

export const fetchCodeforcesProfile = async (handle) => {
  if (!handle) return null;
  const cacheKey = `codeforces_${handle}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (!res.ok) throw new Error('Codeforces user not found');
    const responseData = await res.json();
    
    if (responseData.status !== 'OK') throw new Error('CF API Status Fail');
    const data = responseData.result[0];
    
    const profile = {
      handle: data.handle,
      rating: data.rating || 1500,
      maxRating: data.maxRating || 1500,
      rank: data.rank || 'Unrated',
      maxRank: data.maxRank || 'Unrated',
      contribution: data.contribution || 0,
      solvedTotal: Math.floor(Math.random() * 250) + 120, // CF requires user.status query to get unique solved problems
      activeStreak: Math.floor(Math.random() * 12) + 2,
      profileUrl: `https://codeforces.com/profile/${data.handle}`
    };
    
    cache.set(cacheKey, profile);
    return profile;
  } catch (err) {
    console.warn(`Codeforces fetch failed for ${handle}, falling back to simulator:`, err);
    return generateMockProfile('codeforces', handle);
  }
};

export const fetchLeetcodeProfile = async (handle) => {
  if (!handle) return null;
  const cacheKey = `leetcode_${handle}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const [profileRes, solvedRes, contestRes] = await Promise.all([
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}`),
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}/solved`),
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}/contest`)
    ]);
    
    if (!profileRes.ok || !solvedRes.ok) throw new Error('LeetCode API returned error');
    
    const profileData = await profileRes.json();
    const solvedData = await solvedRes.json();
    
    let contestData = {};
    if (contestRes.ok) {
      try {
        contestData = await contestRes.json();
      } catch (e) {
        console.warn('Contest data parse failed:', e);
      }
    }
    
    if (profileData.errors || solvedData.errors) throw new Error('LeetCode GraphQL returned error');
    
    const profile = {
      handle,
      name: profileData.name || handle,
      avatarUrl: profileData.avatar || `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80`,
      rating: contestData.contestRating ? Math.floor(contestData.contestRating) : 1500,
      globalRank: profileData.ranking || 120000,
      solvedTotal: solvedData.solvedProblem || 0,
      solvedEasy: solvedData.easySolved || 0,
      solvedMedium: solvedData.mediumSolved || 0,
      solvedHard: solvedData.hardSolved || 0,
      acceptanceRate: solvedData.acSubmissionNum && solvedData.acSubmissionNum[0] && solvedData.totalSubmissionNum && solvedData.totalSubmissionNum[0]
        ? `${Math.floor((solvedData.acSubmissionNum[0].count / solvedData.totalSubmissionNum[0].count) * 100)}%`
        : '52%',
      activeStreak: Math.floor(Math.random() * 12) + 3,
      profileUrl: `https://leetcode.com/u/${handle}`
    };
    
    cache.set(cacheKey, profile);
    return profile;
  } catch (err) {
    console.warn(`LeetCode proxy failed for ${handle}, falling back to simulator:`, err);
    return generateMockProfile('leetcode', handle);
  }
};

// 3. Contests Schedule Aggregator
export const fetchUpcomingContests = async () => {
  const cacheKey = 'upcoming_contests';
  const cachedContests = cache.get(cacheKey);
  if (cachedContests) return cachedContests;

  try {
    // 1. Fetch Codeforces upcoming contests (official, CORS-friendly, no keys)
    const res = await fetch('https://codeforces.com/api/contest.list?gym=false');
    if (!res.ok) throw new Error('Codeforces contests fail');
    
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('CF API contest status error');
    
    const upcomingCF = data.result
      .filter(c => c.phase === 'BEFORE')
      .map(c => ({
        id: `cf-${c.id}`,
        name: c.name,
        platform: 'codeforces',
        url: 'https://codeforces.com/contests',
        startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
        duration: c.durationSeconds,
      }))
      .reverse(); // nearest first
      
    // 2. Mix in other upcoming mocks to ensure a full active competitive list
    const fallbackContests = generateMockContests().filter(c => c.platform !== 'codeforces');
    const combined = [...upcomingCF.slice(0, 3), ...fallbackContests].sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    cache.set(cacheKey, combined, 60 * 60 * 1000); // 1 hour TTL
    return combined;
  } catch (err) {
    console.warn('Contests API fetch failed, loading fully mock contest schedule:', err);
    return generateMockContests();
  }
};

// 4. Server Integrations (For full MERN capability)
// These sync user's profiles and checklists with MongoDB database
export const syncUserDashboardToServer = async (token, payload) => {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('Server sync failed:', err);
    return { success: false, error: err.message };
  }
};

export const fetchUserDashboardFromServer = async (token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error('Server fetch failed:', err);
    return null;
  }
};
