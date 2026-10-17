import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Label, Modal, PageHeader, Select, Toggle, toast } from '../components/ui'
import { MODELS, REGIONS } from '../data/models'
import { useStore } from '../store'

export default function Settings() {
  const user = useStore((s) => s.user)
  const signIn = useStore((s) => s.signIn)
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const reset = useStore((s) => s.resetDemo)
  const [name, setName] = useState(user?.name ?? '')
  const [confirm, setConfirm] = useState(false)
  const nav = useNavigate()

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Account</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => user && (signIn({ ...user, name }), toast.ok('Saved'))}>Save</Button>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Defaults</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Default chat model</Label>
              <Select value={settings.defaultModel} onChange={(e) => update({ defaultModel: e.target.value })}>
                {MODELS.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Preferred region</Label>
              <Select value={settings.preferredRegion} onChange={(e) => update({ preferredRegion: e.target.value })}>
                <option value="auto">Auto (nearest healthy region)</option>
                {REGIONS.map((r) => (
                  <option key={r.region} value={r.region}>
                    {r.location} ({r.region})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Theme</Label>
              <Select value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </Select>
            </div>
          </div>
          <Toggle checked={settings.fallbackRouting} onChange={(v) => update({ fallbackRouting: v })} label="Automatic fallback routing" description="Retry in another region if the primary endpoint fails" />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">Privacy</div>
          <Toggle checked={settings.logPrompts} onChange={(v) => update({ logPrompts: v })} label="Log prompts and responses" description="Lets you view request bodies on the Activity page. Off by default." />
          <Toggle checked={settings.allowTraining} onChange={(v) => update({ allowTraining: v })} label="Include endpoints that may train on your data" description="When off, requests are routed only to endpoints that don't retain or train on your data" />
        </Card>

        <Card className="flex items-center justify-between gap-4 border-rose-500/30 p-5">
          <div>
            <div className="font-medium text-rose-600 dark:text-rose-400">Reset demo data</div>
            <div className="text-sm text-fg3">Restores API keys, credits, activity logs, and custom models to their initial state.</div>
          </div>
          <Button variant="danger" onClick={() => setConfirm(true)}>Reset</Button>
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" size="sm" footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { reset(); localStorage.removeItem('inferstack-chats'); setConfirm(false); toast.ok('Demo data reset'); nav('/') }}>Reset</Button></>}>
        <p className="text-sm">All demo data stored in this browser will be deleted.</p>
      </Modal>
    </div>
  )
}
