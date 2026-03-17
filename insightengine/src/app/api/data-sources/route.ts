import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { dataSources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const results = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.userId, userId))

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const body = await req.json()
    const { name, type } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }

    const [created] = await db
      .insert(dataSources)
      .values({ userId, name, type })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
