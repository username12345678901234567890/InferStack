import { CheckCircle2, FileBox, Info } from 'lucide-react'
import { Badge, Card, Label, Select, cx } from '../../components/ui'
import { groupGGUF, safetensorsFiles } from '../../lib/hf'
import { DTYPES, GGUF_QUANTS, SERVE_QUANTS } from '../../data/architectures'
import { fmtBytes } from '../../lib/format'
import type { Setter, WizardState } from './state'

export function FormatStep({ s, set }: { s: WizardState; set: Setter }) {
  const files = s.info?.files ?? []
  const ggufs = groupGGUF(files)
  const st = safetensorsFiles(files)
  const stSize = st.reduce((a, f) => a + (f.size ?? 0), 0)

  const options = [
    {
      id: 'safetensors' as const,
      title: 'Safetensors',
      desc: 'vLLM · SGLang · TensorRT-LLM 고처리량 서빙. 서빙 시 FP8/AWQ/GPTQ 양자화 선택 가능.',
      available: st.length > 0,
      meta: st.length ? `${st.length} shards · ${fmtBytes(stSize)}` : '이 리포지토리에 없음',
    },
    {
      id: 'gguf' as const,
      title: 'GGUF',
      desc: 'llama.cpp 런타임. 사전 양자화된 단일 파일로 적은 VRAM, 저비용 배포에 적합.',
      available: ggufs.length > 0,
      meta: ggufs.length ? `${ggufs.length}개 양자화 변형` : '이 리포지토리에 없음',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.id}
            disabled={!o.available}
            onClick={() => set({ format: o.id, engine: o.id === 'gguf' ? 'llama.cpp' : 'vLLM' })}
            className={cx(
              'rounded-xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              s.format === o.id ? 'border-fg/50 bg-raised ring-1 ring-fg/15' : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
            )}
          >
            <div className="flex items-center gap-2">
              <FileBox size={18} className={s.format === o.id ? 'text-fg' : 'text-slate-400'} />
              <span className="font-semibold">{o.title}</span>
              {s.format === o.id && <CheckCircle2 size={16} className="ml-auto text-fg" />}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{o.desc}</p>
            <div className="mt-3 text-xs text-slate-500">{o.meta}</div>
          </button>
        ))}
      </div>

      {s.format === 'gguf' && ggufs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">양자화 파일 선택</div>
          <div className="max-h-96 overflow-y-auto">
            {ggufs.map((g) => {
              const bpw = GGUF_QUANTS[g.quant.replace(/^UD-/, '')]
              const rec = g.quant === 'Q4_K_M' || g.quant === 'UD-Q4_K_XL'
              return (
                <label key={g.quant} className={cx('flex cursor-pointer items-center gap-3 border-b border-slate-100 px-5 py-2.5 text-sm last:border-0 dark:border-white/5', s.ggufQuant === g.quant ? 'bg-brand-500/5' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]')}>
                  <input type="radio" name="quant" checked={s.ggufQuant === g.quant} onChange={() => set({ ggufQuant: g.quant })} className="accent-fg" />
                  <span className="w-28 font-mono font-medium">{g.quant}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-500">{g.label}</span>
                  {rec && <Badge color="green">추천</Badge>}
                  {bpw && <span className="w-20 text-right text-xs text-slate-500">~{bpw} bpw</span>}
                  <span className="w-24 text-right text-xs">{g.size ? fmtBytes(g.size) : '—'}</span>
                </label>
              )
            })}
          </div>
        </Card>
      )}

      {s.format === 'safetensors' && (
        <Card className="grid gap-5 p-5 md:grid-cols-2">
          <div>
            <Label>가중치 dtype</Label>
            <Select value={s.dtype} onChange={(e) => set({ dtype: e.target.value })}>
              {DTYPES.map((d) => (
                <option key={d} value={d}>
                  {d === 'auto' ? 'auto (config.json의 torch_dtype 사용)' : d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>서빙 양자화</Label>
            <Select value={s.quantization} onChange={(e) => set({ quantization: e.target.value })}>
              {SERVE_QUANTS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-400 md:col-span-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            양자화를 선택하면 배포 시 InferStack이 자동으로 변환합니다. FP8은 품질 손실이 거의 없고 VRAM을 절반으로 줄입니다. NVFP4는 B200 GPU에서만 사용 가능합니다.
          </div>
        </Card>
      )}
    </div>
  )
}
