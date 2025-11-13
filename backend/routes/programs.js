const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { optionalAuth, authenticate } = require('../middleware/auth');

// Get all programs with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      field,
      type,
      language,
      city,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT p.*, c.company_name, c.city, c.state, c.logo_url,
             (SELECT COUNT(*) FROM bookmarks b WHERE b.program_id = p.program_id AND b.user_id = $1) > 0 as is_bookmarked
      FROM programs p
      LEFT JOIN companies c ON p.company_id = c.company_id
      WHERE p.is_active = true
    `;

    const params = [req.user?.user_id || null];
    let paramCount = 1;

    if (field && field !== 'all') {
      paramCount++;
      query += ` AND p.field_of_study = $${paramCount}`;
      params.push(field);
    }

    if (type && type !== 'all') {
      paramCount++;
      query += ` AND p.program_type = $${paramCount}`;
      params.push(type);
    }

    if (language) {
      paramCount++;
      query += ` AND p.language_requirement <= $${paramCount}`;
      params.push(language);
    }

    if (city) {
      paramCount++;
      query += ` AND c.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.program_name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR c.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const validSortColumns = ['created_at', 'program_name', 'duration_months', 'views_count', 'applications_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY p.${sortColumn} ${order}`;
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM programs p LEFT JOIN companies c ON p.company_id = c.company_id WHERE p.is_active = true';
    const countResult = await pool.query(countQuery);

    res.json({
      programs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get single program by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.*,
              (SELECT COUNT(*) FROM bookmarks b WHERE b.program_id = p.program_id AND b.user_id = $1) > 0 as is_bookmarked
       FROM programs p
       LEFT JOIN companies c ON p.company_id = c.company_id
       WHERE p.program_id = $2 AND p.is_active = true`,
      [req.user?.user_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Increment views count
    await pool.query(
      'UPDATE programs SET views_count = views_count + 1 WHERE program_id = $1',
      [id]
    );

    // Get funding options
    const fundingResult = await pool.query(
      `SELECT f.* FROM funding_options f
       JOIN program_funding pf ON f.funding_id = pf.funding_id
       WHERE pf.program_id = $1 AND f.is_active = true`,
      [id]
    );

    // Get contact person
    const contactResult = await pool.query(
      'SELECT * FROM contact_persons WHERE company_id = $1 AND is_available = true LIMIT 1',
      [result.rows[0].company_id]
    );

    res.json({
      program: result.rows[0],
      funding_options: fundingResult.rows,
      contact_person: contactResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Get program statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         views_count,
         applications_count,
         (SELECT COUNT(*) FROM bookmarks WHERE program_id = $1) as bookmarks_count
       FROM programs WHERE program_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get program stats error:', error);
    res.status(500).json({ error: 'Failed to fetch program stats' });
  }
});

// Compare programs
router.post('/compare', async (req, res) => {
  try {
    const { program_ids } = req.body;

    if (!Array.isArray(program_ids) || program_ids.length < 2 || program_ids.length > 5) {
      return res.status(400).json({ error: 'Please provide 2-5 program IDs to compare' });
    }

    const result = await pool.query(
      `SELECT p.*, c.company_name, c.city, c.state
       FROM programs p
       LEFT JOIN companies c ON p.company_id = c.company_id
       WHERE p.program_id = ANY($1) AND p.is_active = true`,
      [program_ids]
    );

    res.json({ programs: result.rows });
  } catch (error) {
    console.error('Compare programs error:', error);
    res.status(500).json({ error: 'Failed to compare programs' });
  }
});

// Get program recommendations
router.get('/:id/recommendations', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current program details
    const programResult = await pool.query(
      'SELECT field_of_study, program_type FROM programs WHERE program_id = $1',
      [id]
    );

    if (programResult.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const { field_of_study, program_type } = programResult.rows[0];

    // Get similar programs
    const result = await pool.query(
      `SELECT p.*, c.company_name, c.city, c.logo_url
       FROM programs p
       LEFT JOIN companies c ON p.company_id = c.company_id
       WHERE p.program_id != $1
         AND p.is_active = true
         AND (p.field_of_study = $2 OR p.program_type = $3)
       ORDER BY
         CASE WHEN p.field_of_study = $2 AND p.program_type = $3 THEN 1
              WHEN p.field_of_study = $2 THEN 2
              ELSE 3 END,
         p.views_count DESC
       LIMIT 6`,
      [id, field_of_study, program_type]
    );

    res.json({ recommendations: result.rows });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
