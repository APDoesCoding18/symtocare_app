document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';

  // --- User Authentication ---
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'login.html'; // Redirect to login if not logged in
    return;
  }

  // --- Element Selection ---

  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link');
  const searchView = document.getElementById('search-view');
  const appointmentsView = document.getElementById('appointments-view');
  const doctorDashboardView = document.getElementById('doctor-dashboard-view');
  const inboxView = document.getElementById('inbox-view');
  const patientAppointmentsList = document.getElementById('patient-appointments-list');

  // Dashboard elements
  const doctorSelect = document.getElementById('doctor-select');
  const doctorAppointmentsList = document.getElementById('doctor-appointments-list');

  // Search elements
  const searchForm = document.getElementById('search-form');
  const specializationSelect = document.getElementById('specialization');
  const cityInput = document.getElementById('city');
  const symptomsInput = document.getElementById('symptoms');
  const resultsContainer = document.getElementById('results');
  const inboxMessagesList = document.getElementById('inbox-messages-list');

  // --- Core Functions ---

  // 1. Load specializations into the dropdown on page load
  async function loadSpecializations() {
    try {
      const res = await fetch(`${API_BASE_URL}/specializations`);
      const specializations = await res.json();
      
      specializations.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec.specialization_id;
        option.textContent = spec.specialization_name;
        specializationSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load specializations:', error);
      resultsContainer.innerHTML = '<p class="error">Could not load specializations. Please try again later.</p>';
    }
  }

  // 2. Handle the search form submission
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    resultsContainer.innerHTML = '<p class="message">Searching...</p>';

    const specializationId = specializationSelect.value;
    const city = cityInput.value.trim();
    const symptoms = symptomsInput.value.trim();

    // Build the query string
    const params = new URLSearchParams();
    if (specializationId) params.append('specializationId', specializationId);
    if (city) params.append('city', city);
    if (symptoms) params.append('symptoms', symptoms);

    try {
      const res = await fetch(`${API_BASE_URL}/doctors/search?${params.toString()}`);
      const doctors = await res.json();
      displayResults(doctors);
    } catch (error) {
      console.error('Search failed:', error);
      resultsContainer.innerHTML = '<p class="message">Search failed. Please check your connection and try again.</p>';
    }
  });

  // 3. Display the search results
  function displayResults(doctors) {
    resultsContainer.innerHTML = '<h2>Results</h2>';

    if (!doctors || doctors.length === 0) {
      resultsContainer.innerHTML += '<p class="message">No doctors found matching your criteria.</p>';
      return;
    }

    doctors.forEach(doctor => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${doctor.name}</h3>
        <p><strong>Specialty:</strong> ${doctor.specialization_name || 'N/A'}</p>
        <p><strong>Experience:</strong> ${doctor.experience ? doctor.experience + ' years' : 'N/A'}</p>
        <p><strong>Location:</strong> ${doctor.city || 'N/A'}</p>
        <p><strong>Affiliation:</strong> ${doctor.hospital_affiliation || 'Private Practice'}</p>
        <button class="book-btn" data-doctor-id="${doctor.doctor_id}">Book Appointment</button>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // 4. Fetch and display appointments
  async function loadAppointments() {
    if (currentUser.type !== 'patient') return;
    patientAppointmentsList.innerHTML = '<p class="message">Loading appointments...</p>';
    try {
      const res = await fetch(`${API_BASE_URL}/appointments?patientId=${currentUser.id}`);
      const appointments = await res.json();

      if (!appointments || appointments.length === 0) {
        patientAppointmentsList.innerHTML = '<p class="message">You have no upcoming or past appointments.</p>';
        return;
      }

      // Clear loading message
      patientAppointmentsList.innerHTML = '';

      appointments.forEach(appt => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        const appointmentDate = new Date(appt.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        card.innerHTML = `
          <h3>${appt.specialization_name} Consultation</h3>
          <p><strong>Doctor:</strong> ${appt.doctor_name}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appt.time_slot}</p>
          <p><strong>Status:</strong> <span class="status">${appt.status}</span></p>`;

        // Lab Test Section for Patient
        if (appt.lab_test_status === 'Requested') {
            card.innerHTML += `<div class="lab-test-info requested">
                <p><strong>Lab Test Requested:</strong> ${appt.test_name}</p>
                <button class="upload-lab-btn" data-labtest-id="${appt.labtest_id}">Upload Report</button>
            </div>`;
        } else if (appt.lab_test_status === 'Submitted') {
            card.innerHTML += `<p class="lab-test-info submitted"><strong>Lab Test:</strong> Report Submitted</p>`;
        }

        // Diagnosis and Prescription Section for Patient
        if (appt.diagnosis_id) {
            let diagnosisHtml = `
                <div class="diagnosis-info">
                    <h4>Diagnosis Details</h4>
                    <p><strong>Summary:</strong> ${appt.diagnosis_summary}</p>
                    <p><strong>Doctor's Advice:</strong> ${appt.advice || 'N/A'}</p>
                    ${appt.follow_up_date ? `<p><strong>Follow-up Date:</strong> ${new Date(appt.follow_up_date).toLocaleDateString()}</p>` : ''}
                </div>
            `;

            if (appt.prescriptions && appt.prescriptions.length > 0) {
                diagnosisHtml += `
                    <div class="prescription-info">
                        <h4>Prescription</h4>
                        <table>
                            <tr><th>Medicine</th><th>Dosage</th><th>Duration</th></tr>
                            ${appt.prescriptions.map(p => `<tr><td>${p.medicine_name}</td><td>${p.dosage}</td><td>${p.duration}</td></tr>`).join('')}
                        </table>
                    </div>
                `;
            }
            card.innerHTML += diagnosisHtml;
        }

        // Review Button
        if (appt.status === 'Completed' && !appt.has_rated) {
            card.innerHTML += `<button class="review-btn" data-doctor-id="${appt.doctor_id}" data-doctor-name="${appt.doctor_name}">Leave a Review</button>`;
          }
        ;
        patientAppointmentsList.appendChild(card);
      });

    } catch (error) {
      console.error('Failed to load appointments:', error);
      patientAppointmentsList.innerHTML = '<p class="message">Could not load appointments. Please try again later.</p>';
    }
  }

  // 4a. Load doctors into the dashboard dropdown
  async function loadDoctorsForDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`);
      const doctors = await res.json();
      
      doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>'; // Reset
      doctors.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.doctor_id;
        option.textContent = doc.name;
        doctorSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load doctors for dashboard:', error);
      doctorAppointmentsList.innerHTML = '<p class="error">Could not load doctor list.</p>';
    }
  }

  // 4b. Fetch and display appointments for the selected doctor
  async function loadDoctorAppointments(doctorId) {
    doctorAppointmentsList.innerHTML = `<p class="message">Loading appointments for ${currentUser.name}...</p>`;
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`);
      const appointments = await res.json();

      if (!appointments || appointments.length === 0) {
        doctorAppointmentsList.innerHTML = '<p class="message">No appointments found for the selected doctor.</p>';
        return;
      }

      doctorAppointmentsList.innerHTML = ''; // Clear loading message

      appointments.forEach(appt => {
        const card = document.createElement('div');
        card.className = 'appointment-card'; // Reuse existing style
        const appointmentDate = new Date(appt.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        card.innerHTML = `
          <h3>Appointment with ${appt.patient_name}</h3>
          <p><strong>Patient Phone:</strong> ${appt.patient_phone || 'N/A'}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appt.time_slot}</p>
          <p><strong>Status:</strong> <span class="status" value="${appt.status}">${appt.status}</span></p>`;

        // Lab Test Section for Doctor
        if (appt.status === 'Confirmed' || appt.status === 'Completed') {
            if (appt.lab_test_status === 'Requested') {
                card.innerHTML += `<p class="lab-test-info requested"><strong>Lab Test:</strong> Requested (${appt.test_name})</p>`;
            } else if (appt.lab_test_status === 'Submitted') {
                card.innerHTML += `<div class="lab-test-info submitted">
                    <p><strong>Lab Test:</strong> Report Submitted for "${appt.test_name}"</p>
                    <button class="view-lab-btn" data-result="${appt.lab_test_result}" data-test-date="${appt.lab_test_date}">View Report</button>
                    <div class="lab-result-display hidden"></div>
                </div>`;
            } else {
                card.innerHTML += `<button class="request-lab-btn" data-appointment-id="${appt.appointment_id}">Request Lab Report</button>`;
            }
        }

        // Diagnosis Section for Doctor
        if (appt.status === 'Completed') {
            if (appt.diagnosis_id) {
                card.innerHTML += `<div class="diagnosis-info">
                    <p><strong>Diagnosis Added.</strong></p>
                    <button class="add-prescription-btn" data-diagnosis-id="${appt.diagnosis_id}">Add Prescription</button>
                </div>`;
            } else {
                card.innerHTML += `<button class="add-diagnosis-btn" data-appointment-id="${appt.appointment_id}">Add Diagnosis</button>`;
            }
        }
        // The cancel button should only show for appointments that are not yet completed or cancelled.
        if (appt.status === 'Confirmed' || appt.status === 'Pending') {
            card.innerHTML += `<button class="cancel-btn" data-appointment-id="${appt.appointment_id}">Cancel Appointment</button>`;
        }
        doctorAppointmentsList.appendChild(card);
      });

      // Add "Complete Appointment" button for confirmed appointments
      appointments.filter(a => a.status === 'Confirmed').forEach(appt => {
          document.querySelector(`.appointment-card:has([data-appointment-id="${appt.appointment_id}"])`).insertAdjacentHTML('beforeend', `<button class="complete-appt-btn" data-appointment-id="${appt.appointment_id}">Mark as Complete</button>`);
      });

    } catch (error) {
      console.error('Failed to load doctor appointments:', error);
      doctorAppointmentsList.innerHTML = '<p class="error">Could not load appointments.</p>';
    }
  }

  // Add availability form to the doctor dashboard
  function showAddAvailabilityForm() {
    const formHtml = `
        <div class="card" id="availability-form-container">
            <h3>Add Your Available Time Slots</h3>
            <form id="add-availability-form">
                <div class="form-group">
                    <label for="avail-date">Date</label>
                    <input type="date" id="avail-date" name="availableDate" required>
                </div>
                <div class="form-group">
                    <label for="avail-start-time">Start Time</label>
                    <input type="time" id="avail-start-time" name="startTime" required>
                </div>
                <div class="form-group">
                    <label for="avail-end-time">End Time</label>
                    <input type="time" id="avail-end-time" name="endTime" required>
                </div>
                <button type="submit">Add Slots</button>
            </form>
        </div>`;
    doctorDashboardView.insertAdjacentHTML('afterbegin', formHtml);
  }

  // 4c. Load inbox messages
  async function loadInboxMessages() {
    if (currentUser.type !== 'patient') return;
    inboxMessagesList.innerHTML = '<p class="message">Loading messages...</p>';
    try {
        const res = await fetch(`${API_BASE_URL}/inbox/${currentUser.id}`);
        const messages = await res.json();

        if (!messages || messages.length === 0) {
            inboxMessagesList.innerHTML = '<p class="message">You have no messages.</p>';
            return;
        }

        inboxMessagesList.innerHTML = '';
        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'appointment-card'; // Reuse style for consistency
            const receivedDate = new Date(msg.received_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
            card.innerHTML = `
                <p>${msg.Pmsg}</p>
                <p><small><strong>Received:</strong> ${receivedDate}</small></p>
            `;
            inboxMessagesList.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load inbox:', error);
        inboxMessagesList.innerHTML = '<p class="error">Could not load messages.</p>';
    }
  }

  // --- Event Listeners ---

  // 5. Handle navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');

      if (link.id === 'nav-search') {
        searchView.classList.remove('hidden');
        appointmentsView.classList.add('hidden');
        inboxView.classList.add('hidden');
        doctorDashboardView.classList.add('hidden');
      } else if (link.id === 'nav-appointments') {
        searchView.classList.add('hidden');
        appointmentsView.classList.remove('hidden');
        inboxView.classList.add('hidden');
        doctorDashboardView.classList.add('hidden');
        loadAppointments(); // Fetch appointments when tab is clicked
      } else if (link.id === 'nav-inbox') {
        searchView.classList.add('hidden');
        appointmentsView.classList.add('hidden');
        inboxView.classList.remove('hidden');
        doctorDashboardView.classList.add('hidden');
        loadInboxMessages();
      } else if (link.id === 'nav-dashboard') {
        searchView.classList.add('hidden');
        appointmentsView.classList.add('hidden');
        inboxView.classList.add('hidden');
        doctorDashboardView.classList.remove('hidden');
        loadDoctorsForDashboard(); // Fetch doctor list
        // Clear the list initially
        doctorAppointmentsList.innerHTML = '<p class="message">Please select your name from the dropdown to see appointments.</p>';
      } else if (link.id === 'nav-profile') {
        window.location.href = link.href; // Allow navigation to profile page
      }
    });
  });

  // 6. Handle "Book Appointment" clicks
  resultsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('book-btn')) {
      showBookingForm(event.target);
    }
  });

  // 7. Handle "Leave a Review" clicks
  patientAppointmentsList.addEventListener('click', (event) => {
    if (event.target.classList.contains('review-btn')) {
      showReviewForm(event.target);
    }
    // Handle "Upload Lab Report" clicks
    if (event.target.classList.contains('upload-lab-btn')) {
        showLabUploadForm(event.target);
    }
  });

  // 8. Handle doctor selection in dashboard
  doctorSelect.addEventListener('change', (event) => {
    loadDoctorAppointments(event.target.value);
  });

  // Handle doctor appointment actions (cancellation)
  doctorAppointmentsList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('cancel-btn')) { // Cancel Appointment
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        const appointmentId = event.target.dataset.appointmentId;
        try {
            const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
                method: 'PUT'
            });
            const result = await res.json();
            alert(result.message);
            if (res.ok) {
                loadDoctorAppointments(doctorSelect.value); // Refresh the list
            }
        } catch (error) {
            alert('Failed to cancel appointment.');
        }
    } else if (event.target.classList.contains('request-lab-btn')) { // Request Lab Test
        const appointmentId = event.target.dataset.appointmentId;
        const testName = prompt("Please enter the name of the lab test to request:");

        if (testName) {
            try {
                const res = await fetch(`${API_BASE_URL}/labtests/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appointmentId, testName })
                });
                const result = await res.json();
                alert(result.message || result.error);
                if (res.ok) {
                    loadDoctorAppointments(doctorSelect.value); // Refresh list
                }
            } catch (error) {
                console.error('Error requesting lab test:', error);
                alert('An error occurred while requesting the lab test.');
            }
        }
    } else if (event.target.classList.contains('view-lab-btn')) { // View Lab Report
        const button = event.target;
        const resultDisplay = button.nextElementSibling;
        
        if (resultDisplay.classList.contains('hidden')) {
            const result = button.dataset.result;
            const testDate = new Date(button.dataset.testDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            resultDisplay.innerHTML = `
                <p><strong>Test Date:</strong> ${testDate}</p>
                <p><strong>Result/Summary:</strong></p>
                <pre>${result}</pre>
            `;
            resultDisplay.classList.remove('hidden');
            button.textContent = 'Hide Report';
        } else {
            resultDisplay.classList.add('hidden');
            button.textContent = 'View Report';
        }
    } else if (event.target.classList.contains('complete-appt-btn')) { // Mark as Complete
        if (!confirm('Are you sure you want to mark this appointment as completed?')) return;
        const appointmentId = event.target.dataset.appointmentId;
        try {
            const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, { method: 'PUT' });
            const result = await res.json();
            alert(result.message || result.error);
            if (res.ok) loadDoctorAppointments(doctorSelect.value);
        } catch (error) {
            alert('An error occurred.');
        }
    } else if (event.target.classList.contains('add-diagnosis-btn')) { // Add Diagnosis
        showDiagnosisForm(event.target);
    } else if (event.target.classList.contains('add-prescription-btn')) { // Add Prescription
        showPrescriptionForm(event.target);
    }
  });

  // 9. Handle Logout
  document.getElementById('nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });


  // --- Inline Form Functions ---

  async function showBookingForm(button) {
    const card = button.closest('.card');
    const doctorId = button.dataset.doctorId;
    const originalContent = card.innerHTML;

    button.style.display = 'none';
    card.insertAdjacentHTML('beforeend', '<div class="inline-form"><p>Loading available slots...</p></div>');

    // Fetch available slots
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/availability`);
    const slots = await res.json();

    let formHtml;
    if (slots.length === 0) {
        formHtml = `<div class="inline-form"><p>This doctor has no available slots.</p><button type="button" class="cancel-btn">Close</button></div>`;
    } else {
        const slotOptions = slots.map(slot => {
            const date = new Date(slot.available_date).toLocaleDateString('en-CA'); // YYYY-MM-DD
            const startTime = slot.start_time.substring(0, 5);
            const endTime = slot.end_time.substring(0, 5);
            return `<option value="${slot.availability_id}">${date} at ${startTime} - ${endTime}</option>`;
        }).join('');

        formHtml = `
          <div class="inline-form">
            <h4>Select an Available Slot</h4>
            <form class="booking-form-inline">
              <input type="hidden" name="doctorId" value="${doctorId}">
              <div class="form-group">
                <label for="app-slot-${doctorId}">Available Slots</label>
                <select id="app-slot-${doctorId}" name="availabilityId" required>
                  <option value="">-- Please select a time --</option>
                  ${slotOptions}
                </select>
              </div>
              <div class="inline-form-actions">
                <button type="submit">Confirm</button>
                <button type="button" class="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        `;
    }

    // Replace loading message with the form or message
    card.querySelector('.inline-form').remove();
    card.insertAdjacentHTML('beforeend', formHtml);

    card.querySelector('.cancel-btn').addEventListener('click', () => {
      card.innerHTML = originalContent;
    });

    // Add submit listener only if the form was created
    const bookingForm = card.querySelector('.booking-form-inline');
    if (!bookingForm) return;

    card.querySelector('.booking-form-inline').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      data.patientId = currentUser.id;
      data.mode = 'F'; // Assuming 'F' for offline/in-person

      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('Appointment booked successfully!');
        document.getElementById('nav-appointments').click(); // Switch to appointments tab
      } else if (res.status === 409) {
        const errorData = await res.json();
        alert(`Booking Failed: ${errorData.error}`); // e.g., slot just got booked
        // We don't restore the card here, so the user can try another time.
      } else {
        const errorData = await res.json();
        alert(`Failed to book appointment. ${errorData.error || ''}`);
        card.innerHTML = originalContent; // Restore card on failure
      }
    });
  }

  function showReviewForm(button) {
    const card = button.closest('.appointment-card');
    const doctorId = button.dataset.doctorId;
    const originalContent = card.innerHTML;

    const formHtml = `
      <div class="inline-form">
        <h4>Leave a Review</h4>
        <form class="review-form-inline" data-appointment-id="${button.dataset.appointmentId}">
          <input type="hidden" name="doctorId" value="${doctorId}">
          <div class="form-group star-rating">
            <input type="radio" id="5-stars-${doctorId}" name="ratingValue" value="5" required/><label for="5-stars-${doctorId}">&#9733;</label>
            <input type="radio" id="4-stars-${doctorId}" name="ratingValue" value="4" /><label for="4-stars-${doctorId}">&#9733;</label>
            <input type="radio" id="3-stars-${doctorId}" name="ratingValue" value="3" /><label for="3-stars-${doctorId}">&#9733;</label>
            <input type="radio" id="2-stars-${doctorId}" name="ratingValue" value="2" /><label for="2-stars-${doctorId}">&#9733;</label>
            <input type="radio" id="1-star-${doctorId}" name="ratingValue" value="1" /><label for="1-star-${doctorId}">&#9733;</label>
          </div>
          <div class="form-group">
            <label for="review-comments-${doctorId}">Comments</label>
            <textarea id="review-comments-${doctorId}" name="reviewComments" rows="3"></textarea>
          </div>
          <div class="inline-form-actions">
            <button type="submit">Submit</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    button.style.display = 'none';
    card.insertAdjacentHTML('beforeend', formHtml);

    card.querySelector('.cancel-btn').addEventListener('click', () => {
      card.innerHTML = originalContent;
    });

    card.querySelector('.review-form-inline').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      data.patientId = currentUser.id;

      const res = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      alert(res.ok ? 'Review submitted!' : 'Failed to submit review.');
      loadAppointments(); // Refresh the appointments list
    });
  }

  function showLabUploadForm(button) {
    const card = button.closest('.appointment-card');
    const labtestId = button.dataset.labtestId;
    const originalContent = card.innerHTML;

    const formHtml = `
      <div class="inline-form">
        <h4>Upload Lab Report</h4>
        <form class="lab-upload-form">
          <div class="form-group">
            <label for="lab-date-${labtestId}">Test Date</label>
            <input type="date" id="lab-date-${labtestId}" name="testDate" required>
          </div>
          <div class="form-group">
            <label for="lab-result-${labtestId}">Result/Summary</label>
            <textarea id="lab-result-${labtestId}" name="result" rows="3" placeholder="Enter summary of results or link to report." required></textarea>
          </div>
          <div class="inline-form-actions">
            <button type="submit">Submit Report</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    // Hide everything else in the card and show the form
    card.innerHTML = formHtml;

    card.querySelector('.cancel-btn').addEventListener('click', () => {
      card.innerHTML = originalContent;
    });

    card.querySelector('.lab-upload-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch(`${API_BASE_URL}/labtests/${labtestId}/upload`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message || result.error);
        if (res.ok) {
          loadAppointments(); // Refresh the patient's appointment list
        }
      } catch (error) {
        console.error('Error submitting lab report:', error);
        alert('An error occurred while submitting the report.');
      }
    });
  }

  function showDiagnosisForm(button) {
    const card = button.closest('.appointment-card');
    const appointmentId = button.dataset.appointmentId;
    const originalContent = card.innerHTML;

    const formHtml = `
      <div class="inline-form">
        <h4>Add Diagnosis</h4>
        <form class="diagnosis-form">
          <div class="form-group">
            <label for="diag-summary-${appointmentId}">Diagnosis Summary</label>
            <textarea id="diag-summary-${appointmentId}" name="diagnosisSummary" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label for="diag-advice-${appointmentId}">Advice</label>
            <textarea id="diag-advice-${appointmentId}" name="advice" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="diag-followup-${appointmentId}">Follow-up Date</label>
            <input type="date" id="diag-followup-${appointmentId}" name="followUpDate">
          </div>
          <div class="inline-form-actions">
            <button type="submit">Save Diagnosis</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;
    card.innerHTML = formHtml;

    card.querySelector('.cancel-btn').addEventListener('click', () => card.innerHTML = originalContent);

    card.querySelector('.diagnosis-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      data.appointmentId = appointmentId;

      try {
        const res = await fetch(`${API_BASE_URL}/diagnosis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message || result.error);
        if (res.ok) loadDoctorAppointments(doctorSelect.value);
      } catch (error) {
        alert('An error occurred while saving the diagnosis.');
      }
    });
  }

  function showPrescriptionForm(button) {
    const card = button.closest('.appointment-card');
    const diagnosisId = button.dataset.diagnosisId;
    const originalContent = card.innerHTML;

    const formHtml = `
      <div class="inline-form">
        <h4>Add Prescription</h4>
        <form class="prescription-form">
          <div id="medicines-container">
            <div class="medicine-entry">
              <input type="text" name="medicineName" placeholder="Medicine Name" required>
              <input type="text" name="dosage" placeholder="Dosage (e.g., 1-0-1)" required>
              <input type="text" name="duration" placeholder="Duration (e.g., 5 days)" required>
            </div>
          </div>
          <button type="button" id="add-medicine-btn">Add Another Medicine</button>
          <div class="inline-form-actions">
            <button type="submit">Save Prescription</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;
    card.innerHTML = formHtml;

    card.querySelector('.cancel-btn').addEventListener('click', () => card.innerHTML = originalContent);

    card.querySelector('#add-medicine-btn').addEventListener('click', () => {
        const container = card.querySelector('#medicines-container');
        const newEntry = document.createElement('div');
        newEntry.className = 'medicine-entry';
        newEntry.innerHTML = `
            <input type="text" name="medicineName" placeholder="Medicine Name" required>
            <input type="text" name="dosage" placeholder="Dosage (e.g., 1-0-1)" required>
            <input type="text" name="duration" placeholder="Duration (e.g., 5 days)" required>
        `;
        container.appendChild(newEntry);
    });

    card.querySelector('.prescription-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const entries = e.target.querySelectorAll('.medicine-entry');
      const prescriptions = Array.from(entries).map(entry => ({
          medicineName: entry.querySelector('[name="medicineName"]').value,
          dosage: entry.querySelector('[name="dosage"]').value,
          duration: entry.querySelector('[name="duration"]').value,
      }));

      if (prescriptions.some(p => !p.medicineName || !p.dosage || !p.duration)) {
          alert('Please fill out all fields for each medicine.');
          return;
      }

      const data = { diagnosisId, prescriptions };

      try {
        const res = await fetch(`${API_BASE_URL}/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message || result.error);
        if (res.ok) {
            card.innerHTML = originalContent; // Restore original card view
            // Optionally, just update the button text or state
            const diagInfo = card.querySelector('.diagnosis-info');
            if (diagInfo) diagInfo.innerHTML += '<p><em>Prescription added.</em></p>';
            button.remove(); // Remove the "Add Prescription" button
        }
      } catch (error) {
        alert('An error occurred while saving the prescription.');
      }
    });
  }

  // --- UI Initialization ---
  function initializeUI() {
    const navSearch = document.getElementById('nav-search');
    const navAppointments = document.getElementById('nav-appointments');
    const navDashboard = document.getElementById('nav-dashboard');
    const navInbox = document.getElementById('nav-inbox');
    const navProfile = document.getElementById('nav-profile');

    if (currentUser.type === 'patient') {
      navDashboard.remove(); // Remove doctor dashboard link
      searchView.classList.remove('hidden');
      loadSpecializations();
    } else if (currentUser.type === 'doctor') {
      navInbox.remove();
      navProfile.remove(); // Remove profile link for doctors for now
      navSearch.remove(); // Remove patient links
      navAppointments.remove();
      navDashboard.classList.add('active');
      
      searchView.classList.add('hidden'); // Hide patient search view
      doctorDashboardView.classList.remove('hidden');
      document.querySelector('.dashboard-header').innerHTML = `<h2>Appointments for ${currentUser.name}</h2>`;
      loadDoctorAppointments(currentUser.id);
      showAddAvailabilityForm();

      // Add event listener for the new form
      document.getElementById('add-availability-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData.entries());
          data.doctorId = currentUser.id;

          try {
              const res = await fetch(`${API_BASE_URL}/availability`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
              });
              const result = await res.json();
              alert(result.message || result.error);
              if (res.ok) {
                  e.target.reset(); // Clear the form on success
              }
          } catch (error) {
              alert('An error occurred while adding availability.');
          }
      });
    }
  }

  // --- Initial Load ---

  // Initial setup
  initializeUI();
});
