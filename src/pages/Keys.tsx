import { useState } from 'react'
import { AlertTriangle, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, CodeBlock, CopyButton, Empty, Input, Label, Modal, PageHeader, Select, Toggle, cx, tbl, toast } from '../components/ui'
import { MODELS } from '../data/models'
import type { ApiKey } from '../data/types'
import { fmtDate, fmtUSD, timeAgo } from '../lib/format'
import { useStore } from '../store'

function mask(k: string) {
  return k.slice(0, 12) + '…' + k.slice(-4)
}

export default function Keys() {
  const keys = useStore((s) => s.keys)
  const createKey = useStore((s) => s.createKey)
  const updateKey = useStore((s) => s.updateKey)
  const deleteKey = useStore((s) => s.deleteKey)
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<ApiKey | null>(null)
  const [edit, setEdit] = useState<ApiKey | null>(null)
  const [del, setDel] = useState<ApiKey | null>(null)

  return (
    <div>
      <PageHeader
        title="API keys"
        description="Set a usage limit, expiration, and allowed models for each key. The full key is shown only once, when you create it."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Create key
          </Button>
        }
      />

      {keys.length === 0 ? (
        <Empty icon={<KeyRound size={32} />} title="No API keys yet" description="Create a key to start calling InferStack from any OpenAI-compatible SDK." action={<Button onClick={() => setOpen(true)}>Create your first key</Button>} />
      ) : (
        <div className={tbl.wrap}>
          <table className={tbl.table}>
            <thead>
              <tr>
                <th className={tbl.th}>Name</th>
                <th className={tbl.th}>Usage / limit</th>
                <th className={tbl.th}>Allowed models</th>
                <th className={tbl.th}>Expires</th>
                <th className={tbl.th}>Last used</th>
                <th className={tbl.th}>Status</th>
                <th className={tbl.th} />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const expired = !!k.expiresAt && k.expiresAt < Date.now()
                const pct = k.limit ? Math.min(1, k.usage / k.limit) : 0
                return (
                  <tr key={k.id} className={tbl.tr}>
                    <td className={tbl.td}>
                      <div className="font-medium">{k.name}</div>
                      <div className="mt-0.5 font-mono text-[12px] text-fg3">{mask(k.key)}</div>
                    </td>
                    <td className={tbl.td}>
                      <div>
                        {fmtUSD(k.usage)} <span className="text-fg3">/ {k.limit ? fmtUSD(k.limit, 0) : 'Unlimited'}</span>
                      </div>
                      {k.limit ? (
                        <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-raised">
                          <div className={pct > 0.9 ? 'h-full bg-rose-500' : 'h-full bg-fg/60'} style={{ width: `${pct * 100}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td className={cx(tbl.td, 'text-fg2')}>{k.allowedModels.length ? `${k.allowedModels.length} ${k.allowedModels.length === 1 ? 'model' : 'models'}` : 'All'}</td>
                    <td className={cx(tbl.td, 'whitespace-nowrap text-fg2')}>{k.expiresAt ? fmtDate(k.expiresAt) : 'Never'}</td>
                    <td className={cx(tbl.td, 'whitespace-nowrap text-fg2')}>{k.lastUsed ? timeAgo(k.lastUsed) : 'Never'}</td>
                    <td className={tbl.td}>{k.disabled ? <Badge>Disabled</Badge> : expired ? <Badge color="rose">Expired</Badge> : <Badge color="green">Active</Badge>}</td>
                    <td className={tbl.td}>
                      <div className="flex justify-end gap-0.5">
                        <button onClick={() => setEdit(k)} className="rounded-full p-1.5 text-fg3 hover:bg-raised hover:text-fg" aria-label={`Edit ${k.name}`} title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDel(k)} className="rounded-full p-1.5 text-fg3 hover:bg-rose-500/10 hover:text-rose-500" aria-label={`Delete ${k.name}`} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-4 mt-12 text-[17px] font-semibold">Using your key</h2>
      <div className="max-w-3xl">
        <CodeBlock
          lang="bash"
          code={`export INFERSTACK_API_KEY="sk-is-v1-..."

# List models
curl https://api.inferstack.dev/v1/models \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY"

# Usage and limit for this key
curl https://api.inferstack.dev/v1/key \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY"`}
        />
      </div>

      <KeyForm
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(v) => {
          const k = createKey(v)
          setOpen(false)
          setCreated(k)
        }}
      />
      {edit && (
        <KeyForm
          open
          initial={edit}
          onClose={() => setEdit(null)}
          onSubmit={(v) => {
            updateKey(edit.id, v)
            setEdit(null)
            toast.ok('Key settings saved')
          }}
        />
      )}

      <Modal open={!!created} onClose={() => setCreated(null)} title="API key created" footer={<Button onClick={() => setCreated(null)}>I've copied it</Button>}>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> This key won't be shown again. Store it somewhere safe.
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-raised p-3">
          <code className="flex-1 break-all font-mono text-xs">{created?.key}</code>
          <CopyButton text={created?.key ?? ''} label="Copy" />
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete this key?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteKey(del!.id)
                setDel(null)
                toast.ok('Key deleted')
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Requests from any application using <b>{del?.name}</b> will be rejected immediately.
        </p>
      </Modal>
    </div>
  )
}

function KeyForm({ open, onClose, onSubmit, initial }: { open: boolean; onClose: () => void; onSubmit: (v: Pick<ApiKey, 'name' | 'limit' | 'expiresAt' | 'allowedModels'> & Partial<ApiKey>) => void; initial?: ApiKey }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [limit, setLimit] = useState(initial?.limit ? String(initial.limit) : '')
  const [exp, setExp] = useState(initial?.expiresAt ? 'keep' : 'never')
  const [restrict, setRestrict] = useState((initial?.allowedModels.length ?? 0) > 0)
  const [allowed, setAllowed] = useState<string[]>(initial?.allowedModels ?? [])
  const [disabled, setDisabled] = useState(initial?.disabled ?? false)
  const days: Record<string, number> = { '7': 7, '30': 30, '90': 90, '365': 365 }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit key' : 'New API key'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                limit: limit ? Math.max(0, +limit) : null,
                expiresAt: exp === 'never' ? null : exp === 'keep' ? initial?.expiresAt ?? null : Date.now() + days[exp] * 86400_000,
                allowedModels: restrict ? allowed : [],
                ...(initial ? { disabled } : {}),
              })
            }
          >
            {initial ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. production-backend" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="USD, optional">Credit limit</Label>
            <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Unlimited" />
          </div>
          <div>
            <Label>Expires</Label>
            <Select value={exp} onChange={(e) => setExp(e.target.value)}>
              {initial?.expiresAt && <option value="keep">Keep ({fmtDate(initial.expiresAt)})</option>}
              <option value="never">Never</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </Select>
          </div>
        </div>
        <Toggle checked={restrict} onChange={setRestrict} label="Restrict allowed models" description="Only the selected models can be called with this key" />
        {restrict && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
            {MODELS.map((m) => (
              <label key={m.slug} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-raised">
                <input type="checkbox" className="accent-fg" checked={allowed.includes(m.slug)} onChange={() => setAllowed(allowed.includes(m.slug) ? allowed.filter((x) => x !== m.slug) : [...allowed, m.slug])} />
                <span className="font-mono text-xs">{m.slug}</span>
              </label>
            ))}
          </div>
        )}
        {initial && <Toggle checked={disabled} onChange={setDisabled} label="Disable key" description="Requests made with a disabled key are rejected with a 401" />}
      </div>
    </Modal>
  )
}
