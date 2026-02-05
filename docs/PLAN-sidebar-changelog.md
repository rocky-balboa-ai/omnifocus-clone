# Plan: Sidebar Navigation + Changelog API

## Overview
Two main improvements:
1. **Sidebar UX** — Restore Projects and Tags as dedicated sections
2. **Changelog API** — Polling endpoint for Rocky to see what changed

---

## Part 1: Sidebar Navigation

### Problem
The sidebar currently shows perspectives (Inbox, Forecast, Flagged, etc.) as simple buttons. Projects and Tags are "perspectives" but should be **expandable tree sections** showing the actual hierarchy.

### Solution

#### 1.1 Projects Section
- Add collapsible "Projects" section below perspectives
- Show folder tree with expandable/collapsible folders
- Show projects under each folder
- Clicking a project navigates to it and shows its tasks
- Include task counts per project

#### 1.2 Tags Section  
- Add collapsible "Tags" section below Projects
- Show tag hierarchy (parent/child tags)
- Clicking a tag shows tasks with that tag
- Include task counts per tag

#### 1.3 Implementation
- Modify `Sidebar.tsx` to add two new sections
- Create `ProjectTree.tsx` component for project hierarchy
- Create `TagTree.tsx` component for tag hierarchy
- Use existing API endpoints (`/api/projects`, `/api/tags`)
- Add expand/collapse state to Zustand store

---

## Part 2: Changelog API

### Problem
Rocky needs to know what changed without polling all data. Need an efficient way to see:
- What tasks were created/updated/completed by Fred
- What tasks were created/updated/completed by Rocky
- Changes since a specific timestamp

### Solution

#### 2.1 Database Changes
Add `ChangeLog` table:
```prisma
model ChangeLog {
  id          String   @id @default(uuid())
  entityType  String   // 'action', 'project', 'tag', 'folder'
  entityId    String
  action      String   // 'create', 'update', 'delete', 'complete', 'uncomplete'
  actor       String   // 'fred', 'rocky', 'system'
  changes     Json?    // { field: { old, new } }
  createdAt   DateTime @default(now())
  
  @@index([createdAt])
  @@index([actor])
  @@index([entityType])
}
```

#### 2.2 API Endpoint
`GET /api/changelog`

Query params:
- `since` — ISO timestamp, return changes after this time
- `actor` — Filter by 'fred', 'rocky', or 'all'
- `entityType` — Filter by 'action', 'project', etc.
- `limit` — Max results (default 100)

Response:
```json
{
  "changes": [
    {
      "id": "...",
      "entityType": "action",
      "entityId": "...",
      "action": "complete",
      "actor": "fred",
      "changes": { "status": { "old": "active", "new": "completed" } },
      "createdAt": "2026-02-05T17:00:00Z"
    }
  ],
  "cursor": "2026-02-05T17:00:00Z"  // Use as `since` for next poll
}
```

#### 2.3 Recording Changes
- Modify ActionsService to log changes on create/update/delete/complete
- Add `actor` parameter to service methods (default 'system', API can pass 'fred' or 'rocky')
- The API determines actor from auth context or explicit header

#### 2.4 Actor Detection
- API key auth → Rocky (actor = 'rocky')
- JWT auth → Fred (actor = 'fred')  
- Or add `X-Actor` header for explicit control

---

## Beads Issues

1. **omnifocus-clone-sidebar-projects** — Add Projects tree section to sidebar
2. **omnifocus-clone-sidebar-tags** — Add Tags tree section to sidebar
3. **omnifocus-clone-changelog-model** — Add ChangeLog table and Prisma migration
4. **omnifocus-clone-changelog-api** — Add GET /api/changelog endpoint
5. **omnifocus-clone-changelog-recording** — Record changes in ActionsService with actor tracking

---

## Acceptance Criteria

### Sidebar
- [ ] Projects section shows folder/project hierarchy
- [ ] Tags section shows tag hierarchy
- [ ] Both sections are collapsible
- [ ] Clicking navigates to that project/tag
- [ ] Task counts shown

### Changelog
- [ ] ChangeLog table exists with proper indexes
- [ ] GET /api/changelog returns changes since timestamp
- [ ] Changes include actor (fred/rocky)
- [ ] Changes recorded on all action mutations
- [ ] Can filter by actor and entityType
