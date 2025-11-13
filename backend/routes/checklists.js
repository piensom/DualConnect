const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Get all checklists
router.get('/', async (req, res) => {
  try {
    const { category, target_audience, language = 'de' } = req.query;

    let query = 'SELECT * FROM checklists WHERE language = $1';
    const params = [language];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (target_audience) {
      paramCount++;
      query += ` AND target_audience = $${paramCount}`;
      params.push(target_audience);
    }

    query += ' ORDER BY title ASC';

    const result = await pool.query(query, params);

    res.json({ checklists: result.rows });
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

// Get single checklist
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM checklists WHERE checklist_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    let progress = null;

    // Get user's progress if authenticated
    if (req.user) {
      const progressResult = await pool.query(
        'SELECT * FROM user_checklist_progress WHERE user_id = $1 AND checklist_id = $2',
        [req.user.user_id, id]
      );

      progress = progressResult.rows[0] || null;
    }

    res.json({
      checklist: result.rows[0],
      progress: progress
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// Update checklist progress
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_items } = req.body;

    // Calculate progress percentage
    const checklistResult = await pool.query(
      'SELECT items FROM checklists WHERE checklist_id = $1',
      [id]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const totalItems = checklistResult.rows[0].items.length;
    const completedCount = completed_items.length;
    const progress_percentage = Math.round((completedCount / totalItems) * 100);

    // Upsert progress
    const result = await pool.query(
      `INSERT INTO user_checklist_progress (user_id, checklist_id, completed_items, progress_percentage)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, checklist_id)
       DO UPDATE SET completed_items = $3, progress_percentage = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.user_id, id, JSON.stringify(completed_items), progress_percentage]
    );

    res.json({
      message: 'Progress updated successfully',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Update checklist progress error:', error);
    res.status(500).json({ error: 'Failed to update checklist progress' });
  }
});

module.exports = router;
