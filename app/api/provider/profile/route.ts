import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100).trim().optional(),
  businessName: z.string().max(100).trim().nullable().optional(),
  description: z.string().max(500).trim().nullable().optional(),
  timezone: z.string().max(50).optional(),
})

const SELECT = {
  id: true,
  fullName: true,
  email: true,
  username: true,
  businessName: true,
  description: true,
  timezone: true,
  avatarUrl: true,
} as const

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = await prisma.provider.findUnique({
    where: { id: session.user.id },
    select: SELECT,
  })

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  return NextResponse.json(provider)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { fullName, businessName, description, timezone } = parsed.data

    const updated = await prisma.provider.update({
      where: { id: session.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(businessName !== undefined && { businessName: businessName || null }),
        ...(description !== undefined && { description: description || null }),
        ...(timezone !== undefined && { timezone }),
      },
      select: SELECT,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
