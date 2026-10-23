# Firestore instead of Supabase

The app now stores its data in Firebase Firestore, with Google sign-in through Firebase Auth and access limited by security rules, instead of Supabase. On Supabase's free plan a project pauses after about a week with no requests and has to be restored by hand from the dashboard. The portfolio is updated irregularly, so we would keep coming back to a paused database, and the owner doesn't want to look after one. Firestore's free plan doesn't pause, and it keeps what mattered in ADR 0001: no backend of our own, Google sign-in, and the same data on the iPhone and the iPad. The reasons in ADR 0001 for leaving the Google Sheet still stand.

## Considered Options

- **Keep Supabase and ping it on a schedule** (e.g. a GitHub Actions cron) so it never pauses: rejected. It is one more thing to keep running just so the database stays awake.
- **Supabase Pro ($25/month)**, which doesn't pause: rejected. Too much to pay for a personal tool.
- **Browser-only storage (IndexedDB) with JSON export/import**: rejected for the same reason as in ADR 0001. Keeping two devices in step would be manual.
- **A JSON file in the user's Google Drive** (app-data folder): rejected. It needs more OAuth setup, and every save rewrites the whole file, so edits made on two devices can overwrite each other.

## Consequences

- Postgres and SQL are gone. That costs little, because the app loads the whole portfolio and works out Change vs Previous and Monthly Change itself.
- Each grouping, category, holding and snapshot is one document under `users/{uid}`, in the same shape as the domain types. With no foreign keys, deleting a category or grouping clears it from holdings in app code, in one atomic batch.
- Firestore is proprietary. The portfolio is small and already plain JSON, so moving off it later means writing one new `PortfolioRepository`.
