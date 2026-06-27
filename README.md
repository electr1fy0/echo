# TurnsOut

![TurnsOut Thumbnail](https://turnsout.xyz/thumb.jpg)

An open community platform built for communities. Ask questions, share knowledge, and curate your feed through isolated chambers.

TurnsOut is a modern social platform that separates content into dedicated spaces, keeping your feed focused and minimal.

## Background

Community platforms are often noisy and disorganized. TurnsOut solves this by using **Chambers** — isolated spaces for specific topics. Join what matters to you, ignore the rest. A question remains a question. An answer an answer. No nested replies. No algorithms.

## Features

- **Chambers** — Dedicated topic spaces to organize content, each with custom channels and schemas
- **Multiple Post Types** — Q&A, partner-finder, campus trade, taxi-sharing, and polls with custom field schemas per channel
- **Threaded Replies** — Nested comments with upvoting and accepted answer marking
- **Direct Messages** — Private conversations between users
- **Reputation, Badges & Levels** — Gamified engagement system
- **Google OAuth** — Social login with email, magic link, and OTP authentication
- **Full-Text Search** — Across posts, replies, chambers, and users
- **Notifications** — Real-time alerts for replies, upvotes, follows, and mentions
- **Bookmarks** — Save and organize posts
- **Analytics** — Track page views, sessions, and custom events
- **Feed Ranking** — Custom algorithm for sorting and ranking content
- **Dark Mode** — System-aware theme with multiple accent colors
- **PWA** — Offline caching and installable web app
- **Onboarding Tour** — Interactive first-time user walkthrough

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TailwindCSS, Vite, TanStack Query |
| Backend | Hono, Cloudflare Workers, Drizzle ORM, Zod |
| Database | PostgreSQL (Neon) |
| Hosting | Cloudflare Pages, Cloudflare Workers, Cloudflare R2 |

## Development

This is a monorepo containing both client and serverless backend.

```bash
git clone https://github.com/electr1fy0/echo.git
cd echo
```

### Backend (Hono)

Located in `serverless/`.

```bash
cd serverless
npm install
# Set up .dev.vars with DATABASE_URL
npm run dev
```

### Client (React)

Located in `client/`.

```bash
cd client
pnpm install
pnpm dev
```

## Requirements

- **Node.js** (or Bun)
- **Wrangler CLI** — For Cloudflare Workers development
- **Neon/PostgreSQL** — Database provider
