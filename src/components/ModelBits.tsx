import { Link } from 'react-router-dom'
import { Sparkles, Star } from 'lucide-react'
import { ORG_COLORS, CAPABILITY_LABEL, weeklyTokens } from '../data/models'
import type { CatalogModel } from '../data/types'
import { fmtCtx, fmtParams, fmtPrice, fmtTokens } from '../lib/format'
import { Badge, Card, cx } from './ui'
import { useStore } from '../store'

export function OrgAvatar({ org, name, size = 32 }: { org: string; name?: string; size?: number }) {
  const color = ORG_COLORS[org] ?? '#475569'
  const letter = (name ?? org).replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontSize: size * 0.42 }}
    >
      {letter}
    </span>
  )
}

export function ModelFlags({ m }: { m: CatalogModel }) {
  return (
    <>
      {m.custom && <Badge color="violet">커스텀</Badge>}
      {m.isNew && (
        <Badge color="cyan">
          <Sparkles size={10} /> NEW
        </Badge>
      )}
      {m.free && <Badge color="green">무료 티어</Badge>}
      {m.preview && <Badge color="amber">Preview</Badge>}
    </>
  )
}

export function modelHref(m: CatalogModel) {
  return m.custom ? `/my-models/${m.slug.split('/')[1]}` : `/models/${m.slug}`
}

export function ModelRow({ m }: { m: CatalogModel }) {
  const fav = useStore((s) => s.favorites.includes(m.slug))
  const toggle = useStore((s) => s.toggleFavorite)
  return (
    <Card className="group p-4 transition-colors hover:border-brand-400/60 dark:hover:border-brand-400/40">
      <div className="flex items-start gap-3">
        <OrgAvatar org={m.org} name={m.orgName} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={modelHref(m)} className="font-semibold hover:text-brand-500">
              {m.name}
            </Link>
            <ModelFlags m={m} />
            <span className="ml-auto hidden text-sm text-slate-500 sm:inline">{fmtTokens(weeklyTokens(m))} 토큰/주</span>
            <button onClick={() => toggle(m.slug)} className="text-slate-400 hover:text-amber-400" title="즐겨찾기">
              <Star size={16} className={cx(fav && 'fill-amber-400 text-amber-400')} />
            </button>
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-500">{m.slug}</div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>by {m.orgName}</span>
            <span>{fmtParams(m.params)} params{m.activeParams ? ` · ${fmtParams(m.activeParams)} active` : ''}</span>
            <span>{fmtCtx(m.context)} context</span>
            <span>
              {fmtPrice(m.price.input)}/M 입력 · {fmtPrice(m.price.output)}/M 출력
            </span>
            <span className="hidden gap-1 md:flex">
              {m.capabilities.slice(0, 4).map((c) => (
                <Badge key={c}>{CAPABILITY_LABEL[c]}</Badge>
              ))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ModelTile({ m }: { m: CatalogModel }) {
  return (
    <Link to={modelHref(m)}>
      <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-lg hover:shadow-brand-900/10">
        <div className="flex items-center gap-2.5">
          <OrgAvatar org={m.org} name={m.orgName} size={30} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{m.name}</div>
            <div className="text-xs text-slate-500">{m.orgName}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <ModelFlags m={m} />
          <Badge>{fmtCtx(m.context)} ctx</Badge>
          <Badge>{fmtParams(m.params)}</Badge>
        </div>
        <div className="mt-3 flex items-end justify-between text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtPrice(m.price.input)}</span> / <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtPrice(m.price.output)}</span> per M
          </span>
          <span>{fmtTokens(weeklyTokens(m))}/wk</span>
        </div>
      </Card>
    </Link>
  )
}
