import { useState } from 'react'
import { Button, Card, Input, Label, Modal, PageHeader, Toggle, cx, tbl, toast } from '../components/ui'
import { fmtDateTime, fmtUSD } from '../lib/format'
import { useStore } from '../store'

const PRESETS = [10, 25, 50, 100]
const KRW_PER_USD = 1380

const krw = (usd: number) => '₩' + Math.round(usd * KRW_PER_USD).toLocaleString('ko-KR')

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
  const daysLeft = spent30 > 0 ? Math.floor(credits / (spent30 / 30)) : null
  const fee = Math.max(0.8, amount * 0.05)

  const openTopUp = (a: number) => {
    setAmount(a)
    setOpen(true)
  }

  return (
    <div>
      <PageHeader title="크레딧" description="충전한 크레딧에서 사용한 토큰만큼 차감됩니다. 원화로 결제하고 매월 세금계산서가 발행됩니다." />

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[13.5px] text-fg3">잔액</div>
          <div className="tabular mt-1 text-[44px] font-bold leading-none tracking-[-0.02em]">{fmtUSD(credits)}</div>
          <div className="tabular mt-3 text-[13.5px] text-fg2">
            최근 30일 {fmtUSD(spent30)} 사용{daysLeft !== null && daysLeft < 365 && <> · 지금 속도면 약 {daysLeft}일 사용 가능</>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.slice(0, 3).map((p) => (
            <Button key={p} variant="outline" onClick={() => openTopUp(p)}>
              +${p}
            </Button>
          ))}
          <Button onClick={() => openTopUp(25)}>충전하기</Button>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <Toggle
            checked={settings.autoTopUp.enabled}
            onChange={(v) => updateSettings({ autoTopUp: { ...settings.autoTopUp, enabled: v } })}
            label="자동 충전"
            description="잔액이 기준 아래로 내려가면 정해 둔 금액을 자동으로 충전합니다."
          />
          <div className={cx('mt-5 grid grid-cols-2 gap-3', !settings.autoTopUp.enabled && 'opacity-50')}>
            <div>
              <Label>기준 잔액 ($)</Label>
              <Input type="number" min={1} value={settings.autoTopUp.threshold} disabled={!settings.autoTopUp.enabled} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, threshold: +e.target.value } })} />
            </div>
            <div>
              <Label>충전 금액 ($)</Label>
              <Input type="number" min={5} value={settings.autoTopUp.amount} disabled={!settings.autoTopUp.enabled} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, amount: +e.target.value } })} />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-[14px] font-medium">프로모션 코드</div>
          <div className="mt-0.5 text-[12.5px] text-fg3">데모 코드: INFERSTACK2026</div>
          <PromoForm />
        </Card>
      </div>

      <h2 className="mb-4 mt-12 text-[17px] font-semibold">거래 내역</h2>
      <div className={tbl.wrap}>
        <table className={tbl.table}>
          <thead>
            <tr>
              <th className={tbl.th}>일시</th>
              <th className={tbl.th}>내용</th>
              <th className={tbl.thR}>금액</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id} className={tbl.tr}>
                <td className={cx(tbl.td, 'whitespace-nowrap text-fg2')}>{fmtDateTime(t.ts)}</td>
                <td className={tbl.td}>{t.note}</td>
                <td className={cx(tbl.tdR, 'font-medium', t.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg')}>
                  {t.amount >= 0 ? '+' : ''}
                  {fmtUSD(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                toast.ok(`${fmtUSD(amount)} 충전했습니다 (데모)`)
              }}
            >
              {krw(amount + fee)} 결제
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={cx('h-10 rounded-lg border text-[14px] font-medium transition-colors', amount === p ? 'border-fg bg-fg text-bg' : 'border-line2 hover:bg-raised')}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Label hint="최소 $5">직접 입력 ($)</Label>
          <Input type="number" min={5} value={amount} onChange={(e) => setAmount(Math.max(0, +e.target.value))} />
        </div>
        <dl className="tabular mt-5 space-y-2 rounded-lg bg-raised p-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-fg2">크레딧</dt>
            <dd>{fmtUSD(amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg2">수수료 (5%, 최소 $0.80)</dt>
            <dd>{fmtUSD(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>결제 금액</dt>
            <dd>
              {krw(amount + fee)} <span className="font-normal text-fg3">({fmtUSD(amount + fee)})</span>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[12.5px] text-fg3">데모에서는 실제 결제 없이 크레딧만 추가됩니다. 환율은 1달러 = {KRW_PER_USD.toLocaleString()}원으로 계산했습니다.</p>
      </Modal>
    </div>
  )
}

function PromoForm() {
  const [code, setCode] = useState('')
  const add = useStore((s) => s.addCredits)
  const [used, setUsed] = useState(false)
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (code === 'INFERSTACK2026' && !used) {
          add(10, '프로모션 코드 INFERSTACK2026')
          setUsed(true)
          toast.ok('$10 크레딧을 받았습니다')
        } else toast.err(used ? '이미 사용한 코드입니다' : '유효하지 않은 코드입니다')
        setCode('')
      }}
    >
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="코드 입력" className="font-mono" aria-label="프로모션 코드" />
      <Button type="submit" variant="outline" disabled={!code}>
        적용
      </Button>
    </form>
  )
}
