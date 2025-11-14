const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get user's applications
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.program_name, p.program_type, p.field_of_study,
              c.company_name, c.city, c.logo_url
       FROM applications a
       JOIN programs p ON a.program_id = p.program_id
       JOIN companies c ON p.company_id = c.company_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ applications: result.rows });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, p.program_name, p.program_type, p.field_of_study, p.description,
              c.company_name, c.city, c.website_url
       FROM applications a
       JOIN programs p ON a.program_id = p.program_id
       JOIN companies c ON p.company_id = c.company_id
       WHERE a.application_id = $1 AND a.user_id = $2`,
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application: result.rows[0] });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create new application
router.post('/', authenticate, async (req, res) => {
  try {
    const { program_id, cover_letter, cv_url, additional_documents, notes } = req.body;

    // Check if program exists
    const programCheck = await pool.query(
      'SELECT program_id FROM programs WHERE program_id = $1 AND is_active = true',
      [program_id]
    );

    if (programCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check for duplicate application
    const duplicateCheck = await pool.query(
      'SELECT application_id FROM applications WHERE user_id = $1 AND program_id = $2',
      [req.user.user_id, program_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this program' });
    }

    const result = await pool.query(
      `INSERT INTO applications (user_id, program_id, cover_letter, cv_url, additional_documents, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [req.user.user_id, program_id, cover_letter, cv_url, additional_documents, notes]
    );

    res.status(201).json({
      message: 'Application created successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { cover_letter, cv_url, additional_documents, notes, status } = req.body;

    const result = await pool.query(
      `UPDATE applications
       SET cover_letter = COALESCE($1, cover_letter),
           cv_url = COALESCE($2, cv_url),
           additional_documents = COALESCE($3, additional_documents),
           notes = COALESCE($4, notes),
           status = COALESCE($5, status),
           submitted_at = CASE WHEN $5 = 'submitted' AND submitted_at IS NULL THEN CURRENT_TIMESTAMP ELSE submitted_at END
       WHERE application_id = $6 AND user_id = $7
       RETURNING *`,
      [cover_letter, cv_url, additional_documents, notes, status, id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update program applications count if submitted
    if (status === 'submitted') {
      await pool.query(
        'UPDATE programs SET applications_count = applications_count + 1 WHERE program_id = $1',
        [result.rows[0].program_id]
      );
    }

    res.json({
      message: 'Application updated successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM applications WHERE application_id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Get application statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_applications,
         COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
         COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
         COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
       FROM applications
       WHERE user_id = $1`,
      [req.user.user_id]
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics' });
  }
});

module.exports = router;
