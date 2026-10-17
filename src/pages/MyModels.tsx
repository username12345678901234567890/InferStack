import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, CheckCircle2, Circle, Cpu, Globe, Loader2, Lock, MessageSquare, Pause, Play, Plus, Settings2, Trash2 } from 'lucide-react'
import type { CustomModelStatus } from '../data/types'
import { Badge, Button, Card, CopyButton, Empty, Modal, PageHeader, Progress, Stat, Tabs, cx, toast } from '../components/ui'
import { buildLogs, buildProgress } from '../lib/build'
import { fmtBytes, fmtDateTime, fmtParams, fmtPrice, fmtUSD, timeAgo } from '../lib/format'
import { useStore } from '../store'
import { ApiSamples } from './ModelDetail'
import { hourlyCost } from './deploy/state'

const STATUS: Record<CustomModelStatus, { label: string; color: 'slate' | 'brand' | 'green' | 'amber' | 'rose' }> = {
  awaiting_upload: { label: 'Awaiting upload', color: 'slate' },
  queued: { label: 'Queued', color: 'amber' },
  building: { label: 'Building', color: 'brand' },
  live: { label: 'Live', color: 'green' },
  paused: { label: 'Paused', color: 'slate' },
  failed: { label: 'Failed', color: 'rose' },
}

export function StatusBadge({ s }: { s: CustomModelStatus }) {
  const v = STATUS[s]
  return (
    <Badge color={v.color}>
      {s === 'building' || s === 'queued' ? <Loader2 size={10} className="animate-spin" /> : s === 'live' ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
      {v.label}
    </Badge>
  )
}

function useTick(active: boolean, ms = 500) {
  const [, set] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => set((x) => x + 1), ms)
    return () => clearInterval(t)
  }, [active, ms])
}

export default function MyModels() {
  const models = useStore((s) => s.customModels)
  const username = useStore((s) => s.user?.username ?? 'me')
  useTick(models.some((m) => m.status === 'queued' || m.status === 'building'))
  return (
    <div>
      <PageHeader
        title="My models"
        description="Manage the custom models you’ve deployed."
        actions={
          <Link to="/deploy">
            <Button>
              <Plus size={16} /> New deployment
            </Button>
          </Link>
        }
      />
      {models.length === 0 ? (
        <Empty
          icon={<Boxes size={32} />}
          title="No models deployed yet"
          description="Deploy a GGUF or safetensors model from Hugging Face, ModelScope or the CLI."
          action={
            <Link to="/deploy">
              <Button>Deploy a model</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {models.map((m) => {
            const p = buildProgress(m)
            return (
              <Link key={m.id} to={`/my-models/${m.slug}`}>
                <Card className="p-4 transition-colors hover:border-line2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-raised text-fg2">
                      <Cpu size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{m.displayName}</span>
                        <StatusBadge s={m.status} />
                        {m.visibility === 'public' ? <Badge color="cyan">Public</Badge> : <Badge>Private</Badge>}
                        {m.newArchitecture && <Badge color="violet">Custom architecture</Badge>}
                      </div>
                      <div className="font-mono text-xs text-fg3">
                        {username}/{m.slug}
                      </div>
                    </div>
                    <div className="hidden text-right text-xs text-fg3 sm:block">
                      <div>
                        {m.format.toUpperCase()} · {m.architecture}
                      </div>
                      <div>
                        {m.gpuCount}x {m.gpu} · {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                  {(m.status === 'queued' || m.status === 'building') && (
                    <div className="mt-3">
                      <Progress value={p.progress} />
                      <div className="mt-1 text-xs text-fg3">
                        {p.phases[Math.min(p.phaseIndex, p.phases.length - 1)]?.label} · {Math.round(p.progress * 100)}%
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MyModelDetail() {
  const { slug } = useParams()
  const m = useStore((s) => s.customModels.find((x) => x.slug === slug))
  const username = useStore((s) => s.user?.username ?? 'me')
  const update = useStore((s) => s.updateCustomModel)
  const remove = useStore((s) => s.deleteCustomModel)
  const nav = useNavigate()
  const [tab, setTab] = useState<'overview' | 'logs' | 'api' | 'settings'>('overview')
  const [confirm, setConfirm] = useState(false)
  const building = !!m && (m.status === 'queued' || m.status === 'building')
  useTick(building)

  if (!m)
    return (
      <Empty
        title="Model not found"
        action={
          <Link to="/my-models">
            <Button variant="outline">My models</Button>
          </Link>
        }
      />
    )

  const full = `${username}/${m.slug}`
  const p = buildProgress(m)
  const logs = buildLogs(m)

  return (
    <div>
      <Link to="/my-models" className="mb-4 inline-flex items-center gap-1 text-sm text-fg3 hover:text-fg">
        <ArrowLeft size={14} /> My models
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-raised text-fg2">
          <Cpu size={24} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{m.displayName}</h1>
            <StatusBadge s={m.status} />
            {m.visibility === 'public' ? <Badge color="cyan">Public on marketplace</Badge> : <Badge>Private</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-sm text-fg3">
            {full} <CopyButton text={full} />
          </div>
          {m.description && <p className="mt-2 text-sm text-fg2">{m.description}</p>}
        </div>
        <div className="flex gap-2">
          {m.status === 'live' && (
            <>
              <Button variant="outline" onClick={() => update(m.id, { status: 'paused', pausedAt: Date.now() })}>
                <Pause size={16} /> Pause
              </Button>
              <Link to={`/chat?model=${encodeURIComponent(full)}`}>
                <Button>
                  <MessageSquare size={16} /> Try it
                </Button>
              </Link>
            </>
          )}
          {m.status === 'paused' && (
            <Button onClick={() => update(m.id, { status: 'live' })}>
              <Play size={16} /> Resume
            </Button>
          )}
        </div>
      </div>

      {building && (
        <Card className="mt-6 p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Deploying — {p.phases[Math.min(p.phaseIndex, p.phases.length - 1)]?.label}</span>
            <span className="text-fg3">{Math.round(p.progress * 100)}%</span>
          </div>
          <Progress value={p.progress} />
          <div className="mt-5 grid gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {p.phases.map((ph, i) => (
              <div key={ph.key} className={cx('flex items-center gap-1.5 text-xs', i < p.phaseIndex ? 'text-emerald-600 dark:text-emerald-400' : i === p.phaseIndex ? 'font-medium text-brand-600 dark:text-brand-300' : 'text-fg3')}>
                {i < p.phaseIndex ? <CheckCircle2 size={13} /> : i === p.phaseIndex ? <Loader2 size={13} className="animate-spin" /> : <Circle size={13} />}
                {ph.label}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs
        className="mt-8"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'logs', label: `Build logs (${logs.length})` },
          { id: 'api', label: 'API' },
          { id: 'settings', label: 'Settings' },
        ]}
      />
      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Status" value={STATUS[m.status].label} sub={m.status === 'live' ? `${m.minReplicas}–${m.maxReplicas} replicas` : undefined} />
              <Stat label="Hardware" value={`${m.gpuCount}x ${m.gpu}`} sub={`${fmtUSD(hourlyCost(m.gpu, m.gpuCount))}/hr per replica`} />
              <Stat label="Engine" value={m.engine} sub={m.format.toUpperCase() + (m.weightFile ? ` · ${m.weightFile}` : '')} />
              <Stat label="Pricing" value={m.visibility === 'public' ? `${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}` : 'Per GPU hour'} sub={m.visibility === 'public' ? 'input / output per M' : 'Private endpoint'} />
            </div>
            <Card className="divide-y divide-line text-sm">
              {(
                [
                  ['Source', m.source === 'cli' ? 'CLI upload' : `${m.source === 'huggingface' ? 'Hugging Face' : 'ModelScope'} · ${m.sourceRepo}${m.revision ? '@' + m.revision : ''}`],
                  ['Architecture', <span className="font-mono">{m.architecture}{m.newArchitecture ? ' (custom package)' : ''}</span>],
                  ...(m.customCode ? [['Inference code', m.customCode.kind === 'github' ? `${m.customCode.repo} @ ${m.customCode.ref ?? 'main'}` : `Local upload · ${m.customCode.files?.length ?? 0} files`]] : []),
                  ['Parameters', fmtParams(m.params)],
                  ['Weights size', m.sizeBytes ? fmtBytes(m.sizeBytes) : '—'],
                  ['dtype / quant', m.format === 'gguf' ? m.weightFile : `${m.dtype} / ${m.quantization}`],
                  ['Context', m.contextLength.toLocaleString()],
                  ['Chat template', m.chatTemplate],
                  ['Created', fmtDateTime(m.createdAt)],
                ] as [string, React.ReactNode][]
              ).map(([k, v]) => (
                <div key={k} className="flex gap-4 px-5 py-2.5">
                  <div className="w-32 shrink-0 text-fg3">{k}</div>
                  <div className="min-w-0 break-all">{v}</div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'logs' && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d0f]">
            <div className="max-h-[520px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
              {logs.map((l, i) => (
                <div key={i} className={cx(l.level === 'ok' ? 'text-emerald-400' : l.level === 'warn' ? 'text-amber-400' : 'text-slate-300')}>
                  <span className="mr-3 text-fg2">{new Date(l.t).toLocaleTimeString('en-GB', { hour12: false })}</span>
                  {l.line}
                </div>
              ))}
              {building && <span className="inline-block h-3.5 w-2 animate-blink bg-fg3" />}
            </div>
          </div>
        )}

        {tab === 'api' &&
          (m.status === 'live' ? (
            <ApiSamples slug={full} />
          ) : (
            <Card className="p-6 text-sm text-fg3">API examples will be available once the deployment is live.</Card>
          ))}

        {tab === 'settings' && (
          <div className="max-w-2xl space-y-4">
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {m.visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />} Visibility
                </div>
                <div className="text-sm text-fg3">{m.visibility === 'public' ? 'Anyone can call it from the marketplace' : 'Only callable with your API keys'}</div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const v = m.visibility === 'public' ? 'private' : 'public'
                  update(m.id, { visibility: v, price: v === 'public' && !m.price.output ? { input: 0.1, output: 0.4 } : m.price })
                  toast.ok(v === 'public' ? 'Published to the marketplace' : 'Made private')
                }}
              >
                <Settings2 size={15} /> {m.visibility === 'public' ? 'Make private' : 'Publish'}
              </Button>
            </Card>
            <Card className="flex items-center justify-between gap-4 border-rose-500/30 p-5">
              <div>
                <div className="font-medium text-rose-600 dark:text-rose-400">Delete model</div>
                <div className="text-sm text-fg3">Permanently deletes the endpoint and uploaded weights.</div>
              </div>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 size={15} /> Delete
              </Button>
            </Card>
          </div>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this model?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                remove(m.id)
                toast.ok('Model deleted')
                nav('/my-models')
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm">
          This permanently deletes <span className="font-mono">{full}</span>. This can’t be undone.
        </p>
      </Modal>
    </div>
  )
}
