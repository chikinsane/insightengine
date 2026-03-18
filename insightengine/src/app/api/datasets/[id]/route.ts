import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { datasets } from '@/db/schema'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'
import { deleteBlob } from '@/lib/storage/blob-store'

export async function GET(
  _req: NextRequest,
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

    return NextResponse.json(dataset)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
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

    // Delete blob from Netlify Blobs
    await deleteBlob(userId, id)

    // Delete dataset record from Neon (cascade will handle dependent records)
    await db.delete(datasets).where(eq(datasets.id, id))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
