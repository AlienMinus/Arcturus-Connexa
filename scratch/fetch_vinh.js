async function getVinhVideos() {
  try {
    const res = await fetch('https://www.youtube.com/@askvinh/videos', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const idRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const ids = [];
    let match;
    while ((match = idRegex.exec(html)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }
    console.log('Total unique IDs found:', ids.length);
    console.log(JSON.stringify(ids.slice(0, 20), null, 2));
  } catch (err) {
    console.error(err);
  }
}
getVinhVideos();

