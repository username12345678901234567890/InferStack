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
  awaiting_upload: { label: '업로드 대기', color: 'slate' },
  queued: { label: '대기열', color: 'amber' },
  building: { label: '빌드 중', color: 'brand' },
  live: { label: 'Live', color: 'green' },
  paused: { label: '일시정지', color: 'slate' },
  failed: { label: '실패', color: 'rose' },
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
        title="내 모델"
        description="업로드·배포한 커스텀 모델을 관리합니다."
        actions={
          <Link to="/deploy">
            <Button>
              <Plus size={16} /> 새 모델
            </Button>
          </Link>
        }
      />
      {models.length === 0 ? (
        <Empty
          icon={<Boxes size={32} />}
          title="아직 배포한 모델이 없습니다"
          description="Hugging Face, ModelScope 또는 CLI로 GGUF/Safetensors 모델을 업로드해 보세요."
          action={
            <Link to="/deploy">
              <Button>모델 업로드</Button>
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-fg2">
                      <Cpu size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{m.displayName}</span>
                        <StatusBadge s={m.status} />
                        {m.visibility === 'public' ? <Badge color="cyan">공개</Badge> : <Badge>비공개</Badge>}
                        {m.newArchitecture && <Badge color="violet">커스텀 아키텍처</Badge>}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {username}/{m.slug}
                      </div>
                    </div>
                    <div className="hidden text-right text-xs text-slate-500 sm:block">
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
                      <div className="mt-1 text-xs text-slate-500">
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
        title="모델을 찾을 수 없습니다"
        action={
          <Link to="/my-models">
            <Button variant="outline">내 모델</Button>
          </Link>
        }
      />
    )

  const full = `${username}/${m.slug}`
  const p = buildProgress(m)
  const logs = buildLogs(m)

  return (
    <div>
      <Link to="/my-models" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-fg">
        <ArrowLeft size={14} /> 내 모델
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-raised text-fg2">
          <Cpu size={24} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{m.displayName}</h1>
            <StatusBadge s={m.status} />
            {m.visibility === 'public' ? <Badge color="cyan">마켓플레이스 공개</Badge> : <Badge>비공개</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-sm text-slate-500">
            {full} <CopyButton text={full} />
          </div>
          {m.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>}
        </div>
        <div className="flex gap-2">
          {m.status === 'live' && (
            <>
              <Button variant="outline" onClick={() => update(m.id, { status: 'paused', pausedAt: Date.now() })}>
                <Pause size={16} /> 일시정지
              </Button>
              <Link to={`/chat?model=${encodeURIComponent(full)}`}>
                <Button>
                  <MessageSquare size={16} /> 테스트
                </Button>
              </Link>
            </>
          )}
          {m.status === 'paused' && (
            <Button onClick={() => update(m.id, { status: 'live' })}>
              <Play size={16} /> 재개
            </Button>
          )}
        </div>
      </div>

      {building && (
        <Card className="mt-6 p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">배포 진행 중 — {p.phases[Math.min(p.phaseIndex, p.phases.length - 1)]?.label}</span>
            <span className="text-slate-500">{Math.round(p.progress * 100)}%</span>
          </div>
          <Progress value={p.progress} />
          <div className="mt-4 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {p.phases.map((ph, i) => (
              <div key={ph.key} className={cx('flex items-center gap-1.5 text-xs', i < p.phaseIndex ? 'text-emerald-600 dark:text-emerald-400' : i === p.phaseIndex ? 'font-medium text-brand-600 dark:text-brand-300' : 'text-slate-400')}>
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
          { id: 'overview', label: '개요' },
          { id: 'logs', label: `빌드 로그 (${logs.length})` },
          { id: 'api', label: 'API' },
          { id: 'settings', label: '설정' },
        ]}
      />
      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="상태" value={STATUS[m.status].label} sub={m.status === 'live' ? `${m.minReplicas}–${m.maxReplicas} 레플리카` : undefined} />
              <Stat label="하드웨어" value={`${m.gpuCount}x ${m.gpu}`} sub={`${fmtUSD(hourlyCost(m.gpu, m.gpuCount))}/hr · 레플리카당`} />
              <Stat label="엔진" value={m.engine} sub={m.format.toUpperCase() + (m.weightFile ? ` · ${m.weightFile}` : '')} />
              <Stat label="가격" value={m.visibility === 'public' ? `${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}` : 'GPU 시간 과금'} sub={m.visibility === 'public' ? '입력 / 출력 per M' : '비공개 엔드포인트'} />
            </div>
            <Card className="divide-y divide-slate-100 text-sm dark:divide-white/5">
              {(
                [
                  ['소스', m.source === 'cli' ? 'CLI 업로드' : `${m.source === 'huggingface' ? 'Hugging Face' : 'ModelScope'} · ${m.sourceRepo}${m.revision ? '@' + m.revision : ''}`],
                  ['아키텍처', <span className="font-mono">{m.architecture}{m.newArchitecture ? ' (커스텀 패키지)' : ''}</span>],
                  ...(m.customCode ? [['추론 코드', m.customCode.kind === 'github' ? `${m.customCode.repo} @ ${m.customCode.ref ?? 'main'}` : `로컬 업로드 · ${m.customCode.files?.length ?? 0}개 파일`]] : []),
                  ['파라미터', fmtParams(m.params)],
                  ['가중치 크기', m.sizeBytes ? fmtBytes(m.sizeBytes) : '—'],
                  ['dtype / 양자화', m.format === 'gguf' ? m.weightFile : `${m.dtype} / ${m.quantization}`],
                  ['컨텍스트', m.contextLength.toLocaleString()],
                  ['채팅 템플릿', m.chatTemplate],
                  ['생성', fmtDateTime(m.createdAt)],
                ] as [string, React.ReactNode][]
              ).map(([k, v]) => (
                <div key={k} className="flex gap-4 px-5 py-2.5">
                  <div className="w-32 shrink-0 text-slate-500">{k}</div>
                  <div className="min-w-0 break-all">{v}</div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'logs' && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c0d0f]">
            <div className="max-h-[520px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
              {logs.map((l, i) => (
                <div key={i} className={cx(l.level === 'ok' ? 'text-emerald-400' : l.level === 'warn' ? 'text-amber-400' : 'text-slate-300')}>
                  <span className="mr-3 text-slate-600">{new Date(l.t).toLocaleTimeString('ko-KR', { hour12: false })}</span>
                  {l.line}
                </div>
              ))}
              {building && <span className="inline-block h-3.5 w-2 animate-blink bg-slate-400" />}
            </div>
          </div>
        )}

        {tab === 'api' &&
          (m.status === 'live' ? (
            <ApiSamples slug={full} />
          ) : (
            <Card className="p-6 text-sm text-slate-500">배포가 완료되면 API 예제가 활성화됩니다.</Card>
          ))}

        {tab === 'settings' && (
          <div className="max-w-2xl space-y-4">
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {m.visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />} 공개 범위
                </div>
                <div className="text-sm text-slate-500">{m.visibility === 'public' ? '모든 사용자가 마켓플레이스에서 호출할 수 있습니다' : '내 API 키로만 호출할 수 있습니다'}</div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const v = m.visibility === 'public' ? 'private' : 'public'
                  update(m.id, { visibility: v, price: v === 'public' && !m.price.output ? { input: 0.1, output: 0.4 } : m.price })
                  toast.ok(v === 'public' ? '마켓플레이스에 공개했습니다' : '비공개로 전환했습니다')
                }}
              >
                <Settings2 size={15} /> {m.visibility === 'public' ? '비공개로 전환' : '공개하기'}
              </Button>
            </Card>
            <Card className="flex items-center justify-between gap-4 border-rose-500/30 p-5">
              <div>
                <div className="font-medium text-rose-600 dark:text-rose-400">모델 삭제</div>
                <div className="text-sm text-slate-500">엔드포인트와 업로드된 가중치가 영구 삭제됩니다.</div>
              </div>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 size={15} /> 삭제
              </Button>
            </Card>
          </div>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="모델을 삭제할까요?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                remove(m.id)
                toast.ok('삭제했습니다')
                nav('/my-models')
              }}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm">
          <span className="font-mono">{full}</span> 를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
      </Modal>
    </div>
  )
}
