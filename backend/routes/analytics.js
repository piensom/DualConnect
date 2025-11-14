const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const programsResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM programs'
    );

    const companiesResult = await pool.query('SELECT COUNT(*) as total FROM companies');

    const applicationsResult = await pool.query('SELECT COUNT(*) as total FROM applications');

    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');

    const topProgramsResult = await pool.query(
      `SELECT p.program_name, c.company_name, p.views_count, p.applications_count
       FROM programs p
       JOIN companies c ON p.company_id = c.company_id
       WHERE p.is_active = true
       ORDER BY p.applications_count DESC, p.views_count DESC
       LIMIT 10`
    );

    const fieldDistributionResult = await pool.query(
      `SELECT field_of_study, COUNT(*) as count
       FROM programs
       WHERE is_active = true
       GROUP BY field_of_study
       ORDER BY count DESC`
    );

    res.json({
      stats: {
        programs: programsResult.rows[0],
        companies: parseInt(companiesResult.rows[0].total),
        applications: parseInt(applicationsResult.rows[0].total),
        users: parseInt(usersResult.rows[0].total)
      },
      top_programs: topProgramsResult.rows,
      field_distribution: fieldDistributionResult.rows
    });
  } catch (error) {
    console.error('Get analytics stats error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

module.exports = router;
