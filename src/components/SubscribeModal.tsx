'use client'
import { useState } from 'react'
import { Bell, X, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import styles from './SubscribeModal.module.css'

interface Props {
  slug?: string        // if provided, subscribe to this app only
  appName?: string
}

export function SubscribeButton({ slug, appName }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className={styles.triggerBtn} onClick={() => setOpen(true)}>
        <Bell size={15} /><span>S&apos;abonner</span>
      </button>
      {open && <SubscribeModal slug={slug} appName={appName} onClose={() => setOpen(false)} />}
    </>
  )
}

function SubscribeModal({
  slug, appName, onClose,
}: { slug?: string; appName?: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [scope, setScope] = useState<'app' | 'all'>(slug ? 'app' : 'all')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const slugs = slug && scope === 'app' ? [slug] : null
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slugs }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setEmailEnabled(data.emailEnabled)
      setDone(true)
    } catch { setError('Erreur réseau') } finally { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadLeft}>
            <Bell size={17} strokeWidth={1.5} />
            <span>{slug ? `S&apos;abonner à ${appName}` : 'S&apos;abonner aux mises à jour'}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className={styles.modalBody}>
            <div className={styles.successWrap}>
              <CheckCircle2 size={36} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
              <h3 className={styles.successTitle}>Abonnement enregistré !</h3>
              {emailEnabled
                ? <p className={styles.successSub}>Un email de confirmation vous a été envoyé à <strong>{email}</strong>.</p>
                : <p className={styles.successSub}>Vous serez notifié lors des prochaines mises à jour. (Email non configuré sur ce serveur)</p>
              }
              <button className={styles.doneBtn} onClick={onClose}>Fermer</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalBody}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sub-email">Adresse email</label>
              <div className={styles.inputWrap}>
                <Mail size={14} className={styles.inputIcon} />
                <input
                  id="sub-email"
                  type="email"
                  required
                  autoFocus
                  className={styles.input}
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {slug && (
              <div className={styles.field}>
                <span className={styles.label}>Recevoir les notifications de</span>
                <div className={styles.radioGroup}>
                  <label className={`${styles.radioLabel} ${scope === 'app' ? styles.radioOn : ''}`}>
                    <input type="radio" name="scope" value="app"
                      checked={scope === 'app'} onChange={() => setScope('app')} />
                    <span>Cette application uniquement<br /><small>{appName}</small></span>
                  </label>
                  <label className={`${styles.radioLabel} ${scope === 'all' ? styles.radioOn : ''}`}>
                    <input type="radio" name="scope" value="all"
                      checked={scope === 'all'} onChange={() => setScope('all')} />
                    <span>Toutes les applications</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorBox}><AlertCircle size={14} /><span>{error}</span></div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="spin" /><span>Abonnement…</span></>
                : <><Bell size={15} /><span>S&apos;abonner</span></>}
            </button>
            <p className={styles.privacy}>Vous pourrez vous désabonner à tout moment via le lien dans les emails.</p>
          </form>
        )}
      </div>
    </div>
  )
}
