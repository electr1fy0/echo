# Echo

![Echo Thumbnail](https://echo.aysh.site/thumb.jpeg)

An open QnA platform built for communities. Ask questions, share knowledge, and curate your feed through isolated chambers.

Echo is a modern social platform that separates content into dedicated spaces, keeping your feed focused and relevant.

## Table of contents

- [Background](#background)
- [Features](#features)
  - [Core](#core)
  - [Interface](#interface)
  - [Tech Stack](#tech-stack)
- [Development](#development)
  - [Server (Go)](#server-go)
  - [Client (React)](#client-react)
- [Requirements](#requirements)

## Background

Community platforms are often noisy and disorganized. Echo solves this by using **Chambers**—isolated spaces for specific topics. Join what matters to you, ignore the rest.

## Features

### Core

- **Chambers**: Dedicated topic spaces to organize content
- **Q&A**: Structured Question and Answer format
- **Voting**: Community upvotes to surface helpful content
- **Social Proof**: Facepiles showing active participants

### Interface

- **Dark Mode**: First-class dark theme integration
- **PWA**: Native-like installable experience on mobile
- **Responsive**: Adaptive layout for all screen sizes
- **Typography**: Clean, legible modern sans-serif fonts

### Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query
- **Backend**: Go (Golang) 1.25, Chi Router
- **Database**: PostgreSQL (pgx driver)
- **Auth**: Stateless JWT authentication

## Development

This repo is a monorepo containing both client and server.

1. Clone the repository
   ```bash
   git clone https://github.com/electr1fy0/echo.git
   cd echo
   ```

### Server (Go)

 Located in `server/`.

```bash
cd server
# Set up your .env file with DATABASE_URL
go run cmd/api/main.go
```

### Client (React)

Located in `client/`.

```bash
cd client
pnpm install
pnpm dev
```

## Requirements

- **Go**: 1.25+
- **PostgreSQL**: Latest stable
