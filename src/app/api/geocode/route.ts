import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

  const res = await fetch(geocodeUrl)
  const data = await res.json()

  const location = data.results?.[0]?.geometry?.location

  if (!location) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  return NextResponse.json({ location })
}