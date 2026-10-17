import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Cpu, Download, ExternalLink, FolderUp, Github, Loader2, Search, Sparkles, XCircle } from 'lucide-react'
import { Badge, Button, Card, CodeBlock, Input, Label, Segmented, Tabs, cx } from '../../components/ui'
import { ARCHITECTURES, CUSTOM_ARCH, findArch, findArchByGguf } from '../../data/architectures'
import { REQUIRED_FILES, REQUIREMENTS_TEMPLATE, SMOKE_TEST_TEMPLATE, SPEC_TREE, manifestTemplate, modelPyTemplate, validateLocalFiles } from '../../data/customArchSpec'
import { listRepoDir, parseGithubUrl } from '../../lib/github'
import { fmtBytes } from '../../lib/format'
import type { Setter, WizardState } from './state'

export function detectArch(s: WizardState): { name?: string; via: 'config' | 'gguf' | 'none'; known: boolean } {
  const info = s.info
  if (!info) return { via: 'none', known: false }
  if (s.format === 'gguf' && info.ggufArchitecture) {
    const a = findArchByGguf(info.ggufArchitecture)
    return { name: a?.name ?? info.ggufArchitecture, via: 'gguf', known: !!a }
  }
  if (info.architecture) return { name: info.architecture, via: 'config', known: !!findArch(info.architecture) }
  return { via: 'none', known: false }
}

export function ArchStep({ s, set }: { s: WizardState; set: Setter }) {
  const det = detectArch(s)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (s.arch) return
    if (det.name && det.known) set({ arch: det.name })
    else if (det.name && !det.known) set({ arch: CUSTOM_ARCH, newArchName: det.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const list = useMemo(() => ARCHITECTURES.filter((a) => (a.name + a.family + a.modelType).toLowerCase().includes(q.toLowerCase())), [q])

  return (
    <div className="space-y-6">
      {det.name ? (
        <div className={cx('flex items-start gap-3 rounded-2xl border p-4 text-sm', det.known ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10' : 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/10')}>
          {det.known ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" /> : <Sparkles size={18} className="mt-0.5 text-amber-500" />}
          <div>
            <div className="font-medium">
              {det.known ? 'Detected' : 'Found'} <span className="font-mono">{det.name}</span> in {det.via === 'gguf' ? 'GGUF metadata' : 'config.json'}{det.known ? '' : ' — a new architecture not in the registry'}
            </div>
            <div className="mt-0.5 text-fg2">
              {det.known
                ? `Ready to deploy on the built-in InferStack runtime (${findArch(det.name)?.engines.join(' / ')}).`
                : 'Upload inference code that follows the spec below, from GitHub or your machine, to deploy this architecture.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-line p-4 text-sm">
          <Cpu size={18} className="mt-0.5 text-fg3" />
          <div>Couldn’t detect the architecture. Pick one from the list or register a new architecture.</div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex max-h-[560px] flex-col overflow-hidden">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${ARCHITECTURES.length} supported architectures`} className="h-9 pl-8" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ArchOption selected={s.arch === CUSTOM_ARCH} onClick={() => set({ arch: CUSTOM_ARCH, newArchName: s.newArchName || det.name || '' })}>
              <div className="flex items-center gap-2 font-medium">
                <Sparkles size={14} className="text-fg3" /> New architecture (custom inference code)
              </div>
              <div className="text-xs text-fg3">Not in the registry — upload code from GitHub or your machine</div>
            </ArchOption>
            {list.map((a) => {
              const compatible = a.formats.includes(s.format)
              return (
                <ArchOption key={a.name} selected={s.arch === a.name} disabled={!compatible} onClick={() => set({ arch: a.name, engine: s.format === 'gguf' ? 'llama.cpp' : a.engines[0] })}>
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[13px] font-medium">{a.name}</span>
                    {a.status === 'beta' && <Badge color="amber">beta</Badge>}
                    {a.name === det.name && <Badge color="green">Detected</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-fg3">
                    <span>{a.family}</span>·<span>{a.formats.join(', ')}</span>
                    {a.moe && <span>· MoE</span>}
                    {a.multimodal && <span>· Multimodal</span>}
                    {!compatible && <span className="text-rose-500">· No {s.format.toUpperCase()} support</span>}
                  </div>
                </ArchOption>
              )
            })}
          </div>
        </Card>

        <div>
          {s.arch === CUSTOM_ARCH ? (
            <CustomCodePanel s={s} set={set} />
          ) : s.arch ? (
            <SelectedArch name={s.arch} s={s} set={set} />
          ) : (
            <Card className="flex h-full items-center justify-center p-10 text-sm text-fg3">Select an architecture on the left</Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ArchOption({ selected, disabled, onClick, children }: { selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx(
'block w-full border-b border-line px-4 py-2.5 text-left last:border-0 disabled:cursor-not-allowed disabled:opacity-40 ',
        selected ? 'bg-raised' : 'hover:bg-raised/60',
      )}
    >
      {children}
    </button>
  )
}

function SelectedArch({ name, s, set }: { name: string; s: WizardState; set: Setter }) {
  const a = findArch(name)!
  const engines = s.format === 'gguf' ? ['llama.cpp'] : a.engines.filter((e) => e !== 'llama.cpp')
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Cpu size={18} className="text-fg" />
        <span className="font-mono font-semibold">{a.name}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-fg3">Family</dt>
          <dd>{a.family}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg3">model_type</dt>
          <dd className="font-mono">{a.modelType}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg3">GGUF arch</dt>
          <dd className="font-mono">{a.gguf ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg3">Status</dt>
          <dd>{a.status === 'stable' ? 'Stable' : 'Beta'}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <Label>Inference engine</Label>
        <Segmented value={engines.includes(s.engine) ? s.engine : engines[0]} onChange={(v) => set({ engine: v })} options={engines.map((e) => ({ id: e, label: e }))} />
      </div>
      <a
        href={`https://huggingface.co/models?other=${a.modelType}&sort=trending`}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-1 text-xs text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg"
      >
        Browse {a.modelType} models on Hugging Face <ExternalLink size={11} />
      </a>
    </Card>
  )
}

/* ------------------------------------------------------------------ */

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

type TplTab = 'yaml' | 'py' | 'req' | 'test'

function CustomCodePanel({ s, set }: { s: WizardState; set: Setter }) {
  const [tpl, setTpl] = useState<TplTab>('yaml')
  const archName = s.newArchName || 'MyNewForCausalLM'
  const code = s.code
  const setCode = (p: Partial<WizardState['code']>) => set((st) => ({ code: { ...st.code, ...p } }))
  const fileRef = useRef<HTMLInputElement>(null)
  const dirRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const templates: Record<TplTab, { file: string; lang: string; body: string }> = {
    yaml: { file: 'inferstack.yaml', lang: 'yaml', body: manifestTemplate(archName, s.slug || 'my-architecture') },
    py: { file: 'model.py', lang: 'python', body: modelPyTemplate(archName) },
    req: { file: 'requirements.txt', lang: 'text', body: REQUIREMENTS_TEMPLATE },
    test: { file: 'tests/test_smoke.py', lang: 'python', body: SMOKE_TEST_TEMPLATE },
  }

  const checks = validateLocalFiles(code.files.map((f) => f.name))
  const manifest = code.files.find((f) => f.name.endsWith('inferstack.yaml'))?.content
  const manifestArchOk = manifest ? manifest.includes(archName) : undefined
  const requiredOk = checks.filter((c) => c.required).every((c) => c.ok)

  const handleFiles = async (list: FileList | null) => {
    if (!list) return
    const arr = Array.from(list)
    const files = await Promise.all(
      arr.map(async (f) => {
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
        const name = rel.split('/').length > 1 ? rel.split('/').slice(1).join('/') : rel
        const content = name.endsWith('inferstack.yaml') ? await f.text() : undefined
        return { name, size: f.size, content }
      }),
    )
    const all = [...code.files.filter((x) => !files.some((f) => f.name === x.name)), ...files]
    const ok = validateLocalFiles(all.map((f) => f.name)).filter((c) => c.required).every((c) => c.ok)
    setCode({ files: all, checked: ok, error: ok ? undefined : 'Required files are missing' })
  }

  const checkGithub = async () => {
    const p = parseGithubUrl(code.repo)
    if (!p) {
      setCode({ error: 'Enter a GitHub URL or owner/repo', checked: false })
      return
    }
    setCode({ checking: true, error: undefined })
    const res = await listRepoDir(p.owner, p.repo, code.ref, code.subdir, code.token || undefined)
    let files: WizardState['code']['files'] = res.files
    if (res.ok && res.files.some((f) => f.name === 'inferstack.yaml')) {
      try {
        const path = [code.subdir.replace(/^\/+|\/+$/g, ''), 'inferstack.yaml'].filter(Boolean).join('/')
        const raw = await fetch(`https://raw.githubusercontent.com/${p.owner}/${p.repo}/${code.ref || 'HEAD'}/${path}`)
        if (raw.ok) {
          const content = await raw.text()
          files = files.map((f) => (f.name === 'inferstack.yaml' ? { ...f, content } : f))
        }
      } catch {
        /* ignore */
      }
    }
    const ok = res.ok && validateLocalFiles(files.map((f) => f.name)).filter((c) => c.required).every((c) => c.ok)
    setCode({ checking: false, files, checked: ok, error: res.error ?? (res.ok && !ok ? `Required files (${REQUIRED_FILES.join(', ')}) not found at this path` : undefined) })
  }

  const useDemoPackage = () => {
    setCode({
      files: [
        { name: 'inferstack.yaml', size: 812, content: manifestTemplate(archName) },
        { name: 'model.py', size: 2410 },
        { name: 'modeling.py', size: 18_220 },
        { name: 'requirements.txt', size: 64 },
        { name: 'tests/test_smoke.py', size: 230 },
      ],
      checked: true,
      error: undefined,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Label hint="architectures[0] in config.json">New architecture name</Label>
        <Input value={s.newArchName} onChange={(e) => set({ newArchName: e.target.value.replace(/[^\w]/g, '') })} placeholder="MyNewForCausalLM" className="font-mono" />
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Upload inference code</div>
          <Segmented
            value={code.kind}
            onChange={(v) => setCode({ kind: v, files: [], checked: false, error: undefined })}
            options={[
              { id: 'github', label: <span className="flex items-center gap-1"><Github size={13} /> GitHub</span> },
              { id: 'local', label: <span className="flex items-center gap-1"><FolderUp size={13} /> Local</span> },
            ]}
          />
        </div>

        {code.kind === 'github' ? (
          <div className="space-y-3">
            <div>
              <Label>Repository</Label>
              <Input value={code.repo} onChange={(e) => setCode({ repo: e.target.value, checked: false })} placeholder="https://github.com/acme/beam-inferstack" className="font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Branch / tag / commit</Label>
                <Input value={code.ref} onChange={(e) => setCode({ ref: e.target.value, checked: false })} placeholder="main" className="font-mono" />
              </div>
              <div>
                <Label hint="optional">Subdirectory</Label>
                <Input value={code.subdir} onChange={(e) => setCode({ subdir: e.target.value, checked: false })} placeholder="inferstack/" className="font-mono" />
              </div>
            </div>
            <div>
              <Label hint="private repos">GitHub token</Label>
              <Input type="password" value={code.token} onChange={(e) => setCode({ token: e.target.value })} placeholder="github_pat_…" className="font-mono" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={checkGithub} disabled={!code.repo || code.checking}>
                {code.checking ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />} Validate repository
              </Button>
              <Button variant="ghost" onClick={useDemoPackage}>
                Use demo package
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              handleFiles(e.dataTransfer.files)
            }}
            className={cx('rounded-2xl border-2 border-dashed p-6 text-center transition-colors', drag ? 'border-brand-500 bg-brand-500/5' : 'border-line2')}
          >
            <FolderUp size={28} className="mx-auto text-fg3" />
            <div className="mt-2 text-sm font-medium">Drag and drop files, or browse</div>
            <div className="mt-1 text-xs text-fg3">inferstack.yaml and model.py required · folders supported</div>
            <div className="mt-3 flex justify-center gap-2">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <input ref={dirRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} {...({ webkitdirectory: '' } as Record<string, string>)} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                Choose files
              </Button>
              <Button size="sm" variant="outline" onClick={() => dirRef.current?.click()}>
                Choose folder
              </Button>
              <Button size="sm" variant="ghost" onClick={useDemoPackage}>
                Demo package
              </Button>
            </div>
          </div>
        )}

        {code.error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle size={15} /> {code.error}
          </div>
        )}

        {code.files.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {checks.map((c) => (
                <div key={c.file} className="flex items-center gap-1.5">
                  {c.ok ? <CheckCircle2 size={13} className="text-emerald-500" /> : c.required ? <XCircle size={13} className="text-rose-500" /> : <span className="h-[13px] w-[13px] rounded-full border border-line2" />}
                  <span className="font-mono">{c.file}</span>
                  {!c.required && <span className="text-fg3">(optional)</span>}
                </div>
              ))}
              {manifestArchOk !== undefined && (
                <div className="col-span-2 flex items-center gap-1.5">
                  {manifestArchOk ? <CheckCircle2 size={13} className="text-emerald-500" /> : <AlertTriangle size={13} className="text-amber-500" />}
                  <span className="font-mono">{archName}</span> {manifestArchOk ? 'found in manifest architectures' : 'missing from manifest architectures — check it'}
                </div>
              )}
            </div>
            <div className="max-h-32 overflow-y-auto rounded-lg bg-raised p-2 font-mono text-[11px] text-fg2">
              {code.files.map((f) => (
                <div key={f.name} className="flex justify-between">
                  <span>{f.name}</span>
                  <span>{fmtBytes(f.size)}</span>
                </div>
              ))}
            </div>
            {requiredOk && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={15} /> Package structure looks good — build and smoke tests run on deploy
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <div className="text-sm font-semibold">InferStack Architecture Package spec v1</div>
            <div className="text-xs text-fg3">Your package must follow this layout and interface</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => Object.values(templates).forEach((t) => downloadText(t.file.split('/').pop()!, t.body))}>
            <Download size={14} /> Download templates
          </Button>
        </div>
        <pre className="mx-5 mt-3 overflow-x-auto rounded-lg bg-raised p-3 font-mono text-[11.5px] leading-relaxed text-fg2">{SPEC_TREE}</pre>
        <Tabs
          className="mt-3 px-5"
          value={tpl}
          onChange={setTpl}
          tabs={[
            { id: 'yaml', label: 'inferstack.yaml' },
            { id: 'py', label: 'model.py' },
            { id: 'req', label: 'requirements.txt' },
            { id: 'test', label: 'test_smoke.py' },
          ]}
        />
        <div className="p-5">
          <CodeBlock code={templates[tpl].body} lang={templates[tpl].lang} />
        </div>
      </Card>
    </div>
  )
}
