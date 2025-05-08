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

    const matches = signsData.signs.filter((sign: { regulation?: string }) => {
      const rule = sign.regulation?.toUpperCase() || ''
      if (!rule.includes(day)) return false

      const timeRegex = /(\d{1,2})(?::(\d{2}))?(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?(AM|PM)/
      const match = rule.match(timeRegex)

      if (!match) return true

      const [
        _unused,
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
    }).map((match: { regulation?: string }) => {
      return match.regulation
        ?.replace(/\bRPP\b|\bNO STANDING\b/gi, '')
        ?.replace(/\s+/g, ' ')
        ?.trim()
        ?.replace(/\b\w/g, (c) => c.toUpperCase())
    })

    setRestrictions(matches)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">NYC Parking Checker</h1>
        <p className="text-gray-600 mb-6">Enter an NYC address to find out if you need to move your car.</p>
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
              <div className="mt-4 bg-red-100 text-red-700 border border-red-300 p-3 rounded">
                <p><strong>⚠️ Active Restrictions:</strong></p>
                <ul className="list-disc pl-5">
                  {restrictions.map((r: string | undefined, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              location && (
                <div className="mt-4 bg-green-100 text-green-700 border border-green-300 p-3 rounded">
                  <p><strong>✅ You&apos;re good — no active restrictions found for today.</strong></p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}