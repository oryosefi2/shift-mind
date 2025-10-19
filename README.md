# ShiftMind

A modern monorepo application with React frontend, FastAPI backend, AI capabilities, and Supabase integration.

## Architecture

- **app/**: React + Vite + TypeScript + Tailwind frontend with RTL support
- **api/**: FastAPI backend with health endpoint
- **ai/**: Python AI module
- **supabase/**: Database and authentication
- **infra/**: Infrastructure configuration

## Quick Start

1. **Development with Docker:**
   ```bash
   docker-compose up
   ```
   - Frontend: http://localhost:5173
   - API: http://localhost:8000

2. **Local Development:**
   ```bash
   # Frontend
   cd app && npm install && npm run dev
   
   # API
   cd api && pip install -r requirements.txt && uvicorn main:app --reload
   ```

## Structure

```
ShiftMind/
├── app/                 # React frontend
├── api/                 # FastAPI backend
├── ai/                  # Python AI module
├── supabase/           # Database & auth
├── infra/              # Infrastructure
└── docker-compose.yml  # Development environment
```

## Features

- ✅ RTL (Hebrew) support in frontend
- ✅ Hot reload development
- ✅ TypeScript throughout
- ✅ Modern UI with Tailwind CSS
- ✅ Production-ready structure
