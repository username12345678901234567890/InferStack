import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, BookOpen, Boxes, ChevronDown, CreditCard, Github, KeyRound, LogOut, Menu, MessageSquare, Moon, Search, Settings, Sun, Trophy, Upload, X } from 'lucide-react'
import { Logo } from './Logo'
import { Button, Toaster, cx } from './ui'
import { useStore } from '../store'
import { MODELS } from '../data/models'
import { fmtUSD } from '../lib/format'
import { buildProgress } from '../lib/build'

const NAV = [
  { to: '/models', label: '모델' },
  { to: '/chat', label: '채팅' },
  { to: '/rankings', label: '랭킹' },
  { to: '/deploy', label: '모델 업로드' },
  { to: '/docs', label: '문서' },
  { to: '/pricing', label: '가격' },
]

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
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const results = q.trim()
    ? MODELS.filter((m) => (m.name + m.slug + m.orgName).toLowerCase().includes(q.toLowerCase())).slice(0, 7)
    : []
  return (
    <div className="relative hidden w-64 lg:block">
      <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (results[0]) nav(`/models/${results[0].slug}`)
            else nav(`/models?q=${encodeURIComponent(q)}`)
            setOpen(false)
            ref.current?.blur()
          }
        }}
        placeholder="모델 검색"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-10 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-white/5"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-300 px-1.5 font-mono text-[10px] text-slate-400 dark:border-white/15">/</kbd>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
          {results.map((m) => (
            <Link key={m.slug} to={`/models/${m.slug}`} className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="font-mono text-[11px] text-slate-500">{m.slug}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const user = useStore((s) => s.user)
  const credits = useStore((s) => s.credits)
  const signOut = useStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  if (!user)
    return (
      <Link to="/signin">
        <Button size="sm">로그인</Button>
      </Link>
    )
  const items = [
    { to: '/credits', label: '크레딧', icon: CreditCard },
    { to: '/keys', label: 'API 키', icon: KeyRound },
    { to: '/activity', label: '활동', icon: Activity },
    { to: '/my-models', label: '내 모델', icon: Boxes },
    { to: '/settings', label: '설정', icon: Settings },
  ]
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
        <span className="hidden text-xs font-medium text-slate-500 sm:inline">{fmtUSD(credits)}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">{user.name[0]}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            {items.map((it) => (
              <Link key={it.to} to={it.to} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                <it.icon size={15} className="text-slate-400" /> {it.label}
                {it.to === '/credits' && <span className="ml-auto text-xs text-slate-500">{fmtUSD(credits)}</span>}
              </Link>
            ))}
            <button onClick={signOut} className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-sm text-rose-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              <LogOut size={15} /> 로그아웃
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#070a14]/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <GlobalSearch />
          <nav className="ml-auto hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cx('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5" title="테마 전환">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <UserMenu />
            <button className="rounded-lg p-2 md:hidden" onClick={() => setMobile(!mobile)}>
              {mobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-white/10">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="block rounded-md px-2 py-2 text-sm">
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={cx('flex-1', !isChat && 'mx-auto w-full max-w-7xl px-4 py-8')}>
        <Outlet />
      </main>

      {!isChat && <Footer />}
      <Toaster />
    </div>
  )
}

function Footer() {
  const cols = [
    { title: '제품', links: [['모델', '/models'], ['채팅', '/chat'], ['랭킹', '/rankings'], ['가격', '/pricing']] },
    { title: '개발자', links: [['문서', '/docs'], ['API 레퍼런스', '/docs#api'], ['CLI', '/docs#cli'], ['아키텍처 패키지', '/docs#arch']] },
    { title: '모델 제공자', links: [['모델 업로드', '/deploy'], ['내 모델', '/my-models'], ['수익 정산', '/credits']] },
    { title: '계정', links: [['API 키', '/keys'], ['크레딧', '/credits'], ['활동', '/activity'], ['설정', '/settings']] },
  ]
  return (
    <footer className="border-t border-slate-200 dark:border-white/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">최신 오픈소스 LLM을 하나의 OpenAI 호환 API로. 내 모델을 올리면 몇 분 만에 서버리스 엔드포인트가 됩니다.</p>
          <div className="mt-4 flex gap-3 text-slate-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-700 dark:hover:text-white">
              <Github size={18} />
            </a>
            <Link to="/docs" className="hover:text-slate-700 dark:hover:text-white">
              <BookOpen size={18} />
            </Link>
            <Link to="/chat" className="hover:text-slate-700 dark:hover:text-white">
              <MessageSquare size={18} />
            </Link>
            <Link to="/rankings" className="hover:text-slate-700 dark:hover:text-white">
              <Trophy size={18} />
            </Link>
            <Link to="/deploy" className="hover:text-slate-700 dark:hover:text-white">
              <Upload size={18} />
            </Link>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-sm font-semibold">{c.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {c.links.map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="hover:text-slate-900 dark:hover:text-white">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500 dark:border-white/10">
        © 2026 InferStack · 프론트엔드 데모 — 실제 추론·결제는 수행되지 않습니다
      </div>
    </footer>
  )
}
