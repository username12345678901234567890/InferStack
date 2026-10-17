import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Download, Github, Globe2, Search, Sparkles, Terminal } from 'lucide-react'
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui'
import { ARCHITECTURES } from '../../data/architectures'
import { useStore } from '../../store'

export default function DeployHome() {
  const count = useStore((s) => s.customModels.length)
  const [q, setQ] = useState('')
  const archs = useMemo(() => ARCHITECTURES.filter((a) => (a.name + a.family + a.modelType).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <div>
      <PageHeader
        title="모델 업로드"
        description="파인튜닝한 모델이나 Hugging Face의 최신 모델을 전용 서버리스 엔드포인트로 배포하세요."
        actions={
          <Link to="/my-models">
            <Button variant="outline">
              <Boxes size={16} /> 내 모델 {count > 0 && <Badge color="brand">{count}</Badge>}
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Download, title: 'Hugging Face에서 불러오기', desc: 'Repo ID 입력 → config.json, safetensors 샤드, GGUF 양자화 파일을 자동 분석. 게이트/비공개 모델은 토큰으로.', source: 'huggingface' },
          { icon: Globe2, title: 'ModelScope에서 불러오기', desc: 'ModelScope 모델 ID로 가중치를 가져옵니다. 중국 리전 미러를 사용해 대형 모델도 빠르게 동기화.', source: 'modelscope' },
          { icon: Terminal, title: 'CLI로 업로드', desc: '로컬/사내 스토리지의 가중치를 inferstack-cli로 멀티파트 업로드. 중단 시 이어올리기 지원.', source: 'cli' },
        ].map((x) => (
          <Link key={x.source} to={`/deploy/new?source=${x.source}`}>
            <Card className="group h-full p-6 transition-all hover:border-line2 hover:bg-raised/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-fg"><x.icon size={20} /></div>
              <div className="mt-4 font-semibold">{x.title}</div>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{x.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fg">
                시작하기 <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Badge color="amber">GGUF</Badge> llama.cpp 런타임
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Q8_0 ~ IQ1_S 전 양자화 지원. 분할 GGUF(-00001-of-0000N)는 자동 병합됩니다. 소형 GPU(L4, L40S)로 저렴하게 배포하기 좋습니다.</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Badge color="brand">Safetensors</Badge> vLLM · SGLang · TensorRT-LLM
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">BF16/FP16/FP8/MXFP4 원본 또는 배포 시 FP8·NVFP4·AWQ·GPTQ 양자화 변환. 텐서 병렬로 최대 8 GPU까지 확장됩니다.</p>
        </Card>
      </div>

      <Card className="mt-10 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-white/10">
          <div className="flex-1">
            <div className="font-semibold">지원 아키텍처 레지스트리</div>
            <div className="text-sm text-slate-500">Hugging Face config.json의 architectures 값 기준 · {ARCHITECTURES.length}종</div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="아키텍처 검색" className="h-9 pl-8" />
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-5 py-2 font-medium">architectures</th>
                <th className="px-3 py-2 font-medium">계열</th>
                <th className="px-3 py-2 font-medium">GGUF</th>
                <th className="px-3 py-2 font-medium">엔진</th>
                <th className="px-3 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {archs.map((a) => (
                <tr key={a.name} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-2 font-mono text-xs">{a.name}</td>
                  <td className="px-3 py-2">
                    {a.family} {a.moe && <Badge>MoE</Badge>} {a.multimodal && <Badge>VL</Badge>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{a.gguf ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{a.engines.join(', ')}</td>
                  <td className="px-3 py-2">{a.status === 'stable' ? <Badge color="green">stable</Badge> : <Badge color="amber">beta</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-raised/50 p-5 sm:flex-row sm:items-center dark:border-white/10">
          <Sparkles size={20} className="text-accent" />
          <div className="flex-1 text-sm">
            <div className="font-medium">목록에 없는 새 아키텍처인가요?</div>
            <div className="text-slate-600 dark:text-slate-400">
              <span className="font-mono">inferstack.yaml</span> + <span className="font-mono">model.py</span> 규격의 추론 코드를 <Github size={12} className="inline" /> GitHub 또는 로컬에서 함께 업로드하면 Day-0로 배포할 수 있습니다.
            </div>
          </div>
          <Link to="/docs#arch">
            <Button variant="outline" size="sm">
              규격 문서
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
