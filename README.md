# Portfolio Visualizer

Record your portfolio's value from your phone, see how it's split across categories, and see whether it's up or down.
Vocabulary is defined in [CONTEXT.md](./CONTEXT.md); decisions are recorded in [docs/adr](./docs/adr).

## Structure

- `src/core`: domain logic, storage (local + Firestore), charts and view-model hooks, independent of any UI library
- `src/ui` + `src/components/ui`: the screens, built with shadcn/ui + Tailwind (see [ADR 0003](./docs/adr/0003-shadcn-ui.md))

The alternative UI prototypes are kept on the `ui/mantine` and `ui/mui` branches.

## Run

```sh
npm install
npm run dev -- --host   # --host lets you open it on your phone over Wi-Fi
npm test
```

## Data

Without configuration, data is kept in this browser's localStorage and starts from the seed:
`src/core/data/seed/my-portfolio.ts` (your real sheet data, **git-ignored**) or the fictional `example.ts`.
To start over from the seed, run `localStorage.clear()` in the browser console.

### Switching to Firestore

1. Create a Firebase project, add a Web app, and create a Firestore database.
2. Enable Google sign-in (Authentication → Sign-in method) and add the domain you serve the app from to the authorised domains.
3. Publish `firestore.rules`: paste it into Firestore → Rules, or run `npx firebase-tools deploy --only firestore:rules`.
4. Copy `.env.example` to `.env.local` and fill in the values from Project settings → Your apps.

The first sign-in to an empty account imports the seed. See [ADR 0004](./docs/adr/0004-firestore-instead-of-supabase.md) for why Firestore.
