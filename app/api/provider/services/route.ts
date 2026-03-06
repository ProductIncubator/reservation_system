import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().max(500).trim().nullable().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  price: z.coerce.number().min(0).max(100000).nullable().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AZN', 'TRY', 'RUB', 'UAH']).default('USD'),
  bufferTimeMinutes: z.coerce.number().int().min(0).max(120).default(0),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const services = await prisma.service.findMany({
    where: { providerId: session.user.id },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = serviceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, description, durationMinutes, price, currency, bufferTimeMinutes } = parsed.data

    const service = await prisma.service.create({
      data: {
        providerId: session.user.id,
        name,
        description: description ?? null,
        durationMinutes,
        price: price ?? null,
        currency,
        bufferTimeMinutes,
        isActive: true,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Service create error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
