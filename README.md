# Portfolio Visualizer

Record your portfolio's value from your phone, see how it's split across categories, and see whether it's up or down.
Vocabulary is defined in [CONTEXT.md](./CONTEXT.md); decisions are recorded in [docs/adr](./docs/adr).

## Branches

`main` holds the parts every UI shares (`src/core`). Each UI candidate lives on its own branch:

- `ui/shadcn`: shadcn/ui + Tailwind
- `ui/mantine`: Mantine
- `ui/mui`: MUI

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

### Switching to Supabase

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable the Google provider (Authentication → Providers) and add your site URL to the redirect URLs.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.

The first sign-in to an empty account imports the seed.
