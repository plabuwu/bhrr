import { Hono } from 'hono'

const app = new Hono()

// Helper function to extract YouTube video ID
const extractYouTubeVideoId = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get all videos
app.get('/api/videos', async (c) => {
  try {
    const { db } = c.env;
    const videos = await db.prepare('SELECT * FROM editing_style').all();
    return c.json(videos.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch videos' }, 500);
  }
});

// Add a new video
app.post('/api/videos', async (c) => {
  try {
    const { db } = c.env;
    const body = await c.req.json();
    const { tweet_url, video_url } = body;

    if (!video_url) {
      return c.json({ error: 'Missing video_url' }, 400);
    }

    let result;
    if (extractYouTubeVideoId(video_url)) {
      // YouTube video
      result = await db.prepare(
        'INSERT INTO editing_style (youtube) VALUES (?) RETURNING *'
      ).bind(video_url).run();
    } else {
      // Twitter/X video
      result = await db.prepare(
        'INSERT INTO editing_style (x, src) VALUES (?, ?) RETURNING *'
      ).bind(tweet_url, video_url).run();
    }

    if (result.success) {
      return c.json(result.results[0]);
    } else {
      return c.json({ error: 'Failed to add video' }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Failed to add video' }, 500);
  }
});

// Delete a video
app.delete('/api/videos', async (c) => {
  try {
    const { db } = c.env;
    const body = await c.req.json();
    const { video_url, youtube_url } = body;

    if (!video_url && !youtube_url) {
      return c.json({ error: 'Missing video identifier' }, 400);
    }

    let result;
    if (youtube_url) {
      result = await db.prepare(
        'DELETE FROM editing_style WHERE youtube = ? RETURNING *'
      ).bind(youtube_url).run();
    } else {
      result = await db.prepare(
        'DELETE FROM editing_style WHERE src = ? RETURNING *'
      ).bind(video_url).run();
    }

    if (result.success && result.results.length > 0) {
      return c.json({ message: 'Video deleted' });
    } else {
      return c.json({ error: 'Video not found' }, 404);
    }
  } catch (error) {
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

export default app;