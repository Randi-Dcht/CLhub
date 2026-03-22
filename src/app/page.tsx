'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadConfig, saveConfig } from '@/lib/config'
import { RepositoryConfig } from '@/types'
import styles from './page.module.css'
import {
  BookOpen, Github, Lock, Globe, ChevronRight,
  AlertCircle, Loader2, Zap, CheckCircle2, GitBranch,
  Eye, EyeOff, ArrowLeft
} from 'lucide-react'

type Step = 'form' | 'confirm' | 'done'

interface RepoInfo {
  name: string
  description: string
  default_branch: string
}

function GitLabIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
  )
}

export default function SetupPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('form')
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github')
  const [isPrivate, setIsPrivate] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [branch, setBranch] = useState('')
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loadConfig()) router.push('/apps')
  }, [router])

  /* ─── Step 1 → validate repo ─── */
  async function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!repoUrl.trim()) { setError("L'URL du dépôt est requise"); return }
    if (isPrivate && !token.trim()) { setError('Un token est requis pour les dépôts privés'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, repoUrl, username, token, isPrivate, branch }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setRepoInfo(data as RepoInfo)
      if (!branch) setBranch(data.default_branch)
      setStep('confirm')
    } catch { setError('Erreur réseau') } finally { setLoading(false) }
  }

  /* ─── Step 2 → load changelogs & save ─── */
  async function handleConnect() {
    setLoading(true)
    setError('')
    const config: RepositoryConfig = {
      provider, repoUrl: repoUrl.trim(),
      username: username.trim() || undefined,
      token: token.trim() || undefined,
      branch: branch.trim() || undefined,
      isPrivate,
    }
    try {
      const res = await fetch('/api/changelogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setStep('form'); return }
      if (data.count === 0) {
        setError("Aucun fichier changelog trouvé. Les fichiers doivent contenir 'changelog' dans leur nom avec l'extension .yml / .yaml / .json")
        setStep('form')
        return
      }
      saveConfig(config)
      setStep('done')
      setTimeout(() => router.push('/apps'), 800)
    } catch { setError('Erreur réseau'); setStep('form') } finally { setLoading(false) }
  }

  /* ─── Render ─── */
  const stepIndex = step === 'form' ? 0 : step === 'confirm' ? 1 : 2

  return (
    <div className={styles.page}>
      {/* Decorative background */}
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.wrap}>
        {/* Logo + title */}
        <header className={styles.header}>
          <div className={styles.logo}><BookOpen size={26} strokeWidth={1.5} /></div>
          <h1 className={styles.title}>ChangeLog Hub</h1>
          <p className={styles.sub}>Connectez votre dépôt pour explorer et partager vos changelogs</p>
        </header>

        {/* Progress dots */}
        <div className={styles.progress}>
          {['Configurer', 'Vérifier', 'Connecté'].map((label, i) => (
            <div key={label} className={styles.progressItem}>
              <div className={`${styles.progressDot} ${i < stepIndex ? styles.progressDone : ''} ${i === stepIndex ? styles.progressActive : ''}`}>
                {i < stepIndex ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className={`${styles.progressLabel} ${i === stepIndex ? styles.progressLabelActive : ''}`}>{label}</span>
              {i < 2 && <div className={`${styles.progressLine} ${i < stepIndex ? styles.progressLineDone : ''}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className={styles.card}>

          {/* ── FORM ── */}
          {step === 'form' && (
            <form onSubmit={handleValidate} noValidate>

              {/* Provider */}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Plateforme</span>
                <div className={styles.toggle2}>
                  <button type="button" onClick={() => setProvider('github')}
                    className={`${styles.toggleBtn} ${provider === 'github' ? styles.toggleBtnOn : ''}`}>
                    <Github size={18} strokeWidth={1.5} /><span>GitHub</span>
                  </button>
                  <button type="button" onClick={() => setProvider('gitlab')}
                    className={`${styles.toggleBtn} ${provider === 'gitlab' ? styles.toggleBtnOn : ''}`}>
                    <GitLabIcon size={18} /><span>GitLab</span>
                  </button>
                </div>
              </div>

              {/* Visibility */}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Visibilité</span>
                <div className={styles.segmented}>
                  <button type="button" onClick={() => setIsPrivate(false)}
                    className={`${styles.segBtn} ${!isPrivate ? styles.segBtnOn : ''}`}>
                    <Globe size={14} /><span>Public</span>
                  </button>
                  <button type="button" onClick={() => setIsPrivate(true)}
                    className={`${styles.segBtn} ${isPrivate ? styles.segBtnOn : ''}`}>
                    <Lock size={14} /><span>Privé</span>
                  </button>
                </div>
              </div>

              {/* URL */}
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="url">URL du dépôt</label>
                <input id="url" type="url" required autoFocus
                  className={styles.input}
                  placeholder={`https://${provider}.com/utilisateur/mon-projet`}
                  value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
              </div>

              {/* Private fields */}
              {isPrivate && (
                <div className={styles.privateBlock}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="username">Nom d&apos;utilisateur</label>
                    <input id="username" type="text" className={styles.input}
                      placeholder="votre_pseudo" value={username}
                      onChange={e => setUsername(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="token">
                      Token d&apos;accès <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputRow}>
                      <input id="token" type={showToken ? 'text' : 'password'} required={isPrivate}
                        className={styles.input}
                        placeholder={provider === 'github' ? 'ghp_…' : 'glpat-…'}
                        value={token} onChange={e => setToken(e.target.value)} />
                      <button type="button" className={styles.eyeBtn}
                        onClick={() => setShowToken(v => !v)} title={showToken ? 'Masquer' : 'Afficher'}>
                        {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className={styles.hint}>
                      {provider === 'github'
                        ? 'Personal Access Token — scope "repo" (dépôts privés)'
                        : 'Personal Access Token — scope "read_repository"'}
                    </p>
                  </div>
                </div>
              )}

              {/* Branch */}
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="branch">
                  Branche&nbsp;<span className={styles.opt}>(optionnel, défaut&nbsp;: main)</span>
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.inputIcon}><GitBranch size={14} /></span>
                  <input id="branch" type="text" className={`${styles.input} ${styles.inputIndented}`}
                    placeholder="main" value={branch} onChange={e => setBranch(e.target.value)} />
                </div>
              </div>

              {error && (
                <div className={styles.errorBox}><AlertCircle size={15} /><span>{error}</span></div>
              )}

              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading
                  ? <><Loader2 size={17} className="spin" /><span>Vérification…</span></>
                  : <><span>Vérifier la connexion</span><ChevronRight size={17} /></>}
              </button>
            </form>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && repoInfo && (
            <div className={`${styles.confirmWrap} fade-up`}>
              <div className={styles.confirmIcon}><CheckCircle2 size={30} strokeWidth={1.5} /></div>
              <h2 className={styles.confirmTitle}>Dépôt accessible !</h2>

              <dl className={styles.infoGrid}>
                <dt>Projet</dt><dd><strong>{repoInfo.name}</strong></dd>
                {repoInfo.description && (<><dt>Description</dt><dd>{repoInfo.description}</dd></>)}
                <dt>Branche</dt>
                <dd>
                  <GitBranch size={12} style={{verticalAlign:'middle',marginRight:4}} />
                  {branch || repoInfo.default_branch}
                </dd>
              </dl>

              {error && (
                <div className={styles.errorBox}><AlertCircle size={15} /><span>{error}</span></div>
              )}

              <div className={styles.confirmActions}>
                <button className={styles.ghostBtn}
                  onClick={() => { setStep('form'); setError('') }}>
                  <ArrowLeft size={15} /><span>Modifier</span>
                </button>
                <button className={`${styles.primaryBtn} ${styles.primaryBtnGrow}`}
                  onClick={handleConnect} disabled={loading}>
                  {loading
                    ? <><Loader2 size={17} className="spin" /><span>Chargement…</span></>
                    : <><span>Charger les changelogs</span><ChevronRight size={17} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className={`${styles.doneWrap} fade-in`}>
              <div className={styles.doneIcon}><CheckCircle2 size={38} strokeWidth={1.5} /></div>
              <h2 className={styles.confirmTitle}>Connexion réussie !</h2>
              <p className={styles.sub} style={{ marginTop: 6 }}>Redirection en cours…</p>
              <Loader2 size={20} className="spin" style={{ color: 'var(--accent)', marginTop: 12 }} />
            </div>
          )}
        </div>

        {/* Format hint — only on form step */}
        {step === 'form' && (
          <details className={styles.hint2}>
            <summary className={styles.hintSummary}>
              <Zap size={13} />
              <span>Format attendu des fichiers changelog</span>
            </summary>
            <pre className={styles.hintCode}>{`# mon-app-changelog.yml  ← nom doit contenir "changelog"
name: Mon Application
description: Description optionnelle
repository: https://github.com/user/repo   # optionnel

versions:
  - version: "2.1.0"
    date: "2024-03-15"
    changes:
      - type: added      # added|changed|fixed|deprecated|removed|security|breaking
        description: Nouvelle fonctionnalité X
      - type: fixed
        description: Correction du bug Y

upcoming:                # optionnel — fonctionnalités futures
  - title: Feature Z
    description: Prévue pour la prochaine version
    priority: high       # high | medium | low
    milestone: v2.2.0`}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
