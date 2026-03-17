import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { dataSources } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/tenant'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    const { id } = await params

    const results = await db
      .select()
      .from(dataSources)
      .where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)))

    if (results.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 403 })
    }

    return NextResponse.json(results[0])
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
