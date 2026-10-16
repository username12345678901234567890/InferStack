import { useState } from 'react'
import { CreditCard, Gift, Wallet, Zap } from 'lucide-react'
import { Badge, Button, Card, Input, Label, Modal, PageHeader, Stat, Toggle, cx, toast } from '../components/ui'
import { fmtDateTime, fmtUSD } from '../lib/format'
import { useStore } from '../store'

const PRESETS = [10, 25, 50, 100, 500]

export default function Credits() {
  const credits = useStore((s) => s.credits)
  const tx = useStore((s) => s.transactions)
  const logs = useStore((s) => s.logs)
  const addCredits = useStore((s) => s.addCredits)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(25)

  const since = Date.now() - 30 * 86400_000
  const spent30 = logs.filter((l) => l.ts > since).reduce((a, l) => a + l.cost, 0)
  const today = logs.filter((l) => l.ts > Date.now() - 86400_000).reduce((a, l) => a + l.cost, 0)
  const fee = Math.max(0.8, amount * 0.05)

  return (
    <div>
      <PageHeader
        title="크레딧"
        description="선불 크레딧으로 사용한 토큰만큼 차감됩니다. 크레딧은 1년간 유효합니다."
        actions={
          <Button onClick={() => setOpen(true)}>
            <CreditCard size={16} /> 크레딧 충전
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="relative overflow-hidden p-5 md:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-500/30 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Wallet size={15} /> 잔액
            </div>
            <div className="mt-2 text-4xl font-bold tracking-tight">{fmtUSD(credits)}</div>
            <div className="mt-4 flex gap-2">
              {PRESETS.slice(0, 3).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAmount(p)
                    setOpen(true)
                  }}
                >
                  +${p}
                </Button>
              ))}
            </div>
          </div>
        </Card>
        <Stat label="최근 24시간 사용" value={fmtUSD(today)} />
        <Stat label="최근 30일 사용" value={fmtUSD(spent30)} sub={`일 평균 ${fmtUSD(spent30 / 30)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">거래 내역</div>
          <table className="w-full text-sm">
            <tbody>
              {tx.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="px-5 py-3 text-slate-500">{fmtDateTime(t.ts)}</td>
                  <td className="px-3 py-3">
                    {t.note} {t.kind === 'bonus' && <Badge color="violet">보너스</Badge>}
                  </td>
                  <td className={cx('px-5 py-3 text-right font-medium', t.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                    {t.amount >= 0 ? '+' : ''}
                    {fmtUSD(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap size={15} /> 자동 충전
            </div>
            <Toggle
              checked={settings.autoTopUp.enabled}
              onChange={(v) => updateSettings({ autoTopUp: { ...settings.autoTopUp, enabled: v } })}
              label="잔액이 부족하면 자동 충전"
              description="서비스 중단 없이 프로덕션 트래픽을 처리합니다"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>기준 잔액 ($)</Label>
                <Input type="number" min={1} value={settings.autoTopUp.threshold} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, threshold: +e.target.value } })} />
              </div>
              <div>
                <Label>충전 금액 ($)</Label>
                <Input type="number" min={5} value={settings.autoTopUp.amount} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, amount: +e.target.value } })} />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gift size={15} /> 프로모션 코드
            </div>
            <PromoForm />
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="크레딧 충전"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              disabled={amount < 5}
              onClick={() => {
                addCredits(amount)
                setOpen(false)
                toast.ok(`${fmtUSD(amount)} 크레딧이 충전되었습니다 (데모)`)
              }}
            >
              {fmtUSD(amount + fee)} 결제 (데모)
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setAmount(p)} className={cx('rounded-lg border py-2 text-sm font-medium', amount === p ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-slate-200 dark:border-white/10')}>
              ${p}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Label hint="최소 $5">직접 입력</Label>
          <Input type="number" min={5} value={amount} onChange={(e) => setAmount(Math.max(0, +e.target.value))} />
        </div>
        <div className="mt-4 space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm dark:bg-white/5">
          <div className="flex justify-between">
            <span className="text-slate-500">크레딧</span>
            <span>{fmtUSD(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">결제 수수료 (5%, 최소 $0.80)</span>
            <span>{fmtUSD(fee)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold dark:border-white/10">
            <span>합계</span>
            <span>{fmtUSD(amount + fee)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">데모 환경이므로 실제 결제는 이루어지지 않고 크레딧만 즉시 추가됩니다.</p>
      </Modal>
    </div>
  )
}

function PromoForm() {
  const [code, setCode] = useState('')
  const add = useStore((s) => s.addCredits)
  const [used, setUsed] = useState(false)
  return (
    <div className="mt-3 flex gap-2">
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="INFERSTACK2026" className="font-mono" />
      <Button
        variant="secondary"
        disabled={!code}
        onClick={() => {
          if (code === 'INFERSTACK2026' && !used) {
            add(10, '프로모션 코드 INFERSTACK2026')
            setUsed(true)
            toast.ok('$10 크레딧이 지급되었습니다')
          } else toast.err(used ? '이미 사용한 코드입니다' : '유효하지 않은 코드입니다')
          setCode('')
        }}
      >
        적용
      </Button>
    </div>
  )
}
