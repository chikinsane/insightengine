import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { datasets } from '@/db/schema'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'
import type { SchemaColumn } from '@/types/query'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const { id } = await params

    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, id))
      .limit(1)

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Tenant isolation check
    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const confirmedSchema: SchemaColumn[] = body.schema

    if (!Array.isArray(confirmedSchema)) {
      return NextResponse.json(
        { error: 'schema must be an array of SchemaColumn objects' },
        { status: 400 }
      )
    }

    // Store confirmed schema with the confirmed flag set to true
    const [updated] = await db
      .update(datasets)
      .set({
        schema: { columns: confirmedSchema, confirmed: true },
      })
      .where(eq(datasets.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
