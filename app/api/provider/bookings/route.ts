import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'upcoming'

  const now = new Date()

  let where: any = { providerId: session.user.id }

  if (tab === 'upcoming') {
    where.startTime = { gte: now }
    where.status = { in: ['confirmed', 'pending'] }
  } else if (tab === 'past') {
    where.startTime = { lt: now }
    where.status = { in: ['confirmed', 'completed', 'no_show'] }
  } else if (tab === 'cancelled') {
    where.status = 'cancelled'
  }
  // 'all' — no extra filter

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: tab === 'past' ? 'desc' : 'asc' },
    include: {
      service: { select: { name: true, price: true, currency: true } },
    },
  })

  return NextResponse.json({ bookings })
}
