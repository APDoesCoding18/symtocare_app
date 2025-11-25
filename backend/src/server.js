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
      lt.labtest_id,
      lt.test_name,
      lt.status as lab_test_status,
      lt.result as lab_test_result,
      lt.test_date as lab_test_date,
      p.name as patient_name,
      p.phone_number as patient_phone
    FROM APPOINTMENT a
    JOIN PATIENT p ON a.patient_id = p.patient_id
    LEFT JOIN LAB_TEST lt ON a.appointment_id = lt.appointment_id
    WHERE a.doctor_id = ?
    AND a.status IN ('Confirmed', 'Completed')
    ORDER BY a.appointment_date ASC, a.time_slot ASC
  `;

  const [appointments] = await pool.query(sql, [doctorId]);
  res.json(appointments);
});

// Endpoint for a doctor to ADD their availability
app.post('/api/availability', async (req, res) => {
    const { doctorId, availableDate, startTime, endTime } = req.body;
    if (!doctorId || !availableDate || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required availability details.' });
    }

    try {
        // The doctor provides a date and a time range. We'll generate 1-hour slots.
        const slots = [];
        let currentTime = new Date(`${availableDate}T${startTime}`);
        const lastTime = new Date(`${availableDate}T${endTime}`);

        while (currentTime < lastTime) {
            const nextTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
            slots.push([
                doctorId,
                availableDate,
                currentTime.toTimeString().split(' ')[0], // "HH:MM:SS"
                nextTime.toTimeString().split(' ')[0]
            ]);
            currentTime = nextTime;
        }

        if (slots.length === 0) {
            return res.status(400).json({ error: 'End time must be after start time.' });
        }

        const sql = 'INSERT INTO DOCTOR_AVAILABILITY (doctor_id, available_date, start_time, end_time) VALUES ?';
        await pool.query(sql, [slots]);

        res.status(201).json({ message: `${slots.length} time slots added successfully for ${availableDate}.` });
    } catch (err) {
        console.error('Error adding availability:', err);
        // Handle potential duplicate entry errors
        res.status(500).json({ error: 'Database error or duplicate time slot.' });
    }
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

// Endpoint to get a single patient's details
app.get('/api/patients/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [patients] = await pool.query('SELECT * FROM PATIENT WHERE patient_id = ?', [patientId]);
        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient not found.' });
        }
        res.json(patients[0]);
    } catch (err) {
        console.error('Error fetching patient:', err);
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
      d.doctor_id,
      s.specialization_name,
      lt.labtest_id,
      lt.test_name,
      lt.status as lab_test_status,
      (SELECT rating_id FROM RATING r WHERE r.doctor_id = a.doctor_id AND r.patient_id = a.patient_id) IS NOT NULL AS has_rated
    FROM APPOINTMENT a
    JOIN DOCTOR d ON a.doctor_id = d.doctor_id
    LEFT JOIN LAB_TEST lt ON a.appointment_id = lt.appointment_id
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

// Endpoint to get inbox messages for a patient
app.get('/api/inbox/:patientId', async (req, res) => {
    const { patientId } = req.params;
    if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required.' });
    }

    try {
        const [messages] = await pool.query(
            'SELECT Pmsg, received_at FROM PATIENT_INBOX WHERE patient_id = ? ORDER BY received_at DESC',
            [patientId]
        );
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for a patient to GET a doctor's available, unbooked slots
app.get('/api/doctors/:doctorId/availability', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const sql = `
            SELECT availability_id, available_date, start_time, end_time 
            FROM DOCTOR_AVAILABILITY 
            WHERE doctor_id = ? AND is_booked = FALSE AND available_date >= CURDATE()
            ORDER BY available_date, start_time
        `;
        const [slots] = await pool.query(sql, [doctorId]);
        res.json(slots);
    } catch (err) {
        console.error('Error fetching availability:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint to book an appointment
app.post('/api/appointments', async (req, res) => {
  const { patientId, doctorId, availabilityId, mode } = req.body;

  if (!patientId || !doctorId || !availabilityId || !mode) {
    return res.status(400).json({ error: 'Missing required appointment details.' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Lock the availability row and check if it's still available
    const [slots] = await connection.query('SELECT * FROM DOCTOR_AVAILABILITY WHERE availability_id = ? AND is_booked = FALSE FOR UPDATE', [availabilityId]);

    if (slots.length === 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'This time slot is no longer available. Please choose another time.' });
    }
    const slot = slots[0];

    // 2. Mark the slot as booked
    await connection.query('UPDATE DOCTOR_AVAILABILITY SET is_booked = TRUE WHERE availability_id = ?', [availabilityId]);

    // 3. Create the appointment record
    const timeSlot = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
    const appointmentSql = 'INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, time_slot, mode, status, availability_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.query(appointmentSql, [patientId, doctorId, slot.available_date, timeSlot, mode, 'Confirmed', availabilityId]);

    // 4. Send an inbox message
    const inboxMsg = `Your appointment with a doctor on ${slot.available_date.toISOString().split('T')[0]} at ${timeSlot} has been confirmed.`;
    await connection.query('INSERT INTO PATIENT_INBOX (patient_id, Pmsg, received_at) VALUES (?, ?, NOW())', [patientId, inboxMsg]);

    await connection.commit();
    res.status(201).json({ appointmentId: result.insertId, message: 'Appointment booked successfully!' });
  } catch (err) {
    await connection.rollback();
    console.error('Error booking appointment:', err);
    // Check for our custom trigger message
    if (err.sqlState === '45000') {
        // The error is from our trigger (e.g., date in the past)
        return res.status(400).json({ error: err.message });
    }
    // Handle other potential database errors
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Endpoint to cancel an appointment
app.put('/api/appointments/:appointmentId/cancel', async (req, res) => {
    const { appointmentId } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        // First, get patient_id and appointment details for the message
        const [appDetails] = await connection.query(
            'SELECT patient_id, appointment_date, time_slot, availability_id FROM APPOINTMENT WHERE appointment_id = ?',
            [appointmentId]
        );

        if (appDetails.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Appointment not found.' });
        }
        const { patient_id, appointment_date, time_slot, availability_id } = appDetails[0];

        const [result] = await connection.query(
            "UPDATE APPOINTMENT SET status = 'Cancelled' WHERE appointment_id = ? AND status IN ('Pending', 'Confirmed')",
            [appointmentId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Appointment not found or cannot be cancelled.' });
        }

        // Make the time slot available again
        if (availability_id) {
            await connection.query('UPDATE DOCTOR_AVAILABILITY SET is_booked = FALSE WHERE availability_id = ?', [availability_id]);
        }

        const inboxMsg = `Your appointment scheduled for ${appointment_date.toISOString().split('T')[0]} at ${time_slot} has been cancelled.`;
        await connection.query('INSERT INTO PATIENT_INBOX (patient_id, Pmsg, received_at) VALUES (?, ?, NOW())', [patient_id, inboxMsg]);

        await connection.commit();
        res.status(200).json({ message: 'Appointment has been cancelled.' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Database error during cancellation.' });
    } finally {
        connection.release();
    }
});

// Endpoint to create a new patient (for login page)
app.post('/api/patients', async (req, res) => {
    const { name, age, gender, phone_number, address } = req.body;
    if (!name || !age || !gender || !phone_number) {
        return res.status(400).json({ error: 'Missing required patient details.' });
    }
    try {
        const [lastPatient] = await pool.query("SELECT patient_id FROM PATIENT ORDER BY patient_id DESC LIMIT 1");
        const lastIdNum = lastPatient.length > 0 ? parseInt(lastPatient[0].patient_id.replace('PT', '')) : 0;
        const newPatientId = `PT${String(lastIdNum + 1).padStart(3, '0')}`;

        const sql = 'INSERT INTO PATIENT (patient_id, name, age, gender, phone_number, address, registration_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())';
        await pool.query(sql, [newPatientId, name, age, gender, phone_number, address || null]);
        res.status(201).json({ patient_id: newPatientId, name, age, gender, phone_number, address });
    } catch (err) {
        console.error('Error creating patient:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint to UPDATE a patient's details
app.put('/api/patients/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { name, age, gender, phone_number, address } = req.body;

    if (!name || !age || !gender || !phone_number) {
        return res.status(400).json({ error: 'Missing required patient details.' });
    }

    const sql = 'UPDATE PATIENT SET name = ?, age = ?, gender = ?, phone_number = ?, address = ? WHERE patient_id = ?';
    try {
        const [result] = await pool.query(sql, [name, age, gender, phone_number, address || null, patientId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Patient not found.' });
        }
        // Return the updated user object to refresh session storage on the client
        const updatedUser = { id: patientId, name, type: 'patient' };
        res.json({ message: 'Profile updated successfully!', user: updatedUser });
    } catch (err) {
        console.error('Error updating patient:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint to DELETE a patient's profile
app.delete('/api/patients/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        // The ON DELETE CASCADE constraint in the DB will handle deleting related records
        const [result] = await pool.query('DELETE FROM PATIENT WHERE patient_id = ?', [patientId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Patient not found.' });
        }
        res.status(200).json({ message: 'Patient profile deleted successfully.' });
    } catch (err) {
        // This will catch errors, including from triggers that prevent deletion
        console.error('Error deleting patient:', err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
});

// NOTE: Doctor profile management (UPDATE/DELETE) would typically be an admin function.

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


// Endpoint for a doctor to request a lab test for an appointment
app.post('/api/labtests/request', async (req, res) => {
    const { appointmentId, testName } = req.body;
    if (!appointmentId || !testName) {
        return res.status(400).json({ error: 'Appointment ID and test name are required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create the lab test record
        const labSql = 'INSERT INTO LAB_TEST (appointment_id, test_name, status) VALUES (?, ?, ?)';
        const [labResult] = await connection.query(labSql, [appointmentId, testName, 'Requested']);

        // 2. Get patient_id for the inbox message
        const [appDetails] = await connection.query('SELECT patient_id FROM APPOINTMENT WHERE appointment_id = ?', [appointmentId]);
        if (appDetails.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Appointment not found.' });
        }
        const patientId = appDetails[0].patient_id;

        // 3. Send a message to the patient's inbox
        const inboxMsg = `Your doctor has requested a lab test: "${testName}". Please upload the report in your appointments section.`;
        await connection.query('INSERT INTO PATIENT_INBOX (patient_id, Pmsg, received_at) VALUES (?, ?, NOW())', [patientId, inboxMsg]);

        await connection.commit();
        res.status(201).json({ message: 'Lab test requested successfully. Patient has been notified.', labtest_id: labResult.insertId });
    } catch (err) {
        await connection.rollback();
        console.error('Error requesting lab test:', err);
        res.status(500).json({ error: 'Database error while requesting lab test.' });
    } finally {
        connection.release();
    }
});

// Endpoint for a patient to upload/submit their lab test results
app.put('/api/labtests/:labtestId/upload', async (req, res) => {
    const { labtestId } = req.params;
    const { result, testDate } = req.body;

    if (!result || !testDate) {
        return res.status(400).json({ error: 'Test result and date are required.' });
    }

    try {
        const sql = "UPDATE LAB_TEST SET result = ?, test_date = ?, status = 'Submitted' WHERE labtest_id = ?";
        await pool.query(sql, [result, testDate, labtestId]);
        res.status(200).json({ message: 'Lab report submitted successfully!' });
    } catch (err) {
        console.error('Error uploading lab report:', err);
        res.status(500).json({ error: 'Database error while submitting report.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
