'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChangelogFile } from '@/types'
import { useSiteName } from '@/hooks/useSiteName'
import styles from './apps.module.css'
import {
  BookOpen, RefreshCw, Search, Package,
  ChevronRight, Clock, Tag, ArrowUpRight,
  Loader2, AlertCircle, ShieldCheck, Rss
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { SubscribeButton } from '@/components/SubscribeModal'
import { fr } from 'date-fns/locale'

function relDate(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }) }
  catch { return d }
}

export default function AppsPage() {
  const siteName = useSiteName()
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
      if (!res.ok) { setError(data.error ?? 'Erreur inconnue'); return }
      setAll(data.changelogs)
      setFiltered(data.changelogs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
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
      <p>Chargement…</p>
    </div>
  )

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/apps" className={styles.brand}>
            <BookOpen size={19} strokeWidth={1.5} />
            <span>{siteName}</span>
          </Link>
          <div className={styles.navRight}>
            <a href="/rss.xml" target="_blank" rel="noopener noreferrer"
              className={styles.rssLink} title="Flux RSS global">
              <Rss size={15} />
            </a>
            <SubscribeButton />
            <button className={styles.iconBtn} title="Rafraîchir"
              onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            </button>
            <Link href="/admin/login" className={styles.adminLink} title="Administration">
              <ShieldCheck size={15} /><span>Admin</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {noRepo ? (
          <div className={styles.noRepoWrap}>
            <div className={styles.noRepoIcon}><BookOpen size={36} strokeWidth={1} /></div>
            <h2 className={styles.noRepoTitle}>Aucun dépôt configuré</h2>
            <p className={styles.noRepoSub}>Un administrateur doit connecter un dépôt pour afficher les changelogs.</p>
            <Link href="/admin/login" className={styles.adminCta}>
              <ShieldCheck size={15} /><span>Accès administrateur</span>
            </Link>
          </div>
        ) : error ? (
          <div className={styles.noRepoWrap}>
            <AlertCircle size={38} strokeWidth={1} style={{ color: 'var(--red)' }} />
            <h2 className={styles.noRepoTitle}>Erreur de chargement</h2>
            <p className={styles.noRepoSub}>{error}</p>
            <button className={styles.adminCta} onClick={() => load(true)}>
              <RefreshCw size={15} /><span>Réessayer</span>
            </button>
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

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <Package size={38} strokeWidth={1} />
                <p>{search ? 'Aucun résultat' : 'Aucun changelog trouvé — vérifiez que vos fichiers contiennent "changelog" dans leur nom'}</p>
                {!search && (
                  <p style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: 8 }}>
                    Exemples valides&nbsp;: <code>app-changelog.yml</code>, <code>CHANGELOG.yaml</code>, <code>my-app-changelog.json</code>
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map((cl, i) => (
                  <Link key={cl.slug} href={`/apps/${cl.slug}`} className={styles.card}
                    style={{ animationDelay: `${i * .04}s` }}>
                    <div className={styles.cardTop}>
                      <div className={styles.appIcon}>{cl.name[0].toUpperCase()}</div>
                      <div className={styles.cardArrow}><ArrowUpRight size={15}/></div>
                    </div>
                    <div className={styles.cardMid}>
                      <h2 className={styles.appName}>{cl.name}</h2>
                      {cl.description && <p className={styles.appDesc}>{cl.description}</p>}
                    </div>
                    <div className={styles.cardFoot}>
                      {cl.versions[0]?.version && (
                        <span className={styles.badge} data-color="green">
                          <Tag size={10}/>v{cl.versions[0].version}
                        </span>
                      )}
                      {cl.versions[0]?.date && (
                        <span className={styles.badge} data-color="neutral">
                          <Clock size={10}/>{relDate(cl.versions[0].date)}
                        </span>
                      )}
                      <span className={styles.vcount}>{cl.versions.length} version{cl.versions.length !== 1 ? 's' : ''}</span>
                      <ChevronRight size={13} className={styles.chevron}/>
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
