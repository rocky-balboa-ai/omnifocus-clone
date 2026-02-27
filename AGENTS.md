# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds


## Vercel Deployment (CRITICAL)

- **Vercel project name:** `omnifocus-clone` (NOT the old `web` project)
- **Custom domain:** `omnifocus.mycyborg.ai` (aliased, not auto-assigned)
- **API URL:** `https://api-omnifocus.mycyborg.ai` (set as `NEXT_PUBLIC_API_URL` env var in Vercel)
- **After EVERY deploy to production**, run: `vercel alias omnifocus.mycyborg.ai`
- **Verify deploy reached production:** `curl -sI "https://omnifocus.mycyborg.ai" | grep age` — must be `age: 0` or very low
- **If `age` is large (thousands+):** The CDN is serving stale content. Re-run `vercel alias`.
- **Build command:** `turbo build --filter=omnifocus-web` (defined in `vercel.json`)
- **Output:** `apps/web/.next`

### Deploy Checklist
```bash
git add -A && git commit -m "description" && git push
npx vercel --prod --force
vercel alias omnifocus.mycyborg.ai
curl -sI "https://omnifocus.mycyborg.ai" | grep age  # verify age: 0
```
