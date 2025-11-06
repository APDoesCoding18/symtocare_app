const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/search
// body: { spec_id, country, state, city }
router.post('/', async (req, res) => {
  const { spec_id, country, state, city } = req.body;
  try {
    const sql = `
      SELECT DISTINCT d.d_id, d.d_name, s.spec_name, h.hosp_name, h.city, h.state, h.country, da.avl_time
      FROM doctor d
      JOIN specialization s ON d.spec_id = s.spec_id
      JOIN doc_avl da ON d.d_id = da.d_id
      JOIN hospital h ON da.hosp_id = h.hosp_id
      WHERE d.spec_id = ?
      AND (h.country = ? OR ? IS NULL OR ? = '')
      AND (h.state = ? OR ? IS NULL OR ? = '')
      AND (h.city = ? OR ? IS NULL OR ? = '')
    `;

    const params = [
      spec_id,
      country, country, country,
      state, state, state,
      city, city, city
    ];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
