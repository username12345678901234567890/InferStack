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
  { id: 'cli', label: <span className="flex items-center gap-1.5"><Terminal size={13} /> CLI 업로드</span> },
]

export function SourceStep({ s, set, onLoaded }: { s: WizardState; set: Setter; onLoaded: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label>가져올 위치</Label>
        <Segmented value={s.source} onChange={(v) => set({ source: v, info: null, resolvedVia: undefined })} options={SOURCES} />
      </div>
      {s.source === 'huggingface' && <HFImport s={s} set={set} onLoaded={onLoaded} />}
      {s.source === 'modelscope' && <MSImport s={s} set={set} onLoaded={onLoaded} />}
      {s.source === 'cli' && <CLIImport s={s} set={set} onLoaded={onLoaded} />}
      {s.info && s.source !== 'cli' && <RepoSummary s={s} />}
    </div>
  )
}

/** 공통: 불러온 메타데이터를 상태에 반영 */
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
      setErr('"organization/model" 형식의 repo ID를 입력하세요')
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
        setErr('게이트/비공개 모델입니다. 액세스 토큰을 입력한 뒤 다시 시도하세요.')
        setShowToken(true)
      } else if (e instanceof HFError && e.status === 404) setErr('모델을 찾을 수 없습니다. repo ID를 확인하세요.')
      else setErr('Hugging Face에 연결할 수 없습니다: ' + (e as Error).message)
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
          <Label hint="예: Qwen/Qwen3.8-27B, unsloth/Qwen3.8-27B-GGUF">Repo ID</Label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={s.repo}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              onFocus={() => suggest.length && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="organization/model-name 또는 huggingface.co URL"
              className="pl-9 font-mono"
            />
          </div>
          {showSuggest && suggest.length > 0 && (
            <div className="absolute left-0 right-0 top-[68px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
              {suggest.map((m) => (
                <button
                  key={m.id}
                  onMouseDown={() => {
                    set({ repo: m.id })
                    load(m.id)
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="truncate font-mono">{m.id}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                    {m.library_name === 'gguf' || m.tags?.includes('gguf') ? <Badge color="amber">GGUF</Badge> : null}
                    <Download size={11} /> {fmtTokens(m.downloads)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label hint="선택">Revision</Label>
          <Input value={s.revision} onChange={(e) => set({ revision: e.target.value })} placeholder="main" className="font-mono" />
        </div>
      </div>
      <div className="mt-3">
        <button onClick={() => setShowToken(!showToken)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-fg">
          <Lock size={12} /> 게이트·비공개 모델용 액세스 토큰 {showToken ? '숨기기' : '입력'}
        </button>
        {showToken && (
          <div className="mt-2 max-w-md">
            <Input type="password" value={s.token} onChange={(e) => set({ token: e.target.value })} placeholder="hf_xxxxxxxxxxxxxxxxx" className="font-mono" />
            <p className="mt-1 text-[11px] text-slate-500">토큰은 브라우저에서 HF API 호출에만 쓰이며, 실제 서비스에서는 암호화되어 가중치 다운로드 시에만 사용됩니다.</p>
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 불러오기
        </Button>
        <span className="text-xs text-slate-500">config.json · 파일 목록 · GGUF 메타데이터를 huggingface.co API로 실시간 조회합니다.</span>
      </div>
      {!s.info && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500">빠른 예시:</span>
          {['Qwen/Qwen3.8-27B', 'LiquidAI/LFM2.5-24B-A2B-GGUF', 'openai/gpt-oss-20b', 'openbmb/MiniCPM5-2B', 'Aleph-Alpha/Kolibri-1'].map((r) => (
            <button
              key={r}
              onClick={() => {
                set({ repo: r })
                load(r)
              }}
              className="rounded-md border border-slate-200 px-2 py-0.5 font-mono hover:border-line2 dark:border-white/10"
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
      setErr('"owner/model" 형식의 ModelScope ID를 입력하세요')
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
          <Label hint="예: Qwen/Qwen3.8-27B, ZhipuAI/GLM-4.7-Flash">ModelScope 모델 ID</Label>
          <Input value={s.repo} onChange={(e) => set({ repo: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="owner/model 또는 modelscope.cn URL" className="font-mono" />
        </div>
        <div>
          <Label hint="선택">Revision</Label>
          <Input value={s.revision} onChange={(e) => set({ revision: e.target.value })} placeholder="master" className="font-mono" />
        </div>
      </div>
      <div className="mt-3 max-w-md">
        <Label hint="비공개 모델">SDK 토큰</Label>
        <Input type="password" value={s.token} onChange={(e) => set({ token: e.target.value })} placeholder="ms-xxxxxxxx" className="font-mono" />
      </div>
      {err && <div className="mt-3 text-sm text-rose-500">{err}</div>}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => load()} disabled={loading || !s.repo.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 불러오기
        </Button>
        <span className="text-xs text-slate-500">ModelScope API → (실패 시) 동일 ID의 HF 미러 → 이름 기반 추정 순으로 메타데이터를 구성합니다.</span>
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

  const cmd = `# 1) CLI 설치 & 로그인
pip install -U inferstack-cli
inferstack login --key sk-is-v1-...

# 2) 모델 생성 (업로드 세션 발급)
inferstack models create ${name} \\
  --format ${fmt}${parsedArch ? ` \\\n  --arch ${parsedArch}` : ''} \\
  --upload-token ${token}

# 3) 가중치 업로드 (멀티파트 · 이어올리기 지원)
inferstack upload ./${fmt === 'gguf' ? files[0].path : 'my-model-dir/'} \\
  --model ${name} --parallel 8`

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>모델 이름</Label>
            <Input value={s.cliName} onChange={(e) => set({ cliName: slugify(e.target.value) })} placeholder="my-model" className="font-mono" />
          </div>
          <div>
            <Label>포맷</Label>
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
            <Label hint="B 단위">파라미터 수</Label>
            <Input type="number" min={0.1} step={0.1} value={s.cliParamsB} onChange={(e) => set({ cliParamsB: Math.max(0.1, +e.target.value) })} />
          </div>
        </div>
      </Card>
      <CodeBlock code={cmd} lang="bash" />
      <Card className="p-5">
        <Label hint="아키텍처 자동 감지용 (선택)">
          <FileJson size={14} className="mr-1 inline" /> config.json 붙여넣기
        </Label>
        <Textarea rows={4} value={s.cliConfig} onChange={(e) => set({ cliConfig: e.target.value })} placeholder={'{\n  "architectures": ["Qwen3ForCausalLM"],\n  "max_position_embeddings": 131072\n}'} className="font-mono text-xs" />
        {parsedArch && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} /> 감지됨: <span className="font-mono">{parsedArch}</span> {parsedCtx && <>· context {fmtNum(parsedCtx)}</>}
          </div>
        )}
        {cfgErr && <div className="mt-2 text-xs text-rose-500">JSON 형식이 올바르지 않습니다</div>}
      </Card>
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            {uploading === null ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <Loader2 size={15} className="animate-spin text-fg" />}
            {uploading === null ? 'CLI 업로드 대기 중…' : `업로드 중 ${uploading}% — ${fmtBytes((total * uploading) / 100)} / ${fmtBytes(total)}`}
          </div>
          {uploading !== null && <Progress value={uploading / 100} className="mt-2" />}
          <div className="mt-1 text-xs text-slate-500">업로드 토큰 <span className="font-mono">{token.slice(0, 10)}…</span> 는 24시간 동안 유효합니다.</div>
        </div>
        <Button variant="secondary" onClick={simulate} disabled={uploading !== null}>
          <Terminal size={15} /> 데모: CLI 업로드 시뮬레이션
        </Button>
      </Card>
      {s.info && s.resolvedVia === 'cli' && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={15} /> {files.length}개 파일 ({fmtBytes(total)}) 업로드 완료
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
          <a href={hfUrl(info.id)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-fg">
            <ExternalLink size={14} />
          </a>
        )}
        {s.resolvedVia === 'hf-mirror' && <Badge color="amber">HF 미러 메타데이터</Badge>}
        {s.resolvedVia === 'heuristic' && <Badge color="amber">이름 기반 추정 (데모)</Badge>}
        {s.resolvedVia === 'modelscope' && <Badge color="green">ModelScope</Badge>}
        {info.gated ? <Badge color="rose">gated</Badge> : null}
        {info.license && <Badge>{info.license}</Badge>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
        <Info k="아키텍처" v={<span className="font-mono text-xs">{info.architecture ?? info.ggufArchitecture ?? '미확인'}</span>} />
        <Info k="파라미터" v={fmtParams(info.params)} />
        <Info k="컨텍스트" v={info.contextLength ? fmtNum(info.contextLength) : '—'} />
        <Info k="파일 / 크기" v={`${info.files.length}개 · ${fmtBytes(total)}`} />
        <Info
          k="인기"
          v={
            <span className="flex items-center gap-2">
              <Heart size={12} /> {fmtNum(info.likes)} <Download size={12} /> {fmtTokens(info.downloads)}
            </span>
          }
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={cx('rounded-md px-2 py-1', st.length ? 'bg-raised text-fg ring-1 ring-line2' : 'bg-slate-100 text-slate-400 line-through dark:bg-white/5')}>Safetensors {st.length ? `· ${st.length} shards` : ''}</span>
        <span className={cx('rounded-md px-2 py-1', ggufs.length ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-slate-100 text-slate-400 line-through dark:bg-white/5')}>GGUF {ggufs.length ? `· ${ggufs.length} quants` : ''}</span>
        {info.chatTemplate && <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-300">chat template ✓</span>}
        {info.lastModified && <span className="px-2 py-1 text-slate-500">수정 {timeAgo(info.lastModified)}</span>}
      </div>
    </Card>
  )
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{k}</div>
      <div className="mt-0.5 font-medium">{v}</div>
    </div>
  )
}
