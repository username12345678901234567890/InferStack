import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActivityLog, ApiKey, CustomModel, Transaction } from '../data/types'
import { randomKey, rng, uid } from '../lib/rand'
import { MODELS } from '../data/models'

interface User {
  name: string
  email: string
  username: string
  org?: string
}

interface Settings {
  defaultModel: string
  logPrompts: boolean
  allowTraining: boolean
  fallbackRouting: boolean
  preferredRegion: string
  autoTopUp: { enabled: boolean; threshold: number; amount: number }
}

interface State {
  user: User | null
  credits: number
  keys: ApiKey[]
  logs: ActivityLog[]
  transactions: Transaction[]
  customModels: CustomModel[]
  settings: Settings
  favorites: string[]
  theme: 'dark' | 'light'

  signIn: (u: User) => void
  signOut: () => void
  setTheme: (t: 'dark' | 'light') => void
  toggleFavorite: (slug: string) => void

  createKey: (k: Pick<ApiKey, 'name' | 'limit' | 'expiresAt' | 'allowedModels'>) => ApiKey
  updateKey: (id: string, patch: Partial<ApiKey>) => void
  deleteKey: (id: string) => void

  addCredits: (amount: number, note?: string) => void
  recordUsage: (log: Omit<ActivityLog, 'id' | 'ts'>) => void
  updateSettings: (p: Partial<Settings>) => void

  addCustomModel: (m: CustomModel) => void
  updateCustomModel: (id: string, patch: Partial<CustomModel>) => void
  deleteCustomModel: (id: string) => void

  resetDemo: () => void
}

function seedLogs(): ActivityLog[] {
  const r = rng(42)
  const pool = MODELS.slice(0, 20)
  const out: ActivityLog[] = []
  const now = Date.now()
  for (let i = 0; i < 220; i++) {
    const m = pool[Math.floor(Math.pow(r(), 1.8) * pool.length)]
    const pt = Math.round(200 + r() * 6000)
    const ct = Math.round(50 + r() * 1800)
    out.push({
      id: 'gen-' + Math.floor(r() * 1e12).toString(36),
      ts: now - Math.floor(r() * 30 * 86400_000),
      model: m.slug,
      keyName: r() > 0.35 ? 'production' : 'dev-local',
      endpoint: ['ap-seoul-1', 'us-east-1', 'ap-tokyo-1', 'eu-central-1'][Math.floor(r() * 4)],
      promptTokens: pt,
      completionTokens: ct,
      cost: (pt * m.price.input + ct * m.price.output) / 1e6,
      latency: Math.round(200 + r() * 900),
      throughput: Math.round(40 + r() * 160),
      finish: r() > 0.93 ? 'length' : r() > 0.9 ? 'tool_calls' : 'stop',
      source: 'api',
    })
  }
  return out.sort((a, b) => b.ts - a.ts)
}

function seedKeys(): ApiKey[] {
  const now = Date.now()
  return [
    { id: 'k1', name: 'production', key: 'sk-is-v1-' + randomKey(48), createdAt: now - 40 * 86400_000, lastUsed: now - 120_000, limit: 500, usage: 61.42, expiresAt: null, disabled: false, allowedModels: [] },
    { id: 'k2', name: 'dev-local', key: 'sk-is-v1-' + randomKey(48), createdAt: now - 12 * 86400_000, lastUsed: now - 3 * 3600_000, limit: null, usage: 4.87, expiresAt: now + 60 * 86400_000, disabled: false, allowedModels: ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'] },
  ]
}

function initial() {
  const now = Date.now()
  return {
    user: { name: 'Demo User', email: 'demo@inferstack.dev', username: 'demo', org: 'Personal' } as User | null,
    credits: 48.25,
    keys: seedKeys(),
    logs: seedLogs(),
    transactions: [
      { id: 't1', ts: now - 41 * 86400_000, amount: 5, kind: 'bonus', note: '가입 보너스 크레딧' },
      { id: 't2', ts: now - 40 * 86400_000, amount: 50, kind: 'purchase', note: '크레딧 구매' },
      { id: 't3', ts: now - 14 * 86400_000, amount: 25, kind: 'purchase', note: '크레딧 구매' },
    ] as Transaction[],
    customModels: [] as CustomModel[],
    settings: {
      defaultModel: 'deepseek/deepseek-v4.1-flash',
      logPrompts: false,
      allowTraining: false,
      fallbackRouting: true,
      preferredRegion: 'auto',
      autoTopUp: { enabled: false, threshold: 5, amount: 20 },
    },
    favorites: ['deepseek/deepseek-v4.1-flash', 'z-ai/glm-5.3'],
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      theme: 'light',

      signIn: (u) => set({ user: u }),
      signOut: () => set({ user: null }),
      setTheme: (t) => {
        document.documentElement.classList.toggle('dark', t === 'dark')
        try {
          localStorage.setItem('is-theme2', t)
        } catch {
          /* ignore */
        }
        set({ theme: t })
      },
      toggleFavorite: (slug) => set((s) => ({ favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug] })),

      createKey: (k) => {
        const key: ApiKey = { id: uid('k_'), key: 'sk-is-v1-' + randomKey(48), createdAt: Date.now(), usage: 0, disabled: false, ...k }
        set((s) => ({ keys: [key, ...s.keys] }))
        return key
      },
      updateKey: (id, patch) => set((s) => ({ keys: s.keys.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),
      deleteKey: (id) => set((s) => ({ keys: s.keys.filter((k) => k.id !== id) })),

      addCredits: (amount, note = '크레딧 구매') =>
        set((s) => ({
          credits: +(s.credits + amount).toFixed(6),
          transactions: [{ id: uid('t_'), ts: Date.now(), amount, kind: 'purchase', note }, ...s.transactions],
        })),
      recordUsage: (log) => {
        const entry: ActivityLog = { ...log, id: 'gen-' + uid(), ts: Date.now() }
        const { settings } = get()
        set((s) => ({
          logs: [entry, ...s.logs].slice(0, 2000),
          credits: Math.max(0, +(s.credits - log.cost).toFixed(6)),
          keys: s.keys.map((k) => (k.name === log.keyName ? { ...k, usage: +(k.usage + log.cost).toFixed(6), lastUsed: Date.now() } : k)),
        }))
        const after = get().credits
        if (settings.autoTopUp.enabled && after < settings.autoTopUp.threshold) {
          get().addCredits(settings.autoTopUp.amount, '자동 충전')
        }
      },
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      addCustomModel: (m) => set((s) => ({ customModels: [m, ...s.customModels] })),
      updateCustomModel: (id, patch) => set((s) => ({ customModels: s.customModels.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteCustomModel: (id) => set((s) => ({ customModels: s.customModels.filter((m) => m.id !== id) })),

      resetDemo: () => set({ ...initial() }),
    }),
    { name: 'inferstack-demo', version: 2, migrate: (s) => ({ ...(s as State), theme: 'light' }) },
  ),
)
