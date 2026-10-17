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
      desc: 'High-throughput serving on vLLM, SGLang or TensorRT-LLM. Optional FP8/AWQ/GPTQ quantization at serve time.',
      available: st.length > 0,
      meta: st.length ? `${st.length} shards · ${fmtBytes(stSize)}` : 'Not in this repository',
    },
    {
      id: 'gguf' as const,
      title: 'GGUF',
      desc: 'llama.cpp runtime. Pre-quantized single files for low-VRAM, low-cost deployments.',
      available: ggufs.length > 0,
      meta: ggufs.length ? `${ggufs.length} quant variants` : 'Not in this repository',
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
'rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              s.format === o.id ? 'border-fg/50 bg-raised ring-1 ring-fg/15' : 'border-line hover:border-line2',
            )}
          >
            <div className="flex items-center gap-2">
              <FileBox size={18} className={s.format === o.id ? 'text-fg' : 'text-fg3'} />
              <span className="font-semibold">{o.title}</span>
              {s.format === o.id && <CheckCircle2 size={16} className="ml-auto text-fg" />}
            </div>
            <p className="mt-2 text-sm text-fg2">{o.desc}</p>
            <div className="mt-3 text-xs text-fg3">{o.meta}</div>
          </button>
        ))}
      </div>

      {s.format === 'gguf' && ggufs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-sm font-semibold">Select a quant</div>
          <div className="max-h-96 overflow-y-auto">
            {ggufs.map((g) => {
              const bpw = GGUF_QUANTS[g.quant.replace(/^UD-/, '')]
              const rec = g.quant === 'Q4_K_M' || g.quant === 'UD-Q4_K_XL'
              return (
                <label key={g.quant} className={cx('flex cursor-pointer items-center gap-3 border-b border-line px-5 py-2.5 text-sm last:border-0 ', s.ggufQuant === g.quant ? 'bg-brand-500/5' : 'hover:bg-raised/60')}>
                  <input type="radio" name="quant" checked={s.ggufQuant === g.quant} onChange={() => set({ ggufQuant: g.quant })} className="accent-fg" />
                  <span className="w-28 font-mono font-medium">{g.quant}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg3">{g.label}</span>
                  {rec && <Badge color="green">Recommended</Badge>}
                  {bpw && <span className="w-20 text-right text-xs text-fg3">~{bpw} bpw</span>}
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
            <Label>Weights dtype</Label>
            <Select value={s.dtype} onChange={(e) => set({ dtype: e.target.value })}>
              {DTYPES.map((d) => (
                <option key={d} value={d}>
                  {d === 'auto' ? 'auto (use torch_dtype from config.json)' : d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Serving quantization</Label>
            <Select value={s.quantization} onChange={(e) => set({ quantization: e.target.value })}>
              {SERVE_QUANTS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 rounded-lg bg-raised p-3 text-xs text-fg2 md:col-span-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            InferStack quantizes the weights automatically at deploy time. FP8 halves VRAM with near-zero quality loss. NVFP4 is available on B200 GPUs only.
          </div>
        </Card>
      )}
    </div>
  )
}
