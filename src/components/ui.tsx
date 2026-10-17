import { clsx } from 'clsx'
import { Check, Copy, X } from 'lucide-react'
import { create } from 'zustand'
import { Link } from 'react-router-dom'
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export const cx = clsx

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent' | 'inverse'
type Size = 'sm' | 'md' | 'lg'

/** 버튼 모양. Link 에도 같은 모양을 쓰기 위해 분리 */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cx(
    'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
    size === 'sm' && 'h-8 px-3 text-[13px]',
    size === 'md' && 'h-9 px-4 text-[14px]',
    size === 'lg' && 'h-11 px-5 text-[15px]',
    (variant === 'primary' || variant === 'accent') && 'bg-accent text-white hover:bg-accent/90',
    variant === 'inverse' && 'bg-fg text-bg hover:bg-fg/85',
    variant === 'secondary' && 'border border-line bg-raised text-fg hover:border-line2',
    variant === 'outline' && 'border border-line2 text-fg hover:bg-raised',
    variant === 'ghost' && 'text-fg2 hover:bg-raised hover:text-fg',
    variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500',
    className,
  )
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className, children }: { to: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-xl border border-line bg-panel', className)} {...rest}>
      {children}
    </div>
  )
}

export function Badge({ children, color = 'slate', className }: { children: ReactNode; color?: 'slate' | 'brand' | 'green' | 'amber' | 'rose' | 'cyan' | 'violet'; className?: string }) {
  const map = {
    slate: 'bg-raised text-fg2 ring-1 ring-inset ring-line',
    violet: 'bg-raised text-fg ring-1 ring-inset ring-line2',
    brand: 'bg-accent/[0.12] text-accent',
    cyan: 'bg-accent/[0.12] text-accent',
    green: 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/[0.12] text-amber-700 dark:text-amber-400',
    rose: 'bg-rose-500/[0.12] text-rose-600 dark:text-rose-400',
  }
  return <span className={cx('inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-medium leading-none', map[color], className)}>{children}</span>
}

const fieldBase = 'rounded-lg border border-line2 bg-panel px-3 text-sm text-fg placeholder:text-fg3 transition-colors focus:border-fg/40 focus:outline-none'

/** 너비 클래스를 넘기지 않으면 w-full */
const width = (className?: string) => (/(^|\s)(w-|min-w-|flex-1)/.test(className ?? '') ? '' : 'w-full')

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, 'h-9', width(className), className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'py-2', width(className), className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-9 pr-8', width(className), className)} {...rest}>
      {children}
    </select>
  )
}

export function Label({ children, hint, className }: { children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={cx('mb-1.5 block text-[13px] font-medium text-fg', className)}>
      {children}
      {hint && <span className="ml-2 text-xs font-normal text-fg3">{hint}</span>}
    </label>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-fg">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-fg3">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors', checked ? 'border-fg bg-fg' : 'border-line2 bg-raised')}
      >
        <span className={cx('absolute top-[1px] h-4 w-4 rounded-full shadow transition-transform', checked ? 'translate-x-[17px] bg-bg' : 'translate-x-[1px] bg-fg3')} />
      </button>
    </label>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cx('relative w-full animate-fade-in rounded-xl border border-line2 bg-panel shadow-2xl shadow-black/40', size === 'sm' && 'max-w-md', size === 'md' && 'max-w-lg', size === 'lg' && 'max-w-2xl')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-fg3 hover:bg-raised hover:text-fg">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('flex gap-5 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx('-mb-px whitespace-nowrap border-b py-2.5 text-sm transition-colors', value === t.id ? 'border-fg font-medium text-fg' : 'border-transparent text-fg3 hover:text-fg')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange, className, size = 'sm' }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string; size?: 'sm' | 'xs' }) {
  return (
    <div className={cx('inline-flex rounded-lg border border-line bg-raised/60 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'rounded-md font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11.5px]',
            value === o.id ? 'bg-panel text-fg shadow-sm ring-1 ring-line' : 'text-fg3 hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function CopyButton({ text, className, label }: { text: string; className?: string; label?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          /* ignore */
        }
        setOk(true)
        setTimeout(() => setOk(false), 1400)
      }}
      className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-fg3 transition-colors hover:bg-raised hover:text-fg', className)}
      title="복사"
    >
      {ok ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {label && <span>{ok ? '복사됨' : label}</span>}
    </button>
  )
}

/** 코드 패널. 라이트/다크 모두 어두운 바탕. */
export function CodeBlock({ code, lang, className, lineNumbers = true, header = true }: { code: string; lang?: string; className?: string; lineNumbers?: boolean; header?: boolean }) {
  const lines = code.split('\n')
  return (
    <div className={cx('overflow-hidden rounded-xl border border-line bg-[#0c0d0f] text-[#d6d7db]', className)}>
      {header && (
        <div className="flex items-center justify-between border-b border-white/[0.06] py-1 pl-3.5 pr-1.5">
          <span className="font-mono text-[11px] text-white/40">{lang ?? 'code'}</span>
          <CopyButton text={code} className="text-white/45 hover:bg-white/10 hover:text-white" label="복사" />
        </div>
      )}
      <pre className="overflow-x-auto py-3.5 font-mono text-[12.5px] leading-[1.75]">
        <code className="block min-w-max">
          {lines.map((l, i) => (
            <span key={i} className="flex">
              {lineNumbers && <span className="w-10 shrink-0 select-none pr-4 text-right text-white/20">{i + 1}</span>}
              <span className={cx('pr-5', !lineNumbers && 'pl-4')}>{highlight(l, lang)}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/** 가벼운 하이라이터: 문자열 / 주석 / 키워드 / 숫자 */
export function highlight(code: string, lang?: string): ReactNode[] {
  if (!code) return [' ']
  const kw =
    lang === 'bash' || lang === 'shell'
      ? /^(curl|pip|npm|inferstack|export|cd|git|huggingface-cli)$/
      : /^(from|import|def|class|return|for|in|if|else|await|async|const|let|new|yield|with|as|print|true|false|null|None|True|False|self|of)$/
  const re = /(#[^\n]*|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w-]*\b)/g
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of code.matchAll(re)) {
    const s = m[0]
    const idx = m.index ?? 0
    if (idx > last) out.push(code.slice(last, idx))
    let cls = ''
    if (s.startsWith('#') || (s.startsWith('//') && lang !== 'bash')) cls = 'text-white/35'
    else if (/^["'`]/.test(s)) cls = 'text-[#a5d6a7]'
    else if (/^\d/.test(s)) cls = 'text-[#f6c177]'
    else if (kw.test(s)) cls = 'text-[#ff9b5e]'
    out.push(cls ? <span key={i++} className={cls}>{s}</span> : s)
    last = idx + s.length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function Stat({ label, value, sub, icon }: { label: ReactNode; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-fg3">
        {label}
        {icon}
      </div>
      <div className="tabular mt-2 text-[24px] font-bold tracking-[-0.02em]">{value}</div>
      {sub && <div className="mt-1 text-xs text-fg3">{sub}</div>}
    </Card>
  )
}

export function Empty({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line2 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-fg3">{icon}</div>}
      <div className="font-medium">{title}</div>
      {description && <div className="mt-1 max-w-md text-sm text-fg3">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-1 w-full overflow-hidden rounded-full bg-raised', className)}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

/** 섹션 제목 + 오른쪽 링크 */
export function SectionHead({ title, sub, link }: { title: ReactNode; sub?: ReactNode; link?: { to: string; label: string } }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">{title}</h2>
        {sub && <p className="mt-1 text-[14px] text-fg2">{sub}</p>}
      </div>
      {link && (
        <Link to={link.to} className="shrink-0 text-[13.5px] text-fg2 transition-colors hover:text-fg">
          {link.label} →
        </Link>
      )}
    </div>
  )
}

/** 표 공통 클래스 */
export const tbl = {
  wrap: 'overflow-x-auto rounded-xl border border-line bg-panel',
  table: 'tabular w-full text-[14px]',
  th: 'whitespace-nowrap border-b border-line px-4 py-3 text-left text-[12.5px] font-medium text-fg3',
  thR: 'whitespace-nowrap border-b border-line px-4 py-3 text-right text-[12.5px] font-medium text-fg3',
  td: 'border-b border-line px-4 py-3.5 align-middle',
  tdR: 'border-b border-line px-4 py-3.5 text-right align-middle',
  tr: 'transition-colors hover:bg-raised/50 [&:last-child>td]:border-0',
}

/* ---------- toast ---------- */
interface ToastItem {
  id: number
  text: ReactNode
  kind: 'ok' | 'err' | 'info'
}
const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, 'id'>) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random()
    set((s) => ({ items: [...s.items, { ...t, id }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200)
  },
}))

export const toast = {
  ok: (text: ReactNode) => useToasts.getState().push({ text, kind: 'ok' }),
  err: (text: ReactNode) => useToasts.getState().push({ text, kind: 'err' }),
  info: (text: ReactNode) => useToasts.getState().push({ text, kind: 'info' }),
}

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-fade-in items-center gap-2.5 rounded-lg border border-line2 bg-panel px-3.5 py-2.5 text-sm shadow-xl shadow-black/30">
          <span className={cx('h-1.5 w-1.5 rounded-full', t.kind === 'ok' && 'bg-emerald-500', t.kind === 'err' && 'bg-rose-500', t.kind === 'info' && 'bg-fg3')} />
          {t.text}
        </div>
      ))}
    </div>
  )
}
