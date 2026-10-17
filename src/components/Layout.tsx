import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Boxes, ChevronDown, CreditCard, KeyRound, LogOut, Menu, Moon, Search, Settings, Sun, Upload, X } from 'lucide-react'
import { Logo } from './Logo'
import { OrgAvatar } from './ModelBits'
import { ButtonLink, Toaster, cx } from './ui'
import { useStore } from '../store'
import { MODELS } from '../data/models'
import { fmtUSD } from '../lib/format'
import { buildProgress } from '../lib/build'

const NAV = [
  { to: '/models', label: 'Models' },
  { to: '/chat', label: 'Chat' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/deploy', label: 'Deploy' },
  { to: '/docs', label: 'Docs' },
  { to: '/pricing', label: 'Pricing' },
]

export const CONTAINER = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8'

function useBuildTicker() {
  const models = useStore((s) => s.customModels)
  const update = useStore((s) => s.updateCustomModel)
  useEffect(() => {
    const active = models.filter((m) => m.status === 'queued' || m.status === 'building')
    if (!active.length) return
    const t = setInterval(() => {
      for (const m of active) {
        const p = buildProgress(m)
        if (p.done) update(m.id, { status: 'live' })
        else if (m.status === 'queued' && p.phaseIndex > 0) update(m.id, { status: 'building' })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [models, update])
}

function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName ?? '')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const results = q.trim() ? MODELS.filter((m) => (m.name + m.slug + m.orgName + m.architecture).toLowerCase().includes(q.toLowerCase())).slice(0, 7) : []
  const go = (slug?: string) => {
    nav(slug ? `/models/${slug}` : `/models?q=${encodeURIComponent(q)}`)
    setOpen(false)
    setQ('')
    ref.current?.blur()
  }
  return (
    <div className="relative hidden w-60 md:block">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setSel(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setSel((s) => Math.min(s + 1, results.length - 1))
          if (e.key === 'ArrowUp') setSel((s) => Math.max(s - 1, 0))
          if (e.key === 'Enter') go(results[sel]?.slug)
          if (e.key === 'Escape') ref.current?.blur()
        }}
        placeholder="Search models"
        aria-label="Search models"
        className="h-8 w-full rounded-full border border-line bg-raised/60 pl-8 pr-10 text-[13px] text-fg placeholder:text-fg3 focus:border-line2 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line px-1 text-[10.5px] text-fg3">⌘K</kbd>
      {open && results.length > 0 && (
        <div className="absolute left-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-line2 bg-panel py-1 shadow-2xl shadow-black/40">
          {results.map((m, i) => (
            <button key={m.slug} onMouseDown={() => go(m.slug)} className={cx('flex w-full items-center gap-2.5 px-3 py-2 text-left', i === sel ? 'bg-raised' : 'hover:bg-raised')}>
              <OrgAvatar org={m.org} name={m.orgName} size={22} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{m.name}</span>
                <span className="block truncate font-mono text-[11.5px] text-fg3">{m.slug}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const ACCOUNT_NAV = [
  { to: '/credits', label: 'Credits', icon: CreditCard },
  { to: '/keys', label: 'API keys', icon: KeyRound },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/my-models', label: 'My models', icon: Boxes },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function UserMenu() {
  const user = useStore((s) => s.user)
  const credits = useStore((s) => s.credits)
  const signOut = useStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  if (!user)
    return (
      <div className="flex items-center gap-1">
        <ButtonLink to="/signin" variant="ghost" size="sm">
          Sign in
        </ButtonLink>
        <ButtonLink to="/signin" size="sm">
          Get started
        </ButtonLink>
      </div>
    )
  return (
    <div className="relative flex items-center gap-1">
      <Link to="/credits" className="tabular hidden h-8 items-center rounded-full px-3 text-[13px] text-fg2 transition-colors hover:bg-raised hover:text-fg sm:flex">
        {fmtUSD(credits)}
      </Link>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-full py-1 pl-1 pr-1.5 hover:bg-raised" aria-label="Account menu">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised text-[12px] font-semibold text-fg ring-1 ring-inset ring-line2">{user.name[0]}</span>
        <ChevronDown size={13} className="text-fg3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-line2 bg-panel py-1 shadow-2xl shadow-black/40">
            <div className="border-b border-line px-3.5 py-2.5">
              <div className="text-[14px] font-medium">{user.name}</div>
              <div className="text-[12px] text-fg3">{user.email}</div>
            </div>
            {ACCOUNT_NAV.map((it) => (
              <Link key={it.to} to={it.to} className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-fg2 hover:bg-raised hover:text-fg">
                <it.icon size={15} /> {it.label}
              </Link>
            ))}
            <button onClick={signOut} className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2 text-[13.5px] text-fg2 hover:bg-raised hover:text-fg">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Layout() {
  useBuildTicker()
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [mobile, setMobile] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    setMobile(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  const isChat = loc.pathname.startsWith('/chat')
  const isHome = loc.pathname === '/'
  const inAccount = ACCOUNT_NAV.some((a) => loc.pathname.startsWith(a.to))

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg">
        <div className={cx(CONTAINER, 'flex h-14 items-center gap-4', isChat && 'max-w-none')}>
          <Link to="/" className="mr-2 shrink-0" aria-label="InferStack home">
            <Logo />
          </Link>
          <GlobalSearch />
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => cx('rounded-full px-3 py-1.5 text-[14px] transition-colors', isActive ? 'font-medium text-fg' : 'text-fg2 hover:bg-raised hover:text-fg')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full p-2 text-fg3 hover:bg-raised hover:text-fg" title="Toggle theme" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <UserMenu />
            {!inAccount && !isChat && (
              <ButtonLink to="/keys" size="sm" className="ml-1 hidden sm:inline-flex">
                Get API key
              </ButtonLink>
            )}
            <button className="rounded-full p-2 text-fg2 lg:hidden" onClick={() => setMobile(!mobile)} aria-label="Menu">
              {mobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="border-t border-line px-5 py-2 lg:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="block py-2.5 text-[15px] text-fg2">
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={cx('flex-1', !isChat && !isHome && cx(CONTAINER, 'pb-20 pt-10'))}>
        <Outlet />
      </main>

      {!isChat && <Footer />}
      <Toaster />
    </div>
  )
}

/** Account area: left sidebar + content */
export function AccountLayout() {
  const user = useStore((s) => s.user)
  const credits = useStore((s) => s.credits)
  return (
    <div className="grid gap-10 md:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="min-w-0 md:sticky md:top-24 md:self-start">
        {user && (
          <div className="mb-5 hidden md:block">
            <div className="text-[14px] font-semibold">{user.name}</div>
            <div className="tabular mt-0.5 text-[13px] text-fg3">Balance {fmtUSD(credits)}</div>
          </div>
        )}
        <nav className="-mx-2 flex gap-1 overflow-x-auto md:flex-col">
          {ACCOUNT_NAV.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cx('flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2 text-[14px] transition-colors', isActive ? 'bg-raised font-medium text-fg' : 'text-fg2 hover:bg-raised/60 hover:text-fg')
              }
            >
              <it.icon size={16} /> {it.label}
            </NavLink>
          ))}
          <div className="mx-3 my-3 hidden h-px bg-line md:block" />
          <NavLink to="/deploy" className="flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2 text-[14px] text-fg2 transition-colors hover:bg-raised/60 hover:text-fg">
            <Upload size={16} /> Deploy a model
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

function Footer() {
  const cols = [
    { title: 'Product', links: [['Models', '/models'], ['Chat', '/chat'], ['Rankings', '/rankings'], ['Pricing', '/pricing']] },
    { title: 'Developers', links: [['Quickstart', '/docs#quickstart'], ['API reference', '/docs#api'], ['CLI', '/docs#cli'], ['Architecture packages', '/docs#arch']] },
    { title: 'Deploy', links: [['From Hugging Face', '/deploy/new?source=huggingface'], ['From ModelScope', '/deploy/new?source=modelscope'], ['CLI upload', '/deploy/new?source=cli'], ['My models', '/my-models']] },
    { title: 'Account', links: [['API keys', '/keys'], ['Credits', '/credits'], ['Activity', '/activity'], ['Settings', '/settings']] },
  ]
  return (
    <footer className="border-t border-line">
      <div className={cx(CONTAINER, 'grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]')}>
        <div>
          <Logo />
          <p className="mt-4 max-w-[17rem] text-[13.5px] leading-relaxed text-fg3">The inference API for open-weight models. Call catalog models and your own fine-tunes from one endpoint.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[13.5px] font-semibold">{c.title}</div>
            <ul className="mt-4 space-y-2.5 text-[13.5px] text-fg3">
              {c.links.map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="transition-colors hover:text-fg">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={cx(CONTAINER, 'flex flex-col justify-between gap-2 py-6 text-[12.5px] text-fg3 sm:flex-row')}>
          <span>© 2026 InferStack</span>
          <span>Frontend demo. Inference, billing and deployments are simulated; usage numbers are sample data.</span>
        </div>
      </div>
    </footer>
  )
}
