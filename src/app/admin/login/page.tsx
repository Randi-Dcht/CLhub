'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, BookOpen, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // If already logged in → redirect
  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => { if (d.isAdmin) router.replace('/admin/dashboard') })
      .finally(() => setChecking(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur inconnue'); return }
      router.push('/admin/dashboard')
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className={styles.center}>
      <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.wrap}>
        {/* Brand */}
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><BookOpen size={22} strokeWidth={1.5} /></div>
            <span className={styles.logoText}>ChangeLog Hub</span>
          </div>
          <div className={styles.adminBadge}>
            <ShieldCheck size={13} />
            <span>Espace Administrateur</span>
          </div>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.lockIcon}><Lock size={20} strokeWidth={1.5} /></div>
            <h1 className={styles.title}>Connexion</h1>
            <p className={styles.sub}>Accès réservé aux administrateurs</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Nom d&apos;utilisateur</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                className={styles.input}
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Mot de passe</label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`${styles.input} ${styles.inputPad}`}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? <><Loader2 size={16} className="spin" /><span>Connexion…</span></>
                : <><Lock size={16} /><span>Se connecter</span></>
              }
            </button>
          </form>
        </div>

        {/* Back to public */}
        <a href="/apps" className={styles.publicLink}>
          ← Retour aux applications publiques
        </a>
      </div>
    </div>
  )
}
