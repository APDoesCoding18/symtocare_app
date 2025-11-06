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

  // Dashboard elements
  const doctorSelect = document.getElementById('doctor-select');
  const doctorAppointmentsList = document.getElementById('doctor-appointments-list');

  // Search elements
  const searchForm = document.getElementById('search-form');
  const specializationSelect = document.getElementById('specialization');
  const cityInput = document.getElementById('city');
  const symptomsInput = document.getElementById('symptoms');
  const resultsContainer = document.getElementById('results');

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
    appointmentsView.innerHTML = '<h2>My Appointments</h2><p class="message">Loading appointments...</p>';
    try {
      const res = await fetch(`${API_BASE_URL}/appointments?patientId=${currentUser.id}`);
      const appointments = await res.json();

      if (!appointments || appointments.length === 0) {
        appointmentsView.innerHTML = '<h2>My Appointments</h2><p class="message">You have no upcoming or past appointments.</p>';
        return;
      }

      // Clear loading message
      appointmentsView.innerHTML = '<h2>My Appointments</h2>';

      appointments.forEach(appt => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        const appointmentDate = new Date(appt.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        card.innerHTML = `
          <h3>${appt.specialization_name} Consultation</h3>
          <p><strong>Doctor:</strong> ${appt.doctor_name}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appt.time_slot}</p>
          <p><strong>Status:</strong> <span class="status">${appt.status}</span></p>
          ${(appt.status === 'Completed' && !appt.has_rated) ? 
            `<button class="review-btn" data-doctor-id="${appt.doctor_id}" data-doctor-name="${appt.doctor_name}">Leave a Review</button>` : ''
          }
        `;
        appointmentsView.appendChild(card);
      });

    } catch (error) {
      console.error('Failed to load appointments:', error);
      appointmentsView.innerHTML = '<h2>My Appointments</h2><p class="message">Could not load appointments. Please try again later.</p>';
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
          <p><strong>Status:</strong> <span class="status" value="${appt.status}">${appt.status}</span></p>
        `;
        doctorAppointmentsList.appendChild(card);
      });

    } catch (error) {
      console.error('Failed to load doctor appointments:', error);
      doctorAppointmentsList.innerHTML = '<p class="error">Could not load appointments.</p>';
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
        doctorDashboardView.classList.add('hidden');
      } else if (link.id === 'nav-appointments') {
        searchView.classList.add('hidden');
        appointmentsView.classList.remove('hidden');
        doctorDashboardView.classList.add('hidden');
        loadAppointments(); // Fetch appointments when tab is clicked
      } else if (link.id === 'nav-dashboard') {
        searchView.classList.add('hidden');
        appointmentsView.classList.add('hidden');
        doctorDashboardView.classList.remove('hidden');
        loadDoctorsForDashboard(); // Fetch doctor list
        loadDoctorAppointments(null); // Show initial message
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
  appointmentsView.addEventListener('click', (event) => {
    if (event.target.classList.contains('review-btn')) {
      showReviewForm(event.target);
    }
  });

  // 8. Handle doctor selection in dashboard
  doctorSelect.addEventListener('change', (event) => {
    loadDoctorAppointments(event.target.value);
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

    // Create the inline form
    const formHtml = `
      <div class="inline-form">
        <h4>Book Appointment for ${currentUser.name}</h4>
        <form class="booking-form-inline">
          <input type="hidden" name="doctorId" value="${doctorId}">
          <input type="hidden" name="patientId" value="${currentUser.id}">
          <div class="form-group">
            <label for="app-date-${doctorId}">Date</label>
            <input type="date" id="app-date-${doctorId}" name="appointmentDate" required>
          </div>
          <div class="form-group">
            <label for="app-time-${doctorId}">Time Slot</label>
            <select id="app-time-${doctorId}" name="timeSlot" required>
              <option value="09:00 - 10:00">09:00 - 10:00</option>
              <option value="10:00 - 11:00">10:00 - 11:00</option>
              <option value="11:00 - 12:00">11:00 - 12:00</option>
              <option value="14:00 - 15:00">14:00 - 15:00</option>
            </select>
          </div>
          <div class="inline-form-actions">
            <button type="submit">Confirm</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    // Replace button with form
    button.style.display = 'none';
    card.insertAdjacentHTML('beforeend', formHtml);

    card.querySelector('.cancel-btn').addEventListener('click', () => {
      card.innerHTML = originalContent;
    });

    card.querySelector('.booking-form-inline').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
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
        alert(`Booking Failed: ${errorData.error}`);
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

  // --- UI Initialization ---
  function initializeUI() {
    const navSearch = document.getElementById('nav-search');
    const navAppointments = document.getElementById('nav-appointments');
    const navDashboard = document.getElementById('nav-dashboard');

    if (currentUser.type === 'patient') {
      navDashboard.remove(); // Remove doctor dashboard link
      searchView.classList.remove('hidden');
      loadSpecializations();
    } else if (currentUser.type === 'doctor') {
      navSearch.remove(); // Remove patient links
      navAppointments.remove();
      navDashboard.classList.add('active');
      
      searchView.classList.add('hidden'); // Hide patient search view
      doctorDashboardView.classList.remove('hidden');
      document.querySelector('.dashboard-header').innerHTML = `<h2>Appointments for ${currentUser.name}</h2>`;
      loadDoctorAppointments(currentUser.id);
    }
  }

  // --- Initial Load ---

  // Initial setup
  initializeUI();
});
