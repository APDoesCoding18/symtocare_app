-- Schema for symtocareFinal (CREATE database then run)
CREATE DATABASE IF NOT EXISTS symtocareFinal;
USE symtocareFinal;

-- 1. SPECIALIZATION: Lists all medical specialties.
CREATE TABLE SPECIALIZATION (
    specialization_id INT PRIMARY KEY AUTO_INCREMENT,
    specialization_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. DOCTOR: Stores details about doctors.
CREATE TABLE DOCTOR (
    doctor_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization_id INT,
    qualification VARCHAR(100),
    experience INT,
    hospital_affiliation VARCHAR(100),
    city VARCHAR(50),
    phone_number VARCHAR(15),
    CONSTRAINT fk_specialization FOREIGN KEY (specialization_id) REFERENCES SPECIALIZATION(specialization_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_doctor_id CHECK (doctor_id LIKE 'DR%')
);

-- 3. PATIENT: Stores details of all patients.
CREATE TABLE PATIENT (
    patient_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    address VARCHAR(255),
    phone_number VARCHAR(15),
    registration_date DATE,
    CONSTRAINT chk_patient_id CHECK (patient_id LIKE 'PT%')
);

-- 4. DOCTOR_AVAILABILITY: Stores doctors' schedules.
CREATE TABLE DOCTOR_AVAILABILITY (
    availability_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id VARCHAR(20),
    available_date DATE,
    time_slot VARCHAR(50),
    mode CHAR(1) CHECK (mode IN ('O', 'F')), -- O: Online, F: Offline
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Booked')),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id) ON DELETE CASCADE
);

-- 5. APPOINTMENT: Stores appointment details.
CREATE TABLE APPOINTMENT (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(20),
    doctor_id VARCHAR(20),
    appointment_date DATE,
    time_slot VARCHAR(50),
    mode CHAR(1),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id) ON DELETE CASCADE
);

-- 6. DIAGNOSIS: Stores doctor's diagnosis after consultation.
CREATE TABLE DIAGNOSIS (
    diagnosis_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT,
    diagnosis_summary TEXT,
    advice TEXT,
    follow_up_date DATE,
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id) ON DELETE CASCADE
);

-- 7. PRESCRIPTION: Stores medicines prescribed.
CREATE TABLE PRESCRIPTION (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    diagnosis_id INT,
    medicine_name VARCHAR(100),
    dosage VARCHAR(100),
    duration VARCHAR(50),
    FOREIGN KEY (diagnosis_id) REFERENCES DIAGNOSIS(diagnosis_id) ON DELETE CASCADE
);

-- 8. LAB_TEST: Stores recommended lab tests.
CREATE TABLE LAB_TEST (
    labtest_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT,
    test_name VARCHAR(100),
    test_date DATE,
    result VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id) ON DELETE CASCADE
);

-- 9. RATING: Patients rate doctors.
CREATE TABLE RATING (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id VARCHAR(20),
    patient_id VARCHAR(20),
    rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
    review_comments TEXT,
    rating_date DATE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, patient_id) -- One rating per patient for a doctor
);

-- 10. SYMPTOM_ENTRY: Patient's symptom entries.
CREATE TABLE SYMPTOM_ENTRY (
    symptom_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(20),
    symptoms_description TEXT,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);
