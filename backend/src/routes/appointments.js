const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create appointment
// body: { app_date, app_time, app_mode, d_id, p_id }
router.post('/', async (req, res) => {
  const { app_date, app_time, app_mode, d_id, p_id } = req.body;
  // In a real app, p_id would come from a session/token, not the request body for security.

  try {
    // 1. Check if the doctor is already booked for that time slot.
    const [existingAppointments] = await pool.query(
      'SELECT appointment_id FROM appointment WHERE d_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN (?, ?)',
      [d_id, app_date, app_time, 'Cancelled', 'Completed']
    );

    if (existingAppointments.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another time.' });
    }

    // 2. If the slot is free, create the new appointment.
    const [result] = await pool.query(
      'INSERT INTO appointment (app_date, app_time, app_mode, d_id, p_id) VALUES (?, ?, ?, ?, ?)',
      [app_date, app_time, app_mode, d_id, p_id]
    );
    res.status(201).json({ app_id: result.insertId, message: 'Appointment booked successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get appointments for a patient
router.get('/patient/:p_id', async (req, res) => {
  const p_id = req.params.p_id;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, d.d_name, s.spec_name
       FROM appointment a
       JOIN doctor d ON a.d_id = d.d_id
       LEFT JOIN specialization s ON d.spec_id = s.spec_id
       WHERE a.p_id = ?`,
      [p_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
