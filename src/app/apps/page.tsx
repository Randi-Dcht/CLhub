'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChangelogFile } from '@/types'
import styles from './apps.module.css'
import {
  BookOpen, RefreshCw, Search, Package,
  ChevronRight, Clock, Tag, ArrowUpRight,
  Loader2, AlertCircle, ShieldCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

function relDate(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }) }
  catch { return d }
}

export default function AppsPage() {
  const [all, setAll] = useState<ChangelogFile[]>([])
  const [filtered, setFiltered] = useState<ChangelogFile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [noRepo, setNoRepo] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(''); setNoRepo(false)
    try {
      const res = await fetch('/api/changelogs')
      const data = await res.json()
      if (res.status === 404) { setNoRepo(true); return }
      if (!res.ok) throw new Error(data.error)
      setAll(data.changelogs)
      setFiltered(data.changelogs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

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
            <button className={styles.iconBtn} title="Rafraîchir"
              onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            </button>
            <Link href="/admin/login" className={styles.adminLink} title="Administration">
              <ShieldCheck size={15} />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {/* No repo configured */}
        {noRepo ? (
          <div className={styles.noRepoWrap}>
            <div className={styles.noRepoIcon}><BookOpen size={36} strokeWidth={1} /></div>
            <h2 className={styles.noRepoTitle}>Aucun dépôt configuré</h2>
            <p className={styles.noRepoSub}>Un administrateur doit connecter un dépôt pour afficher les changelogs.</p>
            <Link href="/admin/login" className={styles.adminCta}>
              <ShieldCheck size={15} />
              <span>Accès administrateur</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.topRow}>
              <div>
                <h1 className={styles.pageTitle}>Applications</h1>
                <p className={styles.pageCount}>
                  {all.length} changelog{all.length !== 1 ? 's' : ''} trouvé{all.length !== 1 ? 's' : ''}
                </p>
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
                <p>{search ? 'Aucun résultat' : 'Aucun changelog trouvé'}</p>
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
          </>
        )}
      </main>
    </div>
  )
}
