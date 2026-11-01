# Convene — Workshop & Seminar Management System

> Production-grade MERN platform for managing workshops, seminars, and webinars. Features atomic capacity reservation, automated FIFO waitlist promotion, camera & manual QR attendance check-in, on-the-fly landscape PDF certificates, post-event feedback, downloadable presentation resources, automated 24-hour reminder crons, and rich admin analytics.

---

## 1. Prerequisites

- **Node.js**: `v18.x` or later (LTS recommended)
- **npm**: `v9.x` or later
- **MongoDB**: `v6.0+` (local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

---

## 2. Environment Setup

### Server Environment (`server/.env`)
Copy the example file and customize:
```bash
cp server/.env.example server/.env
```

| Key | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `PORT` | Backend HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb://127.0.0.1:27017/convene` |
| `MONGODB_URI_TEST` | Optional override URI for tests | _(empty - tests use in-memory server)_ |
| `JWT_SECRET` | Secret key for JWT signing (>= 32 chars) | `super_secret_jwt_key_at_least_32_characters_long` |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:5173` |
| `APP_NAME` | Name shown on certificates and emails | `Convene` |
| `SMTP_HOST` | Optional SMTP server for email delivery | _(empty fallback logs to console)_ |
| `SMTP_PORT` | Optional SMTP server port | `587` |
| `SMTP_USER` | Optional SMTP username | _(empty)_ |
| `SMTP_PASS` | Optional SMTP password | _(empty)_ |
| `MAIL_FROM` | Optional sender email | `"Convene" <no-reply@convene.com>` |
| `ADMIN_NAME` | Platform admin full name | `Platform Admin` |
| `ADMIN_EMAIL` | Platform admin login email | `admin@convene.com` |
| `ADMIN_PASSWORD` | Platform admin initial password | `AdminPassword123!` |

### Client Environment (`client/.env`)
Copy the example file:
```bash
cp client/.env.example client/.env
```

| Key | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint for the backend API | `http://localhost:5000/api` |

---

## 3. Installation

Run installation in both backend and frontend directories:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

---

## 4. Database Seeding & Demo Data

Convene includes an idempotent seeder that creates default platform administrators and optional rich demo datasets for immediate testing.

```bash
cd server

# Seed Platform Admin only:
npm run seed

# Seed Platform Admin + Full Demo Dataset (organizer, 5 attendees, 4 events, registrations, reviews):
npm run seed -- --demo
```

### Pre-configured Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@convene.com` | `AdminPassword123!` | Platform metrics, user governance & role promotions |
| **Organizer** | `organizer@convene.com` | `Password123!` | Event creator, attendance scanner console, resources |
| **Attendee 1** | `alice@convene.com` | `Password123!` | Attended past event (review + certificate ready) |
| **Attendee 2** | `bob@convene.com` | `Password123!` | Attended past event |
| **Attendee 3** | `charlie@convene.com` | `Password123!` | Confirmed in ongoing event (ready for QR scan) |
| **Attendee 4** | `diana@convene.com` | `Password123!` | Waitlisted attendee |
| **Attendee 5** | `edward@convene.com` | `Password123!` | Clean attendee for new registrations |

---

## 5. Running the Application

### Start Backend API Server
```bash
cd server
npm run dev
# Server runs on http://localhost:5000 (Health check: http://localhost:5000/health)
```

### Start Frontend Client
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 6. Running Automated Tests

Convene includes automated unit, integration, and concurrency acceptance suites powered by Vitest and `mongodb-memory-server` (runs completely isolated with zero external database dependencies):

```bash
cd server
npm test
```

### Acceptance Gates Covered
1. **Concurrency Cap**: 20 concurrent registration requests against capacity 5 guarantee exactly 5 confirmed and 15 waitlisted reservations via atomic Mongoose operations.
2. **FIFO Waitlist Promotion**: Exact queue ordering promotion when a confirmed seat is vacated or capacity is raised.
3. **Role & Ownership Permission Matrix**: Granular checks for Guests (401), Attendees (403), Non-Owner Organizers (403), Owner Organizers (200), and Platform Admins (200).
4. **QR Attendance Rules**: Window enforcement `[startTime - 60 min, endTime + 120 min]`, cross-event token rejection (400), non-owner rejection (403), and duplicate scan rejection (409).
5. **Certificate & Feedback Eligibility**: Landscape PDF stream generation restricted to attended registrants after event conclusion; feedback restricted to 1 per attendee.
6. **Validation Error Envelope**: Strict Zod and Mongoose error envelopes formatted as `{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: [...] } }`.

---

## 7. API Architecture Overview

All endpoints adhere to the unified envelope contract:
- Success: `{ success: true, data: ..., message?: string }`
- Error: `{ success: false, error: { code: string, message: string, details?: any[] } }`

### Auth & User Governance (`/api/auth`, `/api/admin`)
- `POST /api/auth/register` — Register new attendee
- `POST /api/auth/login` — Sign in with email and password
- `GET /api/auth/me` — Retrieve current authenticated user profile
- `GET /api/admin/users` — Paginated user directory with role/status filters
- `PATCH /api/admin/users/:id/role` — Promote/demote user role (`organizer`, `attendee`)
- `PATCH /api/admin/users/:id/status` — Toggle user activation status
- `GET /api/admin/stats` — Platform KPI statistics & time-series registration metrics

### Events & Attendance (`/api/events`, `/api/attendance`)
- `GET /api/events` — Filterable event catalog (query, category, mode, phase, date range)
- `GET /api/events/mine` — Organizer's hosted events list
- `GET /api/events/:id` — Public event details with attendee registration status
- `POST /api/events` — Create event with multipart poster upload (max 2MB)
- `PUT /api/events/:id` — Update event details (with automatic waitlist promotion on capacity increase)
- `POST /api/events/:id/cancel` — Cancel event and notify confirmed/waitlisted attendees
- `DELETE /api/events/:id` — Delete event (blocked once registrations exist)
- `GET /api/events/:id/stats` — Organizer dashboard stats (attendance rate, feedback score)
- `POST /api/attendance/scan` — Camera/input QR attendance validator
- `PATCH /api/events/:id/registrations/:regId/attendance` — Manual attendance fallback toggle

### Registrations, Certificates & Resources (`/api/registrations`, `/api/resources`)
- `POST /api/events/:id/register` — Atomic seat reservation or waitlist placement
- `DELETE /api/events/:id/register` — Registration cancellation with FIFO waitlist promotion
- `GET /api/registrations/mine` — Attendee registration dashboard (confirmed, waitlisted, cancelled)
- `GET /api/registrations/:id/qr` — Generate 64-hex signed QR code data URL
- `GET /api/registrations/:id/certificate` — Stream generated landscape A4 participation PDF
- `POST /api/events/:id/feedback` — Submit post-event rating and review
- `GET /api/events/:id/feedback` — List reviews for an event
- `POST /api/events/:id/resources` — Upload slide/document attachments (max 10MB)
- `GET /api/events/:id/resources` — List attachments for confirmed attendees
- `GET /api/resources/:id/download` — Stream attachment file download

---

## 8. Folder Structure

```
Convene/
├── README.md                 # Project documentation and setup guide
├── ASSUMPTIONS.md            # Architectural and design decision records
├── package.json              # Root package metadata
├── client/                   # Frontend Vite + React application
│   ├── index.html            # Single page application entry HTML
│   ├── vite.config.js        # Vite configuration with Tailwind CSS plugin
│   ├── package.json          # Frontend dependencies (React, Lucide, Recharts, etc.)
│   └── src/
│       ├── api/              # Axios service layer (auth, events, registrations, admin)
│       ├── components/       # Reusable UI components (Navbar, EventCard, QrModal, etc.)
│       ├── context/          # Global React state (AuthContext)
│       ├── pages/            # View pages (Home, Detail, Dashboard, Organizer, Admin)
│       └── main.jsx          # React DOM entry point
└── server/                   # Backend Express + Node.js API
    ├── package.json          # Backend dependencies (Express, Mongoose, Zod, PDFKit)
    ├── src/
    │   ├── app.js            # Express application setup & middleware stack
    │   ├── server.js         # HTTP server listener & cron initialization
    │   ├── config/           # Database connection & Zod environment validator
    │   ├── controllers/      # API endpoint handlers
    │   ├── middleware/       # Auth, role, file upload, validation, and error handlers
    │   ├── models/           # Mongoose schemas (User, Event, Registration, Feedback, Resource)
    │   ├── routes/           # Express router definitions
    │   ├── services/         # Business logic (seats engine, certificate PDF, mailer, reminders)
    │   ├── utils/            # ApiError, event phase, and pagination helpers
    │   └── scripts/          # Database seeding scripts (admin & demo data)
    └── tests/                # Automated Vitest integration test suites
```

---

## 9. Known Limitations

1. **Local Disk Uploads**: Uploaded posters and presentation resources are stored on the local filesystem (`server/uploads/`). Ephemeral hosting platforms (such as free Render instances or Heroku dynos) will not persist uploaded files across restarts. In production deployments, configure a persistent object storage provider (e.g. AWS S3 or Cloudflare R2).
2. **Email Delivery**: When SMTP environment variables are unconfigured, emails are gracefully logged to `stdout` via a console fallback. For live outbound emails, provide standard SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
