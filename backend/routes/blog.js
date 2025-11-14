const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all published blog posts
router.get('/', async (req, res) => {
  try {
    const { category, tag, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT bp.*, u.first_name, u.last_name
      FROM blog_posts bp
      JOIN users u ON bp.author_id = u.user_id
      WHERE bp.is_published = true
    `;

    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND bp.category = $${paramCount}`;
      params.push(category);
    }

    if (tag) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(bp.tags)`;
      params.push(tag);
    }

    query += ` ORDER BY bp.published_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const result = await pool.query(query, params);

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT bp.*, u.first_name, u.last_name
       FROM blog_posts bp
       JOIN users u ON bp.author_id = u.user_id
       WHERE bp.slug = $1 AND bp.is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment views
    await pool.query(
      'UPDATE blog_posts SET views_count = views_count + 1 WHERE post_id = $1',
      [result.rows[0].post_id]
    );

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Get blog categories
router.get('/categories/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM blog_posts
       WHERE is_published = true
       GROUP BY category
       ORDER BY count DESC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
