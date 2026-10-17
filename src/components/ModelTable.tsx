import { Link, useNavigate } from 'react-router-dom'
import { Code2, MessageSquare } from 'lucide-react'
import { endpointsFor, weeklyTokens } from '../data/models'
import type { CatalogModel } from '../data/types'
import { fmtCtx, fmtPrice, fmtTokens } from '../lib/format'
import { ModelFlags, OrgAvatar, modelHref } from './ModelBits'
import { CopyButton, cx } from './ui'

export type SortKey = 'popular' | 'newest' | 'cheap' | 'fast'

export const SORTS: { id: SortKey; label: string }[] = [
  { id: 'popular', label: '많이 쓰는' },
  { id: 'newest', label: '최신' },
  { id: 'cheap', label: '저렴한' },
  { id: 'fast', label: '빠른' },
]

export function speedOf(m: CatalogModel) {
  return Math.max(...endpointsFor(m).map((e) => e.throughput))
}

export function sortModels(list: CatalogModel[], key: SortKey) {
  const s = [...list]
  if (key === 'popular') s.sort((a, b) => weeklyTokens(b) - weeklyTokens(a))
  if (key === 'newest') s.sort((a, b) => b.released.localeCompare(a.released))
  if (key === 'cheap') s.sort((a, b) => a.price.input + a.price.output * 3 - (b.price.input + b.price.output * 3))
  if (key === 'fast') s.sort((a, b) => speedOf(b) - speedOf(a))
  return s
}

/** 홈과 모델 목록이 함께 쓰는 표. 이름과 숫자가 주인공이고, 회색은 라벨에만 쓴다. */
export function ModelTable({ models, onCode, codeSlug }: { models: CatalogModel[]; onCode?: (slug: string) => void; codeSlug?: string }) {
  const nav = useNavigate()
  const maxTok = Math.max(1, ...models.map(weeklyTokens))
  return (
    <>
      {/* desktop */}
      <table className="tabular hidden w-full md:table">
        <thead>
          <tr className="text-left text-[12px] text-fg3">
            <th className="pb-3 font-normal">모델</th>
            <th className="w-[92px] pb-3 text-right font-normal">컨텍스트</th>
            <th className="w-[96px] pb-3 text-right font-normal">입력 $/1M</th>
            <th className="w-[96px] pb-3 text-right font-normal">출력 $/1M</th>
            <th className="w-[88px] pb-3 text-right font-normal">속도</th>
            <th className="w-[150px] pb-3 pl-6 font-normal">주간 토큰</th>
            <th className="w-[92px] pb-3" />
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const tok = weeklyTokens(m)
            return (
              <tr
                key={m.slug}
                onClick={() => nav(modelHref(m))}
                className={cx('group cursor-pointer border-t border-line transition-colors hover:bg-raised/60', codeSlug === m.slug && 'bg-raised/60')}
              >
                <td className="py-3.5 pl-3 pr-4">
                  <div className="flex items-center gap-3">
                    <OrgAvatar org={m.org} name={m.orgName} size={28} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={modelHref(m)} onClick={(e) => e.stopPropagation()} className="truncate text-[15px] font-semibold tracking-[-0.01em] text-fg">
                          {m.name}
                        </Link>
                        <ModelFlags m={m} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-fg3" onClick={(e) => e.stopPropagation()}>
                        <span className="font-mono">{m.slug}</span>
                        <CopyButton text={m.slug} className="-my-1 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono text-[13.5px] text-fg">{fmtCtx(m.context)}</td>
                <td className="py-3.5 text-right font-mono text-[13.5px] text-fg">{fmtPrice(m.price.input)}</td>
                <td className="py-3.5 text-right font-mono text-[13.5px] text-fg">{fmtPrice(m.price.output)}</td>
                <td className="py-3.5 text-right font-mono text-[13.5px] text-fg">
                  {speedOf(m)}
                  <span className="ml-1 text-[11px] text-fg3">t/s</span>
                </td>
                <td className="py-3.5 pl-6">
                  <div className="flex items-center gap-2.5">
                    <span className="h-[5px] w-16 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-fg/70" style={{ width: `${Math.max(4, (tok / maxTok) * 100)}%` }} />
                    </span>
                    <span className="font-mono text-[13px] text-fg2">{fmtTokens(tok)}</span>
                  </div>
                </td>
                <td className="py-3.5 pr-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {onCode && (
                      <button onClick={() => onCode(m.slug)} className="rounded-md p-1.5 text-fg2 hover:bg-panel hover:text-fg" title="호출 코드 보기" aria-label={`${m.name} 호출 코드`}>
                        <Code2 size={16} />
                      </button>
                    )}
                    <Link to={`/chat?model=${encodeURIComponent(m.slug)}`} className="rounded-md p-1.5 text-fg2 hover:bg-panel hover:text-fg" title="채팅으로 써보기" aria-label={`${m.name} 채팅`}>
                      <MessageSquare size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* mobile */}
      <ul className="divide-y divide-line border-t border-line md:hidden">
        {models.map((m) => (
          <li key={m.slug}>
            <Link to={modelHref(m)} className="flex items-center gap-3 py-3.5">
              <OrgAvatar org={m.org} name={m.orgName} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-[15px] font-semibold">
                  {m.name} <ModelFlags m={m} />
                </div>
                <div className="tabular mt-0.5 font-mono text-[12.5px] text-fg2">
                  {fmtCtx(m.context)} · {fmtPrice(m.price.input)} / {fmtPrice(m.price.output)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
