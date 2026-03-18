import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { datasets } from '@/db/schema'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const results = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
