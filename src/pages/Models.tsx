import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LayoutList, Search, Table2 } from 'lucide-react'
import { CAPABILITY_LABEL, ORGS, weeklyTokens } from '../data/models'
import type { Capability, Modality } from '../data/types'
import { ModelFlags, ModelRow, OrgAvatar, modelHref } from '../components/ModelBits'
import { Button, Card, Input, Segmented, Select, cx } from '../components/ui'
import { fmtCtx, fmtParams, fmtPrice, fmtTokens } from '../lib/format'
import { useAllModels } from '../lib/catalog'

type Sort = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'context' | 'params'

const CTX_OPTS = [
  [0, '전체'],
  [131072, '128K+'],
  [262144, '256K+'],
  [1048576, '1M+'],
] as const

export default function Models() {
  const [sp, setSp] = useSearchParams()
  const all = useAllModels()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [sort, setSort] = useState<Sort>((sp.get('sort') as Sort) ?? 'popular')
  const [orgs, setOrgs] = useState<string[]>([])
  const [caps, setCaps] = useState<Capability[]>([])
  const [modality, setModality] = useState<Modality | 'all'>('all')
  const [minCtx, setMinCtx] = useState(0)
  const [maxPrice, setMaxPrice] = useState(5)
  const [freeOnly, setFreeOnly] = useState(false)
  const [view, setView] = useState<'list' | 'table'>('list')

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const r = all.filter(
      (m) =>
        (!ql || (m.name + ' ' + m.slug + ' ' + m.orgName + ' ' + m.architecture + ' ' + m.capabilities.join(' ')).toLowerCase().includes(ql)) &&
        (!orgs.length || orgs.includes(m.org)) &&
        caps.every((c) => m.capabilities.includes(c)) &&
        (modality === 'all' || m.input.includes(modality)) &&
        m.context >= minCtx &&
        m.price.output <= maxPrice &&
        (!freeOnly || m.free),
    )
    const s = [...r]
    switch (sort) {
      case 'popular':
        s.sort((a, b) => weeklyTokens(b) - weeklyTokens(a))
        break
      case 'newest':
        s.sort((a, b) => b.released.localeCompare(a.released))
        break
      case 'price-asc':
        s.sort((a, b) => a.price.input + a.price.output - (b.price.input + b.price.output))
        break
      case 'price-desc':
        s.sort((a, b) => b.price.input + b.price.output - (a.price.input + a.price.output))
        break
      case 'context':
        s.sort((a, b) => b.context - a.context)
        break
      case 'params':
        s.sort((a, b) => b.params - a.params)
        break
    }
    return s
  }, [all, q, orgs, caps, modality, minCtx, maxPrice, freeOnly, sort])

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const reset = () => {
    setOrgs([])
    setCaps([])
    setModality('all')
    setMinCtx(0)
    setMaxPrice(5)
    setFreeOnly(false)
    setQ('')
    setSp({})
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-6 text-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">필터</h2>
          <button onClick={reset} className="text-xs text-slate-500 hover:text-brand-500">
            초기화
          </button>
        </div>
        <FilterGroup title="입력 모달리티">
          <Segmented
            value={modality}
            onChange={setModality}
            options={[
              { id: 'all', label: '전체' },
              { id: 'text', label: '텍스트' },
              { id: 'image', label: '이미지' },
              { id: 'audio', label: '오디오' },
            ]}
          />
        </FilterGroup>
        <FilterGroup title="컨텍스트 길이">
          <div className="flex flex-wrap gap-1">
            {CTX_OPTS.map(([v, l]) => (
              <Chip key={v} active={minCtx === v} onClick={() => setMinCtx(v)}>
                {l}
              </Chip>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title={`최대 출력 가격: ${maxPrice >= 5 ? '제한 없음' : `$${maxPrice.toFixed(2)}/M`}`}>
          <input type="range" min={0.05} max={5} step={0.05} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-brand-600" />
          <label className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="accent-brand-600" /> 무료 티어만
          </label>
        </FilterGroup>
        <FilterGroup title="기능">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(CAPABILITY_LABEL) as Capability[]).map((c) => (
              <Chip key={c} active={caps.includes(c)} onClick={() => toggle(caps, c, setCaps)}>
                {CAPABILITY_LABEL[c]}
              </Chip>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="제공자">
          <div className="space-y-1">
            {ORGS.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
                <input type="checkbox" checked={orgs.includes(o.id)} onChange={() => toggle(orgs, o.id, setOrgs)} className="accent-brand-600" />
                <OrgAvatar org={o.id} name={o.name} size={18} />
                {o.name}
              </label>
            ))}
          </div>
        </FilterGroup>
      </aside>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">모델</h1>
            <p className="text-sm text-slate-500">{list.length}개 모델</p>
          </div>
          <div className="flex flex-1 items-center gap-2 sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 제공자, 아키텍처…" className="pl-9" />
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto">
              <option value="popular">인기순 (토큰)</option>
              <option value="newest">최신순</option>
              <option value="price-asc">가격 낮은순</option>
              <option value="price-desc">가격 높은순</option>
              <option value="context">컨텍스트 긴순</option>
              <option value="params">파라미터 큰순</option>
            </Select>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'list', label: <LayoutList size={14} /> },
                { id: 'table', label: <Table2 size={14} /> },
              ]}
            />
          </div>
        </div>

        {list.length === 0 && (
          <Card className="p-10 text-center text-sm text-slate-500">
            조건에 맞는 모델이 없습니다.{' '}
            <Button variant="ghost" size="sm" onClick={reset}>
              필터 초기화
            </Button>
          </Card>
        )}

        {view === 'list' ? (
          <div className="space-y-3">
            {list.map((m) => (
              <ModelRow key={m.slug} m={m} />
            ))}
          </div>
        ) : (
          list.length > 0 && (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="px-4 py-3 font-medium">모델</th>
                    <th className="px-3 py-3 font-medium">파라미터</th>
                    <th className="px-3 py-3 font-medium">컨텍스트</th>
                    <th className="px-3 py-3 text-right font-medium">입력 $/M</th>
                    <th className="px-3 py-3 text-right font-medium">출력 $/M</th>
                    <th className="px-3 py-3 text-right font-medium">주간 토큰</th>
                    <th className="px-3 py-3 font-medium">공개일</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.slug} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5">
                        <Link to={modelHref(m)} className="flex items-center gap-2">
                          <OrgAvatar org={m.org} name={m.orgName} size={22} />
                          <span className="font-medium hover:text-brand-500">{m.name}</span>
                          <ModelFlags m={m} />
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {fmtParams(m.params)}
                        {m.activeParams ? <span className="text-xs"> / {fmtParams(m.activeParams)}</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{fmtCtx(m.context)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtPrice(m.price.input)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtPrice(m.price.output)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{fmtTokens(weeklyTokens(m))}</td>
                      <td className="px-3 py-2.5 text-slate-500">{m.released}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )
        )}
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-md border px-2 py-1 text-xs transition-colors',
        active ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}
