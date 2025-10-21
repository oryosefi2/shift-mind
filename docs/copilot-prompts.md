> אוסף פרומפטים ממוקדים ל‑Copilot/ChatGPT כדי להאיץ פיתוח ב‑ShiftMind. העתק/הדבק לפי הצורך, ועדכן שמות קבצים/נתיבים בפרויקט שלך.

---
## 0) מונורפו, דוקר ו‑DX
**Prompt:**
```
Create Makefile targets for a monorepo with `app` (Vite React), `api` (FastAPI), `ai` (Python svc), and `supabase` (SQL). Targets: up, down, logs, seed, test, lint, typecheck. Add PHONY rules and colored echo.
```
**Prompt:**
```
In Vite + TS, add path aliases @/components, @/api, @/hooks, and update tsconfig.json + vite.config.ts accordingly.
```

---
## 1) DB & Migrations (Postgres/Supabase)
**Prompt:**
```
Generate SQL migration to add `audit_log` table with JSONB `before`/`after`, plus triggers on core tables to write rows on INSERT/UPDATE/DELETE. Include created_at and actor from auth.uid().
```
**Prompt:**
```
Extend `businesses.settings` JSON schema with: min_staff_per_hour, max_shift_hours, break_policy, night_hours, overtime, holiday_multipliers, open_hours. Provide example default JSON and constraints.
```

---
## 2) Auth (SimpleAuth או Supabase)
**Prompt:**
```
Implement invite flow: invitations table (email, business_id, role, expires_at, token). Add endpoints to create invitation, accept via token, and join business. Add UI screens in Hebrew RTL.
```
**Prompt:**
```
For Supabase auth (magic link + Google), initialize client with env vars, build AuthContext that reads business_id claim from JWT, and route-guard unauthenticated users to /login.
```

---
## 3) API (FastAPI)
**Prompt:**
```
Add budgets and availability CRUD endpoints with filtering by business_id, pagination (limit/offset), and pydantic models for Create/Update. Return errors in Hebrew.
```
**Prompt:**
```
Create scheduler service skeleton with functions: will_exceed_budget(), demand_to_staff(), pick_best_employee(), merge_hours_to_shifts(). Add unit tests with pytest.
```

---
## 4) Frontend CRUD + טפסים
**Prompt:**
```
Build Employees page (RTL): table with pagination, search, and modal form using React Hook Form + Zod. Fields: first_name, last_name, email, hourly_rate, role, skills (JSON). Show toasts on success/error.
```
**Prompt:**
```
Create reusable <TimeRangeField> that supports overnight ranges (start > end means cross-midnight), with Zod refinement and Hebrew labels.
```

---
## 5) עונתיות/חגים/אירועים
**Prompt:**
```
Implement seasonality UI: editor for 24-hour multiplier array, calendar overrides for HOLIDAY/EREV_HAG/HIGH_DEMAND with priority. Add resolver that merges multipliers by priority.
```

---
## 6) חיזוי (AI svc)
**Prompt:**
```
In ai service, implement forecast pipeline: load demand_history by business_id + target week, train Prophet baseline if not cached, compute hourly base_forecast, apply seasonal/holiday/event multipliers, and persist into forecast_cache with model_version and confidence_score.
```
**Prompt:**
```
Add backtesting script (sliding window) to compute MAPE/WAPE, store results in model_runs and model_metrics.
```

---
## 7) טריגרים/כרון/אורקסטרציה
**Prompt:**
```
Add POST /forecast/{week}/generate that enqueues a job to the AI service and returns job_id and status endpoint. Implement simple Redis queue worker.
```

---
## 8) אופטימיזציית סידור (מתקדם)
**Prompt:**
```
Improve greedy schedule with local search: generate initial solution via greedy, then run swap and reassign moves to reduce cost and violations. Return deltas and explanation per improvement.
```

---
## 9) לוח סידור DnD + עלות חיה
**Prompt:**
```
Create WeeklyScheduleBoard (RTL) using dnd-kit. Columns=days, rows=hours. Show live total cost and budget bar. On drag end, recompute cost and show alerts inline.
```

---
## 10) ייצוא PDF/XLSX
**Prompt:**
```
Implement export endpoints: GET /schedule/{week}/export?fmt=pdf|xlsx using WeasyPrint for RTL PDF and openpyxl for XLSX. Include company logo, totals per day and per role.
```

---
## 11) יבוא חכם
**Prompt:**
```
Build Import Wizard: upload CSV/XLSX, auto-detect headers, map to fields (timestamp,value,employee_id), preview 20 rows, validate (timezone mismatch, duplicates, spikes), and save mapping template per business.
```

---
## 12) התראות Live + Audit Trail
**Prompt:**
```
Add WebSocket /events that streams alerts (budget_risk, understaffed). Create audit trail for schedule changes with who/what/when and expose UI timeline.
```

---
## 13) הקשחה ו‑CI/CD
**Prompt:**
```
Create GitHub Actions workflows: ci.yml (lint, typecheck, tests, build app/api), deploy.yml (on tag, deploy api + app, run migrations). Use env matrices and cache dependencies.
```

---