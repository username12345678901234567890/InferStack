import type { CustomModel } from '../data/types'
import { fmtBytes } from './format'

export interface BuildPhase {
  key: string
  label: string
  weight: number
}

export function phasesFor(m: CustomModel): BuildPhase[] {
  const p: BuildPhase[] = [
    { key: 'queue', label: '대기열', weight: 0.05 },
    { key: 'pull', label: m.source === 'cli' ? '업로드 검증' : '가중치 다운로드', weight: 0.3 },
    { key: 'validate', label: '포맷·아키텍처 검증', weight: 0.1 },
  ]
  if (m.newArchitecture) p.push({ key: 'code', label: '커스텀 추론 코드 빌드', weight: 0.2 })
  if (m.quantization && m.quantization !== 'none') p.push({ key: 'quant', label: '양자화 변환', weight: 0.12 })
  p.push(
    { key: 'image', label: '런타임 이미지 생성', weight: 0.1 },
    { key: 'load', label: 'GPU 로딩', weight: 0.15 },
    { key: 'health', label: '헬스체크', weight: 0.05 },
  )
  const total = p.reduce((s, x) => s + x.weight, 0)
  return p.map((x) => ({ ...x, weight: x.weight / total }))
}

export function buildProgress(m: CustomModel, now = Date.now()) {
  const phases = phasesFor(m)
  if (m.status === 'awaiting_upload') return { phases, progress: 0, phaseIndex: -1, done: false }
  const elapsed = now - m.createdAt
  const progress = Math.min(1, elapsed / m.buildDuration)
  let acc = 0
  let phaseIndex = phases.length - 1
  for (let i = 0; i < phases.length; i++) {
    if (progress < acc + phases[i].weight) {
      phaseIndex = i
      break
    }
    acc += phases[i].weight
  }
  return { phases, progress, phaseIndex: progress >= 1 ? phases.length : phaseIndex, done: progress >= 1 }
}

export function buildLogs(m: CustomModel, now = Date.now()): { t: number; line: string; level?: 'info' | 'ok' | 'warn' }[] {
  const { phases, progress } = buildProgress(m, now)
  const lines: { at: number; line: string; level?: 'info' | 'ok' | 'warn' }[] = []
  let acc = 0
  const size = m.sizeBytes ?? 0
  for (const ph of phases) {
    const s = acc
    const step = (f: number) => s + ph.weight * f
    switch (ph.key) {
      case 'queue':
        lines.push({ at: 0, line: `job ${m.id} accepted — region=ap-seoul-1 gpu=${m.gpuCount}x${m.gpu}` })
        lines.push({ at: step(0.6), line: `scheduler: reserved ${m.gpuCount}x ${m.gpu} (spot=false)` })
        break
      case 'pull':
        if (m.source === 'cli') {
          lines.push({ at: step(0.05), line: `cli upload session verified (${m.weightFile ?? 'weights'})` })
        } else {
          lines.push({ at: step(0.05), line: `fetching ${m.source === 'huggingface' ? 'hf://' : 'modelscope://'}${m.sourceRepo}@${m.revision || 'main'}` })
        }
        for (const f of [0.25, 0.5, 0.75, 1]) lines.push({ at: step(f), line: `  ↳ ${fmtBytes(size * f)} / ${fmtBytes(size)} (${Math.round(f * 100)}%)` })
        lines.push({ at: step(1), line: 'sha256 checksums verified', level: 'ok' })
        break
      case 'validate':
        lines.push({ at: step(0.2), line: `format=${m.format}${m.weightFile ? ` file=${m.weightFile}` : ''} dtype=${m.dtype ?? 'auto'}` })
        lines.push({ at: step(0.6), line: `architecture=${m.architecture}${m.newArchitecture ? ' (custom package)' : ' (built-in)'}` })
        lines.push({ at: step(0.95), line: 'tokenizer & chat template OK', level: 'ok' })
        break
      case 'code':
        lines.push({ at: step(0.1), line: m.customCode?.kind === 'github' ? `git clone ${m.customCode.repo} --branch ${m.customCode.ref || 'main'}` : `unpacking local package (${m.customCode?.files?.length ?? 0} files)` })
        lines.push({ at: step(0.35), line: 'parsing inferstack.yaml → apiVersion inferstack.dev/v1' })
        lines.push({ at: step(0.55), line: 'pip install -r requirements.txt' })
        lines.push({ at: step(0.8), line: `registering ${m.architecture} → ${m.customCode?.entrypoint ?? 'model.py'}` })
        lines.push({ at: step(0.98), line: 'tests/test_smoke.py ... passed', level: 'ok' })
        break
      case 'quant':
        lines.push({ at: step(0.2), line: `quantizing weights → ${m.quantization?.toUpperCase()}` })
        lines.push({ at: step(0.95), line: 'quantization complete, calibration ppl Δ +0.8%', level: 'ok' })
        break
      case 'image':
        lines.push({ at: step(0.2), line: `building runtime image engine=${m.engine}` })
        lines.push({ at: step(0.9), line: 'image pushed registry.inferstack.dev/runtime@sha256:9f2c…', level: 'ok' })
        break
      case 'load':
        lines.push({ at: step(0.1), line: `loading weights on ${m.gpuCount}x ${m.gpu} (tp=${m.gpuCount})` })
        lines.push({ at: step(0.6), line: `KV cache allocated, max_model_len=${m.contextLength}` })
        lines.push({ at: step(0.9), line: 'CUDA graphs captured', level: 'ok' })
        break
      case 'health':
        lines.push({ at: step(0.3), line: 'POST /v1/chat/completions (healthcheck) → 200 OK' })
        lines.push({ at: step(1), line: `✔ ${m.slug} is live`, level: 'ok' })
        break
    }
    acc += ph.weight
  }
  return lines.filter((l) => l.at <= progress + 1e-9).map((l) => ({ t: m.createdAt + l.at * m.buildDuration, line: l.line, level: l.level }))
}
