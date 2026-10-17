import { Fragment, type ReactNode } from 'react'
import { CodeBlock } from './ui'

/** 채팅용 초경량 마크다운 렌더러 (코드블록, 표, 목록, 굵게, 인라인 코드) */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++
      blocks.push(<CodeBlock key={k++} code={buf.join('\n')} lang={lang || undefined} className="my-3" />)
      continue
    }
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|[-| :]+\|$/)) {
      const head = cells(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].startsWith('|')) rows.push(cells(lines[i++]))
      blocks.push(
        <div key={k++} className="my-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>{head.map((h, j) => <th key={j} className="border-b border-line2 px-2 py-1.5 text-left font-semibold">{inline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j} className="border-b border-line px-2 py-1.5">{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s/, ''))
      const Tag = ordered ? 'ol' : 'ul'
      blocks.push(
        <Tag key={k++} className={(ordered ? 'list-decimal' : 'list-disc') + ' my-2 space-y-1 pl-5'}>
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </Tag>,
      )
      continue
    }
    if (/^#{1,3}\s/.test(line)) {
      blocks.push(<div key={k++} className="mb-1 mt-3 font-semibold">{inline(line.replace(/^#+\s/, ''))}</div>)
      i++
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    // 첫 줄은 항상 소비 (스트리밍 중 미완성 표 헤더 등에서 무한 루프 방지)
    const para: string[] = [lines[i++]]
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('```') && !/^\s*([-*]|\d+\.)\s/.test(lines[i]) && !lines[i].startsWith('|')) para.push(lines[i++])
    blocks.push(<p key={k++} className="my-2 leading-relaxed">{para.map((p, j) => <Fragment key={j}>{j > 0 && <br />}{inline(p)}</Fragment>)}</p>)
  }
  return <div className="text-[14.5px]">{blocks}</div>
}

function cells(l: string) {
  return l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
}

function inline(s: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|(?<!\w)_[^_]+_(?!\w))/g
  let last = 0
  let k = 0
  for (const m of s.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(s.slice(last, idx))
    const t = m[0]
    if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`')) out.push(<code key={k++} className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em]">{t.slice(1, -1)}</code>)
    else out.push(<em key={k++} className="text-fg3">{t.slice(1, -1)}</em>)
    last = idx + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}
