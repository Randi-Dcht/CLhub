'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChangelogFile, VersionEntry, ChangeEntry, FutureFeature } from '@/types'
import styles from './app.module.css'
import {
  BookOpen, ArrowLeft, Tag, Calendar, Package,
  Plus, Wrench, AlertTriangle, Trash2, Shield,
  Zap, RefreshCw, ChevronDown, ChevronUp, Clock,
  Rocket, Star, Loader2, AlertCircle, ExternalLink,
  TrendingUp
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ─── Change type config ─── */
type TypeCfg = { label: string; icon: React.ReactNode; color: string }
const TYPE_CFG: Record<string, TypeCfg> = {
  added:      { label: 'Ajouté',    icon: <Plus size={11} />,          color: 'green'   },
  changed:    { label: 'Modifié',   icon: <RefreshCw size={11} />,     color: 'blue'    },
  fixed:      { label: 'Corrigé',   icon: <Wrench size={11} />,        color: 'purple'  },
  deprecated: { label: 'Déprécié',  icon: <AlertTriangle size={11} />, color: 'amber'   },
  removed:    { label: 'Supprimé',  icon: <Trash2 size={11} />,        color: 'red'     },
  security:   { label: 'Sécurité',  icon: <Shield size={11} />,        color: 'orange'  },
  breaking:   { label: 'Breaking',  icon: <Zap size={11} />,           color: 'pink'    },
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'red', medium: 'amber', low: 'neutral',
}

/* ─── Helpers ─── */
function fmtDate(d: string) {
  try { return format(new Date(d), 'd MMMM yyyy', { locale: fr }) }
  catch { return d }
}
function relDate(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }) }
  catch { return '' }
}

/* ─── Sub-components ─── */
function ChangeBadge({ change }: { change: ChangeEntry }) {
  const cfg = TYPE_CFG[change.type] ?? TYPE_CFG.changed
  return (
    <div className={styles.changeRow} data-color={cfg.color}>
      <span className={styles.changeBadge} data-color={cfg.color}>
        {cfg.icon}{cfg.label}
      </span>
      <p className={styles.changeDesc}>{change.description}</p>
    </div>
  )
}

function VersionCard({ v, index }: { v: VersionEntry; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const isLatest = index === 0

  // group changes by type for the summary bar
  const typeCounts = v.changes.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <article
      className={`${styles.vcard} ${isLatest ? styles.vcardLatest : ''}`}
      style={{ animationDelay: `${index * 0.055}s` }}
      id={`v${v.version}`}
    >
      <header
        className={styles.vcardHead}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className={styles.vcardLeft}>
          <div className={`${styles.vdot} ${isLatest ? styles.vdotLatest : ''}`} />
          <div>
            <div className={styles.vtag}>
              <Tag size={12} />
              <span>v{v.version}</span>
              {isLatest && <span className={styles.latestPill}>latest</span>}
            </div>
            {v.date && (
              <div className={styles.vdate}>
                <Calendar size={11} />
                <span>{fmtDate(v.date)}</span>
                <span className={styles.vdateRel}>· {relDate(v.date)}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.vcardRight}>
          {/* mini type summary */}
          <div className={styles.typeSummary}>
            {Object.entries(typeCounts).map(([type, count]) => {
              const cfg = TYPE_CFG[type]
              if (!cfg) return null
              return (
                <span key={type} className={styles.typeChip} data-color={cfg.color}
                  title={`${count} ${cfg.label}`}>
                  {cfg.icon}<span>{count}</span>
                </span>
              )
            })}
          </div>
          <span className={styles.toggleIcon}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
        </div>
      </header>

      {open && (
        <div className={styles.vcardBody}>
          {v.changes.length === 0
            ? <p className={styles.noChanges}>Aucun changement documenté pour cette version.</p>
            : v.changes.map((c, i) => <ChangeBadge key={i} change={c} />)
          }
        </div>
      )}
    </article>
  )
}

function FeatureCard({ f, index }: { f: FutureFeature; index: number }) {
  const priorityColor = PRIORITY_COLOR[f.priority ?? ''] ?? 'neutral'
  return (
    <div className={styles.fcard} style={{ animationDelay: `${index * 0.06}s` }}>
      <div className={styles.fcardTop}>
        <Star size={13} className={styles.fstar} />
        <h3 className={styles.ftitle}>{f.title}</h3>
        {f.priority && (
          <span className={styles.priorityBadge} data-color={priorityColor}>
            {f.priority}
          </span>
        )}
      </div>
      <p className={styles.fdesc}>{f.description}</p>
      {f.milestone && (
        <div className={styles.fmilestone}>
          <Tag size={11} /><span>{f.milestone}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Page ─── */
export default function AppPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [changelog, setChangelog] = useState<ChangelogFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/changelogs')
      const data = await res.json()
      if (res.status === 404) { setError('Aucun dépôt configuré'); return }
      if (!res.ok) throw new Error(data.error)
      const found = (data.changelogs as ChangelogFile[]).find(c => c.slug === slug)
      if (!found) setError(`Application "${slug}" introuvable`)
      else setChangelog(found)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setLoading(false) }
  }, [slug])

  useEffect(() => { load() }, [load])

  /* Loading */
  if (loading) return (
    <div className={styles.center}>
      <Loader2 size={26} className="spin" style={{ color: 'var(--accent)' }} />
      <p>Chargement…</p>
    </div>
  )

  /* Error */
  if (error || !changelog) return (
    <div className={styles.center}>
      <AlertCircle size={38} strokeWidth={1} style={{ color: 'var(--red)' }} />
      <p style={{ color: 'var(--text-1)', fontWeight: 600 }}>{error || 'Introuvable'}</p>
      <Link href="/apps" className={styles.backBtn}>
        <ArrowLeft size={15} />Retour
      </Link>
    </div>
  )

  const latest = changelog.versions[0]
  const totalChanges = changelog.versions.reduce((s, v) => s + v.changes.length, 0)

  return (
    <div className={styles.page}>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <Link href="/apps" className={styles.navBack}>
              <ArrowLeft size={15} /><span>Applications</span>
            </Link>
            <span className={styles.navSep}>/</span>
            <span className={styles.navCurrent}>{changelog.name}</span>
          </div>
          <Link href="/apps" className={styles.navLogo}>
            <BookOpen size={17} strokeWidth={1.5} />
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.layout}>

          {/* ══ SIDEBAR ══ */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarInner}>

              {/* App identity */}
              <div className={styles.appCard}>
                <div className={styles.appBigIcon}>{changelog.name[0].toUpperCase()}</div>
                <h1 className={styles.appTitle}>{changelog.name}</h1>
                {changelog.description && (
                  <p className={styles.appDesc}>{changelog.description}</p>
                )}
                {changelog.repository && (
                  <a href={changelog.repository} target="_blank" rel="noopener noreferrer"
                    className={styles.repoLink}>
                    <ExternalLink size={12} /><span>Voir le dépôt</span>
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className={styles.statsBox}>
                {latest && (
                  <div className={styles.statRow}>
                    <span className={styles.statKey}><Tag size={12} />Version actuelle</span>
                    <strong className={styles.statVal}>v{latest.version}</strong>
                  </div>
                )}
                {latest?.date && (
                  <div className={styles.statRow}>
                    <span className={styles.statKey}><Calendar size={12} />Dernière MAJ</span>
                    <span className={styles.statVal}>{fmtDate(latest.date)}</span>
                  </div>
                )}
                <div className={styles.statRow}>
                  <span className={styles.statKey}><Package size={12} />Versions</span>
                  <strong className={styles.statVal}>{changelog.versions.length}</strong>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statKey}><TrendingUp size={12} />Changements</span>
                  <strong className={styles.statVal}>{totalChanges}</strong>
                </div>
                {changelog.upcoming && (
                  <div className={styles.statRow}>
                    <span className={styles.statKey}><Rocket size={12} />À venir</span>
                    <strong className={styles.statVal}>{changelog.upcoming.length}</strong>
                  </div>
                )}
              </div>

              {/* Version index */}
              {changelog.versions.length > 1 && (
                <div className={styles.versionIndex}>
                  <p className={styles.versionIndexTitle}>Index des versions</p>
                  {changelog.versions.map((v, i) => (
                    <a key={v.version} href={`#v${v.version}`} className={styles.vIndexItem}>
                      <span className={`${styles.vIndexDot} ${i === 0 ? styles.vIndexDotActive : ''}`} />
                      <span className={styles.vIndexLabel}>v{v.version}</span>
                      {i === 0 && <span className={styles.vIndexLatest}>latest</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ══ CONTENT ══ */}
          <section className={styles.content}>

            {/* Versions */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Clock size={17} strokeWidth={1.5} />
                Historique des versions
              </h2>
              <div className={styles.timeline}>
                <div className={styles.timelineLine} />
                {changelog.versions.map((v, i) => (
                  <VersionCard key={v.version} v={v} index={i} />
                ))}
              </div>
            </div>

            {/* Upcoming */}
            {changelog.upcoming && changelog.upcoming.length > 0 && (
              <div className={`${styles.section} ${styles.upcomingSection}`}>
                <h2 className={styles.sectionTitle}>
                  <Rocket size={17} strokeWidth={1.5} />
                  Fonctionnalités à venir
                </h2>
                <div className={styles.featureGrid}>
                  {changelog.upcoming.map((f, i) => (
                    <FeatureCard key={i} f={f} index={i} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
