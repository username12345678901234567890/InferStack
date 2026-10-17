import { useState } from 'react'
import { AlertTriangle, KeyRound, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CodeBlock, CopyButton, Empty, Input, Label, Modal, PageHeader, Select, Toggle, toast } from '../components/ui'
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
        title="API 키"
        description="키별로 사용 한도, 만료일, 허용 모델을 설정할 수 있습니다. 키는 생성 직후 한 번만 전체가 표시됩니다."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> 키 생성
          </Button>
        }
      />

      {keys.length === 0 ? (
        <Empty icon={<KeyRound size={32} />} title="API 키가 없습니다" action={<Button onClick={() => setOpen(true)}>첫 키 만들기</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-3 py-3 font-medium">키</th>
                <th className="px-3 py-3 font-medium">사용량 / 한도</th>
                <th className="px-3 py-3 font-medium">허용 모델</th>
                <th className="px-3 py-3 font-medium">만료</th>
                <th className="px-3 py-3 font-medium">마지막 사용</th>
                <th className="px-3 py-3 font-medium">상태</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const expired = !!k.expiresAt && k.expiresAt < Date.now()
                const pct = k.limit ? Math.min(1, k.usage / k.limit) : 0
                return (
                  <tr key={k.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">{mask(k.key)}</td>
                    <td className="px-3 py-3">
                      <div>
                        {fmtUSD(k.usage)} <span className="text-slate-500">/ {k.limit ? fmtUSD(k.limit, 0) : '무제한'}</span>
                      </div>
                      {k.limit ? (
                        <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div className={pct > 0.9 ? 'h-full bg-rose-500' : 'h-full bg-fg/70'} style={{ width: `${pct * 100}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{k.allowedModels.length ? `${k.allowedModels.length}개 모델` : '전체'}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{k.expiresAt ? fmtDate(k.expiresAt) : '없음'}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{k.lastUsed ? timeAgo(k.lastUsed) : '사용 안 함'}</td>
                    <td className="px-3 py-3">{k.disabled ? <Badge>비활성</Badge> : expired ? <Badge color="rose">만료</Badge> : <Badge color="green">활성</Badge>}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEdit(k)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white">
                          <MoreHorizontal size={16} />
                        </button>
                        <button onClick={() => setDel(k)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-8 max-w-3xl">
        <div className="mb-2 text-sm font-semibold">사용 방법</div>
        <CodeBlock
          lang="bash"
          code={`export INFERSTACK_API_KEY="sk-is-v1-..."

curl https://api.inferstack.dev/v1/models \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY"

# 키 사용량/한도 조회
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
            toast.ok('키 설정을 저장했습니다')
          }}
        />
      )}

      <Modal open={!!created} onClose={() => setCreated(null)} title="API 키가 생성되었습니다" footer={<Button onClick={() => setCreated(null)}>복사했습니다</Button>}>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> 이 키는 지금 한 번만 표시됩니다. 안전한 곳에 보관하세요.
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
          <code className="flex-1 break-all font-mono text-xs">{created?.key}</code>
          <CopyButton text={created?.key ?? ''} label="복사" />
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="키를 삭제할까요?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteKey(del!.id)
                setDel(null)
                toast.ok('키를 삭제했습니다')
              }}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm">
          <b>{del?.name}</b> 키를 사용하는 모든 애플리케이션의 요청이 즉시 거부됩니다.
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
      title={initial ? '키 편집' : '새 API 키'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
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
            {initial ? '저장' : '생성'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>이름</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="예: production-backend" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="USD, 비우면 무제한">크레딧 한도</Label>
            <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="무제한" />
          </div>
          <div>
            <Label>만료</Label>
            <Select value={exp} onChange={(e) => setExp(e.target.value)}>
              {initial?.expiresAt && <option value="keep">유지 ({fmtDate(initial.expiresAt)})</option>}
              <option value="never">만료 없음</option>
              <option value="7">7일</option>
              <option value="30">30일</option>
              <option value="90">90일</option>
              <option value="365">1년</option>
            </Select>
          </div>
        </div>
        <Toggle checked={restrict} onChange={setRestrict} label="허용 모델 제한" description="선택한 모델만 이 키로 호출할 수 있습니다" />
        {restrict && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
            {MODELS.map((m) => (
              <label key={m.slug} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                <input type="checkbox" className="accent-brand-600" checked={allowed.includes(m.slug)} onChange={() => setAllowed(allowed.includes(m.slug) ? allowed.filter((x) => x !== m.slug) : [...allowed, m.slug])} />
                <span className="font-mono text-xs">{m.slug}</span>
              </label>
            ))}
          </div>
        )}
        {initial && <Toggle checked={disabled} onChange={setDisabled} label="키 비활성화" description="비활성화된 키의 요청은 401로 거부됩니다" />}
      </div>
    </Modal>
  )
}
