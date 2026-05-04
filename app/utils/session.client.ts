// app/lib/session.client.ts
// Client-side session utilities
// Note: For server-side operations in loaders/actions, use session.server.ts instead

import { getSession, commitSession, destroySession } from "./session.server";

/**
 * Get session from request cookie (for use in loaders/actions)
 * This is a re-export from session.server for convenience
 */
export { getSession, commitSession, destroySession };
