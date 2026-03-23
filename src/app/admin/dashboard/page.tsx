'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './dashboard.module.css'
import {
  BookOpen, Github, Globe, Lock, GitBranch, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, ShieldCheck, LogOut,
  Save, Trash2, RefreshCw, ExternalLink, Calendar, Tag,
  ChevronRight, ArrowLeft, Settings, Database, Type, KeyRound,
  Pencil, Bell, Send, Users, Mail, Rss, X
} from 'lucide-react'
import { RepositoryConfig, Subscriber } from '@/types'

function GitLabIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
    </svg>
  )
}

type Tab = 'repo' | 'settings' | 'subscribers'
type RepoStep = 'form' | 'confirm' | 'saved'

interface SavedConfig {
  repo: (RepositoryConfig & { token?: string }) | null
  settings: { siteName: string }
  updatedAt: string | null
}
interface RepoInfo { name: string; description: string; default_branch: string }

/* ════════════════════════════════════════════════════════════════ */
/*  REPO TAB                                                        */
/* ════════════════════════════════════════════════════════════════ */
function RepoTab({ saved, onSaved }: { saved: SavedConfig; onSaved: () => void }) {
  const [provider, setProvider] = useState<'github' | 'gitlab'>(saved.repo?.provider ?? 'github')
  const [isPrivate, setIsPrivate] = useState(saved.repo?.isPrivate ?? false)
  const [repoUrl, setRepoUrl] = useState(saved.repo?.repoUrl ?? '')
  const [username, setUsername] = useState(saved.repo?.username ?? '')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [branch, setBranch] = useState(saved.repo?.branch ?? '')
  const [step, setStep] = useState<RepoStep>('form')
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccessMsg('')
    if (!repoUrl.trim()) { setError("L'URL du dépôt est requise"); return }
    if (isPrivate && !token.trim()) { setError('Un token est requis pour les dépôts privés'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, repoUrl, username, token, isPrivate, branch }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setRepoInfo(data as RepoInfo)
      if (!branch) setBranch(data.default_branch)
      setStep('confirm')
    } catch { setError('Erreur réseau') } finally { setLoading(false) }
  }

  async function handleSave() {
    setLoading(true); setError('')
    const repo: RepositoryConfig = {
      provider, repoUrl: repoUrl.trim(),
      username: username.trim() || undefined,
      token: token.trim() || undefined,
      branch: branch.trim() || undefined,
      isPrivate,
    }
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setStep('form'); return }
      setSuccessMsg(`Dépôt "${data.info.name}" sauvegardé`)
      setStep('saved'); onSaved()
    } catch { setError('Erreur réseau'); setStep('form') } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Supprimer la configuration du dépôt ?')) return
    setLoading(true)
    await fetch('/api/admin/config', { method: 'DELETE' })
    setRepoUrl(''); setUsername(''); setToken(''); setBranch('')
    setIsPrivate(false); setProvider('github')
    setStep('form'); setSuccessMsg(''); setRepoInfo(null)
    setLoading(false); onSaved()
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.formCol}>
        {saved.repo && step !== 'saved' && (
          <div className={styles.currentBanner}>
            <div className={styles.currentBannerLeft}>
              <CheckCircle2 size={15} className={styles.currentIcon} />
              <div>
                <span className={styles.currentLabel}>Dépôt actif</span>
                <span className={styles.currentRepo}>{saved.repo.repoUrl.split('/').slice(-2).join('/')}</span>
              </div>
            </div>
            <div className={styles.currentMeta}>
              {saved.repo.provider === 'github' ? <Github size={13} /> : <GitLabIcon size={13} />}
              <span>{saved.repo.provider}</span>
              {saved.repo.branch && <><span>·</span><GitBranch size={12} /><span>{saved.repo.branch}</span></>}
            </div>
          </div>
        )}
        {successMsg && step === 'saved' && (
          <div className={styles.successBox}><CheckCircle2 size={15} /><span>{successMsg}</span></div>
        )}

        {(step === 'form' || step === 'saved') && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{saved.repo ? 'Modifier le dépôt' : 'Connecter un dépôt'}</h2>
              <p className={styles.cardSub}>Fichiers <code>*changelog*.yml</code> lus depuis la racine</p>
            </div>
            <form onSubmit={handleValidate} className={styles.cardBody}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Plateforme</span>
                <div className={styles.toggle2}>
                  {(['github', 'gitlab'] as const).map(p => (
                    <button key={p} type="button"
                      className={`${styles.tBtn} ${provider === p ? styles.tBtnOn : ''}`}
                      onClick={() => setProvider(p)}>
                      {p === 'github' ? <Github size={17} strokeWidth={1.5} /> : <GitLabIcon size={17} />}
                      <span>{p === 'github' ? 'GitHub' : 'GitLab'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Visibilité</span>
                <div className={styles.segmented}>
                  <button type="button" className={`${styles.segBtn} ${!isPrivate ? styles.segBtnOn : ''}`} onClick={() => setIsPrivate(false)}><Globe size={13} /><span>Public</span></button>
                  <button type="button" className={`${styles.segBtn} ${isPrivate ? styles.segBtnOn : ''}`} onClick={() => setIsPrivate(true)}><Lock size={13} /><span>Privé</span></button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="rurl">URL du dépôt</label>
                <input id="rurl" type="url" required className={styles.input}
                  placeholder={`https://${provider}.com/utilisateur/projet`}
                  value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
              </div>
              {isPrivate && (
                <div className={styles.privateBlock}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="runame">Nom d&apos;utilisateur</label>
                    <input id="runame" type="text" className={styles.input}
                      placeholder="votre_pseudo" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="rtoken">Token d&apos;accès <span className={styles.req}>*</span></label>
                    <div className={styles.inputRow}>
                      <input id="rtoken" type={showToken ? 'text' : 'password'} required={isPrivate}
                        className={styles.input}
                        placeholder={saved.repo ? '(inchangé si vide)' : provider === 'github' ? 'ghp_…' : 'glpat-…'}
                        value={token} onChange={e => setToken(e.target.value)} />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowToken(v => !v)}>
                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className={styles.hint}>{provider === 'github' ? 'Personal Access Token — scope "repo"' : 'Personal Access Token — scope "read_repository"'}</p>
                  </div>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="rbranch">Branche <span className={styles.opt}>(défaut : main)</span></label>
                <div className={styles.inputRow}>
                  <span className={styles.inputIcon}><GitBranch size={13} /></span>
                  <input id="rbranch" type="text" className={`${styles.input} ${styles.inputIndented}`}
                    placeholder="main" value={branch} onChange={e => setBranch(e.target.value)} />
                </div>
              </div>
              {error && <div className={styles.errorBox}><AlertCircle size={14} /><span>{error}</span></div>}
              <div className={styles.formActions}>
                {saved.repo && (
                  <button type="button" className={styles.deleteBtn} onClick={handleDelete} disabled={loading}>
                    <Trash2 size={14} /><span>Supprimer</span>
                  </button>
                )}
                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                  {loading ? <><Loader2 size={15} className="spin" /><span>Vérification…</span></> : <><RefreshCw size={15} /><span>Vérifier & continuer</span><ChevronRight size={14} /></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'confirm' && repoInfo && (
          <div className={`${styles.card} fade-up`}>
            <div className={styles.cardHead}>
              <div className={styles.confirmIconWrap}><CheckCircle2 size={22} strokeWidth={1.5} /></div>
              <h2 className={styles.cardTitle}>Dépôt accessible !</h2>
              <p className={styles.cardSub}>Vérifiez avant de sauvegarder</p>
            </div>
            <div className={styles.cardBody}>
              <dl className={styles.infoGrid}>
                <dt>Projet</dt><dd><strong>{repoInfo.name}</strong></dd>
                {repoInfo.description && <><dt>Description</dt><dd>{repoInfo.description}</dd></>}
                <dt>Branche</dt><dd><GitBranch size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{branch || repoInfo.default_branch}</dd>
                <dt>Accès</dt><dd>{isPrivate ? <><Lock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Privé</> : <><Globe size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Public</>}</dd>
              </dl>
              {error && <div className={styles.errorBox}><AlertCircle size={14} /><span>{error}</span></div>}
              <div className={styles.formActions}>
                <button className={styles.ghostBtn} onClick={() => { setStep('form'); setError('') }}><ArrowLeft size={14} /><span>Modifier</span></button>
                <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                  {loading ? <><Loader2 size={15} className="spin" /><span>Sauvegarde…</span></> : <><Save size={15} /><span>Sauvegarder</span></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className={styles.sideCol}>
        <div className={styles.statusCard}>
          <div className={styles.statusCardHead}><span className={styles.statusCardTitle}>État de la connexion</span></div>
          {saved.repo ? (
            <div className={styles.statusBody}>
              <div className={styles.statusRow}><span className={styles.statusDot} data-active="true" /><span className={styles.statusLabel}>Dépôt connecté</span></div>
              <div className={styles.statusInfo}>
                <div className={styles.siRow}><span className={styles.siKey}>URL</span><a href={saved.repo.repoUrl} target="_blank" rel="noopener noreferrer" className={`${styles.siVal} ${styles.siLink}`}>{saved.repo.repoUrl.replace('https://', '')}<ExternalLink size={10} /></a></div>
                <div className={styles.siRow}><span className={styles.siKey}>Plateforme</span><span className={styles.siVal}>{saved.repo.provider === 'github' ? <><Github size={12} />GitHub</> : <><GitLabIcon size={12} />GitLab</>}</span></div>
                <div className={styles.siRow}><span className={styles.siKey}>Branche</span><span className={styles.siVal}><GitBranch size={12} />{saved.repo.branch ?? 'main'}</span></div>
                <div className={styles.siRow}><span className={styles.siKey}>Accès</span><span className={styles.siVal}>{saved.repo.isPrivate ? <><Lock size={12} />Privé</> : <><Globe size={12} />Public</>}</span></div>
                {saved.updatedAt && <div className={styles.siRow}><span className={styles.siKey}>Mis à jour</span><span className={styles.siVal}><Calendar size={11} />{new Date(saved.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
              </div>
              <a href="/apps" target="_blank" rel="noopener noreferrer" className={styles.viewPublicBtn}><ExternalLink size={13} /><span>Vue publique</span></a>
            </div>
          ) : (
            <div className={styles.statusBody}>
              <div className={styles.statusRow}><span className={styles.statusDot} data-active="false" /><span className={styles.statusLabel}>Aucun dépôt configuré</span></div>
              <p className={styles.statusEmpty}>Configurez un dépôt pour que les changelogs soient accessibles publiquement.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
/*  SETTINGS TAB                                                    */
/* ════════════════════════════════════════════════════════════════ */
function SettingsTab({ siteName: initialSiteName, onSiteNameChange }: { siteName: string; onSiteNameChange: (name: string) => void }) {
  const [siteName, setSiteName] = useState(initialSiteName)
  const [siteNameLoading, setSiteNameLoading] = useState(false)
  const [siteNameError, setSiteNameError] = useState('')
  const [siteNameSuccess, setSiteNameSuccess] = useState('')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  useEffect(() => { setSiteName(initialSiteName) }, [initialSiteName])

  async function handleSiteName(e: React.FormEvent) {
    e.preventDefault(); setSiteNameError(''); setSiteNameSuccess(''); setSiteNameLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'siteName', siteName }),
      })
      const data = await res.json()
      if (!res.ok) { setSiteNameError(data.error); return }
      setSiteNameSuccess('Nom mis à jour avec succès')
      onSiteNameChange(siteName)
    } catch { setSiteNameError('Erreur réseau') } finally { setSiteNameLoading(false) }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdError(''); setPwdSuccess(''); setPwdLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'password', currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd }),
      })
      const data = await res.json()
      if (!res.ok) { setPwdError(data.error); return }
      setPwdSuccess('Mot de passe modifié avec succès')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch { setPwdError('Erreur réseau') } finally { setPwdLoading(false) }
  }

  const pwdStrength = !newPwd ? 0 : newPwd.length < 6 ? 1 : newPwd.length < 10 ? 2 : /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) ? 4 : 3
  const pwdLabels = ['', 'Trop court', 'Faible', 'Moyen', 'Fort']
  const pwdColors = ['', 'red', 'amber', 'blue', 'green']

  return (
    <div className={styles.settingsGrid}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.cardHeadIcon}><Type size={18} strokeWidth={1.5} /></div>
          <div>
            <h2 className={styles.cardTitle}>Nom du site</h2>
            <p className={styles.cardSub}>Affiché dans la navigation et l&apos;onglet du navigateur</p>
          </div>
        </div>
        <form onSubmit={handleSiteName} className={styles.cardBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="siteName">Nom affiché</label>
            <div className={styles.inputRow}>
              <span className={styles.inputIcon}><Pencil size={13} /></span>
              <input id="siteName" type="text" required maxLength={50}
                className={`${styles.input} ${styles.inputIndented}`}
                placeholder="ChangeLog Hub" value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <p className={styles.hint}>Maximum 50 caractères</p>
          </div>
          {siteNameError && <div className={styles.errorBox}><AlertCircle size={14} /><span>{siteNameError}</span></div>}
          {siteNameSuccess && <div className={styles.successBox}><CheckCircle2 size={14} /><span>{siteNameSuccess}</span></div>}
          <button type="submit" className={styles.primaryBtn} disabled={siteNameLoading}>
            {siteNameLoading ? <><Loader2 size={15} className="spin" /><span>Sauvegarde…</span></> : <><Save size={15} /><span>Enregistrer le nom</span></>}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.cardHeadIcon}><KeyRound size={18} strokeWidth={1.5} /></div>
          <div>
            <h2 className={styles.cardTitle}>Mot de passe administrateur</h2>
            <p className={styles.cardSub}>Modifiez le mot de passe de connexion</p>
          </div>
        </div>
        <form onSubmit={handlePassword} className={styles.cardBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cpwd">Mot de passe actuel</label>
            <div className={styles.inputRow}>
              <input id="cpwd" type={showCurrent ? 'text' : 'password'} required autoComplete="current-password"
                className={styles.input} placeholder="••••••••"
                value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrent(v => !v)}>
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="npwd">Nouveau mot de passe</label>
            <div className={styles.inputRow}>
              <input id="npwd" type={showNew ? 'text' : 'password'} required autoComplete="new-password" minLength={6}
                className={styles.input} placeholder="Min. 6 caractères"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {newPwd && (
              <div className={styles.pwdStrength}>
                <div className={styles.pwdBars}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`${styles.pwdBar} ${n <= pwdStrength ? styles[`pwdBar_${pwdColors[pwdStrength]}`] : ''}`} />
                  ))}
                </div>
                <span className={`${styles.pwdLabel} ${styles[`pwdLabel_${pwdColors[pwdStrength]}`]}`}>{pwdLabels[pwdStrength]}</span>
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cpwd2">Confirmer</label>
            <div className={styles.inputRow}>
              <input id="cpwd2" type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                className={`${styles.input} ${confirmPwd && newPwd !== confirmPwd ? styles.inputError : ''}`}
                placeholder="••••••••" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPwd && newPwd !== confirmPwd && <p className={styles.hintError}>Les mots de passe ne correspondent pas</p>}
          </div>
          {pwdError && <div className={styles.errorBox}><AlertCircle size={14} /><span>{pwdError}</span></div>}
          {pwdSuccess && <div className={styles.successBox}><CheckCircle2 size={14} /><span>{pwdSuccess}</span></div>}
          <button type="submit" className={styles.primaryBtn} disabled={pwdLoading}>
            {pwdLoading ? <><Loader2 size={15} className="spin" /><span>Modification…</span></> : <><KeyRound size={15} /><span>Modifier le mot de passe</span></>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
/*  SUBSCRIBERS TAB                                                 */
/* ════════════════════════════════════════════════════════════════ */
interface AppInfo { name: string; slug: string }

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [apps, setApps] = useState<AppInfo[]>([])
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingSlug, setSendingSlug] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<{ slug: string; sent: number; failed: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [subRes, appRes] = await Promise.all([
        fetch('/api/admin/subscribers'),
        fetch('/api/changelogs'),
      ])
      const subData = await subRes.json()
      const appData = await appRes.json()
      if (!subRes.ok) throw new Error(subData.error)
      setSubscribers(subData.subscribers)
      setEmailEnabled(subData.emailEnabled)
      if (appData.changelogs) setApps(appData.changelogs.map((c: AppInfo) => ({ name: c.name, slug: c.slug })))
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet abonné ?')) return
    await fetch('/api/admin/subscribers', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSubscribers(s => s.filter(x => x.id !== id))
  }

  async function handleSendNotification(slug: string) {
    if (!confirm(`Envoyer une notification pour "${apps.find(a => a.slug === slug)?.name}" à tous les abonnés concernés ?`)) return
    setSendingSlug(slug); setSendResult(null)
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSendResult({ slug, sent: data.sent, failed: data.failed })
    } catch { setError('Erreur réseau') } finally { setSendingSlug(null) }
  }

  if (loading) return <div className={styles.tabLoading}><Loader2 size={22} className="spin" style={{ color: 'var(--accent)' }} /></div>

  return (
    <div className={styles.subscribersLayout}>
      {/* Left: subscriber list */}
      <div className={styles.formCol}>
        {/* Email status banner */}
        <div className={emailEnabled ? styles.smtpBannerOk : styles.smtpBannerWarn}>
          <div className={styles.smtpBannerLeft}>
            <Mail size={15} />
            <div>
              <strong>{emailEnabled ? 'SMTP configuré' : 'SMTP non configuré'}</strong>
              <p>{emailEnabled ? 'Les notifications email sont actives.' : 'Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env.local pour activer les emails.'}</p>
            </div>
          </div>
        </div>

        {/* RSS links */}
        <div className={styles.rssInfoBox}>
          <Rss size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
          <div>
            <strong>Flux RSS disponibles</strong>
            <p>
              <a href="/rss.xml" target="_blank" className={styles.rssLink}>/rss.xml</a>
              {' '}(global) · flux par app sur{' '}
              <code>/apps/[slug]/rss.xml</code>
            </p>
          </div>
        </div>

        {/* Send notification panel */}
        {emailEnabled && apps.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardHeadIcon}><Send size={16} strokeWidth={1.5} /></div>
              <div>
                <h2 className={styles.cardTitle}>Envoyer une notification</h2>
                <p className={styles.cardSub}>Notifie les abonnés de la dernière version d&apos;une app</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              {sendResult && (
                <div className={styles.successBox}>
                  <CheckCircle2 size={14} />
                  <span>Envoyé : {sendResult.sent} email{sendResult.sent !== 1 ? 's' : ''}{sendResult.failed > 0 ? `, ${sendResult.failed} échec(s)` : ''}</span>
                  <button className={styles.dismissBtn} onClick={() => setSendResult(null)}><X size={12} /></button>
                </div>
              )}
              {error && <div className={styles.errorBox}><AlertCircle size={14} /><span>{error}</span></div>}
              <div className={styles.appNotifList}>
                {apps.map(app => {
                  const count = subscribers.filter(s => s.slugs === null || s.slugs.includes(app.slug)).length
                  return (
                    <div key={app.slug} className={styles.appNotifRow}>
                      <div className={styles.appNotifInfo}>
                        <span className={styles.appNotifName}>{app.name}</span>
                        <span className={styles.appNotifCount}>{count} abonné{count !== 1 ? 's' : ''}</span>
                      </div>
                      <button
                        className={styles.sendBtn}
                        disabled={sendingSlug === app.slug || count === 0}
                        onClick={() => handleSendNotification(app.slug)}
                      >
                        {sendingSlug === app.slug
                          ? <><Loader2 size={13} className="spin" /><span>Envoi…</span></>
                          : <><Send size={13} /><span>Notifier</span></>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Subscriber list */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadIcon}><Users size={16} strokeWidth={1.5} /></div>
            <div>
              <h2 className={styles.cardTitle}>Abonnés ({subscribers.length})</h2>
              <p className={styles.cardSub}>Personnes inscrites aux notifications email</p>
            </div>
          </div>
          <div className={styles.cardBody}>
            {subscribers.length === 0 ? (
              <div className={styles.emptySubscribers}>
                <Bell size={28} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
                <p>Aucun abonné pour l&apos;instant.</p>
                <span>Le bouton &quot;S&apos;abonner&quot; est visible sur les pages publiques.</span>
              </div>
            ) : (
              <div className={styles.subscriberList}>
                {subscribers.map(sub => (
                  <div key={sub.id} className={styles.subscriberRow}>
                    <div className={styles.subscriberInfo}>
                      <span className={styles.subscriberEmail}>{sub.email}</span>
                      <span className={styles.subscriberMeta}>
                        {sub.slugs === null
                          ? 'Toutes les apps'
                          : `${sub.slugs.length} app${sub.slugs.length !== 1 ? 's' : ''} : ${sub.slugs.join(', ')}`}
                        {' · '}
                        {new Date(sub.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <button className={styles.deleteSubBtn} onClick={() => handleDelete(sub.id)} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: help panel */}
      <aside className={styles.sideCol}>
        <div className={styles.statusCard}>
          <div className={styles.statusCardHead}><span className={styles.statusCardTitle}>Configuration SMTP</span></div>
          <div className={styles.statusBody}>
            <div className={styles.smtpVarList}>
              {[
                { key: 'SMTP_HOST', ex: 'smtp.gmail.com' },
                { key: 'SMTP_PORT', ex: '587' },
                { key: 'SMTP_USER', ex: 'vous@gmail.com' },
                { key: 'SMTP_PASS', ex: 'mot_de_passe_app' },
                { key: 'SMTP_FROM', ex: 'MonApp <vous@gmail.com>' },
                { key: 'APP_URL', ex: 'https://monsite.com' },
              ].map(v => (
                <div key={v.key} className={styles.smtpVar}>
                  <code className={styles.smtpKey}>{v.key}</code>
                  <span className={styles.smtpEx}>{v.ex}</span>
                </div>
              ))}
            </div>
            <p className={styles.smtpNote}>
              Ajoutez ces variables dans <code>.env.local</code> ou dans les variables d&apos;environnement Docker.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                       */
/* ════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)
  const [saved, setSaved] = useState<SavedConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('repo')
  const [siteName, setSiteName] = useState('ChangeLog Hub')

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => { if (!d.isAdmin) router.replace('/admin/login'); else setAuthChecking(false) })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    try {
      const res = await fetch('/api/admin/config')
      if (res.status === 401) { router.replace('/admin/login'); return }
      const data: SavedConfig = await res.json()
      setSaved(data)
      setSiteName(data.settings?.siteName ?? 'ChangeLog Hub')
    } catch { /* ignore */ } finally { setLoadingConfig(false) }
  }, [router])

  useEffect(() => { if (!authChecking) loadConfig() }, [authChecking, loadConfig])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (authChecking || loadingConfig) return (
    <div className={styles.center}><Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} /></div>
  )

  const TABS: { key: Tab; label: string; icon: React.ReactNode; dot?: boolean }[] = [
    { key: 'repo', label: 'Dépôt', icon: <Database size={15} />, dot: !!saved?.repo },
    { key: 'settings', label: 'Paramètres', icon: <Settings size={15} /> },
    { key: 'subscribers', label: 'Abonnés', icon: <Bell size={15} /> },
  ]

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <div className={styles.navBrand}><BookOpen size={18} strokeWidth={1.5} /><span>{siteName}</span></div>
            <div className={styles.adminPill}><ShieldCheck size={12} /><span>Admin</span></div>
          </div>
          <div className={styles.navRight}>
            <a href="/apps" className={styles.navLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /><span>Vue publique</span>
            </a>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={14} /><span>Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIconWrap}><Settings size={22} strokeWidth={1.5} /></div>
            <div>
              <h1 className={styles.pageTitle}>Tableau de bord</h1>
              <p className={styles.pageSub}>Administration de {siteName}</p>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}>
              {t.icon}<span>{t.label}</span>
              {t.dot && <span className={styles.tabDot} />}
            </button>
          ))}
        </div>

        {activeTab === 'repo' && saved && <RepoTab saved={saved} onSaved={loadConfig} />}
        {activeTab === 'settings' && <SettingsTab siteName={siteName} onSiteNameChange={setSiteName} />}
        {activeTab === 'subscribers' && <SubscribersTab />}
      </main>
    </div>
  )
}
