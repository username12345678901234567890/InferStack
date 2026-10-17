import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUp, Bot, ChevronDown, Plus, Search, SlidersHorizontal, Square, Trash2, X } from 'lucide-react'
import { endpointsFor, findModel } from '../data/models'
import type { CatalogModel } from '../data/types'
import { useAllModels } from '../lib/catalog'
import { OrgAvatar } from '../components/ModelBits'
import { Markdown } from '../components/Markdown'
import { Badge, Button, Label, Textarea, cx } from '../components/ui'
import { chunkText, estimateTokens, mockReply } from '../lib/mockLLM'
import { fmtCtx, fmtPrice, fmtUSD } from '../lib/format'
import { uid } from '../lib/rand'
import { useStore } from '../store'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  meta?: { pt: number; ct: number; cost: number; tps: number; ttft: number; region: string }
  streaming?: boolean
  error?: boolean
}

interface Conv {
  id: string
  title: string
  models: string[]
  messages: Msg[]
  updated: number
}

const LS = 'inferstack-chats'

function loadConvs(): Conv[] {
  try {
    return JSON.parse(localStorage.getItem(LS) ?? '[]')
  } catch {
    return []
  }
}

export default function Chat() {
  const [sp] = useSearchParams()
  const all = useAllModels({ includePrivate: true })
  const defaultModel = useStore((s) => s.settings.defaultModel)
  const credits = useStore((s) => s.credits)
  const recordUsage = useStore((s) => s.recordUsage)
  const initialModel = sp.get('model') ?? defaultModel

  const [convs, setConvs] = useState<Conv[]>(() => loadConvs())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draftModels, setDraftModels] = useState<string[]>([initialModel])
  const [input, setInput] = useState('')
  const [showParams, setShowParams] = useState(false)
  const [system, setSystem] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [busy, setBusy] = useState(false)
  const stopRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const conv = convs.find((c) => c.id === activeId) ?? null
  const models = conv?.models ?? draftModels

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(convs.slice(0, 50)))
    } catch {
      /* ignore */
    }
  }, [convs])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [conv?.messages])

  const byslug = (s: string) => all.find((m) => m.slug === s)

  const setModels = (ms: string[]) => {
    if (conv) setConvs((cs) => cs.map((c) => (c.id === conv.id ? { ...c, models: ms } : c)))
    else setDraftModels(ms)
  }

  const patchMsg = (cid: string, mid: string, patch: Partial<Msg> | ((m: Msg) => Partial<Msg>)) =>
    setConvs((cs) => cs.map((c) => (c.id !== cid ? c : { ...c, updated: Date.now(), messages: c.messages.map((m) => (m.id === mid ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) })))

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    let cid = conv?.id
    const userMsg: Msg = { id: uid('m_'), role: 'user', content: text }
    if (!cid) {
      cid = uid('c_')
      const c: Conv = { id: cid, title: text.slice(0, 40), models: draftModels, messages: [userMsg], updated: Date.now() }
      setConvs((cs) => [c, ...cs])
      setActiveId(cid)
    } else {
      setConvs((cs) => cs.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, userMsg], updated: Date.now() } : c)))
    }
    setBusy(true)
    stopRef.current = false
    const history = [...(conv?.messages ?? []), userMsg]
    await Promise.all(models.map((slug) => streamOne(cid!, slug, history)))
    setBusy(false)
  }

  async function streamOne(cid: string, slug: string, history: Msg[]) {
    const m = byslug(slug)
    const mid = uid('m_')
    setConvs((cs) => cs.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, { id: mid, role: 'assistant', content: '', model: slug, streaming: true }] } : c)))
    if (!m) {
      patchMsg(cid, mid, { content: '모델을 찾을 수 없습니다.', streaming: false, error: true })
      return
    }
    if (!m.free && useStore.getState().credits <= 0) {
      patchMsg(cid, mid, { content: '크레딧이 부족합니다. [크레딧] 페이지에서 충전하세요. (무료 티어 모델은 크레딧 없이 사용 가능)', streaming: false, error: true })
      return
    }
    const ep = m.custom ? { region: 'ap-seoul-1', throughput: 90, latency: 420 } : endpointsFor(m)[0]
    const reply = mockReply(slug, history[history.length - 1].content)
    const ttft = ep.latency * (0.7 + Math.random() * 0.6)
    await sleep(ttft)
    const t0 = performance.now()
    let acc = ''
    const tps = ep.throughput * (0.8 + Math.random() * 0.4)
    const limit = Math.max(16, maxTokens)
    let ct = 0
    for (const piece of chunkText(reply)) {
      if (stopRef.current) break
      acc += piece
      ct += estimateTokens(piece)
      if (ct >= limit) break
      patchMsg(cid, mid, { content: acc })
      await sleep(Math.min(25, 600 / tps) * (0.6 + Math.random() * 0.8))
    }
    const pt = estimateTokens(system) + history.filter((h) => h.role === 'user' || h.model === slug).reduce((s, h) => s + estimateTokens(h.content), 0) + 8
    ct = estimateTokens(acc)
    const cost = m.free ? 0 : (pt * m.price.input + ct * m.price.output) / 1e6
    const elapsed = (performance.now() - t0) / 1000
    patchMsg(cid, mid, { content: acc, streaming: false, meta: { pt, ct, cost, tps: Math.round(ct / Math.max(elapsed, 0.05)), ttft: Math.round(ttft), region: ep.region } })
    recordUsage({
      model: slug,
      keyName: 'Playground',
      endpoint: ep.region,
      promptTokens: pt,
      completionTokens: ct,
      cost,
      latency: Math.round(ttft),
      throughput: Math.round(ct / Math.max(elapsed, 0.05)),
      finish: stopRef.current ? 'length' : 'stop',
      source: 'playground',
    })
  }

  const newChat = () => {
    setActiveId(null)
    setDraftModels(models)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line p-3 md:flex">
        <Button variant="outline" onClick={newChat} className="w-full justify-start">
          <Plus size={16} /> 새 채팅
        </Button>
        <div className="mt-4 flex-1 space-y-0.5 overflow-y-auto">
          {convs.length === 0 && <div className="px-2 py-6 text-center text-xs text-fg3">대화 기록이 없습니다</div>}
          {convs.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cx('group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm', c.id === activeId ? 'bg-raised' : 'hover:bg-raised')}
            >
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setConvs((cs) => cs.filter((x) => x.id !== c.id))
                  if (activeId === c.id) setActiveId(null)
                }}
                className="hidden text-fg3 hover:text-rose-500 group-hover:block"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-line p-3 text-xs">
          <div className="text-fg3">남은 크레딧</div>
          <div className="mt-0.5 text-base font-semibold">{fmtUSD(credits, 4)}</div>
          <Link to="/credits" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">
            충전하기
          </Link>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
          {models.map((s, i) => (
            <ModelPicker
              key={s + i}
              value={s}
              models={all}
              onChange={(v) => setModels(models.map((x, j) => (j === i ? v : x)))}
              onRemove={models.length > 1 ? () => setModels(models.filter((_, j) => j !== i)) : undefined}
            />
          ))}
          {models.length < 3 && (
            <Button variant="ghost" size="sm" onClick={() => setModels([...models, all.find((m) => !models.includes(m.slug))?.slug ?? models[0]])}>
              <Plus size={14} /> 비교 모델 추가
            </Button>
          )}
          <Button variant={showParams ? 'secondary' : 'ghost'} size="sm" className="ml-auto" onClick={() => setShowParams(!showParams)}>
            <SlidersHorizontal size={14} /> 파라미터
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
            {!conv || conv.messages.length === 0 ? (
              <Welcome models={models.map(byslug).filter(Boolean) as CatalogModel[]} onPick={(p) => setInput(p)} />
            ) : (
              <div className={cx('grid gap-0', models.length === 2 && 'md:grid-cols-2', models.length === 3 && 'md:grid-cols-3')}>
                {models.map((slug) => (
                  <div key={slug} className="min-w-0 border-line px-4 py-6 md:[&:not(:last-child)]:border-r">
                    <div className="mx-auto max-w-3xl space-y-6">
                      {conv.messages
                        .filter((m) => m.role === 'user' || m.model === slug)
                        .map((m) => (
                          <MessageView key={m.id} m={m} model={byslug(m.model ?? '')} compact={models.length > 1} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {showParams && (
            <aside className="w-72 shrink-0 space-y-5 overflow-y-auto border-l border-line p-4 text-sm">
              <div>
                <Label>시스템 프롬프트</Label>
                <Textarea rows={4} value={system} onChange={(e) => setSystem(e.target.value)} placeholder="You are a helpful assistant." />
              </div>
              <Slider label="Temperature" value={temperature} min={0} max={2} step={0.05} onChange={setTemperature} />
              <Slider label="Max tokens" value={maxTokens} min={64} max={8192} step={64} onChange={setMaxTokens} />
              <div className="rounded-lg bg-raised p-3 text-xs text-fg3">
                플레이그라운드 사용량은 <b>Playground</b> 키로 기록되며 크레딧에서 차감됩니다. 무료 티어 모델은 차감되지 않습니다.
              </div>
            </aside>
          )}
        </div>

        <div className="border-t border-line p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line2 bg-panel p-2 focus-within:border-fg/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
              className="max-h-48 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-fg3"
            />
            {busy ? (
              <Button size="sm" variant="secondary" onClick={() => (stopRef.current = true)} className="h-9 w-9 p-0">
                <Square size={14} />
              </Button>
            ) : (
              <Button size="sm" onClick={send} disabled={!input.trim()} className="h-9 w-9 p-0">
                <ArrowUp size={16} />
              </Button>
            )}
          </div>
          <div className="mt-1.5 text-center text-[11px] text-fg3">데모 환경: 응답은 시뮬레이션이며 실제 모델 출력이 아닙니다.</div>
        </div>
      </div>
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-fg3">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-fg" />
    </div>
  )
}

function MessageView({ m, model, compact }: { m: Msg; model?: CatalogModel; compact?: boolean }) {
  if (m.role === 'user')
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-line bg-raised px-4 py-2.5 text-sm text-fg">{m.content}</div>
      </div>
    )
  return (
    <div className="flex gap-3">
      {model ? <OrgAvatar org={model.org} name={model.orgName} size={28} /> : <Bot size={28} />}
      <div className="min-w-0 flex-1">
        {!compact && <div className="mb-1 text-xs font-medium text-fg3">{model?.name ?? m.model}</div>}
        <div className={cx(m.error && 'text-rose-500')}>
          {m.content ? <Markdown text={m.content} /> : <span className="inline-block h-4 w-2 animate-blink bg-fg3" />}
          {m.streaming && m.content && <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-fg3 align-middle" />}
        </div>
        {m.meta && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg3">
            <span>{m.meta.pt} → {m.meta.ct} 토큰</span>
            <span>{m.meta.cost === 0 ? '무료' : fmtUSD(m.meta.cost)}</span>
            <span>{m.meta.tps} tok/s</span>
            <span>첫 토큰 {m.meta.ttft}ms</span>
            <span className="font-mono">{m.meta.region}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Welcome({ models, onPick }: { models: CatalogModel[]; onPick: (p: string) => void }) {
  const prompts = ['파이썬으로 InferStack API를 호출하는 코드를 보여줘', 'GGUF와 safetensors 차이를 표로 비교해줘', '안녕! 너는 어떤 모델이야?', '이 모델의 가격 정책을 알려줘']
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex -space-x-2">
        {models.map((m) => (
          <OrgAvatar key={m.slug} org={m.org} name={m.orgName} size={44} />
        ))}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{models.map((m) => m.name).join(' vs ')}</h2>
      <p className="mt-1 text-sm text-fg3">{models.length > 1 ? '같은 프롬프트를 여러 모델에 동시에 보내 결과를 비교하세요.' : models[0]?.description}</p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {prompts.map((p) => (
          <button key={p} onClick={() => onPick(p)} className="rounded-xl border border-line p-3 text-left text-sm text-fg2 hover:border-line2 hover:bg-raised">
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModelPicker({ value, models, onChange, onRemove }: { value: string; models: CatalogModel[]; onChange: (v: string) => void; onRemove?: () => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const cur = models.find((m) => m.slug === value) ?? findModel(value)
  const list = useMemo(() => models.filter((m) => (m.name + m.slug).toLowerCase().includes(q.toLowerCase())), [models, q])
  return (
    <div className="relative">
      <div className="flex items-center rounded-lg border border-line">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-raised">
          {cur && <OrgAvatar org={cur.org} name={cur.orgName} size={18} />}
          <span className="max-w-[180px] truncate font-medium">{cur?.name ?? value}</span>
          <ChevronDown size={14} className="text-fg3" />
        </button>
        {onRemove && (
          <button onClick={onRemove} className="border-l border-line px-1.5 py-1.5 text-fg3 hover:text-rose-500">
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
            <div className="relative border-b border-line p-2">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg3" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="모델 검색" className="h-8 w-full rounded-md bg-raised pl-7 pr-2 text-sm outline-none " />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {list.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => {
                    onChange(m.slug)
                    setOpen(false)
                  }}
                  className={cx('flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-raised', m.slug === value && 'bg-brand-500/10')}
                >
                  <OrgAvatar org={m.org} name={m.orgName} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {m.name} {m.free && <Badge color="green">무료</Badge>} {m.custom && <Badge color="violet">내 모델</Badge>}
                    </div>
                    <div className="text-[11px] text-fg3">
                      {fmtCtx(m.context)} · {fmtPrice(m.price.input)}/{fmtPrice(m.price.output)} per M
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
