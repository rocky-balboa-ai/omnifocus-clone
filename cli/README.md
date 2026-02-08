# OmniFocus CLI

Command-line interface for OmniFocus Clone API.

## Installation

```bash
# From the repo
cd cli
npm link

# Or install globally (after publishing)
npm install -g omnifocus-cli
```

## Setup

Configure your API endpoint and credentials:

```bash
omnifocus configure
```

This will prompt for:
- **API URL** - Your OmniFocus API endpoint (e.g., `https://api-omnifocus.mycyborg.ai`)
- **Username** - Your account username
- **Password** - Your account password

Configuration is stored in `~/.config/omnifocus/config.json`.

## Usage

### List Tasks
```bash
omnifocus list                    # All tasks
omnifocus list --flagged          # Flagged only
omnifocus list --overdue          # Overdue tasks
omnifocus list --today            # Due today
omnifocus list --rocky            # Managed by Rocky
omnifocus list --status=todo      # By Rocky status
omnifocus list --limit=10         # Limit results
omnifocus list --json             # JSON output
```

### Create Task
```bash
omnifocus add "Task title"
omnifocus add "Pay electricity" --due=2026-02-15 --category=bills --flag
omnifocus add "Review PR" --project=abc123 --priority=high
```

### Manage Tasks
```bash
omnifocus show <id>               # View details
omnifocus complete <id>           # Mark done
omnifocus update <id> --flag      # Update task
omnifocus log <id> "Note here"    # Add activity log
omnifocus delete <id>             # Delete task
```

### Other Commands
```bash
omnifocus projects                # List projects
omnifocus tags                    # List tags
omnifocus health                  # Check API status
omnifocus config                  # Show configuration
omnifocus help                    # Show help
```

## Rocky Status Values

- `inbox` - New, unprocessed
- `todo` - Ready to work on
- `in_progress` - Currently working
- `waiting_on_fred` - Needs human input
- `waiting_external` - Waiting on external party
- `done` - Completed
- `dropped` - Abandoned

## Categories

`bills`, `documents`, `household`, `family`, `errands`, `health`, `finance`, `other`

## Environment Variables

You can also configure via environment variables:

```bash
export OMNIFOCUS_API_URL=https://api-omnifocus.mycyborg.ai
export OMNIFOCUS_USERNAME=fred
export OMNIFOCUS_PASSWORD=secret
```

## License

MIT
