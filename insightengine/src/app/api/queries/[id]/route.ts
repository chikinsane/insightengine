import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { queries } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const { id } = await params

    const deleted = await db
      .delete(queries)
      .where(and(eq(queries.id, id), eq(queries.userId, userId)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
