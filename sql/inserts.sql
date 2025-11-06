USE symtocareFinal;

-- 1. SPECIALIZATION
-- Clear table before inserting
DELETE FROM SPECIALIZATION;
INSERT INTO SPECIALIZATION (specialization_id, specialization_name) VALUES
(1, 'Cardiology'),
(2, 'Dermatology'),
(3, 'Neurology'),
(4, 'Pediatrics'),
(5, 'Orthopedics'),
(6, 'Psychiatry'),
(7, 'Gynecology'),
(8, 'Ophthalmology'),
(9, 'Gastroenterology');

-- 2. DOCTOR
DELETE FROM DOCTOR;
INSERT INTO DOCTOR (doctor_id, name, specialization_id, qualification, experience, hospital_affiliation, city, phone_number) VALUES
('DR001', 'Dr. Arjun Mehta', 1, 'MD, Cardiology', 15, 'Apollo Hospital', 'Mumbai', '9876543210'),
('DR002', 'Dr. Priya Nair', 2, 'MD, Dermatology', 10, 'Fortis Healthcare', 'Delhi', '9123456780'),
('DR003', 'Dr. Rajesh Khanna', 3, 'DM, Neurology', 20, 'AIIMS', 'New Delhi', '9988776655'),
('DR004', 'Dr. Sneha Verma', 4, 'MD, Pediatrics', 8, 'CMC Hospital', 'Vellore', '9090909090'),
('DR005', 'Dr. Rohit Sharma', 5, 'MS, Orthopedics', 12, 'Narayana Health', 'Bangalore', '9876001234'),
('DR006', 'Dr. Neha Patel', 6, 'DPM, Psychiatry', 9, 'Medanta Hospital', 'Gurugram', '9765432109'),
('DR007', 'Dr. Kavita Iyer', 7, 'MS, Gynecology', 14, 'Sunshine Hospital', 'Hyderabad', '9856743210'),
('DR008', 'Dr. Aditya Rao', 8, 'MS, Ophthalmology', 7, 'Max Healthcare', 'Mohali', '9123098765'),
('DR009', 'Dr. Vivek Singh', 1, 'MD, Cardiology', 18, 'Fortis Healthcare', 'Delhi', '9111222333'),
('DR010', 'Dr. Rina Kapoor', 5, 'MS, Orthopedics', 9, 'Apollo Hospital', 'Mumbai', '9876500001'),
('DR011', 'Dr. Anjali Desai', 9, 'MD, Gastroenterology', 11, 'Global Hospital', 'Chennai', '9821123456'),
('DR012', 'Dr. Vikram Rathod', 1, 'DM, Cardiology', 22, 'Narayana Health', 'Bangalore', '9900112233'),
('DR013', 'Dr. Fatima Khan', 2, 'MD, Dermatology', 6, 'Skin & Hair Clinic', 'Pune', '9876512345'),
('DR014', 'Dr. Suresh Gupta', 3, 'MD, Neurology', 13, 'Medanta Hospital', 'Gurugram', '9123498765'),
('DR015', 'Dr. Meera Reddy', 4, 'DCH, Pediatrics', 5, 'Rainbow Childrens Hospital', 'Hyderabad', '9000190001'),
('DR016', 'Dr. Alok Verma', 5, 'MS, Orthopedics', 16, 'AIIMS', 'New Delhi', '9810298102'),
('DR017', 'Dr. Sunita Patil', 7, 'DGO, Gynecology', 19, 'Cloudnine Hospital', 'Pune', '9988771122'),
('DR018', 'Dr. James Fernandes', 8, 'MS, Ophthalmology', 10, 'Sankara Nethralaya', 'Chennai', '9840098400'),
('DR019', 'Dr. Harish Kumar', 9, 'DM, Gastroenterology', 14, 'Apollo Hospital', 'Mumbai', '9820098200'),
('DR020', 'Dr. Preeti Singh', 6, 'MD, Psychiatry', 7, 'Mind Care Clinic', 'Bangalore', '9886098860');

-- 3. PATIENT
DELETE FROM PATIENT;
INSERT INTO PATIENT (patient_id, name, age, gender, address, phone_number, registration_date) VALUES
('PT001', 'Amit Sharma', 28, 'M', '123 Marine Drive, Mumbai', '9876543100', '2023-01-10'),
('PT002', 'Neha Gupta', 32, 'F', '456 Connaught Place, Delhi', '9123456700', '2023-02-15'),
('PT003', 'Rahul Verma', 40, 'M', '789 MG Road, Bangalore', '9988776600', '2023-03-20'),
('PT004', 'Pooja Singh', 25, 'F', '101 Anna Salai, Chennai', '9090909000', '2023-04-05'),
('PT005', 'Manish Patel', 35, 'M', '212 SG Highway, Ahmedabad', '9876001200', '2023-05-12'),
('PT006', 'Sunita Rao', 45, 'F', '321 Jubilee Hills, Hyderabad', '9848012345', '2023-06-18'),
('PT007', 'Karan Malhotra', 22, 'M', '654 Koregaon Park, Pune', '9890098900', '2023-07-21'),
('PT008', 'Aisha Begum', 58, 'F', '987 T Nagar, Chennai', '9841098410', '2023-08-01'),
('PT009', 'Rohan Desai', 31, 'M', '111 Indiranagar, Bangalore', '9886112345', '2023-08-15'),
('PT010', 'Priya Sharma', 29, 'F', '222 Malviya Nagar, Delhi', '9818012345', '2023-09-02'),
('PT011', 'Siddharth Jain', 38, 'M', '333 Bandra West, Mumbai', '9820198201', '2023-09-25'),
('PT012', 'Ananya Reddy', 26, 'F', '444 Gachibowli, Hyderabad', '9100091000', '2023-10-10'),
('PT013', 'Vikram Singh', 52, 'M', '555 Sector 29, Gurugram', '9810098100', '2023-10-30'),
('PT014', 'Ishita Kumar', 33, 'F', '666 Viman Nagar, Pune', '9860098600', '2023-11-11'),
('PT015', 'Arjun Nair', 41, 'M', '777 Koramangala, Bangalore', '9900299002', '2023-11-28'),
('PT016', 'Sameer Khan', 24, 'M', '888 Andheri East, Mumbai', '9821298212', '2023-12-05'),
('PT017', 'Divya Patel', 30, 'F', '999 Saket, Delhi', '9811198111', '2023-12-15'),
('PT018', 'Rajesh Kumar', 48, 'M', '121 Velachery, Chennai', '9840198401', '2024-01-02'),
('PT019', 'Nandini Verma', 27, 'F', '232 Hitec City, Hyderabad', '9849098490', '2024-01-18'),
('PT020', 'Aditya Mehta', 36, 'M', '343 Powai, Mumbai', '9820398203', '2024-02-01');

-- 4. DOCTOR_AVAILABILITY
DELETE FROM DOCTOR_AVAILABILITY;
INSERT INTO DOCTOR_AVAILABILITY (doctor_id, available_date, time_slot, mode, status) VALUES
('DR001', '2024-08-01', '09:00 - 11:00', 'F', 'Available'),
('DR001', '2024-08-01', '14:00 - 16:00', 'O', 'Available'),
('DR002', '2024-08-01', '10:00 - 12:00', 'F', 'Booked'),
('DR005', '2024-08-02', '11:00 - 13:00', 'F', 'Booked'),
('DR005', '2024-08-02', '16:00 - 17:00', 'O', 'Available'),
('DR012', '2024-08-03', '10:00 - 11:00', 'O', 'Available'),
('DR013', '2024-08-03', '15:00 - 16:00', 'F', 'Available'),
('DR017', '2024-08-04', '09:00 - 10:00', 'F', 'Available'),
('DR020', '2024-08-04', '11:00 - 12:00', 'O', 'Available');

-- 5. APPOINTMENT (Example of a booked appointment)
DELETE FROM APPOINTMENT;
INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, time_slot, mode, status) VALUES
('PT003', 'DR005', '2024-08-02', '11:00 - 13:00', 'F', 'Confirmed'),
('PT001', 'DR001', '2024-07-20', '09:00 - 10:00', 'F', 'Completed'),
('PT002', 'DR002', '2024-07-21', '10:00 - 11:00', 'F', 'Completed'),
('PT004', 'DR018', '2024-07-22', '14:00 - 15:00', 'O', 'Completed'),
('PT009', 'DR012', '2024-07-25', '11:00 - 12:00', 'O', 'Confirmed'),
('PT014', 'DR017', '2024-07-28', '10:00 - 11:00', 'F', 'Cancelled'),
('PT001', 'DR010', '2024-08-05', '15:00 - 16:00', 'F', 'Confirmed');

-- 6. RATING
DELETE FROM RATING;
INSERT INTO RATING (doctor_id, patient_id, rating_value, review_comments, rating_date) VALUES
('DR001', 'PT001', 5, 'Excellent consultation, very knowledgeable.', '2023-10-01'),
('DR002', 'PT002', 4, 'Good advice and clear explanation.', '2023-10-02'),
('DR001', 'PT002', 5, 'Dr. Mehta was very reassuring.', '2023-11-05'),
('DR005', 'PT003', 4, 'The treatment for my knee pain was effective. Doctor was patient.', '2024-01-15'),
('DR018', 'PT004', 5, 'Very happy with the online consultation. Saved me a trip.', '2024-02-10'),
('DR012', 'PT009', 3, 'The waiting time was a bit long, but the doctor was good.', '2024-03-01');

-- 7. SYMPTOM_ENTRY
DELETE FROM SYMPTOM_ENTRY;
INSERT INTO SYMPTOM_ENTRY (patient_id, symptoms_description) VALUES
('PT001', 'Chest pain and shortness of breath'),
('PT002', 'Skin rash and persistent itching'),
('PT003', 'Knee pain and difficulty walking'),
('PT004', 'Blurry vision in right eye'),
('PT005', 'Constant feeling of sadness and low energy'),
('PT006', 'Severe stomach cramps and bloating'),
('PT007', 'Acne breakout on face and back'),
('PT008', 'Frequent migraines and sensitivity to light'),
('PT009', 'High fever and body aches for three days'),
('PT010', 'Irregular menstrual cycle and abdominal pain'),
('PT011', 'Pain in the lower back, radiating to the leg'),
('PT012', 'Child has a persistent cough and cold'),
('PT013', 'Difficulty sleeping and high anxiety'),
('PT014', 'Swollen ankle after a fall'),
('PT015', 'Acid reflux and heartburn after meals');
