# HealMind

## Web app and backend database

Both applications use Prisma 8 (CLI `8.0.0-rc.22`, PostgreSQL runtime
`8.0.0-rc.17`). These packages have independent release numbers; Prisma 8 is
currently a release candidate. Use Node.js 22.18+, 24.11+, or 26+ (Node 24
recommended). The Docker image uses Node 24.

Install from the repository root with `npm ci`, and install the separate
backend with `cd backend && npm ci`. Each application loads its own `.env`;
set `DATABASE_URL` to your PostgreSQL connection string in both directories.
The backend also needs `JWT_SECRET` for registration/login. Deployment
environments must supply these variables themselves. Never commit credentials.

The schemas are now `src/prisma/contract.prisma` and
`backend/src/prisma/contract.prisma`; keep the models synchronized. The generated
`contract.json` and `contract.d.ts` next to each contract are required runtime
and type artifacts and must be committed. `npm ci` emits them automatically
without connecting to a database.

Run these commands from the root for the Next.js app, or from `backend` for
the Express app:

```sh
npm run db:generate   # Emit artifacts after editing the contract
npm run db:init       # Only for an empty database
npm run db:push       # Reconcile an existing development database
npm run db:seed       # Seed affirmations and exercises
npm run dev
```

`db:push` now runs `prisma db update`, not the removed `prisma db push`.
For an existing Prisma 5 database, first back it up, verify the new contract
against a development copy with `npx prisma db sign`, then review
`npx prisma db update --dry-run` before applying any changes. The converted
contract preserves table/column names, timestamp storage, unique indexes, and
cascading relations. Generated IDs use Prisma 8's CUID2 default; existing IDs
are unchanged. Date conversion in the application preserves UTC `Date` values
and existing ISO JSON responses. The NextAuth adapter uses the new runtime for
users, OAuth accounts, sessions, and verification tokens.

For production schema changes, generate and review a migration with
`npx prisma migration plan`, commit the migration, and deploy it with
`npx prisma db migrate`. Do not initialize or reset a database containing data.
See the [official migration guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql)
for transferring migration ownership from an existing Prisma installation.

Prisma 8 does not include Studio. `npm run db:studio` uses the documented
standalone Prisma 7 Studio against `DATABASE_URL`, outside the project's
Prisma 8 configuration. It downloads that pinned CLI on first use; the
applications themselves do not use a Prisma 7 client.

To run database regression tests, initialize a dedicated test database with
`DATABASE_URL` pointing to it and `npm run db:init`, then run:

```sh
PRISMA_TEST_DATABASE_URL="<test database connection string>" npm run test:db
```

The tests create their own fixtures and remove them afterward. Without the
test URL, only date unit tests run and the database tests are explicitly skipped.
To include HTTP regression tests, run the built backend against the same test
database with a test-only `JWT_SECRET`, and set `PRISMA_TEST_API_URL` to its
local URL alongside `PRISMA_TEST_DATABASE_URL`.
The web app runs on port 3000 and the backend on port 4000 by default.

## Mobile app

The mobile app uses Expo SDK 57, React Native 0.86, and React Navigation.
Scene lifecycle support is enabled through `expo-build-properties` for builds
with Xcode 27 and the iOS 27 SDK. Keep this setting enabled on SDK 57.
The minimum supported iOS version is now 16.4.

```sh
cd frontend-mobile
npm ci
npx expo prebuild --platform ios
npm run ios
```

For Xcode builds, open `frontend-mobile/ios/HealMind.xcworkspace`, select the
HealMind scheme and an iPhone simulator, and run. Xcode, iOS platform components,
and CocoaPods must be installed. Run `npm start` to start Metro separately.

Native projects are generated from the Expo configuration. After an SDK upgrade,
back up any native customizations before regenerating the iOS project.
