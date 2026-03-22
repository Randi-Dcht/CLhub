'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadConfig, clearConfig } from '@/lib/config'
import { ChangelogFile } from '@/types'
import styles from './apps.module.css'
import {
  BookOpen, RefreshCw, LogOut, Search, Package,
  ChevronRight, Clock, Tag, ArrowUpRight, Loader2,
  AlertCircle, Github
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

function GitLabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
  )
}

function relDate(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }) }
  catch { return d }
}

export default function AppsPage() {
  const router = useRouter()
  const [all, setAll] = useState<ChangelogFile[]>([])
  const [filtered, setFiltered] = useState<ChangelogFile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const config = typeof window !== 'undefined' ? loadConfig() : null

  const load = useCallback(async (isRefresh = false) => {
    const cfg = loadConfig()
    if (!cfg) { router.push('/'); return }
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/changelogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAll(data.changelogs)
      setFiltered(data.changelogs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setLoading(false); setRefreshing(false) }
  }, [router])

  useEffect(() => {
    if (!loadConfig()) { router.push('/'); return }
    load()
  }, [load, router])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    ))
  }, [search, all])

  if (loading) return (
    <div className={styles.center}>
      <Loader2 size={26} className="spin" style={{ color: 'var(--accent)' }} />
      <p>Chargement des changelogs…</p>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/apps" className={styles.brand}>
            <BookOpen size={19} strokeWidth={1.5} />
            <span>ChangeLog Hub</span>
          </Link>
          <div className={styles.navRight}>
            {config && (
              <div className={styles.repoChip}>
                {config.provider === 'github' ? <Github size={13} /> : <GitLabIcon size={13} />}
                <span>{config.repoUrl.split('/').slice(-2).join('/')}</span>
              </div>
            )}
            <button className={styles.iconBtn} title="Rafraîchir"
              onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            </button>
            <button className={styles.iconBtn} title="Déconnecter"
              onClick={() => { clearConfig(); router.push('/') }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.pageTitle}>Applications</h1>
            <p className={styles.pageCount}>{all.length} changelog{all.length !== 1 ? 's' : ''} trouvé{all.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Rechercher…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className={styles.errorBox}><AlertCircle size={15} /><span>{error}</span></div>
        )}

        {filtered.length === 0 && !error ? (
          <div className={styles.empty}>
            <Package size={38} strokeWidth={1} />
            <p>{search ? 'Aucun résultat pour cette recherche' : 'Aucun changelog trouvé'}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((cl, i) => (
              <Link key={cl.slug} href={`/apps/${cl.slug}`} className={styles.card}
                style={{ animationDelay: `${i * .04}s` }}>
                <div className={styles.cardTop}>
                  <div className={styles.appIcon}>{cl.name[0].toUpperCase()}</div>
                  <div className={styles.cardArrow}><ArrowUpRight size={15} /></div>
                </div>
                <div className={styles.cardMid}>
                  <h2 className={styles.appName}>{cl.name}</h2>
                  {cl.description && <p className={styles.appDesc}>{cl.description}</p>}
                </div>
                <div className={styles.cardFoot}>
                  {cl.versions[0]?.version && (
                    <span className={styles.badge} data-color="green">
                      <Tag size={10} />v{cl.versions[0].version}
                    </span>
                  )}
                  {cl.versions[0]?.date && (
                    <span className={styles.badge} data-color="neutral">
                      <Clock size={10} />{relDate(cl.versions[0].date)}
                    </span>
                  )}
                  <span className={styles.vcount}>
                    {cl.versions.length} version{cl.versions.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight size={13} className={styles.chevron} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
