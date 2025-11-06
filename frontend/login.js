document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';

    // Role selection
    const rolePatientRadio = document.getElementById('role-patient');
    const roleDoctorRadio = document.getElementById('role-doctor');

    // Forms
    const patientLoginForm = document.getElementById('patient-login-form');
    const doctorLoginForm = document.getElementById('doctor-login-form');

    // Form elements
    const patientSelect = document.getElementById('patient-select');
    const doctorLoginSelect = document.getElementById('doctor-login-select');
    const createPatientBtn = document.getElementById('create-patient-btn');

    // Modal elements
    const newPatientModal = document.getElementById('new-patient-modal');
    const newPatientForm = document.getElementById('new-patient-form');
    const modalCloseBtn = document.getElementById('modal-close');

    // --- Event Listeners ---

    // Toggle forms based on role
    rolePatientRadio.addEventListener('change', () => {
        patientLoginForm.classList.remove('hidden');
        doctorLoginForm.classList.add('hidden');
    });

    roleDoctorRadio.addEventListener('change', () => {
        patientLoginForm.classList.add('hidden');
        doctorLoginForm.classList.remove('hidden');
    });

    // Patient login
    patientLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const patientId = patientSelect.value;
        if (!patientId) return;
        const patientName = patientSelect.options[patientSelect.selectedIndex].text;
        loginUser('patient', patientId, patientName);
    });

    // Doctor login
    doctorLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const doctorId = doctorLoginSelect.value;
        if (!doctorId) return;
        const doctorName = doctorLoginSelect.options[doctorLoginSelect.selectedIndex].text;
        loginUser('doctor', doctorId, doctorName);
    });

    // Modal controls
    createPatientBtn.addEventListener('click', () => newPatientModal.classList.remove('hidden'));
    modalCloseBtn.addEventListener('click', () => newPatientModal.classList.add('hidden'));

    // New patient creation
    newPatientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientData = {
            name: document.getElementById('new-patient-name').value,
            age: document.getElementById('new-patient-age').value,
            gender: document.getElementById('new-patient-gender').value,
            phone_number: document.getElementById('new-patient-phone').value,
            address: document.getElementById('new-patient-address').value,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData)
            });
            if (res.ok) {
                const newPatient = await res.json();
                alert(`Profile for ${newPatient.name} created successfully!`);
                loginUser('patient', newPatient.patient_id, newPatient.name);
            } else {
                alert('Failed to create patient profile.');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // --- Data Loading Functions ---

    async function loadPatients() {
        try {
            const res = await fetch(`${API_BASE_URL}/patients`);
            const patients = await res.json();
            patientSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
            patients.forEach(p => {
                patientSelect.innerHTML += `<option value="${p.patient_id}">${p.name}</option>`;
            });
        } catch (error) {
            console.error('Failed to load patients:', error);
            patientSelect.innerHTML = '<option value="">Could not load patients</option>';
        }
    }

    async function loadDoctors() {
        try {
            const res = await fetch(`${API_BASE_URL}/doctors`);
            const doctors = await res.json();
            doctorLoginSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
            doctors.forEach(d => {
                doctorLoginSelect.innerHTML += `<option value="${d.doctor_id}">${d.name}</option>`;
            });
        } catch (error) {
            console.error('Failed to load doctors:', error);
            doctorLoginSelect.innerHTML = '<option value="">Could not load doctors</option>';
        }
    }

    function loginUser(type, id, name) {
        const user = { type, id, name };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'index.html';
    }

    // --- Initial Load ---
    loadPatients();
    loadDoctors();
});