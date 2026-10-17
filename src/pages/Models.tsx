import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CAPABILITY_LABEL, ORGS, weeklyTokens } from '../data/models'
import type { Capability, Modality } from '../data/types'
import { OrgAvatar } from '../components/ModelBits'
import { ModelTable, speedOf } from '../components/ModelTable'
import { Input, Segmented, Select, cx } from '../components/ui'
import { useAllModels } from '../lib/catalog'

type Sort = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'context' | 'params' | 'fast'

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
      case 'fast':
        s.sort((a, b) => speedOf(b) - speedOf(a))
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
          <button onClick={reset} className="text-xs text-slate-500 hover:text-fg">
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
          <input type="range" min={0.05} max={5} step={0.05} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-fg" />
          <label className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="accent-fg" /> 무료 티어만
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
                <input type="checkbox" checked={orgs.includes(o.id)} onChange={() => toggle(orgs, o.id, setOrgs)} className="accent-fg" />
                <OrgAvatar org={o.id} name={o.name} size={18} />
                {o.name}
              </label>
            ))}
          </div>
        </FilterGroup>
      </aside>

      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">모델</h1>
            <p className="tabular mt-1 text-[14px] text-fg2">{list.length}개</p>
          </div>
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 제작사, 아키텍처" className="pl-9" aria-label="모델 검색" />
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto" aria-label="정렬">
              <option value="popular">많이 쓰는</option>
              <option value="newest">최신</option>
              <option value="price-asc">저렴한</option>
              <option value="fast">빠른</option>
              <option value="context">컨텍스트 긴</option>
              <option value="params">파라미터 큰</option>
            </Select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="border-t border-line py-16 text-center text-[14px] text-fg2">
            조건에 맞는 모델이 없습니다.{' '}
            <button onClick={reset} className="text-fg underline underline-offset-4">
              필터 초기화
            </button>
          </div>
        ) : (
          <ModelTable models={list} />
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
        active ? 'border-fg/50 bg-raised text-fg' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}
