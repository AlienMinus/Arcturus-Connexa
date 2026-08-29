import express from 'express';

const router = express.Router();

let cachedNews = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getTimeAgo(timestamp) {
  if (!timestamp) return 'Recent';
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function fetchLiveNews() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=15&orderBy="$key"', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!hnRes.ok) throw new Error('HN API error');
    const storyIds = await hnRes.json();
    const topIds = (Array.isArray(storyIds) ? storyIds : []).slice(0, 12);

    const storyPromises = topIds.map(async (id) => {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!itemRes.ok) return null;
        return await itemRes.json();
      } catch {
        return null;
      }
    });

    const rawStories = (await Promise.all(storyPromises)).filter(Boolean);

    const formatted = rawStories
      .filter((s) => s.title && s.type === 'story')
      .map((s) => {
        let domain = 'Tech News';
        if (s.url) {
          try {
            domain = new URL(s.url).hostname.replace(/^www\./, '');
          } catch {}
        }
        return {
          id: s.id,
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          timeAgo: getTimeAgo(s.time),
          readers: `${((s.score || 10) * 17 + 100).toLocaleString()} readers`,
          source: domain,
        };
      });

    if (formatted.length > 0) {
      cachedNews = formatted;
      lastFetchTime = Date.now();
      return formatted;
    }
  } catch (err) {
    console.warn('Live news fetch error:', err.message);
  }

  // If HN failed, try Dev.to articles API
  try {
    const devToRes = await fetch('https://dev.to/api/articles?per_page=12&top=1');
    if (devToRes.ok) {
      const devToData = await devToRes.json();
      if (Array.isArray(devToData) && devToData.length > 0) {
        const formatted = devToData.map((a) => ({
          id: a.id,
          title: a.title,
          url: a.url,
          timeAgo: a.readable_publish_date || 'Recent',
          readers: `${(a.positive_reactions_count * 15 + 150).toLocaleString()} readers`,
          source: 'dev.to',
        }));
        cachedNews = formatted;
        lastFetchTime = Date.now();
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Dev.to fallback fetch error:', err.message);
  }

  return cachedNews || [];
}

router.get('/', async (req, res) => {
  try {
    if (cachedNews && Date.now() - lastFetchTime < CACHE_TTL) {
      return res.json(cachedNews);
    }
    const news = await fetchLiveNews();
    res.json(news);
  } catch (err) {
    res.json(cachedNews || []);
  }
});

export default router;
