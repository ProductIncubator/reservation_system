import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_TABS = ['upcoming', 'past', 'cancelled', 'all'] as const

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'upcoming'

  if (!VALID_TABS.includes(tab as (typeof VALID_TABS)[number])) {
    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  }

  const now = new Date()
  const providerId = session.user.id

  const baseWhere = { providerId }

  const where =
    tab === 'upcoming'
      ? { ...baseWhere, startTime: { gte: now }, status: { in: ['confirmed', 'pending'] as string[] } }
      : tab === 'past'
      ? { ...baseWhere, startTime: { lt: now }, status: { in: ['confirmed', 'completed', 'no_show'] as string[] } }
      : tab === 'cancelled'
      ? { ...baseWhere, status: 'cancelled' as string }
      : baseWhere

  try {
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: tab === 'past' ? 'desc' : 'asc' },
      include: {
        service: { select: { name: true, price: true, currency: true } },
      },
    })
    return NextResponse.json({ bookings })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
