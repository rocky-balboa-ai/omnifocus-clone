# OmniFocus Clone - System Design

## Overview

A web-based GTD task management app cloning OmniFocus core features for Fred (human user) and Rocky (AI assistant automation).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + TypeScript + Zustand |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Containerization | Docker Compose |

## Ports

- **7847**: Next.js web app
- **7848**: NestJS API
- **54329**: PostgreSQL

## Authentication

- **Fred (human)**: Session-based auth with username/password login
- **Rocky (AI)**: Static API key in `X-API-Key` header

## Data Model

### Core Entities

```
Folder
├── Folder (nested)
└── Project
    ├── ActionGroup (nested task container)
    │   ├── Action (task)
    │   └── ActionGroup (nested)
    └── Action (task)

Tag
├── Tag (nested tag groups)
```

### Action (Task) Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | string | Task title |
| note | text | Rich text notes |
| status | enum | active, completed, dropped, on_hold |
| flagged | boolean | Visual importance marker |
| deferDate | datetime | Start no earlier than |
| dueDate | datetime | End no later than |
| plannedDate | datetime | Scheduled work date (no constraint) |
| completedAt | datetime | When completed |
| droppedAt | datetime | When dropped |
| estimatedMinutes | int | Time estimate |
| parentId | UUID | Parent action (for action groups) |
| projectId | UUID | Containing project |
| position | int | Sort order within parent |

### Project Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Project name |
| note | text | Project notes |
| status | enum | active, completed, dropped, on_hold |
| type | enum | sequential, parallel, single_actions |
| folderId | UUID | Parent folder |
| reviewInterval | string | Review cycle (e.g., "1w", "2w") |
| lastReviewedAt | datetime | Last review date |
| nextReviewAt | datetime | Next review due |
| deferDate | datetime | Project defer date |
| dueDate | datetime | Project due date |

### Repeat Configuration

| Field | Type | Description |
|-------|------|-------------|
| repeatMode | enum | fixed, defer_another, due_again |
| repeatInterval | string | Interval (e.g., "1d", "1w", "1m", "1y") |
| repeatEndDate | datetime | When to stop repeating |
| repeatEndCount | int | Max repetitions |

**Repeat Modes:**
- `fixed`: Repeat on fixed schedule regardless of completion
- `defer_another`: New defer date = completion date + interval
- `due_again`: New due date = completion date + interval

### Tag Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Tag name |
| parentId | UUID | Parent tag (for tag groups) |
| availableFrom | time | Available start time |
| availableUntil | time | Available end time |

### Perspective Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Perspective name |
| icon | string | Icon identifier |
| isBuiltIn | boolean | System perspective |
| filterRules | jsonb | Filter configuration |
| sortRules | jsonb | Sort configuration |
| groupBy | string | Grouping field |

## Built-in Perspectives

1. **Inbox** - Unfiled actions
2. **Projects** - All projects hierarchy
3. **Tags** - Actions grouped by tag
4. **Forecast** - Calendar view with due/defer dates
5. **Flagged** - All flagged items
6. **Review** - Projects due for review

## API Endpoints

### Actions
- `GET /api/actions` - List with filters
- `GET /api/actions/:id` - Get single action
- `POST /api/actions` - Create action
- `PATCH /api/actions/:id` - Update action
- `DELETE /api/actions/:id` - Delete action
- `POST /api/actions/:id/complete` - Mark complete
- `POST /api/actions/:id/drop` - Drop action

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project with actions
- `POST /api/projects` - Create project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/review` - Mark reviewed

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PATCH /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `PATCH /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Perspectives
- `GET /api/perspectives` - List perspectives
- `GET /api/perspectives/:id/actions` - Get filtered actions
- `POST /api/perspectives` - Create custom perspective
- `PATCH /api/perspectives/:id` - Update perspective
- `DELETE /api/perspectives/:id` - Delete perspective

### Auth
- `POST /api/auth/login` - Session login
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Current user

## Directory Structure

```
omnifocus-clone/
├── docker-compose.yml
├── api/                    # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── actions/
│   │   │   ├── projects/
│   │   │   ├── tags/
│   │   │   ├── folders/
│   │   │   ├── perspectives/
│   │   │   └── auth/
│   │   ├── prisma/
│   │   └── main.ts
│   ├── test/
│   └── package.json
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── stores/
│   │   └── lib/
│   └── package.json
└── docs/
```

## Key Implementation Notes

1. **Sequential projects**: Only first incomplete action is "available"
2. **Parallel projects**: All incomplete actions are "available"
3. **Inheritance**: Children inherit defer/due dates, flags, tags from parents unless overridden
4. **Repeat on complete**: When completing a repeating action, create next instance based on repeat mode
5. **Review cycle**: Projects have configurable review intervals; Review perspective shows overdue reviews
