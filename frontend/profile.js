document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';

    // --- User Authentication ---
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- Element Selection ---
    const profileDisplayView = document.getElementById('profile-display-view');
    const editProfileView = document.getElementById('edit-profile-view');
    const editPatientForm = document.getElementById('edit-patient-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const navContainer = document.querySelector('header nav');

    let currentPatientData = null;

    // --- Core Functions ---

    function buildNav() {
        if (currentUser.type === 'patient') {
            navContainer.innerHTML = `
                <a href="index.html" id="nav-search" class="nav-link">Search Doctors</a>
                <a href="index.html#appointments" id="nav-appointments" class="nav-link">My Appointments</a>
                <a href="profile.html" id="nav-profile" class="nav-link active">My Profile</a>
                <a href="#" id="nav-logout" class="nav-link logout-btn">Logout</a>
            `;
        }
        // Add doctor nav if needed

        document.getElementById('nav-logout').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    async function loadProfile() {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${currentUser.id}`);
            if (!res.ok) throw new Error('Failed to fetch profile data.');
            
            currentPatientData = await res.json();
            displayProfile(currentPatientData);

        } catch (error) {
            console.error('Error loading profile:', error);
            profileDisplayView.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    function displayProfile(patient) {
        profileDisplayView.innerHTML = `
            <div class="profile-details">
                <h2>My Profile</h2>
                <p><strong>Name:</strong> ${patient.name}</p>
                <p><strong>Age:</strong> ${patient.age}</p>
                <p><strong>Gender:</strong> ${patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>
                <p><strong>Phone:</strong> ${patient.phone_number}</p>
                <p><strong>Address:</strong> ${patient.address || 'N/A'}</p>
                <p><strong>Member Since:</strong> ${new Date(patient.registration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="profile-actions">
                <button id="edit-profile-btn">Edit Profile</button>
                <button id="delete-profile-btn" class="delete-btn">Delete Profile</button>
            </div>
        `;

        document.getElementById('edit-profile-btn').addEventListener('click', showEditView);
        document.getElementById('delete-profile-btn').addEventListener('click', deleteProfile);
    }

    function showEditView() {
        if (!currentPatientData) return;

        // Pre-fill the form
        document.getElementById('edit-patient-name').value = currentPatientData.name;
        document.getElementById('edit-patient-age').value = currentPatientData.age;
        document.getElementById('edit-patient-gender').value = currentPatientData.gender;
        document.getElementById('edit-patient-phone').value = currentPatientData.phone_number;
        document.getElementById('edit-patient-address').value = currentPatientData.address || '';

        // Switch views
        profileDisplayView.classList.add('hidden');
        editProfileView.classList.remove('hidden');
    }

    async function deleteProfile() {
        if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${currentUser.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete profile.');

            alert('Profile deleted successfully.');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Error deleting profile:', error);
            alert(error.message);
        }
    }

    // --- Event Listeners ---

    cancelEditBtn.addEventListener('click', () => {
        editProfileView.classList.add('hidden');
        profileDisplayView.classList.remove('hidden');
    });

    editPatientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            name: document.getElementById('edit-patient-name').value,
            age: document.getElementById('edit-patient-age').value,
            gender: document.getElementById('edit-patient-gender').value,
            phone_number: document.getElementById('edit-patient-phone').value,
            address: document.getElementById('edit-patient-address').value,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/patients/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to update profile.');

            alert(result.message);
            sessionStorage.setItem('currentUser', JSON.stringify(result.user)); // Update session
            window.location.reload(); // Reload to show updated data

        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message);
        }
    });

    // --- Initial Load ---
    buildNav();
    loadProfile();
});