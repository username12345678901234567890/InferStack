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

const STEPS = ['Source', 'Weights', 'Architecture', 'Configure', 'Review']

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
'Import a model first',
    s.format === 'gguf' ? 'Select a GGUF quant file' : 'No safetensors files in this repository',
    s.arch === CUSTOM_ARCH ? 'Enter an architecture name and validate the inference code' : 'Select an architecture',
    slugTaken ? 'Model ID is already taken' : !s.slug ? 'Enter a model ID' : 'Not enough VRAM',
'',
  ][step]

  const deploy = () => {
    if (!user) {
      toast.err('Sign in to deploy')
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
    toast.ok(`Deploying ${m.displayName}`)
    nav(`/my-models/${m.slug}`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/deploy" className="mb-4 inline-flex items-center gap-1 text-sm text-fg3 hover:text-fg">
        <ArrowLeft size={14} /> Deploy
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New deployment</h1>

      <ol className="mt-6 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              disabled={i > step}
              onClick={() => setStep(i)}
              className={cx(
'flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
                i === step && 'border-accent/60 bg-accent/[0.05] font-medium text-fg',
                i < step && 'border-line2 text-fg2 hover:text-fg',
                i > step && 'border-line text-fg3 ',
              )}
            >
              <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', i < step ? 'bg-brand text-on-brand' : i === step ? 'border border-accent text-accent' : 'border border-line2 text-fg3')}>
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-line2" />}
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

      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 border-t border-line bg-bg/90 py-4 backdrop-blur">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex items-center gap-3">
          {!canNext && blockReason && <span className="hidden text-xs text-fg3 sm:inline">{blockReason}</span>}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={deploy}>
              <Rocket size={16} /> Deploy
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
    ['Model ID', <span className="font-mono">{username}/{s.slug}</span>],
    ['Source', s.source === 'cli' ? 'CLI upload' : `${s.source === 'huggingface' ? 'Hugging Face' : 'ModelScope'} · ${s.repo}${s.revision ? `@${s.revision}` : ''}`],
    ['Format', s.format === 'gguf' ? `GGUF · ${s.ggufQuant}` : `Safetensors · dtype ${s.dtype}${s.quantization !== 'none' ? ` → ${s.quantization.toUpperCase()}` : ''}`],
    ['Weights size', fmtBytes(s.format === 'gguf' ? selectedGgufSize(s) ?? weightBytes(s) : weightBytes(s))],
    ['Parameters', fmtParams(s.info?.params ?? s.cliParamsB * 1e9)],
    ['Architecture', <span className="font-mono">{isNew ? s.newArchName : s.arch} {isNew && <Badge color="violet">Custom code</Badge>}</span>],
    ...(isNew ? ([['Inference code', s.code.kind === 'github' ? `${s.code.repo} (${s.code.ref || 'main'})${s.code.subdir ? ` /${s.code.subdir}` : ''}` : `${s.code.files.length} local files`]] as [string, React.ReactNode][]) : []),
    ['Engine', s.format === 'gguf' ? 'llama.cpp' : s.engine],
    ['Hardware', `${s.gpuCount}x ${s.gpu} · ~${need} GB VRAM required`],
    ['Autoscaling', `${s.minReplicas}–${s.maxReplicas} replicas${s.scaleToZero ? ' · scale to zero' : ''}`],
    ['Context', fmtNum(s.contextLength)],
    ['Chat template', s.chatTemplate],
    ['Visibility', s.visibility === 'public' ? `Public on marketplace · ${fmtPrice(s.priceIn)}/${fmtPrice(s.priceOut)} per M` : 'Private'],
    ['Estimated cost', `${fmtUSD(hourly)}/hr per replica`],
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center">
            <div className="w-36 shrink-0 text-fg3">{k}</div>
            <div className="min-w-0 break-all">{v}</div>
          </div>
        ))}
      </Card>
      <Card className="h-fit p-5 text-sm">
        <div className="font-semibold">What happens next</div>
        <ol className="mt-3 space-y-2 text-fg2">
          <li>1. Reserve GPUs and {s.source === 'cli' ? 'verify' : 'download'} weights</li>
          <li>2. Validate format, architecture and tokenizer</li>
          {isNew && <li>3. Build custom inference code and run smoke tests</li>}
          <li>{isNew ? 4 : 3}. Build runtime image and load onto GPUs</li>
          <li>{isNew ? 5 : 4}. Health check, then activate the endpoint</li>
        </ol>
        <p className="mt-4 text-xs text-fg3">Once live, your model is available in the chat playground and via the API.</p>
      </Card>
    </div>
  )
}
