import nodemailer from 'nodemailer'
import { ChangelogFile, Subscriber } from '@/types'

function getAppUrl(): string {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

function createTransport() {
  const host = process.env.SMTP_HOST
  if (!host) return null

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export function isMailEnabled(): boolean {
  return !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS
}

// ── Email templates ─────────────────────────────────────────────

function changeTypeBadge(type: string): string {
  const colors: Record<string, string> = {
    added:      '#16a34a',
    changed:    '#2563eb',
    fixed:      '#7c3aed',
    deprecated: '#b45309',
    removed:    '#dc2626',
    security:   '#c2410c',
    breaking:   '#be185d',
  }
  const labels: Record<string, string> = {
    added: 'Ajouté', changed: 'Modifié', fixed: 'Corrigé',
    deprecated: 'Déprécié', removed: 'Supprimé', security: 'Sécurité', breaking: 'Breaking',
  }
  const color = colors[type] ?? '#6b7280'
  const label = labels[type] ?? type
  return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${color}18;color:${color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-right:8px">${label}</span>`
}

function buildChangelogEmailHtml(
  changelog: ChangelogFile,
  siteName: string,
  sub: Subscriber,
): string {
  const appUrl = getAppUrl()
  const latest = changelog.versions[0]
  if (!latest) return ''

  const changesHtml = latest.changes
    .map(c => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0ece8;vertical-align:top">
          ${changeTypeBadge(c.type)}
          <span style="font-size:14px;color:#1a1714">${c.description}</span>
        </td>
      </tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;border:1.5px solid #ddd8cf;border-bottom:none;padding:28px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:13px;font-weight:600;color:#8a837a;text-transform:uppercase;letter-spacing:.07em">${siteName}</span>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#18160f;letter-spacing:-.02em">${changelog.name}</h1>
                ${changelog.description ? `<p style="margin:6px 0 0;font-size:14px;color:#56504a">${changelog.description}</p>` : ''}
              </td>
              <td align="right" valign="top">
                <span style="display:inline-block;padding:6px 14px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:99px;font-size:13px;font-weight:700">v${latest.version}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;border:1.5px solid #ddd8cf;border-top:none;border-bottom:none;padding:0 32px 24px">
          <p style="margin:0 0 16px;padding-top:20px;font-size:13px;color:#8a837a">
            ${latest.date ? `Publié le ${new Date(latest.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Nouvelle version disponible'}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${changesHtml}
          </table>
          <div style="margin-top:24px">
            <a href="${appUrl}/apps/${changelog.slug}" style="display:inline-block;padding:11px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
              Voir le changelog complet →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f3ef;border:1.5px solid #ddd8cf;border-top:1px solid #ddd8cf;border-radius:0 0 16px 16px;padding:18px 32px">
          <p style="margin:0;font-size:12px;color:#8a837a">
            Vous recevez cet email car vous êtes abonné aux mises à jour de <strong>${changelog.name}</strong>.
            <br>
            <a href="${appUrl}/unsubscribe?token=${sub.unsubscribeToken}" style="color:#2563eb">Se désabonner</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildWelcomeHtml(sub: Subscriber, siteName: string, appNames: string[]): string {
  const appUrl = getAppUrl()
  const list = appNames.length > 0
    ? appNames.map(n => `<li style="margin:4px 0;color:#1a1714;font-size:14px">${n}</li>`).join('')
    : '<li style="color:#56504a;font-size:14px">Toutes les applications</li>'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;border:1.5px solid #ddd8cf;overflow:hidden">
        <tr><td style="padding:32px;border-bottom:1px solid #ddd8cf;background:#f5f3ef">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#18160f">Abonnement confirmé ✓</h1>
          <p style="margin:8px 0 0;color:#56504a;font-size:14px">Vous recevrez les mises à jour de ${siteName}</p>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 14px;font-size:14px;color:#56504a">Applications suivies :</p>
          <ul style="margin:0 0 24px;padding-left:20px">${list}</ul>
          <a href="${appUrl}/apps" style="display:inline-block;padding:11px 22px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
            Voir les applications →
          </a>
        </td></tr>
        <tr><td style="padding:18px 32px;background:#f5f3ef;border-top:1px solid #ddd8cf">
          <p style="margin:0;font-size:12px;color:#8a837a">
            <a href="${appUrl}/unsubscribe?token=${sub.unsubscribeToken}" style="color:#2563eb">Se désabonner à tout moment</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Public API ───────────────────────────────────────────────────

export async function sendWelcomeEmail(
  sub: Subscriber,
  siteName: string,
  appNames: string[],
): Promise<void> {
  const transport = createTransport()
  if (!transport) return

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? siteName,
    to: sub.email,
    subject: `✓ Abonnement confirmé — ${siteName}`,
    html: buildWelcomeHtml(sub, siteName, appNames),
  })
}

export async function sendChangelogNotification(
  changelog: ChangelogFile,
  subscriber: Subscriber,
  siteName: string,
): Promise<void> {
  const transport = createTransport()
  if (!transport) return

  const latest = changelog.versions[0]
  if (!latest) return

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? siteName,
    to: subscriber.email,
    subject: `🚀 ${changelog.name} v${latest.version} — ${siteName}`,
    html: buildChangelogEmailHtml(changelog, siteName, subscriber),
  })
}

export async function sendNotificationsForChangelog(
  changelog: ChangelogFile,
  subscribers: Subscriber[],
  siteName: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0; let failed = 0
  for (const sub of subscribers) {
    try {
      await sendChangelogNotification(changelog, sub, siteName)
      sent++
    } catch (e) {
      console.error(`[mailer] failed to send to ${sub.email}:`, e)
      failed++
    }
  }
  return { sent, failed }
}
