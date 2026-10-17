import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Boxes, ChevronDown, CreditCard, KeyRound, LogOut, Menu, Moon, Search, Settings, Sun, X } from 'lucide-react'
import { Logo } from './Logo'
import { OrgAvatar } from './ModelBits'
import { Button, Toaster, cx } from './ui'
import { useStore } from '../store'
import { MODELS } from '../data/models'
import { fmtUSD } from '../lib/format'
import { buildProgress } from '../lib/build'

const NAV = [
  { to: '/models', label: '모델' },
  { to: '/rankings', label: '랭킹' },
  { to: '/deploy', label: '모델 업로드' },
  { to: '/chat', label: '채팅' },
  { to: '/docs', label: '문서' },
  { to: '/pricing', label: '가격' },
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
    <div className="relative hidden w-56 lg:block">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg3" />
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
        placeholder="모델 검색"
        className="h-8 w-full rounded-lg border border-line bg-panel pl-8 pr-10 text-[13px] text-fg placeholder:text-fg3 focus:border-line2 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line px-1 font-mono text-[10px] text-fg3">⌘K</kbd>
      {open && results.length > 0 && (
        <div className="absolute left-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-line2 bg-panel py-1 shadow-2xl shadow-black/40">
          {results.map((m, i) => (
            <button key={m.slug} onMouseDown={() => go(m.slug)} className={cx('flex w-full items-center gap-2.5 px-3 py-2 text-left', i === sel ? 'bg-raised' : 'hover:bg-raised')}>
              <OrgAvatar org={m.org} name={m.orgName} size={22} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{m.name}</span>
                <span className="block truncate font-mono text-[11px] text-fg3">{m.slug}</span>
              </span>
            </button>
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
      <>
        <Link to="/signin">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
        </Link>
        <Link to="/signin">
          <Button size="sm">시작하기</Button>
        </Link>
      </>
    )
  const items = [
    { to: '/keys', label: 'API 키', icon: KeyRound },
    { to: '/credits', label: '크레딧', icon: CreditCard },
    { to: '/activity', label: '활동', icon: Activity },
    { to: '/my-models', label: '내 모델', icon: Boxes },
    { to: '/settings', label: '설정', icon: Settings },
  ]
  return (
    <div className="relative flex items-center gap-1.5">
      <Link to="/keys" className="hidden sm:block">
        <Button size="sm">API 키</Button>
      </Link>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 hover:bg-raised">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line2 bg-raised text-[12px] font-semibold">{user.name[0]}</span>
        <ChevronDown size={13} className="text-fg3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-line2 bg-panel py-1 shadow-2xl shadow-black/40">
            <div className="border-b border-line px-3.5 py-2.5">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-fg3">{user.email}</div>
              <div className="tabular mt-2 flex items-center justify-between rounded-lg bg-raised px-2.5 py-1.5 font-mono text-xs">
                <span className="font-sans text-fg3">크레딧</span>
                {fmtUSD(credits)}
              </div>
            </div>
            {items.map((it) => (
              <Link key={it.to} to={it.to} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-fg2 hover:bg-raised hover:text-fg">
                <it.icon size={14} /> {it.label}
              </Link>
            ))}
            <button onClick={signOut} className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2 text-[13px] text-fg2 hover:bg-raised hover:text-fg">
              <LogOut size={14} /> 로그아웃
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className={cx(CONTAINER, 'flex h-14 items-center gap-7', isChat && 'max-w-none')}>
          <Link to="/" className="shrink-0" aria-label="InferStack 홈">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('text-[13.5px] transition-colors', isActive ? 'text-fg' : 'text-fg2 hover:text-fg')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 text-fg3 hover:bg-raised hover:text-fg" title="테마 전환" aria-label="테마 전환">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <UserMenu />
            <button className="rounded-lg p-2 text-fg2 md:hidden" onClick={() => setMobile(!mobile)} aria-label="메뉴">
              {mobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="border-t border-line px-5 py-2 md:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="block py-2.5 text-[15px] text-fg2">
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className={cx('flex-1', !isChat && !isHome && cx(CONTAINER, 'py-10'))}>
        <Outlet />
      </main>

      {!isChat && <Footer />}
      <Toaster />
    </div>
  )
}

function Footer() {
  const cols = [
    { title: '제품', links: [['모델', '/models'], ['랭킹', '/rankings'], ['채팅', '/chat'], ['가격', '/pricing']] },
    { title: '개발자', links: [['빠른 시작', '/docs#quickstart'], ['API 레퍼런스', '/docs#api'], ['CLI', '/docs#cli'], ['아키텍처 패키지', '/docs#arch']] },
    { title: '모델 업로드', links: [['Hugging Face', '/deploy/new?source=huggingface'], ['ModelScope', '/deploy/new?source=modelscope'], ['CLI 업로드', '/deploy/new?source=cli'], ['내 모델', '/my-models']] },
    { title: '계정', links: [['API 키', '/keys'], ['크레딧', '/credits'], ['활동', '/activity'], ['설정', '/settings']] },
  ]
  return (
    <footer className="border-t border-line">
      <div className={cx(CONTAINER, 'grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]')}>
        <div>
          <Logo />
          <p className="mt-4 max-w-[17rem] text-[13px] leading-relaxed text-fg3">오픈 웨이트 모델을 위한 추론 API. 카탈로그 모델과 직접 올린 모델을 같은 엔드포인트에서 호출합니다.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[13px] font-medium">{c.title}</div>
            <ul className="mt-4 space-y-2.5 text-[13px] text-fg3">
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
        <div className={cx(CONTAINER, 'flex flex-col justify-between gap-2 py-6 text-xs text-fg3 sm:flex-row')}>
          <span>© 2026 InferStack</span>
          <span>프론트엔드 데모입니다. 추론, 결제, 배포는 시뮬레이션이며 사용량 수치는 예시 데이터입니다.</span>
        </div>
      </div>
    </footer>
  )
}
