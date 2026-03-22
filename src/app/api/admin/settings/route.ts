import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { readAppConfig, writeSettings } from '@/lib/store'
import fs from 'fs'
import path from 'path'

async function isAdmin(req: NextRequest, res: NextResponse): Promise<boolean> {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return session.isAdmin === true
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const cfg = readAppConfig()
  return NextResponse.json({ settings: cfg.settings })
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = (await req.json()) as {
    action: 'siteName' | 'password'
    siteName?: string
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }

  if (body.action === 'siteName') {
    if (!body.siteName?.trim()) {
      return NextResponse.json({ error: 'Le nom ne peut pas être vide' }, { status: 400 })
    }
    const cfg = writeSettings({ siteName: body.siteName.trim() })
    return NextResponse.json({ ok: true, settings: cfg.settings })
  }

  if (body.action === 'password') {
    const expectedPass = process.env.ADMIN_PASSWORD ?? 'admin1234'
    if (body.currentPassword !== expectedPass) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }
    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 })
    }

    // Write new password to .env.local
    const envPath = path.resolve(process.cwd(), '.env.local')
    try {
      let envContent = ''
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
      }
      if (envContent.includes('ADMIN_PASSWORD=')) {
        envContent = envContent.replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${body.newPassword}`)
      } else {
        envContent += `\nADMIN_PASSWORD=${body.newPassword}`
      }
      fs.writeFileSync(envPath, envContent, 'utf-8')
      // Also update process.env for current session
      process.env.ADMIN_PASSWORD = body.newPassword
    } catch {
      return NextResponse.json({ error: 'Impossible d\'écrire le fichier .env.local' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
