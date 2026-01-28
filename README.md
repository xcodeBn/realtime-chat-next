# Realtime Chat Next

Realtime Chat Next is a private, ephemeral chat application built with Next.js. It lets users create self-destructing chat rooms with client-side encryption and real-time message delivery.

## Features

- Create password-protected rooms with configurable participant limits.
- End-to-end message encryption with keys generated in the browser and shared via the room URL hash.
- Real-time message delivery and room events backed by Upstash Realtime and Redis.
- Automatic room and message cleanup based on the configured time-to-live.
- Optional custom Upstash Redis connection configured from the application UI.

## Tech Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Elysia API routes
- Upstash Redis and Upstash Realtime
- TanStack Query and Zod

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the application.

## Configuration

The server uses the default `@upstash/redis` environment variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

You can also provide a custom Redis URL and token from the "Advanced: Use Custom Database" screen, which stores the values in local storage for the current browser.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the production bundle
- `npm start` - run the production server
- `npm run lint` - run ESLint
