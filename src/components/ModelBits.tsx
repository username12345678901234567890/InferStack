import { Link } from 'react-router-dom'
import { Cpu, Star } from 'lucide-react'
import { CAPABILITY_LABEL, ORG_COLORS, weeklyTokens } from '../data/models'
import type { CatalogModel } from '../data/types'
import { fmtCtx, fmtParams, fmtPrice, fmtTokens } from '../lib/format'
import { Badge, Card, cx } from './ui'
import { useStore } from '../store'

/** 제공사 로고 (Hugging Face 조직 아바타를 public/logos 에 내려받아 사용) */
export function OrgAvatar({ org, name, size = 32, className }: { org: string; name?: string; size?: number; className?: string }) {
  const known = org in ORG_COLORS
  const r = Math.max(4, Math.round(size * 0.22))
  if (!known)
    return (
      <span className={cx('inline-flex shrink-0 items-center justify-center border border-line2 bg-raised text-fg2', className)} style={{ width: size, height: size, borderRadius: r }} title={name ?? org}>
        <Cpu size={Math.round(size * 0.55)} strokeWidth={1.6} />
      </span>
    )
  return (
    <span className={cx('inline-flex shrink-0 overflow-hidden bg-white ring-1 ring-black/10 dark:ring-white/10', className)} style={{ width: size, height: size, borderRadius: r }} title={name ?? org}>
      <img src={`./logos/${org}.png`} alt={name ?? org} width={size} height={size} className="h-full w-full object-cover" />
    </span>
  )
}

export function ModelFlags({ m }: { m: CatalogModel }) {
  return (
    <>
      {m.custom && <Badge color="violet">내 모델</Badge>}
      {m.isNew && <Badge color="brand">New</Badge>}
      {m.free && <Badge color="green">무료</Badge>}
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
    <div className="group grid grid-cols-[auto_1fr] gap-4 border-b border-line py-5 last:border-0">
      <OrgAvatar org={m.org} name={m.orgName} size={36} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to={modelHref(m)} className="text-[15px] font-semibold tracking-[-0.01em] hover:underline hover:decoration-fg3 hover:underline-offset-4">
            {m.name}
          </Link>
          <ModelFlags m={m} />
          <span className="tabular ml-auto hidden font-mono text-[12.5px] text-fg2 sm:inline">{fmtTokens(weeklyTokens(m))} tokens/wk</span>
          <button onClick={() => toggle(m.slug)} className="text-fg3 opacity-0 transition-opacity hover:text-fg group-hover:opacity-100 data-[on=true]:opacity-100" data-on={fav} title="즐겨찾기">
            <Star size={15} className={cx(fav && 'fill-accent text-accent')} />
          </button>
        </div>
        <p className="mt-1.5 line-clamp-2 max-w-3xl text-[13.5px] leading-relaxed text-fg2">{m.description}</p>
        <div className="tabular mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-fg3">
          <span className="font-sans text-fg2">by {m.orgName}</span>
          <Dot />
          <span>{fmtCtx(m.context)} context</span>
          <Dot />
          <span>{fmtParams(m.params)}{m.activeParams ? ` · ${fmtParams(m.activeParams)} active` : ''}</span>
          <Dot />
          <span>
            {fmtPrice(m.price.input)}/M in · {fmtPrice(m.price.output)}/M out
          </span>
          <span className="hidden font-sans text-fg3 lg:inline">
            <Dot /> {m.capabilities.slice(0, 3).map((c) => CAPABILITY_LABEL[c]).join(' · ')}
          </span>
        </div>
      </div>
    </div>
  )
}

function Dot() {
  return <span className="text-fg3/50">·</span>
}

export function ModelTile({ m }: { m: CatalogModel }) {
  return (
    <Link to={modelHref(m)} className="block">
      <Card className="h-full p-4 transition-colors hover:border-line2 hover:bg-raised/40">
        <div className="flex items-center gap-3">
          <OrgAvatar org={m.org} name={m.orgName} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {m.name} <ModelFlags m={m} />
            </div>
            <div className="text-xs text-fg3">by {m.orgName}</div>
          </div>
        </div>
        <div className="tabular mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-[12px]">
          <div>
            <div className="text-fg">{fmtTokens(weeklyTokens(m))}</div>
            <div className="font-sans text-[11px] text-fg3">tokens/wk</div>
          </div>
          <div>
            <div className="text-fg">{fmtCtx(m.context)}</div>
            <div className="font-sans text-[11px] text-fg3">context</div>
          </div>
          <div>
            <div className="text-fg">{fmtPrice(m.price.output)}</div>
            <div className="font-sans text-[11px] text-fg3">out / 1M</div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
