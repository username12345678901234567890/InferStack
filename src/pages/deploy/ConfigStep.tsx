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
          <div className="text-sm font-semibold">기본 정보</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>표시 이름</Label>
              <Input value={s.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder="My Fine-tuned Model" />
            </div>
            <div>
              <Label>모델 ID</Label>
              <div className="flex items-center rounded-lg border border-line2 bg-raised pl-3 text-sm">
                <span className="font-mono text-fg3">{username}/</span>
                <input value={s.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} className="h-10 flex-1 bg-transparent pr-3 font-mono outline-none" />
              </div>
            </div>
          </div>
          <div>
            <Label hint="선택">설명</Label>
            <Textarea rows={2} value={s.description} onChange={(e) => set({ description: e.target.value })} placeholder="이 모델이 잘하는 일, 학습 데이터, 사용 시 주의사항 등" />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">하드웨어</div>
            <Button size="sm" variant="ghost" onClick={() => set({ gpu: rec.gpu, gpuCount: rec.count })}>
              <Wand2 size={14} /> 추천 적용 ({rec.count}x {rec.gpu})
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
'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                    s.gpu === g.id ? 'border-fg/50 bg-raised ring-1 ring-fg/15' : 'border-line hover:border-line2',
                  )}
                >
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-fg3">
                      {g.vram}GB · ${g.price.toFixed(2)}/hr
                    </div>
                  </div>
                  {ok ? <CheckCircle2 size={15} className="text-emerald-500" /> : <span className="text-[11px] text-fg3">VRAM 부족</span>}
                </button>
              )
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>GPU 수 (TP)</Label>
              <Select value={s.gpuCount} onChange={(e) => set({ gpuCount: +e.target.value })}>
                {[1, 2, 4, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>최소 레플리카</Label>
              <Input type="number" min={0} max={s.maxReplicas} value={s.minReplicas} onChange={(e) => set({ minReplicas: Math.max(0, +e.target.value), scaleToZero: +e.target.value === 0 })} />
            </div>
            <div>
              <Label>최대 레플리카</Label>
              <Input type="number" min={Math.max(1, s.minReplicas)} max={32} value={s.maxReplicas} onChange={(e) => set({ maxReplicas: Math.max(1, +e.target.value) })} />
            </div>
          </div>
          <Toggle
            checked={s.scaleToZero}
            onChange={(v) => set({ scaleToZero: v, minReplicas: v ? 0 : Math.max(1, s.minReplicas) })}
            label="Scale to zero"
            description="요청이 없으면 15분 후 레플리카를 0으로 줄여 비용을 절감합니다 (콜드스타트 발생)"
          />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">추론 설정</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label hint={`최대 ${fmtNum(maxCtx)}`}>최대 컨텍스트 길이</Label>
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
              <Label>채팅 템플릿</Label>
              <Select value={s.chatTemplate} onChange={(e) => set({ chatTemplate: e.target.value })}>
                <option value="auto">자동 (tokenizer_config / GGUF 메타데이터)</option>
                <option value="chatml">ChatML</option>
                <option value="llama3">Llama 3</option>
                <option value="gemma">Gemma</option>
                <option value="mistral">Mistral [INST]</option>
                <option value="none">없음 (completion 전용)</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">공개 범위 & 가격</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: 'private' as const, icon: Lock, title: '비공개', desc: '내 API 키로만 호출 가능. GPU 시간당 과금.' },
              { id: 'public' as const, icon: Globe, title: '마켓플레이스 공개', desc: '모든 사용자가 호출. 토큰 매출의 80%를 정산받습니다.' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => set({ visibility: o.id })}
                className={cx('rounded-lg border p-3 text-left text-sm', s.visibility === o.id ? 'border-fg/50 bg-raised ring-1 ring-fg/15' : 'border-line')}
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
                <Label>입력 가격 ($/1M)</Label>
                <Input type="number" step={0.01} min={0} value={s.priceIn} onChange={(e) => set({ priceIn: Math.max(0, +e.target.value) })} />
              </div>
              <div>
                <Label>출력 가격 ($/1M)</Label>
                <Input type="number" step={0.01} min={0} value={s.priceOut} onChange={(e) => set({ priceOut: Math.max(0, +e.target.value) })} />
              </div>
              <Button variant="outline" onClick={() => set({ priceIn: suggested.in, priceOut: suggested.out })}>
                <Wand2 size={14} /> 추천가
              </Button>
              <div className="text-xs text-fg3 md:col-span-3">
                추천가 ${suggested.in}/${suggested.out} — 유사 규모 카탈로그 모델 가격과 예상 처리량 기반. 손익분기 처리량 ≈ {fmtNum(Math.round((hourly / Math.max(0.01, s.priceOut * 0.8)) * 1e6 / 3600))} 출력 토큰/초
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-5">
          <div className="text-sm font-semibold">리소스 추정</div>
          <div className="mt-4 space-y-3 text-sm">
            <Row k="필요 VRAM" v={`~${need} GB`} />
            <Row k="선택 구성" v={`${s.gpuCount}x ${s.gpu} (${(GPUS.find((g) => g.id === s.gpu)?.vram ?? 0) * s.gpuCount} GB)`} />
            <Row k="추천 구성" v={`${rec.count}x ${rec.gpu}`} />
          </div>
          <div className={cx('mt-4 flex items-start gap-2 rounded-lg p-3 text-xs', fits ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300')}>
            {fits ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            {fits ? '선택한 하드웨어에 모델과 KV 캐시가 적재됩니다.' : 'VRAM이 부족합니다. GPU 수를 늘리거나 양자화를 적용하세요.'}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold">예상 비용</div>
          <div className="mt-3 text-3xl font-bold tracking-tight">
            {fmtUSD(hourly)}
            <span className="text-sm font-normal text-fg3">/hr · 레플리카당</span>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="상시 최소 비용" v={s.minReplicas === 0 ? '$0 (scale to zero)' : `${fmtUSD(hourly * s.minReplicas * 24 * 30, 0)}/월`} />
            <Row k="최대 부하 시" v={`${fmtUSD(hourly * s.maxReplicas)}/hr`} />
          </div>
          <p className="mt-3 text-[11px] text-fg3">초 단위 과금. 데모에서는 실제로 청구되지 않습니다.</p>
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
