'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, BookOpen } from 'lucide-react'
import { useSiteName } from '@/hooks/useSiteName'
import styles from './unsubscribe.module.css'

function UnsubscribeContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const siteName = useSiteName()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Token manquant ou invalide.'); return }
    fetch(`/api/unsubscribe?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setStatus('ok')
        else { setStatus('error'); setMessage(d.error ?? 'Erreur inconnue') }
      })
      .catch(() => { setStatus('error'); setMessage('Erreur réseau') })
  }, [token])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/apps" className={styles.brand}>
          <BookOpen size={18} strokeWidth={1.5} /><span>{siteName}</span>
        </Link>

        {status === 'loading' && (
          <div className={styles.body}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
            <p>Traitement en cours…</p>
          </div>
        )}

        {status === 'ok' && (
          <div className={styles.body}>
            <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
            <h1 className={styles.title}>Désabonnement confirmé</h1>
            <p className={styles.sub}>Vous ne recevrez plus de notifications par email.</p>
            <Link href="/apps" className={styles.btn}>Retour aux applications</Link>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.body}>
            <XCircle size={40} strokeWidth={1.5} style={{ color: 'var(--red)' }} />
            <h1 className={styles.title}>Lien invalide</h1>
            <p className={styles.sub}>{message}</p>
            <Link href="/apps" className={styles.btn}>Retour aux applications</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.body}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
            <p>Chargement…</p>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
