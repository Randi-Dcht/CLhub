'use client'
import { useState, useEffect } from 'react'

// Default shown immediately, replaced once API responds
export function useSiteName(defaultName = 'ChangeLog Hub') {
  const [siteName, setSiteName] = useState(defaultName)

  useEffect(() => {
    let cancelled = false
    fetch('/api/site', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.siteName) setSiteName(d.siteName)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return siteName
}
