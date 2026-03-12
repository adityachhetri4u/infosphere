// Direct API calls to news services from frontend
export interface NewsArticle {
  id?: number;
  title: string;
  description?: string;
  content: string;
  url: string;
  source: string;
  author?: string;
  published_at?: string;
  published_date: string;
  fetched_date: string;
  image_url?: string;
  category: string;
  sentiment?: string;
  confidence?: number;
  location?: string;
}

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedArticles: NewsArticle[] | null = null;
let lastFetchTime: number = 0;

// Format date to relative time (e.g., "2 hours ago", "3 days ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // For older dates, show formatted date
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

// Categorize article and compute confidence based on keyword match strength
function categorizeWithConfidence(title: string, description: string): { category: string; confidence: number } {
  const text = `${title} ${description}`.toLowerCase();
  const categories: Record<string, string[]> = {
    Politics: ['election', 'government', 'minister', 'parliament', 'pm modi', 'congress', 'bjp', 'policy', 'supreme court'],
    Sports: ['cricket', 'football', 'sports', 'player', 'match', 'ipl', 'world cup', 'olympics', 'fifa'],
    Technology: ['tech', 'ai', 'smartphone', 'app', 'google', 'apple', 'software', 'startup', 'innovation'],
    Entertainment: ['film', 'actor', 'bollywood', 'celebrity', 'music', 'movie', 'netflix', 'series', 'award'],
    Business: ['economy', 'market', 'stock', 'business', 'company', 'rupee', 'gdp', 'trade', 'investment'],
    Health: ['health', 'hospital', 'doctor', 'disease', 'covid', 'vaccine', 'medicine', 'treatment'],
    Crime: ['crime', 'police', 'arrest', 'murder', 'theft', 'scam', 'fraud', 'investigation'],
    Weather: ['rain', 'weather', 'cyclone', 'temperature', 'forecast', 'flood', 'storm'],
    Accident: ['accident', 'crash', 'collision', 'injured', 'died', 'fatal'],
    International: ['g20', 'russia', 'china', 'usa', 'pakistan', 'dubai', 'international', 'global'],
  };

  let bestCategory = 'General';
  let bestCount = 0;
  let bestTotal = 1;

  for (const [cat, keywords] of Object.entries(categories)) {
    const count = keywords.filter(kw => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestTotal = keywords.length;
      bestCategory = cat;
    }
  }

  if (bestCount === 0) {
    return { category: 'General', confidence: parseFloat((0.30 + Math.random() * 0.15).toFixed(2)) };
  }

  const ratio = bestCount / bestTotal;
  let confidence = 0.50 + ratio * 0.45;
  confidence += (Math.random() - 0.5) * 0.06; // small variance
  confidence = Math.max(0.30, Math.min(0.98, parseFloat(confidence.toFixed(2))));
  return { category: bestCategory, confidence };
}

// CORS proxy for browser-side API calls (some APIs block direct browser requests)
const CORS_PROXY = 'https://corsproxy.io/?';

const NEWS_APIS = {
  gnews: {
    key: 'eda407cf5b208678dcba2187d0ad083c',
    url: 'https://gnews.io/api/v4/top-headlines',
    params: '?lang=en&max=30&country=in'
  },
  newsdata: {
    key: 'pub_d29854fffb18474da508e0a12322adff',
    url: 'https://newsdata.io/api/1/latest',
    params: '?language=en&country=in&size=10'
  },
  newsapi: {
    key: 'b9332a9838474c4e9f42521e4b2bb197',
    url: 'https://newsapi.org/v2/top-headlines',
    params: '?country=in&pageSize=30'
  }
};

// Helper: try direct fetch first, then CORS proxy fallback
async function fetchWithCorsProxy(url: string): Promise<Response> {
  try {
    const direct = await fetch(url);
    if (direct.ok) return direct;
    throw new Error(`HTTP ${direct.status}`);
  } catch {
    // Fallback to CORS proxy
    const proxied = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!proxied.ok) throw new Error(`Proxy HTTP ${proxied.status}`);
    return proxied;
  }
}

// Fetch from GNews API
async function fetchGNews(): Promise<NewsArticle[]> {
  try {
    const url = `${NEWS_APIS.gnews.url}${NEWS_APIS.gnews.params}&apikey=${NEWS_APIS.gnews.key}`;
    console.log('🔍 Fetching from GNews...');
    
    const response = await fetchWithCorsProxy(url);
    
    const data = await response.json();
    console.log('✅ GNews response:', data);
    
    return (data.articles || []).map((article: any, index: number) => {
      const { category, confidence } = categorizeWithConfidence(article.title || '', article.description || '');
      return {
      id: Date.now() + index,
      title: article.title || 'No Title',
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url || '',
      source: article.source?.name || 'GNews',
      author: article.source?.name || 'Unknown',
      published_at: article.publishedAt || new Date().toISOString(),
      published_date: formatRelativeTime(article.publishedAt || new Date().toISOString()),
      fetched_date: new Date().toISOString(),
      image_url: article.image || '',
      category,
      sentiment: 'neutral',
      confidence,
      location: 'India'
    }});
  } catch (error) {
    console.error('❌ GNews fetch error:', error);
    return [];
  }
}

// Fetch from NewsData.io API
async function fetchNewsData(): Promise<NewsArticle[]> {
  try {
    const url = `${NEWS_APIS.newsdata.url}${NEWS_APIS.newsdata.params}&apikey=${NEWS_APIS.newsdata.key}`;
    console.log('🔍 Fetching from NewsData.io...');
    
    const response = await fetchWithCorsProxy(url);
    
    const data = await response.json();
    console.log('✅ NewsData response:', data);
    
    return (data.results || []).map((article: any, index: number) => {
      const { category: autoCategory, confidence } = categorizeWithConfidence(article.title || '', article.description || '');
      return {
      id: Date.now() + index + 1000,
      title: article.title || 'No Title',
      description: article.description || '',
      content: article.description || article.content || '',
      url: article.link || '',
      source: article.source_id || 'NewsData.io',
      author: article.creator?.[0] || 'Unknown',
      published_at: article.pubDate || new Date().toISOString(),
      published_date: formatRelativeTime(article.pubDate || new Date().toISOString()),
      fetched_date: new Date().toISOString(),
      image_url: article.image_url || '',
      category: article.category?.[0] || autoCategory,
      sentiment: 'neutral',
      confidence,
      location: 'India'
    }});
  } catch (error) {
    console.error('❌ NewsData fetch error:', error);
    return [];
  }
}

// Fetch from NewsAPI.org
async function fetchNewsAPI(): Promise<NewsArticle[]> {
  try {
    const url = `${NEWS_APIS.newsapi.url}${NEWS_APIS.newsapi.params}&apiKey=${NEWS_APIS.newsapi.key}`;
    console.log('🔍 Fetching from NewsAPI.org...');
    
    const response = await fetchWithCorsProxy(url);
    
    const data = await response.json();
    console.log('✅ NewsAPI response:', data);
    
    return (data.articles || []).map((article: any, index: number) => {
      const { category, confidence } = categorizeWithConfidence(article.title || '', article.description || '');
      return {
      id: Date.now() + index + 2000,
      title: article.title || 'No Title',
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url || '',
      source: article.source?.name || 'NewsAPI',
      author: article.author || 'Unknown',
      published_at: article.publishedAt || new Date().toISOString(),
      published_date: formatRelativeTime(article.publishedAt || new Date().toISOString()),
      fetched_date: new Date().toISOString(),
      image_url: article.urlToImage || '',
      category,
      sentiment: 'neutral',
      confidence,
      location: 'India'
    }});
  } catch (error) {
    console.error('❌ NewsAPI fetch error:', error);
    return [];
  }
}

// Fetch from all APIs and combine results
export async function fetchAllNews(): Promise<NewsArticle[]> {
  // Check if cache is still valid
  const now = Date.now();
  if (cachedArticles && (now - lastFetchTime) < CACHE_DURATION) {
    console.log(`📦 Using cached news (${Math.floor((CACHE_DURATION - (now - lastFetchTime)) / 60000)} minutes remaining)`);
    return cachedArticles;
  }
  
  console.log('🚀 Fetching fresh news from all APIs...');
  
  const [gnewsArticles, newsdataArticles, newsapiArticles] = await Promise.all([
    fetchGNews(),
    fetchNewsData(),
    fetchNewsAPI()
  ]);
  
  const allArticles = [
    ...gnewsArticles,
    ...newsdataArticles,
    ...newsapiArticles
  ];
  
  console.log(`✅ Total articles fetched: ${allArticles.length}`);
  console.log(`   - GNews: ${gnewsArticles.length}`);
  console.log(`   - NewsData: ${newsdataArticles.length}`);
  console.log(`   - NewsAPI: ${newsapiArticles.length}`);
  
  // Sort by published date (newest first)
  allArticles.sort((a, b) => {
    const dateA = new Date(a.published_at || a.published_date || 0).getTime();
    const dateB = new Date(b.published_at || b.published_date || 0).getTime();
    return dateB - dateA;
  });
  
  // Only cache if we actually got articles (don't cache failures)
  if (allArticles.length > 0) {
    cachedArticles = allArticles;
    lastFetchTime = now;
    console.log(`💾 Cache updated with ${allArticles.length} articles - valid for 1 hour`);
  } else {
    console.warn('⚠️ No articles fetched from any API - not caching empty result');
  }
  
  return allArticles;
}

// Search news across all APIs
export async function searchNews(query: string): Promise<NewsArticle[]> {
  console.log(`🔍 Searching for: "${query}"`);
  
  const allArticles = await fetchAllNews();
  
  // Filter articles by search query
  const searchLower = query.toLowerCase();
  const filtered = allArticles.filter(article => 
    article.title?.toLowerCase().includes(searchLower) ||
    article.description?.toLowerCase().includes(searchLower) ||
    article.content?.toLowerCase().includes(searchLower)
  );
  
  console.log(`✅ Found ${filtered.length} articles matching "${query}"`);
  return filtered;
}
