import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Rocket } from 'lucide-react'
import { Badge, Button, Card, cx, toast } from '../../components/ui'
import { CUSTOM_ARCH } from '../../data/architectures'
import type { CustomModel, ImportSource } from '../../data/types'
import { fmtBytes, fmtNum, fmtParams, fmtPrice, fmtUSD } from '../../lib/format'
import { uid } from '../../lib/rand'
import { useStore } from '../../store'
import { ArchStep } from './ArchStep'
import { ConfigStep, selectedGgufSize } from './ConfigStep'
import { FormatStep } from './FormatStep'
import { SourceStep } from './SourceStep'
import { fitsGpu, hourlyCost, initialState, vramNeededGB, weightBytes, type WizardState } from './state'
import { safetensorsFiles } from '../../lib/hf'

const STEPS = ['소스', '가중치 포맷', '아키텍처', '배포 설정', '검토']

export default function DeployWizard() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const source = (sp.get('source') as ImportSource) || 'huggingface'
  const [s, setS] = useState<WizardState>(() => initialState(source, sp.get('repo') ?? ''))
  const [step, setStep] = useState(0)
  const existing = useStore((st) => st.customModels)
  const user = useStore((st) => st.user)
  const addCustomModel = useStore((st) => st.addCustomModel)

  const set = (p: Partial<WizardState> | ((x: WizardState) => Partial<WizardState>)) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) }))

  const need = vramNeededGB(s, s.format === 'gguf' ? selectedGgufSize(s) : undefined)
  const slugTaken = existing.some((m) => m.slug === s.slug)

  const canNext = [
    !!s.info,
    s.format === 'safetensors' ? safetensorsFiles(s.info?.files ?? []).length > 0 || s.resolvedVia === 'cli' : !!s.ggufQuant,
    !!s.arch && (s.arch !== CUSTOM_ARCH || (!!s.newArchName && s.code.checked)),
    !!s.slug && !slugTaken && fitsGpu(s.gpu, s.gpuCount, need),
    true,
  ][step]

  const blockReason = [
    '먼저 모델을 불러오세요',
    s.format === 'gguf' ? 'GGUF 양자화 파일을 선택하세요' : '이 리포지토리에 safetensors 파일이 없습니다',
    s.arch === CUSTOM_ARCH ? '새 아키텍처 이름과 추론 코드 검증이 필요합니다' : '아키텍처를 선택하세요',
    slugTaken ? '이미 사용 중인 모델 ID입니다' : !s.slug ? '모델 ID를 입력하세요' : 'VRAM이 부족합니다',
    '',
  ][step]

  const deploy = () => {
    if (!user) {
      toast.err('배포하려면 로그인하세요')
      nav('/signin')
      return
    }
    const gg = selectedGgufSize(s)
    const size = s.format === 'gguf' ? gg ?? weightBytes(s) : safetensorsFiles(s.info?.files ?? []).reduce((a, f) => a + (f.size ?? 0), 0) || weightBytes(s)
    const isNew = s.arch === CUSTOM_ARCH
    const m: CustomModel = {
      id: uid('cm_'),
      slug: s.slug,
      displayName: s.displayName || s.slug,
      description: s.description,
      source: s.source,
      sourceRepo: s.source === 'cli' ? undefined : s.repo,
      revision: s.revision || undefined,
      format: s.format,
      weightFile: s.format === 'gguf' ? s.ggufQuant : undefined,
      dtype: s.format === 'safetensors' ? s.dtype : undefined,
      quantization: s.format === 'safetensors' ? s.quantization : undefined,
      architecture: isNew ? s.newArchName : s.arch,
      newArchitecture: isNew,
      customCode: isNew
        ? { kind: s.code.kind, repo: s.code.repo || undefined, ref: s.code.ref || undefined, subdir: s.code.subdir || undefined, files: s.code.files.map(({ name, size }) => ({ name, size })), entrypoint: s.code.entrypoint, validated: s.code.checked }
        : undefined,
      engine: s.format === 'gguf' ? 'llama.cpp' : s.engine,
      gpu: s.gpu,
      gpuCount: s.gpuCount,
      minReplicas: s.minReplicas,
      maxReplicas: s.maxReplicas,
      scaleToZero: s.scaleToZero,
      contextLength: s.contextLength,
      chatTemplate: s.chatTemplate,
      visibility: s.visibility,
      price: s.visibility === 'public' ? { input: s.priceIn, output: s.priceOut } : { input: 0, output: 0 },
      params: s.info?.params ?? s.cliParamsB * 1e9,
      sizeBytes: size,
      createdAt: Date.now(),
      buildDuration: Math.round(22000 + Math.min(30000, size / 1e9 * 250) + (isNew ? 12000 : 0)),
      status: 'queued',
    }
    addCustomModel(m)
    toast.ok(`${m.displayName} 배포를 시작했습니다`)
    nav(`/my-models/${m.slug}`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/deploy" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-fg">
        <ArrowLeft size={14} /> 모델 업로드
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">새 모델 배포</h1>

      <ol className="mt-6 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              disabled={i > step}
              onClick={() => setStep(i)}
              className={cx(
                'flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
                i === step && 'border-fg/50 bg-raised font-medium text-fg',
                i < step && 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
                i > step && 'border-slate-200 text-slate-400 dark:border-white/10',
              )}
            >
              <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', i < step ? 'bg-fg text-bg' : i === step ? 'border border-fg text-fg' : 'border border-line2 text-fg3')}>
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-slate-300 dark:bg-white/15" />}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        {step === 0 && <SourceStep s={s} set={set} onLoaded={() => {}} />}
        {step === 1 && <FormatStep s={s} set={set} />}
        {step === 2 && <ArchStep s={s} set={set} />}
        {step === 3 && <ConfigStep s={s} set={set} />}
        {step === 4 && <Review s={s} need={need} />}
      </div>

      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/90 py-4 backdrop-blur dark:border-white/10 dark:bg-[#08090a]/90">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft size={16} /> 이전
        </Button>
        <div className="flex items-center gap-3">
          {!canNext && blockReason && <span className="hidden text-xs text-slate-500 sm:inline">{blockReason}</span>}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              다음 <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={deploy}>
              <Rocket size={16} /> 배포하기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Review({ s, need }: { s: WizardState; need: number }) {
  const username = useStore((st) => st.user?.username ?? 'me')
  const isNew = s.arch === CUSTOM_ARCH
  const hourly = hourlyCost(s.gpu, s.gpuCount)
  const rows: [string, React.ReactNode][] = [
    ['모델 ID', <span className="font-mono">{username}/{s.slug}</span>],
    ['소스', s.source === 'cli' ? 'CLI 업로드' : `${s.source === 'huggingface' ? 'Hugging Face' : 'ModelScope'} · ${s.repo}${s.revision ? `@${s.revision}` : ''}`],
    ['포맷', s.format === 'gguf' ? `GGUF · ${s.ggufQuant}` : `Safetensors · dtype ${s.dtype}${s.quantization !== 'none' ? ` → ${s.quantization.toUpperCase()}` : ''}`],
    ['가중치 크기', fmtBytes(s.format === 'gguf' ? selectedGgufSize(s) ?? weightBytes(s) : weightBytes(s))],
    ['파라미터', fmtParams(s.info?.params ?? s.cliParamsB * 1e9)],
    ['아키텍처', <span className="font-mono">{isNew ? s.newArchName : s.arch} {isNew && <Badge color="violet">커스텀 코드</Badge>}</span>],
    ...(isNew ? ([['추론 코드', s.code.kind === 'github' ? `${s.code.repo} (${s.code.ref || 'main'})${s.code.subdir ? ` /${s.code.subdir}` : ''}` : `로컬 ${s.code.files.length}개 파일`]] as [string, React.ReactNode][]) : []),
    ['엔진', s.format === 'gguf' ? 'llama.cpp' : s.engine],
    ['하드웨어', `${s.gpuCount}x ${s.gpu} · 필요 VRAM ~${need}GB`],
    ['오토스케일', `${s.minReplicas}–${s.maxReplicas} 레플리카${s.scaleToZero ? ' · scale to zero' : ''}`],
    ['컨텍스트', fmtNum(s.contextLength)],
    ['채팅 템플릿', s.chatTemplate],
    ['공개 범위', s.visibility === 'public' ? `마켓플레이스 공개 · ${fmtPrice(s.priceIn)}/${fmtPrice(s.priceOut)} per M` : '비공개'],
    ['예상 비용', `${fmtUSD(hourly)}/hr · 레플리카당`],
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="divide-y divide-slate-100 dark:divide-white/5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center">
            <div className="w-36 shrink-0 text-slate-500">{k}</div>
            <div className="min-w-0 break-all">{v}</div>
          </div>
        ))}
      </Card>
      <Card className="h-fit p-5 text-sm">
        <div className="font-semibold">배포 후 진행 과정</div>
        <ol className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
          <li>1. GPU 예약 및 가중치 {s.source === 'cli' ? '검증' : '다운로드'}</li>
          <li>2. 포맷·아키텍처·토크나이저 검증</li>
          {isNew && <li>3. 커스텀 추론 코드 빌드 & 스모크 테스트</li>}
          <li>{isNew ? 4 : 3}. 런타임 이미지 생성 및 GPU 로딩</li>
          <li>{isNew ? 5 : 4}. 헬스체크 후 엔드포인트 활성화</li>
        </ol>
        <p className="mt-4 text-xs text-slate-500">배포가 완료되면 채팅 플레이그라운드와 API에서 즉시 사용할 수 있습니다.</p>
      </Card>
    </div>
  )
}
