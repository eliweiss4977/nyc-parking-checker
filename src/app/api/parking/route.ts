import { NextRequest, NextResponse } from 'next/server'

const NYC_DATA_API = 'https://data.cityofnewyork.us/resource/xswq-wnv9.json'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = 100 // meters

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  const query = `${NYC_DATA_API}?$where=within_circle(location, ${lat}, ${lng}, ${radius})&$limit=50`

  const res = await fetch(query)
  const data = await res.json()

  return NextResponse.json({ signs: data })
}