Mini-CRM

A tiny, full-stack CRM you can run locally in minutes.
Backend: Node + Express + TypeScript + Prisma (SQLite) + JWT auth + Swagger
Frontend: Next.js (App Router) + TypeScript + simple auth guard

FEATURES

User signup/login with JWT (Bearer)
Contacts CRUD (+ search, paginate, sort/date descending)
Notes per contact
Deals per contact
Analytics (simple aggregates + recompute trigger)
Swagger UI at /docs
Frontend /login, /contacts, /deals, /analytics pages
Auth guard for protected pages

TECH STACK

Backend: Node 18+, Express, TypeScript, Prisma, SQLite, jsonwebtoken, bcryptjs, Swagger (swagger-ui-express, swagger-jsdoc)
Frontend: Next.js 15+, React, TypeScript, Axios
Dev tooling: ts-node-dev, concurrently

REPO LAYOUT
mini-crm/
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma         # SQLite dev DB
│  │  └─ dev.db                # local database (created on first run)
│  ├─ src/server.ts            # Express app (all endpoints + Swagger)
│  ├─ package.json
│  └─ .env                     # PORT/JWT/DATABASE_URL
├─ frontend/
│  ├─ app/
│  │  ├─ login/page.tsx
│  │  ├─ contacts/page.tsx
│  │  ├─ deals/page.tsx
│  │  ├─ analytics/page.tsx
│  │  └─ page.tsx              # home/health check
│  ├─ lib/api.ts               # axios client with token
│  ├─ components/Nav.tsx
│  ├─ package.json
│  └─ .env.local               # NEXT_PUBLIC_API_URL
├─ README.md
└─ .gitignore


PREREQUISITES

Node.js 18 or 20
npm 9+
Windows PowerShell or macOS/Linux shell
Git

CLONE AND INSTALL
git clone https://github.com/<your-username>/mini-crm.git
cd mini-crm

# Backend deps
cd backend
npm install

# Frontend deps
cd ..\frontend
npm install


ENVIRONMENT VARIABLES
backend/.env
PORT=4000
JWT_SECRET=dev-secret-change-me
DATABASE_URL="file:./dev.db"

frontend/.env.local
# When running locally with the backend on port 4000:
NEXT_PUBLIC_API_URL=http://localhost:4000

PRISMA (DB)
From mini-crm/backend:
# Generate Prisma client (after install or schema changes)
npx prisma generate

# (Optional) Create a migration folder for the initial schema
npx prisma migrate dev --name init


RUN LOCALLY

Open two terminals:
Terminal A — Backend
cd mini-crm\backend
npm run dev
# -> API running on http://localhost:4000

Terminal B — Frontend
cd mini-crm\frontend
npm run dev
# -> Web running on http://localhost:3000


 TRY THE API (Swagger or PowerShell)
Swagger

Open: http://localhost:4000/docs
POST /auth/signup with:
{ "email": "demo@mini-crm.test", "password": "Demo#1234" }

POST /auth/login with the same payload — copy the returned token.
Click Authorize (top-right), choose bearerAuth, and paste the token (no “Bearer ” prefix needed).
Use protected endpoints like GET /contacts, POST /contacts, etc.

PowerShell quick test
$base = 'http://localhost:4000'

# Create a demo user (ignore if already exists)
irm -Method Post "$base/auth/signup" -ContentType 'application/json' `
  -Body (@{ email='demo@mini-crm.test'; password='Demo#1234' } | ConvertTo-Json)

# Login and capture JWT
$t = (irm -Method Post "$base/auth/login" -ContentType 'application/json' `
  -Body (@{ email='demo@mini-crm.test'; password='Demo#1234' } | ConvertTo-Json)).token
$h = @{ Authorization = "Bearer $t" }

# List contacts (empty or already created)
irm -Headers $h "$base/contacts?page=1&pageSize=10"

# Create one
$contact = @{ name='Alice'; email='alice@acme.com'; company='Acme'; phone='555-1234' } | ConvertTo-Json
irm -Method Post "$base/contacts" -Headers $h -ContentType 'application/json' -Body $contact

FRONTEND USAGE

Open http://localhost:3000
Go to /login and sign in with:
Email: demo@mini-crm.test
Password: Demo#1234
Navigate to Contacts / Deals / Analytics from the navbar.

SCRIPTS
Backend (/backend/package.json)
dev – run the API in watch mode (ts-node-dev)
build – tsc compile to dist/
start – run compiled server node dist/server.js
Frontend (/frontend/package.json)
dev – next dev
build – next build
start – next start (production)
lint – next lint

DEMO CREDENTIALS

Email: demo@mini-crm.test
Password: Demo#1234

NOTES AND SCOPE

The app intentionally favors clarity over complexity (e.g., simple error handling, SQLite dev DB).
For production you’d typically add:
Postgres, logging, validation with Zod/JOI, rate limiting, refresh tokens, domain services, tests, CI.
