import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!providerId || !serviceId || !date) {
    return NextResponse.json({ error: 'providerId, serviceId, and date are required' }, { status: 400 })
  }

  // Validate date format to prevent injection
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlots(providerId, serviceId, date, 'UTC')
    return NextResponse.json(slots)
  } catch (error: any) {
    console.error('Public availability error:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
