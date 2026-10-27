# Debate Judge

A MERN web application for running debate tournaments. Organizers set motions and create debates, judges score participants, and participants see their motions and the points they have earned.

- **Live app:** _add your deployed URL_
- **Demo video:** _add your link_

## Problem Statement

Debate events are usually run on paper and spreadsheets. Organizers have to track which judge is on which debate, judges hand in score sheets that someone must add up by hand, and debaters wait a long time to find out how they did. Totals get miscounted, and there is no running record of a debater's results.

## Target Users

| Role | Who they are | What they need |
|---|---|---|
| **Organizer** | Tournament or club committee member | Create motions and debates, assign judges and debaters, see progress, publish results |
| **Judge** | Adjudicator at an event | See assigned debates, score each debater quickly and consistently, leave feedback |
| **Participant** | Debater | See which motions and sides they have been given, track their points and judge feedback |

## Solution

One app with three role-based dashboards. The organizer builds the schedule, judges submit structured scores, and the system does the maths. Closing a debate locks the scores and publishes each participant's points to their profile.

## Key Features

1. **Authentication and roles** – JWT login, password hashing, role-based route protection on both server and client. Organizer sign-up requires an invite code.
2. **Organizer workflow** – create/edit/delete motions; create debates by choosing a motion, date, venue, judges, and a Proposition/Opposition team; see scoring progress; close a debate to publish results.
3. **Judge workflow** – see only debates they are assigned to; score each participant on Argument, Rebuttal and Delivery (0-10 each) with optional written feedback; update scores until the debate is closed.
4. **Participant workflow** – see assigned debates with motion, side, date, venue and judges; profile page with total points, average, per-criterion breakdown and judge feedback for every completed debate.
5. **Application logic** – scores are upserted (one per judge per participant per debate), a debate's points are the **average across judges** (so more judges never inflates points), the profile total is the sum across debates, closed debates are immutable, and removing a judge or participant from a debate removes their orphaned scores.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MongoDB with Mongoose |
| Backend | Node.js, Express 4 |
| Frontend | React 18, React Router 6, Vite, Axios |
| Auth | JSON Web Tokens, bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS allow-list, express-rate-limit on auth routes |

## Architecture

```
React SPA (Vite)  ──HTTP/JSON──▶  Express API  ──Mongoose──▶  MongoDB
  pages / components               routes → middleware → controllers → services → models
  AuthContext (JWT)                protect + authorize (RBAC), zod validation, central error handler
```

**Backend layers** (`server/src`)

- `routes/` – URL → middleware chain → controller. Role rules are declared here (`authorize(ROLES.ORGANIZER)`).
- `middleware/` – `protect` (verify JWT), `authorize` (role check), `validate` (zod), `validateObjectId`, central `errorHandler`.
- `validators/` – zod schemas for every request body/query. Unknown fields are stripped, which prevents mass-assignment.
- `controllers/` – thin HTTP handlers.
- `services/` – business logic: assignment validation, progress counts, result averaging, profile points.
- `models/` – Mongoose schemas and indexes. A unique index on `(debate, judge, participant)` guarantees one score per judge per participant.

**Data model**

```
User    { name, email (unique), password (hashed, hidden), role }
Motion  { title, description, createdBy }
Debate  { title, motion→Motion, scheduledAt, venue, judges[→User],
          participants[{ user→User, side }], status: scheduled|completed, completedAt }
Score   { debate, judge, participant, argument, rebuttal, delivery, total, feedback }
```

**Frontend structure** (`client/src`)

- `api/` – one Axios instance (adds the token, handles expired sessions) plus a small module per resource.
- `context/AuthContext.jsx` – current user, login/register/logout.
- `components/ProtectedRoute.jsx` – blocks unauthenticated users and wrong roles.
- `hooks/useFetch.js` – loading / error / reload handling for every page.
- `pages/organizer`, `pages/judge`, `pages/participant` – one folder per dashboard.

**Why these decisions**

- *Results are hidden until a debate is closed.* This stops half-finished scores from leaking and gives judges room to revise.
- *Average of judges, not sum.* Debates with three judges and debates with one judge stay comparable.
- *Single deployable service.* In production Express also serves the built React app, so there is no CORS setup and only one thing to host.
- *Token in `localStorage`.* Simple for a SPA; the trade-off is exposure to XSS. React escapes output by default and Helmet adds a Content-Security-Policy. HttpOnly cookies would be the next step if CSRF protection were added.

## Local Setup

**Prerequisites:** Node.js 18+ and a MongoDB instance (local install or a free MongoDB Atlas cluster).

```bash
# 1. Install everything
npm install                 # root: installs the dev runner (concurrently)
npm run install:all         # installs server/ and client/ dependencies

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env (MONGO_URI, JWT_SECRET, ORGANIZER_INVITE_CODE)

# 3. (Optional) load demo data - WARNING: wipes the database it points at
npm run seed

# 4. Start both servers
npm run dev
#    API:    http://localhost:5000
#    Client: http://localhost:5173
```

### Demo accounts (after `npm run seed`)

Password for all accounts: `Password123`

| Role | Emails |
|---|---|
| Organizer | `organizer@demo.com` |
| Judges | `judge1@demo.com`, `judge2@demo.com`, `judge3@demo.com` |
| Participants | `participant1@demo.com` … `participant6@demo.com` |

`participant1@demo.com` has two closed debates (points on the profile), plus upcoming debates. `judge1@demo.com` has a closed debate and an open one to score.

To register a new organizer through the UI, use the `ORGANIZER_INVITE_CODE` from your `server/.env`.

## Environment Variables

**`server/.env`**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d` |
| `PORT` | no | Default `5000` |
| `NODE_ENV` | no | `development` or `production` |
| `CLIENT_URL` | no | Comma-separated allowed origins, needed only if the client is hosted on a different domain |
| `ORGANIZER_INVITE_CODE` | yes, to create organizers | Code required to register as an organizer |

**`client/.env`** – `VITE_API_URL` is optional. Leave it empty in development and when the server serves the client.

No secrets are committed; `.env` files are git-ignored.

## Deployment

The app deploys as **one web service** (Express serves the API and the built React app) plus a MongoDB Atlas database.

1. **Database:** create a free MongoDB Atlas cluster, add a database user, and allow network access from `0.0.0.0/0` (or Render's IPs). Copy the connection string.
2. **Optional demo data:** on your machine, put the Atlas string in `server/.env` as `MONGO_URI` and run `npm run seed`.
3. **Web service (Render):** New → Web Service → connect this GitHub repo.
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `ORGANIZER_INVITE_CODE`
4. Open the Render URL. `GET /api/health` should return `{"status":"ok"}`.

The same build works on any host that runs Node (Railway, Fly.io, a VPS). To host the client separately (Vercel/Netlify), set `VITE_API_URL` at build time to `https://<api-host>/api` and `CLIENT_URL` on the server to the client's origin.

## API Reference

All routes are under `/api`. Everything except register/login requires `Authorization: Bearer <token>`.

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create an account |
| POST | `/auth/login` | public | Log in, returns token + user |
| GET | `/auth/me` | any | Current user |
| GET | `/users?role=judge\|participant` | organizer | People available for assignment |
| GET/POST | `/motions` | organizer | List / create motions |
| PUT/DELETE | `/motions/:id` | organizer | Edit / delete (blocked if used by a debate) |
| GET | `/debates` | any | Debates visible to the current role |
| POST | `/debates` | organizer | Create a debate with judges and participants |
| GET | `/debates/:id` | assigned user / organizer | Debate details |
| PUT | `/debates/:id` | organizer | Edit a scheduled debate |
| PATCH | `/debates/:id/complete` | organizer | Close debate, lock scores, publish points |
| DELETE | `/debates/:id` | organizer | Delete debate and its scores |
| GET | `/debates/:id/results` | organizer | Averaged results per participant |
| GET | `/debates/:id/scores/mine` | judge | The judge's own saved scores |
| PUT | `/debates/:id/scores/:participantId` | judge | Create or update a score |
| GET | `/profile` | participant | Total points, history, feedback |

Errors always look like `{ "message": "...", "details": [...] }` with a meaningful HTTP status (400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict).

## Error Handling and Security

- Every request body and query is validated with zod; malformed ids are rejected before hitting the database.
- Authorization is enforced on the server (role guards plus per-debate assignment checks); the client guards are only for UX.
- Passwords are hashed with bcrypt (cost 12); login failures return one generic message.
- Rate limiting on login/register, Helmet security headers, JSON body size limit, CORS allow-list.
- Conflicts are handled explicitly: scoring a closed debate, editing a closed debate, deleting a motion that is in use, closing a debate with no scores, duplicate emails.
- The UI shows loading, empty, success and error states on every screen.

## Known Limitations / Future Work

- No automated tests yet (the service layer is structured to make unit tests straightforward).
- One fixed set of scoring criteria; making them configurable per tournament would be a natural extension.
- No email notifications or password reset.
- No multi-tournament support or leaderboard across participants.
