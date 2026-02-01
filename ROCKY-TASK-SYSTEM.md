# Rocky Task Management System — Overnight Build

**Deadline:** 7am Dubai (7pm PST) — Feb 1, 2026
**Report:** 8am Dubai (8pm PST) on WhatsApp

## Goal
Transform OmniFocus clone into Rocky's primary system for managing Fred's personal tasks. Rocky (AI assistant) will use this to track, manage, and collaborate on personal tasks with Fred.

## Current State
- Next.js frontend at omnifocus.mycyborg.ai
- NestJS API at api-omnifocus.mycyborg.ai  
- PostgreSQL database
- Basic task/project CRUD working
- Auth: fred / omnifocus

## Requirements

### 1. API Enhancements for Rocky Integration

**New/Updated Fields on Tasks:**
- `managedBy` — "rocky" | "fred" | null (who's handling this)
- `status` — "inbox" | "todo" | "in_progress" | "waiting_on_fred" | "waiting_external" | "done" | "dropped"
- `category` — "bills" | "documents" | "household" | "family" | "errands" | "health" | "finance" | "other"
- `activityLog` — JSON array of timestamped notes: `[{timestamp, author, note}]`
- `dueDate` — Already exists, ensure it works
- `priority` — "high" | "medium" | "low" | null

**API Endpoints to Verify/Create:**
```
GET    /api/actions              — List all tasks (with filters)
GET    /api/actions/:id          — Get single task
POST   /api/actions              — Create task
PATCH  /api/actions/:id          — Update task
DELETE /api/actions/:id          — Delete task
POST   /api/actions/:id/log      — Add activity log entry
GET    /api/actions/status/:status — Filter by status
GET    /api/actions/managed-by/rocky — Rocky's tasks
```

**Query Filters Needed:**
- `?status=waiting_on_fred`
- `?managedBy=rocky`
- `?category=bills`
- `?dueBefore=2026-02-05`
- `?priority=high`

### 2. Database Schema Updates

Add to Prisma schema (actions table):
```prisma
model Action {
  // ... existing fields
  managedBy    String?   // "rocky" | "fred"
  status       String    @default("inbox")
  category     String?
  activityLog  Json      @default("[]")
  priority     String?
}
```

Run migration after schema update.

### 3. Frontend Updates

**Task List View:**
- Show `managedBy` badge (🤖 Rocky, 👤 Fred)
- Show `status` as colored pill
- Show `category` tag
- Filter sidebar by status, category, managedBy

**Task Detail Panel:**
- Edit all new fields
- Activity log timeline (readonly, Rocky adds via API)
- Status dropdown with all options
- Category dropdown
- Priority selector

**New "Rocky's Queue" Perspective:**
- Shows all tasks where `managedBy=rocky`
- Grouped by status
- Quick filters for waiting_on_fred, in_progress

### 4. Seed Data

Create sample tasks to demonstrate:
```
- "Renew Fred's passport" — managedBy: rocky, status: in_progress, category: documents
- "Pay Salma (maid) — February" — managedBy: rocky, status: todo, category: household, dueDate: Feb 5
- "DEWA bill payment" — managedBy: rocky, status: waiting_external, category: bills
- "Book dentist for Anthony" — managedBy: rocky, status: waiting_on_fred, category: family
- "Research Tesla Optimus availability" — managedBy: rocky, status: in_progress, category: other
```

### 5. Deployment

After all changes:
1. Run Prisma migration
2. Build frontend: `npm run build`
3. Deploy to Vercel (frontend) — already configured
4. Deploy to Railway (backend) — `railway up`
5. Verify at omnifocus.mycyborg.ai and api-omnifocus.mycyborg.ai

### 6. Documentation

Update ~/clawd/TOOLS.md with:
- API endpoints and auth
- How Rocky uses the system
- Example curl commands

## Success Criteria

By 7am Dubai:
- [ ] All API endpoints working with new fields
- [ ] Frontend shows all new fields and filters
- [ ] "Rocky's Queue" perspective exists
- [ ] Sample tasks seeded
- [ ] Deployed and accessible
- [ ] Rocky can create/update tasks via API

## Tech Notes

- **Frontend:** ~/Projects/omnifocus-clone/web/
- **Backend:** ~/Projects/omnifocus-clone/api/
- **Prisma schema:** ~/Projects/omnifocus-clone/api/prisma/schema.prisma
- **Deploy frontend:** `cd web && vercel --prod`
- **Deploy backend:** `cd ~/Projects/omnifocus-clone && railway up`

## Testing

After implementation, verify with curl:
```bash
# Auth
TOKEN=$(curl -s "https://api-omnifocus.mycyborg.ai/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"fred","password":"omnifocus"}' | jq -r '.accessToken')

# Create task
curl -X POST "https://api-omnifocus.mycyborg.ai/api/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test task","managedBy":"rocky","status":"todo","category":"other"}'

# List Rocky's tasks
curl "https://api-omnifocus.mycyborg.ai/api/actions?managedBy=rocky" \
  -H "Authorization: Bearer $TOKEN"
```

---

**GO! Build this overnight. Commit frequently. Deploy when ready.**
