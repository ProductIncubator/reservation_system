import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().nullable().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
  price: z.coerce.number().min(0).max(100000).nullable().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AZN', 'TRY', 'RUB', 'UAH']).optional(),
  bufferTimeMinutes: z.coerce.number().int().min(0).max(120).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.service.findFirst({
      where: { id, providerId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, description, durationMinutes, price, currency, bufferTimeMinutes, isActive } = parsed.data

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(price !== undefined && { price: price ?? null }),
        ...(currency !== undefined && { currency }),
        ...(bufferTimeMinutes !== undefined && { bufferTimeMinutes }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.service.findFirst({
    where: { id, providerId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const activeBookings = await prisma.booking.count({
    where: { serviceId: id, status: { in: ['confirmed', 'pending'] } },
  })

  if (activeBookings > 0) {
    await prisma.service.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Service deactivated (has active bookings)' })
  }

  await prisma.service.delete({ where: { id } })
  return NextResponse.json({ message: 'Service deleted' })
}
