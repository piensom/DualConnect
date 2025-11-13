const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const { category, language = 'de' } = req.query;

    let query = 'SELECT * FROM faqs WHERE is_published = true';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    paramCount++;
    query += ` AND language = $${paramCount}`;
    params.push(language);

    query += ' ORDER BY order_index ASC, faq_id ASC';

    const result = await pool.query(query, params);

    res.json({ faqs: result.rows });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Get FAQ categories
router.get('/categories', async (req, res) => {
  try {
    const { language = 'de' } = req.query;

    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM faqs
       WHERE is_published = true AND language = $1
       GROUP BY category
       ORDER BY category`,
      [language]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ categories' });
  }
});

module.exports = router;
