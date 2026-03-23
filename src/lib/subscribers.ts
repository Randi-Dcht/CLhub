import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Subscriber, SubscribersStore } from '@/types'

function getDataDir(): string {
  const dir = process.env.DATA_DIR ?? './data'
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir)
}

function getFile(): string {
  return path.join(getDataDir(), 'subscribers.json')
}

function ensureDir(): void {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function readSubscribers(): SubscribersStore {
  try {
    ensureDir()
    const file = getFile()
    if (!fs.existsSync(file)) return { subscribers: [] }
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as SubscribersStore
  } catch {
    return { subscribers: [] }
  }
}

function writeSubscribers(store: SubscribersStore): void {
  ensureDir()
  fs.writeFileSync(getFile(), JSON.stringify(store, null, 2), 'utf-8')
}

export function addSubscriber(email: string, slugs: string[] | null): Subscriber {
  const store = readSubscribers()

  // Check if already subscribed
  const existing = store.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    // Update slugs if needed
    existing.slugs = slugs
    writeSubscribers(store)
    return existing
  }

  const sub: Subscriber = {
    id: crypto.randomBytes(16).toString('hex'),
    email,
    slugs,
    unsubscribeToken: crypto.randomBytes(24).toString('hex'),
    confirmedAt: new Date().toISOString(), // auto-confirm for simplicity
    createdAt: new Date().toISOString(),
  }
  store.subscribers.push(sub)
  writeSubscribers(store)
  return sub
}

export function removeSubscriberByToken(token: string): boolean {
  const store = readSubscribers()
  const before = store.subscribers.length
  store.subscribers = store.subscribers.filter(s => s.unsubscribeToken !== token)
  if (store.subscribers.length < before) {
    writeSubscribers(store)
    return true
  }
  return false
}

export function removeSubscriberById(id: string): boolean {
  const store = readSubscribers()
  const before = store.subscribers.length
  store.subscribers = store.subscribers.filter(s => s.id !== id)
  if (store.subscribers.length < before) {
    writeSubscribers(store)
    return true
  }
  return false
}

export function getSubscribersForSlug(slug: string): Subscriber[] {
  const { subscribers } = readSubscribers()
  return subscribers.filter(s =>
    s.confirmedAt !== null &&
    (s.slugs === null || s.slugs.includes(slug))
  )
}

export function getAllSubscribersConfirmed(): Subscriber[] {
  return readSubscribers().subscribers.filter(s => s.confirmedAt !== null)
}
