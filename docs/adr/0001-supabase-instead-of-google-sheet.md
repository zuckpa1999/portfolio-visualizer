---
status: superseded by ADR-0004
---

# Supabase is the source of truth, not the Google Sheet

The portfolio used to live in a Google Sheet. The app instead stores its data in Supabase (Postgres plus Google sign-in, locked down with row-level security) and talks to it directly from the React front end, with no backend of our own. The Sheet is imported once and then no longer used.

## Considered Options

- **Google Sheet as the database (via the Sheets API)**: rejected. The owner won't open the Sheet anymore because it's unpleasant on mobile, so its only advantage is gone, while it would still force a rigid tab layout and make history queries awkward.
- **Our own backend (.NET + Postgres)**: rejected. It adds a component to build and host, and the goal is as few moving parts as possible.
- **Browser-only storage**: rejected. The data has to be the same on the iPhone and the iPad.
