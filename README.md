# TurnsOut

![TurnsOut Thumbnail](https://echo.aysh.site/thumb.jpeg)


An open community platform built for communities. Ask questions, share knowledge, and curate your feed through isolated chambers.

TurnsOut is a modern social platform that separates content into dedicated spaces, keeping your feed focused and minimal.



## Screenshots
<img width="1920" height="1440" alt="296_1x_shots_so" src="https://github.com/user-attachments/assets/34e52ca5-4bf7-473e-a652-08649227b62b" />
<img width="1920" height="1440" alt="416_1x_shots_so" src="https://github.com/user-attachments/assets/584200bc-ad65-464b-9b93-f4391133521c" />
<img width="1920" height="1440" alt="106_1x_shots_so" src="https://github.com/user-attachments/assets/0500035e-a02a-4e19-b515-1b5110114cda" />


## Background

Community platforms are often noisy and disorganized. TurnsOut solves this by using **Chambers**. Isolated spaces for specific topics. Join what matters to you, ignore the rest.
A question remains a question. An answer an answer. No nested replies. No algorithms.

## Features

### Core
- **Chambers**: Dedicated topic spaces to organize content
- **Q&A**: Structured Question and Answer format
- **Voting**: Community upvotes to surface helpful content
- **Social Proof**: Facepiles showing active participants

### Interface
Has dark mode, PWA, Responsiveness and tons of microinteractions.

### Tech Stack
React, TailwindCSS, Vite, TypeScript, Tanstack Query, Hono, Cloudflare Workers, Drizzle ORM, Neon

## Development

It's a monorepo containing both client and serverless backend.

1. Clone the repository
   ```bash
   git clone https://github.com/electr1fy0/echo.git
   cd echo
   ```

### Backend (Hono)

 Located in `serverless/`.

```bash
cd serverless
# Set up your .dev.vars with DATABASE_URL
npm install
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

- **Node.js**: (or Bun)
- **Wrangler CLI**: For Cloudflare Workers development
- **Neon/PostgreSQL**: Database provider
