const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all doctors (with specialization and availability/hospital)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, s.spec_name, h.hosp_name, h.city, h.state, h.country, da.avl_time
      FROM doctor d
      LEFT JOIN specialization s ON d.spec_id = s.spec_id
      LEFT JOIN doc_avl da ON d.d_id = da.d_id
      LEFT JOIN hospital h ON da.hosp_id = h.hosp_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET doctor by id
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM doctor WHERE d_id = ?', [id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
