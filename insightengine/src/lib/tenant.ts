import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Extract authenticated userId from Clerk. Throws 401-appropriate error if unauthenticated.
 * Use this in every API route handler as the first call.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('UNAUTHENTICATED')
  }
  return userId
}

/**
 * Ensure the Clerk user exists in our users table (lazy sync).
 * Creates the row on first authenticated request if missing.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
  if (existing.length === 0) {
    // Lazy create — get email from Clerk if available, or use placeholder
    await db.insert(users).values({
      id: userId,
      email: `${userId}@placeholder.local`, // Will be updated on profile sync
    }).onConflictDoNothing()
  }
}
