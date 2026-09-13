# LibFlow - Library Management System

A complete, modern Library Management System built with React, Express, Prisma, and PostgreSQL.

**GitHub:** https://github.com/Randheer-07/Library_management_system-main

## Features

- **Dashboard** - Real-time overview with charts, stats, and alerts
- **Books** - Full CRUD with search, filters, cover display, copies tracking
- **Authors** - Manage author profiles linked to books
- **Categories** - Hierarchical book categorization
- **Collections** - Curated book collections
- **Members** - Member profiles with borrowing history
- **Loans** - Borrow, return, renew with fine calculation
- **Reservations** - Hold system for unavailable books
- **Fines** - Automatic late fee calculation, payment, and waiver
- **Reports** - Analytics with charts and popular books
- **Search** - Global search across books, authors, members
- **Dark/Light Theme** - System theme with persistence
- **Role-Based Access** - Admin, Librarian, Member roles
- **Responsive** - Mobile-first modern UI
- **Authentication** - JWT-based secure auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT + bcrypt |
| Security | Helmet, Rate Limiting, CORS |
| Charts | Recharts |

## Architecture

```
├── backend/
│   ├── config/          # Environment & database config
│   ├── controllers/     # Business logic (11 controllers)
│   ├── middleware/       # Auth, validation, error handling
│   ├── prisma/          # Database schema
│   ├── routes/          # API routes (10 route modules)
│   ├── utils/           # Helper functions
│   ├── seed.js          # Development seed data
│   └── server.js        # Express server entry
├── frontend/
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth & Theme context
│   │   └── pages/       # 16 page components
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json         # Root scripts (build, start)
├── render.yaml          # Render deployment config
└── .gitignore
```

## Database Schema

- **User** - Authentication and profiles
- **Member** - Library membership
- **Book** - Book metadata
- **Author** - Author profiles
- **BookAuthor** - Book-Author relationship
- **Category** - Hierarchical categories
- **BookCategory** - Book-Category relationship
- **Collection** - Curated collections
- **BookCopy** - Individual copies with tracking
- **Loan** - Borrowing records
- **Reservation** - Hold requests
- **Fine** - Late fee records
- **ActivityLog** - System audit trail

## Local Development

```bash
# Clone
git clone https://github.com/Randheer-07/Library_management_system-main.git
cd Library_management_system-main

# Backend setup
cd backend
cp .env.example .env  # Configure your DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev
node seed.js  # Seed demo data
cd ..

# Frontend setup
cd frontend
npm install
npm run dev

# Start backend (in another terminal)
cd backend
npm start
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| JWT_SECRET | Secret key for JWT tokens | `your-secret-key` |
| JWT_EXPIRES_IN | Token expiration | `7d` |
| PORT | Server port | `3000` |
| CORS_ORIGIN | Frontend origin | `http://localhost:5173` |
| NODE_ENV | Environment | `development` / `production` |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | lib123 |
| Member | john@example.com | member123 |
| Member | emma@example.com | member123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new member
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/users` - List users (Admin)

### Books
- `GET /api/books` - List books (search, filter, paginate)
- `GET /api/books/:id` - Book details
- `POST /api/books` - Create book (Admin/Librarian)
- `PUT /api/books/:id` - Update book (Admin/Librarian)
- `DELETE /api/books/:id` - Delete book (Admin)

### Loans
- `GET /api/loans` - List loans
- `POST /api/loans` - Create loan
- `POST /api/loans/:id/renew` - Renew loan
- `POST /api/loans/:id/return` - Return book

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `POST /api/reservations/:id/fulfill` - Fulfill reservation
- `POST /api/reservations/:id/cancel` - Cancel reservation

### And more: Authors, Categories, Collections, Members, Fines, Dashboard, Reports

## Deploy to Render

### Step 1: Delete any old services
1. Go to [Render Dashboard](https://dashboard.render.com/project/prj-d8v87qv7f7vs73b6lpsg)
2. If there are existing services, delete them first

### Step 2: Create PostgreSQL Database
1. Click **New** → **PostgreSQL**
2. **Name:** `libflow-db`
3. **Database:** `libflow`
4. **Plan:** Free
5. Click **Create Database**
6. Wait for it to be ready, then copy the **Internal Database URL**

### Step 3: Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository: `Randheer-07/Library_management_system-main`
3. Configure these settings exactly:
   - **Name:** `libflow`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Click **Advanced** → Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste Internal Database URL from Step 2)* |
| `JWT_SECRET` | *(any random string, e.g. `libflow-prod-secret-2024-xkcd`)  |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | *(leave empty for now, update after deploy)* |

5. Click **Create Web Service**
6. Wait for the first deploy to complete

### Step 4: Seed the Database
1. After deployment succeeds, go to the **Shell** tab in your Render web service
2. Run:
```bash
cd backend && node seed.js
```
3. This creates demo accounts and sample data

### Step 5: Update CORS_ORIGIN
1. Go to your service **Environment** tab
2. Update `CORS_ORIGIN` to your actual Render URL (e.g., `https://libflow.onrender.com`)
3. Trigger a manual redeploy

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | lib123 |
| Member | john@example.com | member123 |

## License

ISC
