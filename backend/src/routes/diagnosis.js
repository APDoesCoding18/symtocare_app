const express = require('express');
const router = express.Router();
const pool = require('../db');

// Add diagnosis
router.post('/', async (req, res) => {
  const { p_id, d_id, disease_name, note } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO diagnosis (p_id, d_id, disease_name, note) VALUES (?, ?, ?, ?)',
      [p_id, d_id, disease_name, note]
    );
    res.json({ diag_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
