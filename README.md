# ✅ FocusFlow

> **A powerful, open-source task management app inspired by OmniFocus**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FocusFlow is a full-featured Getting Things Done (GTD) task management application built with a modern tech stack. Organize your tasks, manage projects, track your productivity, and achieve your goals with a beautiful, keyboard-driven interface.

---

## 📸 Screenshots

<!-- Add your screenshots here -->
| Dashboard | Projects View | Task Detail |
|-----------|---------------|-------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Projects](docs/screenshots/projects.png) | ![Task Detail](docs/screenshots/task-detail.png) |

---

## ✨ Features

### Core Task Management
- **📝 Smart Quick Add** - Natural language task creation with intelligent parsing
  - `task today` or `task !today` → due today
  - `task in 3 days` / `task next monday` → relative dates
  - `task #ProjectName @tagname` → auto-assign project and tags
  - `task ~15m` / `task ~1h` → estimated time
  - `task !flag` → flagged/high priority
- **📁 Hierarchical Projects** - Sequential, parallel, or single-action projects with folder organization
- **🏷️ Tags & Contexts** - Hierarchical tags with time-based availability windows
- **🔗 Task Dependencies** - Block tasks until prerequisites are complete
- **🔁 Recurring Tasks** - Flexible repeat patterns (fixed, defer-based, due-based)
- **📎 Attachments & Links** - File uploads and URL storage per task

### Perspectives & Views
- **📥 Inbox** - Capture and process unassigned items
- **📅 Forecast** - Calendar-based view of upcoming tasks
- **🎯 Available** - Smart filtering that respects defer dates and tag availability
- **⭐ Flagged** - Quick access to high-priority items
- **📋 Review** - Projects due for periodic review
- **🔧 Custom Perspectives** - Create personalized views with custom filters and sorting

### Productivity Features
- **🔥 Productivity Streaks** - Track consecutive days of task completion with gamification
- **⏱️ Pomodoro Timer** - Built-in focus timer with session tracking
- **🌅 Morning Briefing** - Daily startup summary of what's ahead
- **🌙 End of Day Summary** - Review your accomplishments
- **📊 Statistics Dashboard** - Track completion rates and productivity metrics
- **📋 Task Templates** - Save and reuse common task patterns
- **🔔 Browser Notifications** - Reminders for due and overdue tasks
- **📤 Export** - Download tasks as CSV, Markdown, or plain text

### Keyboard-First Design
- `⌘K` - Quick search
- `⌘P` - Command palette
- `⌘O` - Quick open (jump to projects/tags/perspectives)
- `⌘\` - Toggle focus mode
- `N` - New task
- `E` - Edit selected
- `Space` - Complete task
- `F` - Toggle flag
- `J/K` - Navigate up/down
- `Tab/Shift+Tab` - Indent/outdent tasks
- `?` - Show all keyboard shortcuts

### User Experience
- **🌓 Dark/Light Themes** - System-aware theme with manual override
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **⚡ Fast & Lightweight** - Optimized for performance
- **🎨 Beautiful UI** - Clean, modern interface with smooth animations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [@dnd-kit](https://dndkit.com/) | Drag and drop |
| [date-fns](https://date-fns.org/) | Date utilities |
| [Lucide React](https://lucide.dev/) | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| [NestJS 10](https://nestjs.com/) | Node.js framework |
| [Prisma 5](https://www.prisma.io/) | Database ORM |
| [PostgreSQL 16](https://www.postgresql.org/) | Database |
| [JWT](https://jwt.io/) | Authentication |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| [Docker](https://www.docker.com/) | Containerization |
| [Turbo](https://turbo.build/) | Monorepo build system |
| [Jest](https://jestjs.io/) | Testing |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10.8+
- PostgreSQL 16 (or use Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/omnifocus-clone.git
cd omnifocus-clone

# Start with Docker Compose
docker-compose up

# Access the app at http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Run database migrations
npm run db:generate
npm run db:push

# Start development servers (API on :3001, Web on :7847)
npm run dev
```

### Environment Variables

**API (`apps/api/.env`)**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/focusflow
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:7847
NODE_ENV=development
```

**Web (`apps/web/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📂 Project Structure

```
omnifocus-clone/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── actions/    # Task CRUD & business logic
│   │   │   │   ├── projects/   # Project management
│   │   │   │   ├── tags/       # Tag/context management
│   │   │   │   ├── perspectives/# Custom views
│   │   │   │   ├── attachments/# File uploads
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── export/     # Data export
│   │   │   │   └── folders/    # Folder hierarchy
│   │   │   └── prisma/         # Database service
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # 120+ UI components
│       │   │   ├── actions/    # Task-related components
│       │   │   ├── projects/   # Project components
│       │   │   ├── perspectives/# View components
│       │   │   ├── layout/     # Layout components
│       │   │   └── ui/         # Base UI components
│       │   ├── lib/            # Utilities & hooks
│       │   └── stores/         # Zustand state
│       └── public/             # Static assets
│
├── docker-compose.yml          # Docker orchestration
├── turbo.json                  # Turbo configuration
└── package.json                # Root package
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run API e2e tests
cd apps/api && npm run test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and write tests
4. **Run linting and tests**
   ```bash
   npm run lint
   npm run test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (ESLint + Prettier configured)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Keep PRs focused and atomic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [OmniFocus](https://www.omnigroup.com/omnifocus/) by The Omni Group
- Built with love for the GTD methodology by David Allen
- Icons by [Lucide](https://lucide.dev/)

---

<p align="center">
  Made with ❤️ for productivity enthusiasts
</p>
