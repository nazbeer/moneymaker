# HealMind

AI-powered mental health and wellness platform with web and mobile clients.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Web** | Next.js 16, React 19, Tailwind CSS 4, Recharts, Framer Motion |
| **Frontend Mobile** | React Native 0.76, Expo 52, React Navigation |
| **Backend API** | Express.js 4, Node.js 20, TypeScript 5 |
| **Database** | PostgreSQL 16, Prisma 5 ORM |
| **AI** | OpenAI API (GPT-4o-mini) |
| **Payments** | Stripe (subscriptions) |
| **Auth** | NextAuth (web), JWT + SecureStore (mobile/API) |

## Architecture

```
┌──────────────────┐   ┌──────────────────┐
│  frontend-web    │   │  frontend-mobile │
│  Next.js :3000   │   │  Expo :8081      │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
          ┌─────────▼─────────┐
          │   backend         │
          │   Express :4000   │
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │   PostgreSQL      │
          │   :5432           │
          └───────────────────┘
```

## Features

- **Mood Tracking** — Log daily mood (1-5 scale), notes, tags; auto-track healing streaks
- **AI Therapist** — Streaming chat powered by GPT-4o-mini with session history
- **Journal** — Guided writing prompts across gratitude, reflection, healing, and growth categories
- **Community** — Anonymous/named posts with reactions (heart, hug, strength, relate) and category filtering
- **Exercises** — Step-by-step guided practices (breathing, meditation, CBT, gratitude)
- **Dashboard** — Stats overview, mood trend charts, streak tracking, daily affirmations
- **Premium** — Stripe subscription ($6.99/mo) unlocking unlimited chats, all exercises, advanced features
- **SDK/API Keys** — User-generated API keys for external integrations

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker)
- OpenAI API key
- Stripe account (for payments)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/nazbeer/moneymaker.git
cd moneymaker

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend-mobile && npm install && cd ..
```

### 2. Set up the database

```bash
# Option A: Docker (recommended)
docker-compose up -d

# Option B: Use your own PostgreSQL instance
# Just make sure DATABASE_URL is set correctly in .env files
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` in the project root:

```env
DATABASE_URL="postgresql://healmind:healmind_password@localhost:5432/healmind?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PREMIUM_PRICE_ID="price_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://healmind:healmind_password@localhost:5432/healmind?schema=public"
JWT_SECRET="<generate with: openssl rand -base64 32>"
FRONTEND_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PORT=4000
```

### 4. Initialize the database

```bash
npm run db:push
npm run db:seed    # Seeds affirmations and exercises
```

### 5. Start development servers

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Web frontend
npm run dev

# Terminal 3 — Mobile (optional)
cd frontend-mobile && npx expo start
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API server | http://localhost:4000 |
| API health check | http://localhost:4000/api/health |
| Prisma Studio | `npm run db:studio` |

## Project Structure

```
moneymaker/
├── prisma/
│   └── schema.prisma          # Database schema (13 models)
├── src/                       # Next.js web app (root)
│   ├── app/                   # Pages (dashboard, chat, mood, journal, etc.)
│   ├── components/            # React components
│   └── lib/                   # API client, auth, types, constants
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Backend schema (mirror)
│   └── src/
│       ├── index.ts           # Express server entry
│       ├── routes/            # API route handlers
│       ├── middleware/        # Auth middleware (JWT + API key)
│       └── lib/               # Constants, system prompts
├── frontend-web/
│   └── src/                   # Standalone Next.js web client
├── frontend-mobile/
│   ├── App.tsx                # Expo entry point
│   └── src/
│       ├── screens/           # React Native screens
│       ├── navigation/        # Tab + stack navigation
│       └── lib/               # API client, auth context, types
├── docker-compose.yml         # PostgreSQL + app services
└── Dockerfile                 # Multi-stage Next.js build
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in (returns JWT) |
| GET | `/api/auth/me` | Get current user |

### Core Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats and mood trends |
| POST | `/api/mood` | Log a mood entry (1-5) |
| GET | `/api/mood` | Get mood history (query: `days`) |
| POST | `/api/chat` | Send chat message (SSE streaming) |
| GET | `/api/chat` | List chat sessions |
| GET | `/api/chat/:id` | Get session messages |
| POST | `/api/journal` | Create journal entry |
| GET | `/api/journal` | List entries (paginated) |
| POST | `/api/community` | Create community post |
| GET | `/api/community` | List posts (paginated, filterable) |
| POST | `/api/community/:id/react` | Toggle reaction on post |
| GET | `/api/exercises` | List exercises (premium-gated) |
| GET | `/api/affirmations` | Get random affirmation |

### Payments & SDK
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/checkout` | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| POST | `/api/apikeys` | Create API key |
| GET | `/api/apikeys` | List API keys |
| DELETE | `/api/apikeys` | Delete API key |
| POST | `/api/sdk/chat` | SDK chat (non-streaming) |
| POST | `/api/sdk/mood` | SDK mood logging |
| GET | `/api/sdk/widget` | SDK widget data |

## Docker Deployment

```bash
# Build and run everything
docker-compose up --build

# Or run just the database
docker-compose up -d db
```

The Docker setup uses:
- `postgres:16-alpine` for the database
- Multi-stage Node.js 20 Alpine build for the web app
- Persistent volume for PostgreSQL data

## Mobile App

The Expo mobile app (`frontend-mobile/`) mirrors all web features:

- **Auth** — Login/Register with JWT stored in SecureStore
- **Dashboard** — Affirmation, streaks, mood trend, quick actions
- **Mood Tracker** — Emoji picker, notes, tags, history
- **AI Chat** — Streaming messages, session management
- **Journal** — Prompt cards, write modal, category filtering
- **Community** — Category chips, reaction buttons, FAB to create posts
- **Exercises** — Step-by-step guided flow with progress dots
- **Settings** — Profile, Stripe upgrade, logout

### Running on device

```bash
cd frontend-mobile
npx expo start

# Then scan the QR code with Expo Go, or:
npx expo start --ios
npx expo start --android
```

Set the API URL for your device:

```bash
EXPO_PUBLIC_API_URL=http://<your-ip>:4000 npx expo start
```

## License

MIT
