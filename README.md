# PortfolioIQ — AI-Powered Career Intelligence Platform

PortfolioIQ is a production-grade career intelligence platform that analyzes developer PDF resumes, active GitHub repositories, and target job descriptions using Google Gemini, then compiles structured metrics, keyword gap analysis, and before/after resume updates.

---

## 🎥 Platform Demonstration

Watch the platform, responsive layout, and timeline analysis flow in action:

[![PortfolioIQ Platform Walkthrough](https://img.youtube.com/vi/8bHguG0czLo/maxresdefault.jpg)](https://youtu.be/8bHguG0czLo)
---

## System Architecture

```
                 +-------------------+
                 |   Next.js App     |
                 | (Client / Poller) |
                 +---------+---------+
                           |
            HTTPS (JWT)    |  GET /status
            Upload PDF     |  Poll progress
                           v
                 +---------+---------+
                 |    Express API    |
                 |      Server       |
                 +----+---------+----+
                      |         |
         Save Records |         | Push Job Task
                      v         v
                 +---------+  +----+-----+
                 | MongoDB |  |  Redis   |
                 | (Atlas) |  | (BullMQ) |
                 +---------+  +----+-----+
                                   ^
                       Pull Task   |
                       And Process |
                       v
                      +------------+------------+
                      |   Background Worker     |
                      |   Orchestrator Process  |
                      +------+------------+-----+
                             |            |
                Query API    |            | Query Heuristics
                             v            v
                      +------+-----+ +----+----+
                      | GitHub API | |  Google |
                      |  Octokit   | |  Gemini |
                      +------------+ +---------+
```

---

## Technical Stack Justification

- **MongoDB Atlas & Mongoose**: Selected for its flexible schema capabilities. Resumes, parsed markdown strings, and Gemini audit outputs are documents that vary in structure based on job types. Relational layouts would require unnecessary joins and schemas mapping.
- **BullMQ & Redis**: De-couples the slow, rate-limited external third-party requests (GitHub, Gemini) from the client request-response lifecycle. Express returns an HTTP `202 Accepted` immediately (under 2 seconds), and heavy operations run in a dedicated queue worker.
- **Google Gemini (gemini-1.5-flash)**: Selected for state-of-the-art token processing speeds, prompt contextual logic, and native JSON output structure enforcement, guaranteeing type-safe frontend UI bindings.

---

## Architectural Trade-offs

- **HTTP Polling vs. WebSockets**: We chose a 2-second client-side polling cycle over active WebSocket pipelines. Given analysis execution times of 15–30 seconds and a low concurrent dashboard connection count, polling is highly reliable, scales horizontally with stateless instances, and drastically simplifies connection state management.
- **Memory Parsing of PDFs**: Resumes are parsed directly from buffers in memory via `pdf-parse` and streamed to Cloudinary. This eliminates server storage writes, preventing disk space exhaustion vectors and local filesystem cleaning cron scripts.

---

## Data Flow Walkthrough

1.  **Ingestion**: Client uploads resume PDF, inputs target title/description, and triggers form.
2.  **Acknowledge**: Express API parses file via Multer in memory, uploads the binary file to Cloudinary, extracts text via `pdf-parse`, records new `Resume` & `Insight` states in MongoDB, schedules a task in BullMQ, and returns HTTP `202 Accepted` with the `insightId`.
3.  **Polling Launch**: Client receives `202` and transitions to `/analysis/[id]/progress`, initiating a 2-second check loop on `/api/analysis/[id]/status`.
4.  **Scrape & Audit**: Worker thread claims job, queries top repositories from GitHub using token credentials, and analyzes repository READMEs.
5.  **LLM Processing**: Worker constructs prompt context containing resume markdown, job details, and repository audits, queries Gemini API, and enforces strict JSON outputs.
6.  **Persistence**: Worker stores parsed insights, updates job state as `completed`, logs final status logs, and updates progress to `100%`.
7.  **Render**: Client poller detects `completed` status, breaks the loop, and redirects to `/analysis/[id]/results`.

---

## Performance & Optimization Notes

- **Composite Indexing**: Mongoose models implement composite indexes `{ userId: 1, status: 1 }` and `{ userId: 1, createdAt: -1 }` to optimize history lookups.
- **GitHub Backoff Jitter**: The integration service implements exponential backoff retry algorithms with randomized jitter bounds (1s to 32s) to prevent 403 secondary rate limits.
- **Token Optimization**: Prompts are constrained to keep input token context under 4,000 tokens, maximizing execution speed and minimizing Gemini API costs.

---

## UI/UX Enhancements (June 2026)

We recently optimized and polished visual components on the platform landing page to ensure premium, Claude-like quality:

- **Top-Aligned Stepper Timeline**: Resolved a major visual bug where the horizontal connector line crossed through the center of the cards. Moved the pipeline connector line to a dedicated timeline stepper track above the cards, with step nodes perfectly aligned with the column centers.
- **Contrast Enhancements (Opaque Highlighting)**: Replaced the low-contrast blue-on-blue text inside the highlighted active card by setting the Step Number `03` and Step Label `DEPLOY` to solid `text-white`.
- **Skeleton Loader Cleanup**: Removed confusing skeleton loader placeholder bars from the top of the "Before/After" preview cards to keep the visual states clean and prevent users from thinking the page is stuck loading.

---

## Project Setup & Startup

To run this workspace locally, follow these guides:

### 1. Requirements Installation (macOS)

Ensure Redis and MongoDB community services are active:

```bash
# Redis setup
brew install redis
brew services start redis

# MongoDB setup
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Environment Configurations

Create target configuration files:

#### `apps/web/.env.local`

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_secure_nextauth_jwt_key_phrase
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### `apps/api/.env`

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/portfolioiq
REDIS_URL=redis://localhost:6379
GOOGLE_GEMINI_API_KEY=your_google_gemini_key
GITHUB_TOKEN=your_github_personal_access_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXTAUTH_SECRET=a_secure_nextauth_jwt_key_phrase
```

### 3. Run Development Commands

```bash
# Install all root and workspace dependencies
npm install

# Build shared types package
npm run build:shared

# Seed demo recruiter metrics database records
npm run seed

# Launch Express server, worker client, and Next.js frontend concurrently:
# (Launch in separate terminals)
npm run dev:api    # PORT 4000
npm run worker     # Background Queue Worker
npm run dev:web    # PORT 3000
```

---
