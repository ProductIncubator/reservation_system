import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const VALID_TABS = ['upcoming', 'past', 'cancelled', 'all'] as const

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'upcoming'

  if (!VALID_TABS.includes(tab as any)) {
    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  }

  const now = new Date()
  const providerId = session.user.id

  const where: Prisma.BookingWhereInput = { providerId }

  if (tab === 'upcoming') {
    where.startTime = { gte: now }
    where.status = { in: ['confirmed', 'pending'] }
  } else if (tab === 'past') {
    where.startTime = { lt: now }
    where.status = { in: ['confirmed', 'completed', 'no_show'] }
  } else if (tab === 'cancelled') {
    where.status = 'cancelled'
  }

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
