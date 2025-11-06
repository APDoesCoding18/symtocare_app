    # Symtocare — Starter (Express + MySQL + Simple Frontend)

This archive contains a minimal backend (Express + MySQL) and a simple frontend (HTML/CSS/JS) to work with the `symtocareFinal` database.

## What is included

- `backend/` — Express API server.
- `frontend/` — Simple single-page HTML+JS UI that calls backend endpoints.
- `sql/schema.sql` — SQL schema to create tables.
- `sql/inserts.sql` — Sample data inserts (15 records per main table).

## Quick setup (localhost)

1. Ensure MySQL server is running.
   Starting mysql server:
   1) check for running server:
      Press Win + R to open the Run dialog.
      Type services.msc and press Enter.
      In the list of services, find the one for MySQL. The name is often MySQL followed by a version number, like MySQL80.
      Right-click on the MySQL service and select Start.
   2)Else:
      Open cmd as admin, run following command: net start MySQL80

2. Create the database and load the schema & sample data:
   - `mysql -u root -p < sql/schema.sql`
   - `mysql -u root -p symtocareFinal < sql/inserts.sql`
3. Backend:
   - `cd backend`
   - copy `.env.example` to `.env` and fill credentials
   - `npm install`
   - `npm run dev` (requires nodemon) or `npm start` or nodemon src/server.js
4. Frontend:
   - `cd frontend`
   - open `index.html` in your browser (or serve it with a static server)

## Notes
- Backend runs on port 5000 by default. Frontend expects the API at `http://localhost:5000/api`.
- This is a starter — add authentication, validation, and better UI for production.

