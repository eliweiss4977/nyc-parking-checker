'use client'

import { useState } from 'react'

export default function AddressForm() {
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [restrictions, setRestrictions] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
    const data = await res.json()
    setLocation(data.location)

    const signsRes = await fetch(`/api/parking?lat=${data.location.lat}&lng=${data.location.lng}`)
    const signsData = await signsRes.json()

    const now = new Date()
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const hour = now.getHours()

    const matches = signsData.signs.filter((sign: any) => {
      const rule = sign.regulation?.toUpperCase() || ''
      if (!rule.includes(day)) return false

      // Extract time ranges (e.g. 8AM-10AM or 10:30AM–1PM)
      const timeRegex = /(\d{1,2})(?::(\d{2}))?(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?(AM|PM)/
      const match = rule.match(timeRegex)

      if (!match) return true // if no time found but matches day, assume restriction applies

      const [
        _,
        startHourStr, startMinStr, startPeriod,
        endHourStr, endMinStr, endPeriod
      ] = match

      const parseTo24 = (hourStr: string, minStr: string | undefined, period: string) => {
        let hour = parseInt(hourStr)
        const min = parseInt(minStr || '0')
        if (period === 'PM' && hour !== 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0
        return hour + min / 60
      }

      const nowTime = now.getHours() + now.getMinutes() / 60
      const startTime = parseTo24(startHourStr, startMinStr, startPeriod)
      const endTime = parseTo24(endHourStr, endMinStr, endPeriod)

      return nowTime >= startTime && nowTime <= endTime
    }).map((match: any) => match.regulation)

    setRestrictions(matches)
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          type="text"
          placeholder="Enter NYC address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">
          Check
        </button>
      </form>
      {location && (
        <div className="mt-4">
          <p><strong>Latitude:</strong> {location.lat}</p>
          <p><strong>Longitude:</strong> {location.lng}</p>
          {restrictions.length > 0 ? (
            <div className="mt-4 text-red-600">
              <p><strong>⚠️ Active Restrictions:</strong></p>
              <ul className="list-disc pl-5">
                {restrictions.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : (
            location && (
              <div className="mt-4 text-green-600">
                <p><strong>✅ You're good — no active restrictions found for today.</strong></p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}