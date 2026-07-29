# JobProof

JobProof is an explainable career-intelligence app that turns a job description, resume text, and project evidence into a job-specific proof packet.

It solves a real job-search problem: candidates need to show credible project evidence, not just send generic AI-polished resumes.

## What it does

- Extracts role skills from a job description.
- Compares them with resume/profile text.
- Matches the role to real portfolio projects.
- Flags scam or low-trust job-post signals.
- Generates application bullets and a fit score.
- Works for free with a deterministic rule engine.
- Optionally attempts AI-enhanced narrative analysis when the user enters their own API key.

## Structure

- `backend` - Python FastAPI API and explainable analyzer.
- `src/app` - Next.js frontend product UI.
- `src/lib` - frontend types and browser fallback analyzer.

## Run frontend

```bash
npm install
```

To use the local Python backend instead of the browser fallback, create
`.env.local` with:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
```

Then start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The frontend falls back to the browser analyzer if the Python backend is not running.

## Deploy

Vercel deploys the Next.js frontend and FastAPI backend as separate services.
Production browser requests use the same-origin `/api` prefix, which Vercel
rewrites to the FastAPI service.
