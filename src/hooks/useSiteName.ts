'use client'
import { useState, useEffect } from 'react'

export function useSiteName() {
  const [siteName, setSiteName] = useState('ChangeLog Hub')

  useEffect(() => {
    fetch('/api/site')
      .then(r => r.json())
      .then(d => { if (d.siteName) setSiteName(d.siteName) })
      .catch(() => {})
  }, [])

  return siteName
}
