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
        title="Deploy a model"
        description="Deploy your fine-tunes or the latest Hugging Face models to a dedicated serverless endpoint."
        actions={
          <Link to="/my-models">
            <Button variant="outline">
              <Boxes size={16} /> My models {count > 0 && <Badge color="brand">{count}</Badge>}
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Download, title: 'Import from Hugging Face', desc: 'Enter a repo ID and we auto-detect config.json, safetensors shards and GGUF quants. Use a token for gated or private models.', source: 'huggingface' },
          { icon: Globe2, title: 'Import from ModelScope', desc: 'Pull weights by ModelScope model ID. Mirrored in China regions, so even large models sync fast.', source: 'modelscope' },
          { icon: Terminal, title: 'Upload with the CLI', desc: 'Multipart-upload weights from local or private storage with inferstack-cli. Interrupted uploads resume automatically.', source: 'cli' },
        ].map((x) => (
          <Link key={x.source} to={`/deploy/new?source=${x.source}`}>
            <Card className="group h-full p-6 transition-all hover:border-line2 hover:bg-raised/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-raised text-fg"><x.icon size={20} /></div>
              <div className="mt-4 font-semibold">{x.title}</div>
              <p className="mt-1.5 text-sm text-fg2">{x.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fg">
                Get started <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Badge>GGUF</Badge> llama.cpp runtime
          </div>
          <p className="mt-2 text-sm text-fg2">Every quant from Q8_0 to IQ1_S. Split GGUFs (-00001-of-0000N) are merged automatically. Great for low-cost deployments on smaller GPUs (L4, L40S).</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Badge>Safetensors</Badge> vLLM · SGLang · TensorRT-LLM
          </div>
          <p className="mt-2 text-sm text-fg2">Serve BF16/FP16/FP8/MXFP4 weights as-is, or quantize to FP8, NVFP4, AWQ or GPTQ at deploy time. Scales to 8 GPUs with tensor parallelism.</p>
        </Card>
      </div>

      <Card className="mt-10 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="font-semibold">Supported architectures</div>
            <div className="text-sm text-fg3">Matched on architectures in Hugging Face config.json · {ARCHITECTURES.length} total</div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search architectures" className="h-9 pl-8" />
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel text-left text-xs text-fg3">
              <tr>
                <th className="px-5 py-2 font-medium">architectures</th>
                <th className="px-3 py-2 font-medium">Family</th>
                <th className="px-3 py-2 font-medium">GGUF</th>
                <th className="px-3 py-2 font-medium">Engines</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {archs.map((a) => (
                <tr key={a.name} className="border-t border-line">
                  <td className="px-5 py-2 font-mono text-xs">{a.name}</td>
                  <td className="px-3 py-2">
                    {a.family} {a.moe && <Badge>MoE</Badge>} {a.multimodal && <Badge>VL</Badge>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-fg3">{a.gguf ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-fg3">{a.engines.join(', ')}</td>
                  <td className="px-3 py-2">{a.status === 'stable' ? <span className="text-[12.5px] text-fg3">stable</span> : <Badge color="amber">beta</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-line bg-raised/50 p-5 sm:flex-row sm:items-center">
          <Sparkles size={20} className="text-fg3" />
          <div className="flex-1 text-sm">
            <div className="font-medium">New architecture not on the list?</div>
            <div className="text-fg2">
              Upload inference code (<span className="font-mono">inferstack.yaml</span> + <span className="font-mono">model.py</span>) from <Github size={12} className="inline" /> GitHub or your machine and deploy on day 0.
            </div>
          </div>
          <Link to="/docs#arch">
            <Button variant="outline" size="sm">
              Spec
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
