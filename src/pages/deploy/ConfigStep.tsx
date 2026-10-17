import { AlertTriangle, CheckCircle2, Globe, Lock, Wand2 } from 'lucide-react'
import { Button, Card, Input, Label, Select, Textarea, Toggle, cx } from '../../components/ui'
import { GPUS } from '../../data/architectures'
import { fmtNum, fmtUSD, slugify } from '../../lib/format'
import { groupGGUF } from '../../lib/hf'
import { fitsGpu, hourlyCost, recommendGpu, vramNeededGB, type Setter, type WizardState } from './state'
import { useStore } from '../../store'

export function selectedGgufSize(s: WizardState) {
  return groupGGUF(s.info?.files ?? []).find((g) => g.quant === s.ggufQuant)?.size
}

export function ConfigStep({ s, set }: { s: WizardState; set: Setter }) {
  const username = useStore((st) => st.user?.username ?? 'me')
  const need = vramNeededGB(s, s.format === 'gguf' ? selectedGgufSize(s) : undefined)
  const rec = recommendGpu(need)
  const fits = fitsGpu(s.gpu, s.gpuCount, need)
  const hourly = hourlyCost(s.gpu, s.gpuCount)
  const maxCtx = s.info?.contextLength ?? 131072
  const suggested = suggestPrice(s, hourly)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Basics</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input value={s.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder="My Fine-tuned Model" />
            </div>
            <div>
              <Label>Model ID</Label>
              <div className="flex items-center rounded-xl border border-line2 bg-raised pl-3 text-sm">
                <span className="font-mono text-fg3">{username}/</span>
                <input value={s.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} className="h-10 flex-1 bg-transparent pr-3 font-mono outline-none" />
              </div>
            </div>
          </div>
          <div>
            <Label hint="optional">Description</Label>
            <Textarea rows={2} value={s.description} onChange={(e) => set({ description: e.target.value })} placeholder="What it’s good at, training data, usage caveats…" />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Hardware</div>
            <Button size="sm" variant="ghost" onClick={() => set({ gpu: rec.gpu, gpuCount: rec.count })}>
              <Wand2 size={14} /> Use recommended ({rec.count}x {rec.gpu})
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {GPUS.map((g) => {
              const ok = g.vram * s.gpuCount * 0.92 >= need
              return (
                <button
                  key={g.id}
                  onClick={() => set({ gpu: g.id })}
                  className={cx(
'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    s.gpu === g.id ? 'border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20' : 'border-line hover:border-line2',
                  )}
                >
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-fg3">
                      {g.vram} GB · ${g.price.toFixed(2)}/hr
                    </div>
                  </div>
                  {!ok ? <span className="text-[11px] text-fg3">Not enough VRAM</span> : s.gpu === g.id ? <CheckCircle2 size={15} className="text-fg" /> : null}
                </button>
              )
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>GPUs (TP)</Label>
              <Select value={s.gpuCount} onChange={(e) => set({ gpuCount: +e.target.value })}>
                {[1, 2, 4, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Min replicas</Label>
              <Input type="number" min={0} max={s.maxReplicas} value={s.minReplicas} onChange={(e) => set({ minReplicas: Math.max(0, +e.target.value), scaleToZero: +e.target.value === 0 })} />
            </div>
            <div>
              <Label>Max replicas</Label>
              <Input type="number" min={Math.max(1, s.minReplicas)} max={32} value={s.maxReplicas} onChange={(e) => set({ maxReplicas: Math.max(1, +e.target.value) })} />
            </div>
          </div>
          <Toggle
            checked={s.scaleToZero}
            onChange={(v) => set({ scaleToZero: v, minReplicas: v ? 0 : Math.max(1, s.minReplicas) })}
            label="Scale to zero"
            description="Scale to 0 replicas after 15 minutes without requests to save cost (adds cold starts)"
          />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Inference</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label hint={`up to ${fmtNum(maxCtx)}`}>Max context length</Label>
              <Select value={s.contextLength} onChange={(e) => set({ contextLength: +e.target.value })}>
                {[4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
                  .filter((c) => c <= Math.max(maxCtx, 4096))
                  .map((c) => (
                    <option key={c} value={c}>
                      {fmtNum(c)}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label>Chat template</Label>
              <Select value={s.chatTemplate} onChange={(e) => set({ chatTemplate: e.target.value })}>
                <option value="auto">Auto (tokenizer_config / GGUF metadata)</option>
                <option value="chatml">ChatML</option>
                <option value="llama3">Llama 3</option>
                <option value="gemma">Gemma</option>
                <option value="mistral">Mistral [INST]</option>
                <option value="none">None (completions only)</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Visibility & pricing</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: 'private' as const, icon: Lock, title: 'Private', desc: 'Only callable with your API keys. Billed per GPU hour.' },
              { id: 'public' as const, icon: Globe, title: 'Public on marketplace', desc: 'Anyone can call it. You earn 80% of token revenue.' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => set({ visibility: o.id })}
                className={cx('rounded-xl border p-3 text-left text-sm', s.visibility === o.id ? 'border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20' : 'border-line')}
              >
                <div className="flex items-center gap-2 font-medium">
                  <o.icon size={15} /> {o.title}
                </div>
                <div className="mt-1 text-xs text-fg3">{o.desc}</div>
              </button>
            ))}
          </div>
          {s.visibility === 'public' && (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <Label>Input price ($/1M)</Label>
                <Input type="number" step={0.01} min={0} value={s.priceIn} onChange={(e) => set({ priceIn: Math.max(0, +e.target.value) })} />
              </div>
              <div>
                <Label>Output price ($/1M)</Label>
                <Input type="number" step={0.01} min={0} value={s.priceOut} onChange={(e) => set({ priceOut: Math.max(0, +e.target.value) })} />
              </div>
              <Button variant="outline" onClick={() => set({ priceIn: suggested.in, priceOut: suggested.out })}>
                <Wand2 size={14} /> Suggest price
              </Button>
              <div className="text-xs text-fg3 md:col-span-3">
                Suggested ${suggested.in}/${suggested.out}, based on similar-size catalog models and expected throughput. Break-even ≈ {fmtNum(Math.round((hourly / Math.max(0.01, s.priceOut * 0.8)) * 1e6 / 3600))} output tokens/s
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-5">
          <div className="text-sm font-semibold">Resource estimate</div>
          <div className="mt-4 space-y-3 text-sm">
            <Row k="VRAM required" v={`~${need} GB`} />
            <Row k="Selected" v={`${s.gpuCount}x ${s.gpu} (${(GPUS.find((g) => g.id === s.gpu)?.vram ?? 0) * s.gpuCount} GB)`} />
            <Row k="Recommended" v={`${rec.count}x ${rec.gpu}`} />
          </div>
          <div className={cx('mt-4 flex items-start gap-2 rounded-lg p-3 text-xs', fits ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300')}>
            {fits ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            {fits ? 'The model and KV cache fit on the selected hardware.' : 'Not enough VRAM. Add GPUs or apply quantization.'}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold">Estimated cost</div>
          <div className="mt-3 text-3xl font-bold tracking-tight">
            {fmtUSD(hourly)}
            <span className="text-sm font-normal text-fg3">/hr per replica</span>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Baseline cost" v={s.minReplicas === 0 ? '$0 (scale to zero)' : `${fmtUSD(hourly * s.minReplicas * 24 * 30, 0)}/mo`} />
            <Row k="At peak" v={`${fmtUSD(hourly * s.maxReplicas)}/hr`} />
          </div>
          <p className="mt-3 text-[11px] text-fg3">Billed per second. Nothing is charged in this demo.</p>
        </Card>
      </div>
    </div>
  )
}

function suggestPrice(s: WizardState, hourly: number) {
  const params = (s.info?.params ?? s.cliParamsB * 1e9) / 1e9
  const base = Math.max(0.02, +(0.012 * Math.pow(params, 0.75)).toFixed(2))
  const fromHw = +(hourly / 3600 / 400 * 1e6 * 0.25).toFixed(2)
  const out = +Math.max(base * 3, fromHw).toFixed(2)
  return { in: +(out / 4).toFixed(2), out }
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-fg3">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  )
}
