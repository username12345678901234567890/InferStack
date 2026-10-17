import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronDown, LayoutList, MessageSquare, Search, Table2, X } from 'lucide-react'
import { CAPABILITY_LABEL, ORGS, findModel, weeklyTokens } from '../data/models'
import type { Capability, CatalogModel, Modality } from '../data/types'
import { ModelFlags, OrgAvatar, modelHref } from '../components/ModelBits'
import { ModelTable, speedOf } from '../components/ModelTable'
import { ButtonLink, CopyButton, Input, Segmented, Select, buttonClass, cx } from '../components/ui'
import { useAllModels } from '../lib/catalog'
import { fmtCtx, fmtPrice, fmtTokens } from '../lib/format'

type Sort = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'context' | 'params' | 'fast'

const CTX_STEPS = [0, 131072, 262144, 1048576]
const CTX_LABEL = ['Any', '128K+', '256K+', '1M+']
const PRICE_STEPS = [0.2, 0.5, 1, 2.5, Infinity]
const PRICE_LABEL = ['≤ $0.2', '≤ $0.5', '≤ $1', '≤ $2.5', 'Any']
const MODALITY: { id: Modality; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'audio', label: 'Audio' },
]

/** Quick presets above the list: one click narrows the catalog to a use case */
type Preset = { id: string; label: string; caps?: Capability[]; mods?: Modality[]; ctx?: number; free?: boolean }
const PRESETS: Preset[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free tier', free: true },
  { id: 'coding', label: 'Coding', caps: ['coding'] },
  { id: 'agent', label: 'Agents', caps: ['agent'] },
  { id: 'reasoning', label: 'Reasoning', caps: ['reasoning'] },
  { id: 'vision', label: 'Vision', mods: ['image'] },
  { id: 'long', label: '1M context', ctx: 3 },
]

const MAX_COMPARE = 3

export default function Models() {
  const [sp, setSp] = useSearchParams()
  const all = useAllModels()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [sort, setSort] = useState<Sort>((sp.get('sort') as Sort) ?? 'popular')
  const [view, setView] = useState<'list' | 'table'>('list')
  const [orgs, setOrgs] = useState<string[]>([])
  const [caps, setCaps] = useState<Capability[]>([])
  const [mods, setMods] = useState<Modality[]>([])
  const [ctxIdx, setCtxIdx] = useState(0)
  const [priceIdx, setPriceIdx] = useState(PRICE_STEPS.length - 1)
  const [freeOnly, setFreeOnly] = useState(false)
  const [compare, setCompare] = useState<string[]>([])

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const r = all.filter(
      (m) =>
        (!ql || [m.name, m.slug, m.orgName, m.architecture, ...m.capabilities].join(' ').toLowerCase().includes(ql)) &&
        (!orgs.length || orgs.includes(m.org)) &&
        caps.every((c) => m.capabilities.includes(c)) &&
        mods.every((md) => m.input.includes(md)) &&
        m.context >= CTX_STEPS[ctxIdx] &&
        m.price.output <= PRICE_STEPS[priceIdx] &&
        (!freeOnly || m.free),
    )
    const by: Record<Sort, (a: CatalogModel, b: CatalogModel) => number> = {
      popular: (a, b) => weeklyTokens(b) - weeklyTokens(a),
      newest: (a, b) => b.released.localeCompare(a.released),
      'price-asc': (a, b) => a.price.input + a.price.output - (b.price.input + b.price.output),
      'price-desc': (a, b) => b.price.input + b.price.output - (a.price.input + a.price.output),
      context: (a, b) => b.context - a.context,
      params: (a, b) => b.params - a.params,
      fast: (a, b) => speedOf(b) - speedOf(a),
    }
    return [...r].sort(by[sort])
  }, [all, q, orgs, caps, mods, ctxIdx, priceIdx, freeOnly, sort])

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const reset = () => {
    setOrgs([])
    setCaps([])
    setMods([])
    setCtxIdx(0)
    setPriceIdx(PRICE_STEPS.length - 1)
    setFreeOnly(false)
    setQ('')
    setSp({})
  }
  const applyPreset = (p: Preset) => {
    reset()
    setCaps(p.caps ?? [])
    setMods(p.mods ?? [])
    setCtxIdx(p.ctx ?? 0)
    setFreeOnly(!!p.free)
  }
  const presetActive = (p: Preset) =>
    !q && !orgs.length && priceIdx === PRICE_STEPS.length - 1 && freeOnly === !!p.free && ctxIdx === (p.ctx ?? 0) && caps.join() === (p.caps ?? []).join() && mods.join() === (p.mods ?? []).join()

  const active: { label: string; clear: () => void }[] = [
    ...mods.map((md) => ({ label: `Input: ${MODALITY.find((x) => x.id === md)?.label}`, clear: () => toggle(mods, md, setMods) })),
    ...(ctxIdx ? [{ label: `Context ${CTX_LABEL[ctxIdx]}`, clear: () => setCtxIdx(0) }] : []),
    ...(priceIdx < PRICE_STEPS.length - 1 ? [{ label: `Output ${PRICE_LABEL[priceIdx]}`, clear: () => setPriceIdx(PRICE_STEPS.length - 1) }] : []),
    ...(freeOnly ? [{ label: 'Free tier', clear: () => setFreeOnly(false) }] : []),
    ...caps.map((c) => ({ label: CAPABILITY_LABEL[c], clear: () => toggle(caps, c, setCaps) })),
    ...orgs.map((o) => ({ label: ORGS.find((x) => x.id === o)?.name ?? o, clear: () => toggle(orgs, o, setOrgs) })),
  ]

  const toggleCompare = (slug: string) =>
    setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : c.length >= MAX_COMPARE ? c : [...c, slug]))

  return (
    <div>
      <header>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Models</h1>
        <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-fg2">
          {all.length} models from {ORGS.length} labs, all on the same API. Try one in chat, then call it with its model ID.
        </p>
      </header>

      <StartHere />

      <div className="mt-14 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[14px] font-semibold">Filters</span>
            {active.length > 0 && (
              <button onClick={reset} className="text-[13px] text-fg3 hover:text-fg">
                Clear all
              </button>
            )}
          </div>

          <Group title="Input">
            {MODALITY.map((md) => (
              <Check key={md.id} checked={mods.includes(md.id)} onChange={() => toggle(mods, md.id, setMods)}>
                {md.label}
              </Check>
            ))}
          </Group>

          <Group title="Context length" value={CTX_LABEL[ctxIdx]}>
            <Range value={ctxIdx} max={CTX_STEPS.length - 1} onChange={setCtxIdx} labels={['Any', '1M']} />
          </Group>

          <Group title="Output price / M" value={PRICE_LABEL[priceIdx]}>
            <Range value={priceIdx} max={PRICE_STEPS.length - 1} onChange={setPriceIdx} labels={['$0.2', 'Any']} />
            <div className="mt-3">
              <Check checked={freeOnly} onChange={() => setFreeOnly(!freeOnly)}>
                Free tier only
              </Check>
            </div>
          </Group>

          <Group title="Capabilities">
            {(Object.keys(CAPABILITY_LABEL) as Capability[]).map((c) => (
              <Check key={c} checked={caps.includes(c)} onChange={() => toggle(caps, c, setCaps)}>
                {CAPABILITY_LABEL[c]}
              </Check>
            ))}
          </Group>

          <Group title="Labs" defaultOpen={false}>
            {ORGS.map((o) => (
              <Check key={o.id} checked={orgs.includes(o.id)} onChange={() => toggle(orgs, o.id, setOrgs)}>
                <span className="flex items-center gap-2">
                  <OrgAvatar org={o.id} name={o.name} size={18} />
                  {o.name}
                </span>
              </Check>
            ))}
          </Group>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em]">All models</h2>
              <span className="tabular text-[14px] text-fg3">{list.length}</span>
              <span className="hidden text-[13px] text-fg3 xl:inline">· tick up to {MAX_COMPARE} to compare</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <div className="relative w-full sm:w-60">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, lab or architecture" className="!rounded-full pl-9" aria-label="Search models" />
              </div>
              <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-w-0 flex-1 !rounded-full sm:w-[150px] sm:flex-none" aria-label="Sort">
                <option value="popular">Most used</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Cheapest</option>
                <option value="fast">Fastest</option>
                <option value="context">Longest context</option>
                <option value="params">Largest</option>
              </Select>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { id: 'list', label: <LayoutList size={15} aria-label="List view" /> },
                  { id: 'table', label: <Table2 size={15} aria-label="Table view" /> },
                ]}
              />
            </div>
          </div>

          <div className="-mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={cx(
                  'h-8 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors',
                  presetActive(p) ? 'border-transparent bg-brand text-on-brand' : 'border-line2 text-fg2 hover:border-fg/40 hover:text-fg',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {active.length > 0 && !PRESETS.some(presetActive) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {active.map((a) => (
                <button key={a.label} onClick={a.clear} className="flex h-7 items-center gap-1 rounded-full bg-raised pl-3 pr-2 text-[12.5px] text-fg ring-1 ring-line2 hover:ring-fg/40">
                  {a.label} <X size={13} className="text-fg3" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line2 py-16 text-center text-[14px] text-fg2">
                No models match these filters.{' '}
                <button onClick={reset} className="text-fg underline underline-offset-4">
                  Clear filters
                </button>
              </div>
            ) : view === 'table' ? (
              <ModelTable models={list} />
            ) : (
              <ul className="border-t border-line">
                {list.map((m) => (
                  <ListRow key={m.slug} m={m} selected={compare.includes(m.slug)} canSelect={compare.length < MAX_COMPARE} onSelect={() => toggleCompare(m.slug)} />
                ))}
              </ul>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-raised/70 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[15.5px] font-semibold">Can’t find the model you need?</div>
              <p className="mt-1 text-[14px] text-fg2">Deploy any Hugging Face or ModelScope model to a dedicated endpoint on the same API.</p>
            </div>
            <ButtonLink to="/deploy" variant="outline" className="shrink-0 bg-panel">
              Deploy a model <ArrowRight size={15} />
            </ButtonLink>
          </div>
        </div>
      </div>

      <CompareBar slugs={compare} onClear={() => setCompare([])} onRemove={(s) => toggleCompare(s)} />
    </div>
  )
}

/** A few starting points above the full list */
function StartHere() {
  const all = useAllModels()
  const fastest = [...all].filter((m) => !m.custom).sort((a, b) => speedOf(b) - speedOf(a))[0]
  const picks: { label: string; slug: string; why: string }[] = [
    { label: 'Best default', slug: 'deepseek/deepseek-v4.1-flash', why: '1M context and vision at a low price' },
    { label: 'Best for coding', slug: 'z-ai/glm-5.3', why: 'Leads agentic coding benchmarks' },
    { label: 'Cheapest', slug: 'openbmb/minicpm5-2b', why: '$0.04 per million output tokens' },
    { label: 'Fastest', slug: fastest.slug === 'openbmb/minicpm5-2b' ? 'liquid/lfm2.5-24b-a2b' : fastest.slug, why: 'Highest throughput in the catalog' },
  ]
  return (
    <section className="mt-8">
      <div className="mb-3 text-[13px] font-medium text-fg3">Start here</div>
      <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {picks.map((p) => {
          const m = findModel(p.slug)!
          return (
            <div key={p.label} className="group relative flex w-[80%] shrink-0 snap-start flex-col rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-line2 sm:w-auto">
              <Link to={`/models/${m.slug}`} className="absolute inset-0 rounded-2xl" aria-label={`${p.label}: ${m.name}`} />
              <div className="text-[12.5px] font-medium text-accent">{p.label}</div>
              <div className="mt-3 flex items-center gap-2.5">
                <OrgAvatar org={m.org} name={m.orgName} size={28} />
                <div className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.01em]">{m.name}</div>
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-snug text-fg2">{p.why}</p>
              <div className="tabular mt-4 flex items-center justify-between text-[12.5px] text-fg2">
                <span>
                  {fmtPrice(m.price.input)} / {fmtPrice(m.price.output)} <span className="text-fg3">per M</span>
                </span>
                <Link to={`/chat?model=${encodeURIComponent(m.slug)}`} className="relative z-10 flex items-center gap-1 rounded-full font-medium text-fg hover:text-accent">
                  Try it <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ListRow({ m, selected, canSelect, onSelect }: { m: CatalogModel; selected: boolean; canSelect: boolean; onSelect: () => void }) {
  return (
    <li className={cx('group relative border-b border-line transition-colors', selected ? 'bg-accent/[0.04]' : 'hover:bg-raised/40')}>
      <Link to={modelHref(m)} className="absolute inset-0" aria-label={m.name} />
      <div className="flex gap-4 px-1 py-5">
        <label
          className={cx('relative z-10 mt-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center', !selected && !canSelect && 'cursor-not-allowed opacity-40')}
          title={selected ? 'Remove from comparison' : canSelect ? 'Add to comparison' : `Compare up to ${MAX_COMPARE} models`}
        >
          <input type="checkbox" checked={selected} disabled={!selected && !canSelect} onChange={onSelect} className="h-4 w-4 cursor-pointer accent-[rgb(var(--accent))]" aria-label={`Compare ${m.name}`} />
        </label>
        <OrgAvatar org={m.org} name={m.orgName} size={36} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[16px] font-semibold tracking-[-0.015em] group-hover:underline group-hover:decoration-fg3 group-hover:underline-offset-4">{m.name}</span>
            <ModelFlags m={m} />
          </div>
          <p className="mt-1.5 line-clamp-2 max-w-[46rem] text-[14px] leading-relaxed text-fg2">{m.description}</p>
          <div className="tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg3">
            <span>
              by <span className="text-fg2">{m.orgName}</span>
            </span>
            <span>
              <span className="text-fg2">{fmtCtx(m.context)}</span> context
            </span>
            <span>
              <span className="text-fg2">{fmtPrice(m.price.input)}</span>/M in
            </span>
            <span>
              <span className="text-fg2">{fmtPrice(m.price.output)}</span>/M out
            </span>
            <span className="hidden md:inline">
              <span className="text-fg2">{speedOf(m)}</span> tok/s
            </span>
          </div>
        </div>
        <div className="hidden w-[170px] shrink-0 flex-col items-end justify-between sm:flex">
          <span className="tabular text-[13.5px] text-fg2">{fmtTokens(weeklyTokens(m))} tokens/wk</span>
          <div className="relative z-10 flex items-center gap-1">
            <CopyButton text={m.slug} label="ID" className="h-8 rounded-full px-2.5" />
            <Link to={`/chat?model=${encodeURIComponent(m.slug)}`} className={buttonClass('outline', 'sm', 'bg-panel')}>
              <MessageSquare size={14} /> Chat
            </Link>
          </div>
        </div>
      </div>
    </li>
  )
}

function CompareBar({ slugs, onClear, onRemove }: { slugs: string[]; onClear: () => void; onRemove: (s: string) => void }) {
  const nav = useNavigate()
  if (!slugs.length) return null
  const models = slugs.map((s) => findModel(s)).filter(Boolean) as CatalogModel[]
  return (
    <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="flex max-w-full animate-fade-in items-center gap-2 overflow-x-auto rounded-full border border-line2 bg-panel py-1.5 pl-2 pr-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.3)]">
        {models.map((m) => (
          <span key={m.slug} className="flex shrink-0 items-center gap-1.5 rounded-full bg-raised py-1 pl-1 pr-1.5 text-[13px] font-medium">
            <OrgAvatar org={m.org} name={m.orgName} size={20} className="!rounded-full" />
            {m.name}
            <button onClick={() => onRemove(m.slug)} className="rounded-full p-0.5 text-fg3 hover:text-fg" aria-label={`Remove ${m.name}`}>
              <X size={13} />
            </button>
          </span>
        ))}
        <span className="shrink-0 px-1 text-[12.5px] text-fg3">{slugs.length < 2 ? 'Pick one more to compare' : `${slugs.length} of ${MAX_COMPARE}`}</span>
        <button onClick={onClear} className="shrink-0 rounded-full px-2.5 py-1.5 text-[13px] text-fg2 hover:bg-raised hover:text-fg">
          Clear
        </button>
        <button onClick={() => nav(`/chat?model=${slugs.map(encodeURIComponent).join(',')}`)} className={buttonClass('primary', 'md', 'shrink-0')}>
          {slugs.length < 2 ? 'Chat' : 'Compare in chat'} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

function Group({ title, value, children, defaultOpen = true }: { title: string; value?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-left text-[13.5px] font-medium">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-[12.5px] font-normal text-fg3">
          {value}
          <ChevronDown size={15} className={cx('transition-transform', !open && '-rotate-90')} />
        </span>
      </button>
      {open && <div className="mt-2 space-y-0.5">{children}</div>}
    </div>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-[13.5px] text-fg2 hover:text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[rgb(var(--accent))]" />
      {children}
    </label>
  )
}

function Range({ value, max, onChange, labels }: { value: number; max: number; onChange: (v: number) => void; labels: [string, string] }) {
  return (
    <div className="px-1">
      <input type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" />
      <div className="mt-1 flex justify-between text-[12px] text-fg3">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}
