import { NextResponse } from 'next/server'
import { db } from '@/db'
import { queries, datasets } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    // Fetch 30 most recent queries joined with dataset name
    const rows = await db
      .select({
        id: queries.id,
        naturalLanguage: queries.naturalLanguage,
        vizType: queries.vizType,
        createdAt: queries.createdAt,
        datasetId: queries.datasetId,
        datasetName: datasets.name,
        datasetRowCount: datasets.rowCount,
      })
      .from(queries)
      .leftJoin(datasets, eq(queries.datasetId, datasets.id))
      .where(eq(queries.userId, userId))
      .orderBy(desc(queries.createdAt))
      .limit(30)

    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    console.error('[queries/route] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
