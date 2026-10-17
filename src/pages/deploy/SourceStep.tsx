import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FileJson, Globe2, Heart, Loader2, Lock, Search, Terminal } from 'lucide-react'
import { Badge, Button, Card, CodeBlock, Input, Label, Progress, Segmented, Textarea, cx } from '../../components/ui'
import { getModelInfo, groupGGUF, hfUrl, safetensorsFiles, searchModels, HFError, type HFModelSummary, type HFSibling } from '../../lib/hf'
import { getModelScopeInfo } from '../../lib/modelscope'
import { guessArchFromName } from '../../data/architectures'
import { fmtBytes, fmtNum, fmtParams, fmtTokens, slugify, timeAgo } from '../../lib/format'
import { randomKey } from '../../lib/rand'
import type { Setter, WizardState } from './state'
import type { ImportSource } from '../../data/types'

const SOURCES: { id: ImportSource; label: React.ReactNode }[] = [
  { id: 'huggingface', label: <span className="flex items-center gap-1.5"><Download size={13} /> Hugging Face</span> },
  { id: 'modelscope', label: <span className="flex items-center gap-1.5"><Globe2 size={13} /> ModelScope</span> },
  { id: 'cli', label: <span className="flex items-center gap-1.5"><Terminal size={13} /> CLI upload</span> },
]

export function SourceStep({ s, set, onLoaded }: { s: WizardState; set: Setter; onLoaded: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Import from</Label>
        <Segmented value={s.source} onChange={(v) => set({ source: v, info: null, resolvedVia: undefined })} options={SOURCES} />
      </div>
      {s.source === 'huggingface' && <HFImport s={s} set={set} onLoaded={onLoaded} />}
      {s.source === 'modelscope' && <MSImport s={s} set={set} onLoaded={onLoaded} />}
      {s.source === 'cli' && <CLIImport s={s} set={set} onLoaded={onLoaded} />}
      {s.info && s.source !== 'cli' && <RepoSummary s={s} />}
    </div>
  )
}

/** Shared: apply imported metadata to wizard state */
function applyInfo(set: Setter, info: WizardState['info'], via: WizardState['resolvedVia']) {
  if (!info) return
  const ggufs = groupGGUF(info.files)
  const hasST = safetensorsFiles(info.files).length > 0
  const format = hasST ? 'safetensors' : ggufs.length ? 'gguf' : 'safetensors'
  const preferred = ggufs.find((g) => g.quant === 'Q4_K_M') ?? ggufs.find((g) => g.quant.includes('Q4')) ?? ggufs[0]
  const name = info.id.split('/').pop() ?? info.id
  set({
    info,
    resolvedVia: via,
    format,
    ggufQuant: preferred?.quant ?? '',
    arch: '',
    slug: slugify(name),
    displayName: name,
    contextLength: Math.min(info.contextLength ?? 32768, 131072),
  })
}

function HFImport({ s, set, onLoaded }: { s: WizardState; set: Setter; onLoaded: () => void }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [suggest, setSuggest] = useState<HFModelSummary[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const timer = useRef<number>()
  const autoLoaded = useRef(false)

  const load = async (repo = s.repo) => {
    const id = repo.trim().replace(/^https?:\/\/huggingface\.co\//, '').replace(/\/$/, '')
    if (!/^[\w.-]+\/[\w.-]+$/.test(id)) {
      setErr('Enter a repo ID in the form "organization/model"')
      return
    }
    setLoading(true)
    setErr(null)
    setShowSuggest(false)
    try {
      const info = await getModelInfo(id, { revision: s.revision || undefined, token: s.token || undefined })
      set({ repo: id })
      applyInfo(set, info, 'huggingface')
      onLoaded()
    } catch (e) {
      if (e instanceof HFError && (e.status === 401 || e.status === 403)) {
        setErr('This model is gated or private. Add an access token and try again.')
        setShowToken(true)
      } else if (e instanceof HFError && e.status === 404) setErr('Model not found. Check the repo ID.')
      else setErr('Can’t reach Hugging Face: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (s.repo && !s.info && !autoLoaded.current) {
      autoLoaded.current = true
      load(s.repo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onType = (v: string) => {
    set({ repo: v })
    window.clearTimeout(timer.current)
    if (v.trim().length < 2) {
      setSuggest([])
      return
    }
    timer.current = window.setTimeout(() => {
      searchModels({ search: v.trim(), sort: 'downloads', limit: 8 })
        .then((r) => {
          setSuggest(r)
          setShowSuggest(true)
        })
        .catch(() => setSuggest([]))
    }, 250)
  }

  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Label hint="e.g. Qwen/Qwen3.8-27B, unsloth/Qwen3.8-27B-GGUF">Repo ID</Label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
            <Input
              value={s.repo}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              onFocus={() => suggest.length && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="organization/model-name or huggingface.co URL"
              className="pl-9 font-mono"
            />
          </div>
          {showSuggest && suggest.length > 0 && (
            <div className="absolute left-0 right-0 top-[68px] z-30 overflow-hidden rounded-2xl border border-line bg-panel shadow-xl">
              {suggest.map((m) => (
                <button
                  key={m.id}
                  onMouseDown={() => {
                    set({ repo: m.id })
                    load(m.id)
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-raised"
                >
                  <span className="truncate font-mono">{m.id}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-fg3">
                    {m.library_name === 'gguf' || m.tags?.includes('gguf') ? <Badge>GGUF</Badge> : null}
                    <Download size={11} /> {fmtTokens(m.downloads)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label hint="optional">Revision</Label>
          <Input value={s.revision} onChange={(e) => set({ revision: e.target.value })} placeholder="main" className="font-mono" />
        </div>
      </div>
      <div className="mt-3">
        <button onClick={() => setShowToken(!showToken)} className="flex items-center gap-1 text-xs text-fg3 hover:text-fg">
          <Lock size={12} /> {showToken ? 'Hide' : 'Add'} access token for gated or private models
        </button>
        {showToken && (
          <div className="mt-2 max-w-md">
            <Input type="password" value={s.token} onChange={(e) => set({ token: e.target.value })} placeholder="hf_xxxxxxxxxxxxxxxxx" className="font-mono" />
            <p className="mt-1 text-[11px] text-fg3">In this demo the token is only used for HF API calls from your browser. In production it’s encrypted and used only to download weights.</p>
          </div>
        )}
      </div>
      {err && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={15} /> {err}
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => load()} disabled={loading || !s.repo.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Import
        </Button>
        <span className="text-xs text-fg3">Fetches config.json, the file list and GGUF metadata live from the huggingface.co API.</span>
      </div>
      {!s.info && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="text-fg3">Try:</span>
          {['Qwen/Qwen3.8-27B', 'LiquidAI/LFM2.5-24B-A2B-GGUF', 'openai/gpt-oss-20b', 'openbmb/MiniCPM5-2B', 'Aleph-Alpha/Kolibri-1'].map((r) => (
            <button
              key={r}
              onClick={() => {
                set({ repo: r })
                load(r)
              }}
              className="rounded-md border border-line px-2 py-0.5 font-mono hover:border-line2 "
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

function MSImport({ s, set, onLoaded }: { s: WizardState; set: Setter; onLoaded: () => void }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const load = async (repo = s.repo) => {
    const id = repo.trim().replace(/^https?:\/\/(www\.)?modelscope\.cn\/models\//, '').replace(/\/$/, '')
    if (!/^[\w.-]+\/[\w.-]+$/.test(id)) {
      setErr('Enter a ModelScope ID in the form "owner/model"')
      return
    }
    setLoading(true)
    setErr(null)
    const r = await getModelScopeInfo(id, s.revision || 'master')
    set({ repo: id })
    applyInfo(set, r.info, r.resolvedVia)
    setLoading(false)
    onLoaded()
  }
  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div>
          <Label hint="e.g. Qwen/Qwen3.8-27B, ZhipuAI/GLM-4.7-Flash">ModelScope model ID</Label>
          <Input value={s.repo} onChange={(e) => set({ repo: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="owner/model or modelscope.cn URL" className="font-mono" />
        </div>
        <div>
          <Label hint="optional">Revision</Label>
          <Input value={s.revision} onChange={(e) => set({ revision: e.target.value })} placeholder="master" className="font-mono" />
        </div>
      </div>
      <div className="mt-3 max-w-md">
        <Label hint="private models">SDK token</Label>
        <Input type="password" value={s.token} onChange={(e) => set({ token: e.target.value })} placeholder="ms-xxxxxxxx" className="font-mono" />
      </div>
      {err && <div className="mt-3 text-sm text-rose-500">{err}</div>}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => load()} disabled={loading || !s.repo.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Import
        </Button>
        <span className="text-xs text-fg3">Resolves metadata from the ModelScope API, then the HF mirror of the same ID, then a name-based guess.</span>
      </div>
    </Card>
  )
}

function CLIImport({ s, set, onLoaded }: { s: WizardState; set: Setter; onLoaded: () => void }) {
  const [token] = useState(() => 'up_' + randomKey(24))
  const [fmt, setFmt] = useState<'safetensors' | 'gguf'>('gguf')
  const [uploading, setUploading] = useState<number | null>(null)
  const name = s.cliName || 'my-model'
  const shards = Math.max(1, Math.ceil((s.cliParamsB * 2) / 5))
  const files: HFSibling[] =
    fmt === 'gguf'
      ? [{ path: `${name}-Q4_K_M.gguf`, size: Math.round((s.cliParamsB * 1e9 * 4.8) / 8) }]
      : [
          { path: 'config.json', size: 1350 },
          { path: 'tokenizer.json', size: 11_200_000 },
          { path: 'tokenizer_config.json', size: 8900 },
          ...Array.from({ length: shards }, (_, i) => ({
            path: `model-${String(i + 1).padStart(5, '0')}-of-${String(shards).padStart(5, '0')}.safetensors`,
            size: Math.round((s.cliParamsB * 2e9) / shards),
          })),
        ]
  const total = files.reduce((a, f) => a + (f.size ?? 0), 0)

  let parsedArch: string | undefined
  let parsedCtx: number | undefined
  let cfgErr = false
  if (s.cliConfig.trim()) {
    try {
      const j = JSON.parse(s.cliConfig)
      parsedArch = j.architectures?.[0]
      parsedCtx = (j.text_config ?? j).max_position_embeddings
    } catch {
      cfgErr = true
    }
  }

  const simulate = async () => {
    setUploading(0)
    for (let p = 0; p <= 100; p += 4) {
      setUploading(p)
      await new Promise((r) => setTimeout(r, 60))
    }
    setUploading(null)
    set({
      info: {
        id: `cli/${name}`,
        likes: 0,
        downloads: 0,
        tags: [],
        files,
        params: s.cliParamsB * 1e9,
        architecture: parsedArch ?? (fmt === 'safetensors' ? guessArchFromName(name) : undefined),
        contextLength: parsedCtx ?? 32768,
        chatTemplate: true,
      },
      resolvedVia: 'cli',
      format: fmt,
      ggufQuant: fmt === 'gguf' ? 'Q4_K_M' : '',
      slug: slugify(name),
      displayName: name,
      contextLength: Math.min(parsedCtx ?? 32768, 131072),
      arch: '',
    })
    onLoaded()
  }

  const cmd = `# 1) Install the CLI and sign in
pip install -U inferstack-cli
inferstack login --key sk-is-v1-...

# 2) Create the model (issues an upload session)
inferstack models create ${name} \\
  --format ${fmt}${parsedArch ? ` \\\n  --arch ${parsedArch}` : ''} \\
  --upload-token ${token}

# 3) Upload weights (multipart, resumable)
inferstack upload ./${fmt === 'gguf' ? files[0].path : 'my-model-dir/'} \\
  --model ${name} --parallel 8`

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Model name</Label>
            <Input value={s.cliName} onChange={(e) => set({ cliName: slugify(e.target.value) })} placeholder="my-model" className="font-mono" />
          </div>
          <div>
            <Label>Format</Label>
            <Segmented
              value={fmt}
              onChange={setFmt}
              options={[
                { id: 'gguf', label: 'GGUF' },
                { id: 'safetensors', label: 'Safetensors' },
              ]}
            />
          </div>
          <div>
            <Label hint="in billions">Parameters</Label>
            <Input type="number" min={0.1} step={0.1} value={s.cliParamsB} onChange={(e) => set({ cliParamsB: Math.max(0.1, +e.target.value) })} />
          </div>
        </div>
      </Card>
      <CodeBlock code={cmd} lang="bash" />
      <Card className="p-5">
        <Label hint="optional, for architecture detection">
          <FileJson size={14} className="mr-1 inline" /> Paste config.json
        </Label>
        <Textarea rows={4} value={s.cliConfig} onChange={(e) => set({ cliConfig: e.target.value })} placeholder={'{\n"architectures": ["Qwen3ForCausalLM"],\n"max_position_embeddings": 131072\n}'} className="font-mono text-xs" />
        {parsedArch && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} /> Detected: <span className="font-mono">{parsedArch}</span> {parsedCtx && <>· context {fmtNum(parsedCtx)}</>}
          </div>
        )}
        {cfgErr && <div className="mt-2 text-xs text-rose-500">Invalid JSON</div>}
      </Card>
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            {uploading === null ? <Loader2 size={15} className="animate-spin text-fg3" /> : <Loader2 size={15} className="animate-spin text-fg" />}
            {uploading === null ? 'Waiting for CLI upload…' : `Uploading ${uploading}% — ${fmtBytes((total * uploading) / 100)} / ${fmtBytes(total)}`}
          </div>
          {uploading !== null && <Progress value={uploading / 100} className="mt-2" />}
          <div className="mt-1 text-xs text-fg3">Upload token <span className="font-mono">{token.slice(0, 10)}…</span> is valid for 24 hours.</div>
        </div>
        <Button variant="secondary" onClick={simulate} disabled={uploading !== null}>
          <Terminal size={15} /> Demo: simulate CLI upload
        </Button>
      </Card>
      {s.info && s.resolvedVia === 'cli' && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={15} /> Uploaded {files.length} files ({fmtBytes(total)})
        </div>
      )}
    </div>
  )
}

function RepoSummary({ s }: { s: WizardState }) {
  const info = s.info!
  const ggufs = groupGGUF(info.files)
  const st = safetensorsFiles(info.files)
  const total = info.files.reduce((a, f) => a + (f.size ?? 0), 0)
  return (
    <Card className="animate-fade-in p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-500" />
        <span className="font-mono font-semibold">{info.id}</span>
        {s.resolvedVia === 'huggingface' && (
          <a href={hfUrl(info.id)} target="_blank" rel="noreferrer" className="text-fg3 hover:text-fg">
            <ExternalLink size={14} />
          </a>
        )}
        {s.resolvedVia === 'hf-mirror' && <Badge color="amber">HF mirror metadata</Badge>}
        {s.resolvedVia === 'heuristic' && <Badge color="amber">Guessed from name (demo)</Badge>}
        {s.resolvedVia === 'modelscope' && <Badge color="green">ModelScope</Badge>}
        {info.gated ? <Badge color="rose">gated</Badge> : null}
        {info.license && <Badge>{info.license}</Badge>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        <Info k="Architecture" v={<span className="font-mono text-xs">{info.architecture ?? info.ggufArchitecture ?? 'Unknown'}</span>} />
        <Info k="Parameters" v={fmtParams(info.params)} />
        <Info k="Context" v={info.contextLength ? fmtNum(info.contextLength) : '—'} />
        <Info k="Files / size" v={`${info.files.length} · ${fmtBytes(total)}`} />
        <Info
          k="Popularity"
          v={
            <span className="flex items-center gap-2">
              <Heart size={12} /> {fmtNum(info.likes)} <Download size={12} /> {fmtTokens(info.downloads)}
            </span>
          }
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={cx('rounded-md px-2 py-1', st.length ? 'bg-raised text-fg ring-1 ring-line2' : 'bg-raised text-fg3 line-through ')}>Safetensors {st.length ? `· ${st.length} shards` : ''}</span>
        <span className={cx('rounded-md px-2 py-1', ggufs.length ? 'bg-raised text-fg ring-1 ring-line2' : 'bg-raised text-fg3 line-through ')}>GGUF {ggufs.length ? `· ${ggufs.length} quants` : ''}</span>
        {info.chatTemplate && <span className="rounded-md bg-raised px-2 py-1 text-fg ring-1 ring-line2">Chat template included</span>}
        {info.lastModified && <span className="px-2 py-1 text-fg3">Updated {timeAgo(info.lastModified)}</span>}
      </div>
    </Card>
  )
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-fg3">{k}</div>
      <div className="mt-0.5 break-words font-medium [overflow-wrap:anywhere]">{v}</div>
    </div>
  )
}
