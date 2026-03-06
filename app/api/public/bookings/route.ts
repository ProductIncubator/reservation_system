import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createBookingSafe, BookingError } from '@/lib/booking'

const bookingSchema = z.object({
  providerId: z.string().uuid('Invalid provider'),
  serviceId: z.string().uuid('Invalid service'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  customerName: z.string().min(1).max(100).trim(),
  customerEmail: z.string().email('Invalid email').max(200),
  customerPhone: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { providerId, serviceId, startTime, endTime, customerName, customerEmail, customerPhone, notes } = parsed.data

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    // Prevent booking slots in the past
    if (start < new Date()) {
      return NextResponse.json({ error: 'Cannot book a slot in the past' }, { status: 400 })
    }

    const booking = await createBookingSafe({
      providerId,
      serviceId,
      startTime: start,
      endTime: end,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: customerPhone?.trim() || undefined,
      customerTimezone: 'UTC',
      notes: notes?.trim() || undefined,
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 })
    }
    console.error('Public booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
