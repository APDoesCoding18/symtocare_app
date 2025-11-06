const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Using the existing db connection pool

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to get all specializations for the search dropdown
app.get('/api/specializations', async (req, res) => {
  try {
    const [specializations] = await pool.query('SELECT * FROM SPECIALIZATION ORDER BY specialization_name');
    res.json(specializations);
  } catch (err) {
    console.error('Error fetching specializations:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// The core search endpoint for finding doctors
app.get('/api/doctors/search', async (req, res) => {
  const { specializationId, city, symptoms } = req.query;

  // Start with a base query
  let sql = `
    SELECT
      d.doctor_id,
      d.name,
      d.experience,
      d.hospital_affiliation,
      d.city,
      s.specialization_name
    FROM DOCTOR d
    JOIN SPECIALIZATION s ON d.specialization_id = s.specialization_id
    WHERE 1=1
  `;

  const params = [];

  // Dynamically add conditions based on query parameters
  if (specializationId) {
    sql += ' AND d.specialization_id = ?';
    params.push(specializationId);
  }

  if (city) {
    sql += ' AND d.city LIKE ?';
    params.push(`%${city}%`);
  }

  // Note: A real-world symptom search would be more complex, likely involving
  // a separate table mapping symptoms to specializations.
  // This is a simplified version for demonstration.
  if (symptoms) {
    // This part is for future enhancement.
  }

  try {
    const [doctors] = await pool.query(sql, params);
    res.json(doctors);
  } catch (err) {
    console.error('Error searching for doctors:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to get all doctors for the dashboard dropdown
app.get('/api/doctors', async (req, res) => {
  try {
    const [doctors] = await pool.query('SELECT doctor_id, name FROM DOCTOR ORDER BY name');
    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to get appointments for a specific doctor
app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT
      a.appointment_id,
      a.appointment_date,
      a.time_slot,
      a.status,
      p.name as patient_name,
      p.phone_number as patient_phone
    FROM APPOINTMENT a
    JOIN PATIENT p ON a.patient_id = p.patient_id
    WHERE a.doctor_id = ?
    ORDER BY a.appointment_date ASC, a.time_slot ASC
  `;

  const [appointments] = await pool.query(sql, [doctorId]);
  res.json(appointments);
});

// Endpoint to get all patients for the booking dropdown
app.get('/api/patients', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT patient_id, name FROM PATIENT ORDER BY name');
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to get appointments for a patient
app.get('/api/appointments', async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) return res.status(400).json({ error: 'Patient ID is required.' });

  const sql = `
    SELECT
      a.appointment_id,
      a.appointment_date,
      a.time_slot,
      a.status,
      d.name as doctor_name,
      s.specialization_name,
      (SELECT rating_id FROM RATING r WHERE r.doctor_id = a.doctor_id AND r.patient_id = a.patient_id) IS NOT NULL AS has_rated
    FROM APPOINTMENT a
    JOIN DOCTOR d ON a.doctor_id = d.doctor_id
    LEFT JOIN SPECIALIZATION s ON d.specialization_id = s.specialization_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.time_slot DESC
  `;

  try {
    const [appointments] = await pool.query(sql, [patientId]);
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to book an appointment
app.post('/api/appointments', async (req, res) => {
  const { patientId, doctorId, appointmentDate, timeSlot, mode } = req.body;

  if (!patientId || !doctorId || !appointmentDate || !timeSlot || !mode) {
    return res.status(400).json({ error: 'Missing required appointment details.' });
  }

  try {
    // 1. Check if the doctor is already booked for that time slot.
    const [existingAppointments] = await pool.query(
      'SELECT appointment_id FROM APPOINTMENT WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN (?, ?)',
      [doctorId, appointmentDate, timeSlot, 'Cancelled', 'Completed']
    );

    if (existingAppointments.length > 0) {
      // If an appointment exists, return a conflict error.
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another time.' });
    }

    // 2. If the slot is free, create the new appointment.
    const sql = 'INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, time_slot, mode, status) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [patientId, doctorId, appointmentDate, timeSlot, mode, 'Confirmed'];

    const [result] = await pool.query(sql, params);
    res.status(201).json({ appointmentId: result.insertId, message: 'Appointment booked successfully!' });
  } catch (err) {
    // This will catch both the SELECT and INSERT query errors.
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to create a new patient (for login page)
app.post('/api/patients', async (req, res) => {
    const { name, age, gender, phone_number, address } = req.body;
    if (!name || !age || !gender || !phone_number) {
        return res.status(400).json({ error: 'Missing required patient details.' });
    }
    const [lastPatient] = await pool.query("SELECT patient_id FROM PATIENT ORDER BY patient_id DESC LIMIT 1");
    const lastIdNum = lastPatient.length > 0 ? parseInt(lastPatient[0].patient_id.replace('PT', '')) : 0;
    const newPatientId = `PT${String(lastIdNum + 1).padStart(3, '0')}`;

    const sql = 'INSERT INTO PATIENT (patient_id, name, age, gender, phone_number, address, registration_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())';
    const [result] = await pool.query(sql, [newPatientId, name, age, gender, phone_number, address || null]);
    res.status(201).json({ patient_id: newPatientId, name, age, gender, phone_number, address });
});

// Endpoint to submit a rating/review
app.post('/api/ratings', async (req, res) => {
  const { patientId, doctorId, ratingValue, reviewComments } = req.body;
  if (!patientId) return res.status(400).json({ error: 'Patient ID is required.' });

  const sql = 'INSERT INTO RATING (doctor_id, patient_id, rating_value, review_comments, rating_date) VALUES (?, ?, ?, ?, CURDATE())';
  try {
    await pool.query(sql, [doctorId, patientId, ratingValue, reviewComments]);
    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('Error submitting rating:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
