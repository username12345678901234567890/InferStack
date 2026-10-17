import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, LayoutList, Search, Table2, X } from 'lucide-react'
import { CAPABILITY_LABEL, ORGS, weeklyTokens } from '../data/models'
import type { Capability, CatalogModel, Modality } from '../data/types'
import { ModelFlags, OrgAvatar, modelHref } from '../components/ModelBits'
import { ModelTable, speedOf } from '../components/ModelTable'
import { Input, Segmented, Select, cx } from '../components/ui'
import { useAllModels } from '../lib/catalog'
import { fmtCtx, fmtPrice, fmtTokens } from '../lib/format'

type Sort = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'context' | 'params' | 'fast'

const CTX_STEPS = [0, 131072, 262144, 1048576]
const CTX_LABEL = ['전체', '128K 이상', '256K 이상', '1M 이상']
const PRICE_STEPS = [0.2, 0.5, 1, 2.5, Infinity]
const PRICE_LABEL = ['$0.2 이하', '$0.5 이하', '$1 이하', '$2.5 이하', '전체']
const MODALITY: { id: Modality; label: string }[] = [
  { id: 'text', label: '텍스트' },
  { id: 'image', label: '이미지' },
  { id: 'audio', label: '오디오' },
]

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
    const s = [...r]
    const by: Record<Sort, (a: CatalogModel, b: CatalogModel) => number> = {
      popular: (a, b) => weeklyTokens(b) - weeklyTokens(a),
      newest: (a, b) => b.released.localeCompare(a.released),
'price-asc': (a, b) => a.price.input + a.price.output - (b.price.input + b.price.output),
'price-desc': (a, b) => b.price.input + b.price.output - (a.price.input + a.price.output),
      context: (a, b) => b.context - a.context,
      params: (a, b) => b.params - a.params,
      fast: (a, b) => speedOf(b) - speedOf(a),
    }
    return s.sort(by[sort])
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

  const active: { label: string; clear: () => void }[] = [
    ...mods.map((md) => ({ label: `입력: ${MODALITY.find((x) => x.id === md)?.label}`, clear: () => toggle(mods, md, setMods) })),
    ...(ctxIdx ? [{ label: `컨텍스트 ${CTX_LABEL[ctxIdx]}`, clear: () => setCtxIdx(0) }] : []),
    ...(priceIdx < PRICE_STEPS.length - 1 ? [{ label: `출력 ${PRICE_LABEL[priceIdx]}`, clear: () => setPriceIdx(PRICE_STEPS.length - 1) }] : []),
    ...(freeOnly ? [{ label: '무료 티어', clear: () => setFreeOnly(false) }] : []),
    ...caps.map((c) => ({ label: CAPABILITY_LABEL[c], clear: () => toggle(caps, c, setCaps) })),
    ...orgs.map((o) => ({ label: ORGS.find((x) => x.id === o)?.name ?? o, clear: () => toggle(orgs, o, setOrgs) })),
  ]

  return (
    <div className="grid gap-10 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[14px] font-semibold">필터</span>
          {active.length > 0 && (
            <button onClick={reset} className="text-[13px] text-fg3 hover:text-fg">
              모두 지우기
            </button>
          )}
        </div>

        <Group title="입력 형식">
          {MODALITY.map((md) => (
            <Check key={md.id} checked={mods.includes(md.id)} onChange={() => toggle(mods, md.id, setMods)}>
              {md.label}
            </Check>
          ))}
        </Group>

        <Group title="컨텍스트 길이" value={CTX_LABEL[ctxIdx]}>
          <Range value={ctxIdx} max={CTX_STEPS.length - 1} onChange={setCtxIdx} labels={['전체', '1M']} />
        </Group>

        <Group title="출력 가격 / 1M" value={PRICE_LABEL[priceIdx]}>
          <Range value={priceIdx} max={PRICE_STEPS.length - 1} onChange={setPriceIdx} labels={['$0.2', '전체']} />
          <div className="mt-3">
            <Check checked={freeOnly} onChange={() => setFreeOnly(!freeOnly)}>
              무료 티어만
            </Check>
          </div>
        </Group>

        <Group title="용도">
          {(Object.keys(CAPABILITY_LABEL) as Capability[]).map((c) => (
            <Check key={c} checked={caps.includes(c)} onChange={() => toggle(caps, c, setCaps)}>
              {CAPABILITY_LABEL[c]}
            </Check>
          ))}
        </Group>

        <Group title="제작사" defaultOpen={false}>
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
          <div className="flex items-baseline gap-3">
            <h1 className="text-[28px] font-bold tracking-[-0.03em]">모델</h1>
            <span className="tabular text-[15px] text-fg3">{list.length}개</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 제작사, 아키텍처" className="pl-9" aria-label="모델 검색" />
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-[136px]" aria-label="정렬">
              <option value="popular">많이 쓰는 순</option>
              <option value="newest">최신 순</option>
              <option value="price-asc">저렴한 순</option>
              <option value="fast">빠른 순</option>
              <option value="context">컨텍스트 순</option>
              <option value="params">파라미터 순</option>
            </Select>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'list', label: <LayoutList size={15} aria-label="목록" /> },
                { id: 'table', label: <Table2 size={15} aria-label="표" /> },
              ]}
            />
          </div>
        </div>

        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {active.map((a) => (
              <button key={a.label} onClick={a.clear} className="flex h-7 items-center gap-1 rounded-full bg-raised pl-3 pr-2 text-[12.5px] text-fg ring-1 ring-line2 hover:ring-fg/40">
                {a.label} <X size={13} className="text-fg3" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line2 py-16 text-center text-[14px] text-fg2">
              조건에 맞는 모델이 없습니다.{' '}
              <button onClick={reset} className="text-fg underline underline-offset-4">
                필터 지우기
              </button>
            </div>
          ) : view === 'table' ? (
            <ModelTable models={list} />
          ) : (
            <ul className="border-t border-line">
              {list.map((m) => (
                <ListRow key={m.slug} m={m} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ListRow({ m }: { m: CatalogModel }) {
  return (
    <li className="border-b border-line">
      <Link to={modelHref(m)} className="group flex gap-4 py-6">
        <OrgAvatar org={m.org} name={m.orgName} size={36} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[16px] font-semibold tracking-[-0.015em] group-hover:underline group-hover:decoration-fg3 group-hover:underline-offset-4">{m.name}</span>
            <ModelFlags m={m} />
            <span className="tabular ml-auto hidden shrink-0 pl-4 text-[13.5px] text-fg2 sm:block">{fmtTokens(weeklyTokens(m))} 토큰/주</span>
          </div>
          <p className="mt-1.5 line-clamp-2 max-w-[52rem] text-[14px] leading-relaxed text-fg2">{m.description}</p>
          <div className="tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg3">
            <span>
              by <span className="text-fg2">{m.orgName}</span>
            </span>
            <span>
              <span className="text-fg2">{fmtCtx(m.context)}</span> 컨텍스트
            </span>
            <span>
              입력 <span className="text-fg2">{fmtPrice(m.price.input)}</span>/M
            </span>
            <span>
              출력 <span className="text-fg2">{fmtPrice(m.price.output)}</span>/M
            </span>
            <span className="hidden md:inline">
              <span className="text-fg2">{speedOf(m)}</span> tok/s
            </span>
          </div>
        </div>
      </Link>
    </li>
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
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-fg" />
      {children}
    </label>
  )
}

function Range({ value, max, onChange, labels }: { value: number; max: number; onChange: (v: number) => void; labels: [string, string] }) {
  return (
    <div className="px-1">
      <input type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-fg" />
      <div className="mt-1 flex justify-between text-[12px] text-fg3">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}
