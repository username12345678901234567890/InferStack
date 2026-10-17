import { useState } from 'react'
import { Button, Card, Input, Label, Modal, PageHeader, Toggle, cx, tbl, toast } from '../components/ui'
import { fmtDateTime, fmtUSD } from '../lib/format'
import { useStore } from '../store'

const PRESETS = [10, 25, 50, 100]

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
      <PageHeader title="Credits" description="Prepay for credits and pay only for the tokens you use. Pay with card — every purchase comes with an invoice and receipt." />

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[13.5px] text-fg3">Balance</div>
          <div className="tabular mt-1 text-[44px] font-bold leading-none tracking-[-0.02em]">{fmtUSD(credits)}</div>
          <div className="tabular mt-3 text-[13.5px] text-fg2">
            {fmtUSD(spent30)} spent in the last 30 days{daysLeft !== null && daysLeft < 365 && <> · about {daysLeft} days left at this rate</>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.slice(0, 3).map((p) => (
            <Button key={p} variant="outline" onClick={() => openTopUp(p)}>
              +${p}
            </Button>
          ))}
          <Button onClick={() => openTopUp(25)}>Add credits</Button>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <Toggle
            checked={settings.autoTopUp.enabled}
            onChange={(v) => updateSettings({ autoTopUp: { ...settings.autoTopUp, enabled: v } })}
            label="Auto top-up"
            description="Automatically add credits when your balance drops below a threshold."
          />
          <div className={cx('mt-5 grid grid-cols-2 gap-3', !settings.autoTopUp.enabled && 'opacity-50')}>
            <div>
              <Label>Threshold ($)</Label>
              <Input type="number" min={1} value={settings.autoTopUp.threshold} disabled={!settings.autoTopUp.enabled} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, threshold: +e.target.value } })} />
            </div>
            <div>
              <Label>Top-up amount ($)</Label>
              <Input type="number" min={5} value={settings.autoTopUp.amount} disabled={!settings.autoTopUp.enabled} onChange={(e) => updateSettings({ autoTopUp: { ...settings.autoTopUp, amount: +e.target.value } })} />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-[14px] font-medium">Promo code</div>
          <div className="mt-0.5 text-[12.5px] text-fg3">Demo code: INFERSTACK2026</div>
          <PromoForm />
        </Card>
      </div>

      <h2 className="mb-4 mt-12 text-[17px] font-semibold">Transactions</h2>
      <div className={tbl.wrap}>
        <table className={tbl.table}>
          <thead>
            <tr>
              <th className={tbl.th}>Date</th>
              <th className={tbl.th}>Description</th>
              <th className={tbl.thR}>Amount</th>
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
        title="Add credits"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={amount < 5}
              onClick={() => {
                addCredits(amount)
                setOpen(false)
                toast.ok(`Added ${fmtUSD(amount)} in credits (demo)`)
              }}
            >
              Pay {fmtUSD(amount + fee)}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={cx('h-10 rounded-full border text-[14px] font-medium transition-colors', amount === p ? 'border-transparent bg-brand text-white' : 'border-line2 hover:bg-raised')}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Label hint="Min. $5">Custom amount ($)</Label>
          <Input type="number" min={5} value={amount} onChange={(e) => setAmount(Math.max(0, +e.target.value))} />
        </div>
        <dl className="tabular mt-5 space-y-2 rounded-lg bg-raised p-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-fg2">Credits</dt>
            <dd>{fmtUSD(amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg2">Fee (5%, min. $0.80)</dt>
            <dd>{fmtUSD(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{fmtUSD(amount + fee)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[12.5px] text-fg3">Demo only: credits are added without charging a card. All amounts are in USD.</p>
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
          add(10, 'Promo code INFERSTACK2026')
          setUsed(true)
          toast.ok('$10 in credits added')
        } else toast.err(used ? 'This code has already been used' : 'Invalid promo code')
        setCode('')
      }}
    >
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" className="uppercase placeholder:normal-case" aria-label="Promo code" />
      <Button type="submit" variant="outline" disabled={!code}>
        Apply
      </Button>
    </form>
  )
}
